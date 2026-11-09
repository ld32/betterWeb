// Vector store in IndexedDB. Replaces RAGServer's chunks.db + embeddingCache.
//
// Vectors are stored as Float32Array, not JSON. For this corpus that is
// 1131 x 768 x 4B = 3.5 MB, against ~11 MB if they were stringified.
// Search loads them once into one contiguous matrix and scans it; 868k
// multiply-adds per query is sub-millisecond, so there is no GPU path here.

const DB_NAME = "rag-browser";
// v2 adds the ticket index and the ADDED store; an existing v1 database keeps
// its vectors and gains both on upgrade.
const DB_VERSION = 2;
const VECTORS = "vectors";
const META = "meta";
// Tickets added in the browser. They are a *source*, like data/tickets.json, not
// derived data: a rebuild re-embeds them, so adding one is not undone by it.
const ADDED = "added";
const TICKET_INDEX = "ticket";

let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const vectors = db.objectStoreNames.contains(VECTORS)
        ? req.transaction.objectStore(VECTORS)
        : db.createObjectStore(VECTORS, { keyPath: "id" });
      // Lets the duplicate check be a key lookup rather than a scan that would
      // deserialise every vector in the store.
      if (!vectors.indexNames.contains(TICKET_INDEX)) vectors.createIndex(TICKET_INDEX, "meta.ticket_id");
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
      if (!db.objectStoreNames.contains(ADDED)) db.createObjectStore(ADDED, { keyPath: "ticket_id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const out = fn(t.objectStore(store));
        // Read the request explicitly. `out?.result ?? out` would resolve to the
        // IDBRequest itself whenever a lookup misses, since a missing key gives
        // result === undefined -- making "no meta stored" look like meta.
        t.oncomplete = () => resolve(out instanceof IDBRequest ? out.result : out);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

export async function putBatch(records) {
  const db = await open();
  // Any write invalidates the cached search matrix, or a search after an
  // incremental write would scan the pre-write snapshot.
  invalidate();
  return new Promise((resolve, reject) => {
    const t = db.transaction(VECTORS, "readwrite");
    const s = t.objectStore(VECTORS);
    for (const r of records) s.put(r);
    t.oncomplete = resolve;
    t.onerror = () => reject(t.error);
  });
}

export const getMeta = () => tx(META, "readonly", (s) => s.get("index"));
export const setMeta = (m) => tx(META, "readwrite", (s) => s.put(m, "index"));

/** True if any chunk in the index already carries this ticket id. */
export const hasTicket = (ticketId) =>
  tx(VECTORS, "readonly", (s) => s.index(TICKET_INDEX).getKey(String(ticketId))).then(
    (key) => key !== undefined,
  );

/**
 * Drop every chunk of these tickets, leaving the rest of the index alone.
 *
 * An import that keeps existing records still has to remove the old copy of a
 * ticket it is re-importing: chunk ids are `${ticket_id}#${i}`, so a shorter
 * re-cut overwrites #0..#3 and leaves #4.. behind as orphans that still answer
 * searches. Deleting first is what the clear-everything path gets for free.
 */
export async function removeTickets(ticketIds) {
  const ids = [...new Set(ticketIds.map(String))];
  if (!ids.length) return 0;
  invalidate();
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(VECTORS, "readwrite");
    const index = t.objectStore(VECTORS).index(TICKET_INDEX);
    let removed = 0;
    for (const id of ids) {
      // openKeyCursor, not getAll: this walks keys and never deserialises a
      // vector it is about to delete.
      const req = index.openKeyCursor(IDBKeyRange.only(id));
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        t.objectStore(VECTORS).delete(cursor.primaryKey);
        removed += 1;
        cursor.continue();
      };
    }
    t.oncomplete = () => resolve(removed);
    t.onerror = () => reject(t.error);
  });
}

// Clears the derived index only. Added tickets are sources and survive, the way
// data/tickets.json does; Build regenerates the index from both.
export async function clear() {
  await tx(VECTORS, "readwrite", (s) => s.clear());
  await tx(META, "readwrite", (s) => s.clear());
  invalidate();
}

export const count = () => tx(VECTORS, "readonly", (s) => s.count());

// ---- locally added tickets ----------------------------------------------
export const putAdded = (record) => tx(ADDED, "readwrite", (s) => s.put(record));
export const getAdded = (ticketId) => tx(ADDED, "readonly", (s) => s.get(String(ticketId)));
export const addedTickets = () => tx(ADDED, "readonly", (s) => s.getAll());
export const addedCount = () => tx(ADDED, "readonly", (s) => s.count());

// The only way to delete uploaded ticket text. clear() deliberately spares this
// store so a Rebuild can regenerate the index from it; that makes Clear useless
// for getting rid of the text itself, which is what someone who uploaded the
// wrong ticket -- or who just wants their data gone -- actually needs.
export const clearAdded = () => tx(ADDED, "readwrite", (s) => s.clear());

/**
 * The first `limit` uploaded tickets, oldest first, without their text.
 * Listing is for reviewing what is stored, so it returns a short preview rather
 * than whole conversations.
 */
export async function listAdded(limit = 10, previewChars = 160) {
  const all = await addedTickets();
  all.sort((a, b) => String(a.addedAt || "").localeCompare(String(b.addedAt || "")));
  return {
    total: all.length,
    tickets: all.slice(0, Math.max(0, limit)).map((t) => ({
      ticket_id: t.ticket_id,
      addedAt: t.addedAt || null,
      chars: (t.text || "").length,
      preview: (t.text || "").slice(0, previewChars),
      meta: t.meta || {},
    })),
  };
}

/**
 * One entry per ticket that currently has vectors, keyed by ticket id.
 *
 * Reads the index rather than the sources, which is the distinction that makes
 * Delete legible: clearing the vectors has to empty this list, or the panel goes
 * on showing tickets that are no longer searchable.
 *
 * Deserialises every vector, so this is for a user-initiated listing, not for
 * anything on a hot path.
 */
export async function indexedTickets() {
  const rows = await tx(VECTORS, "readonly", (s) => s.getAll());
  const byTicket = new Map();
  for (const r of rows) {
    const id = r.meta?.ticket_id;
    if (id === undefined || id === null) continue;
    const key = String(id);
    const entry = byTicket.get(key) || { ticket_id: key, chunks: 0, chars: 0, preview: "" };
    entry.chunks += 1;
    entry.chars += (r.text || "").length;
    // The opener is the readable summary of a ticket; later chunks are mid-thread.
    if (r.meta?.chunk_index === 0) entry.preview = (r.text || "").slice(0, 160);
    byTicket.set(key, entry);
  }
  // A ticket whose chunk 0 is missing still deserves a preview.
  for (const entry of byTicket.values()) {
    if (!entry.preview) {
      const any = rows.find((r) => String(r.meta?.ticket_id) === entry.ticket_id);
      entry.preview = (any?.text || "").slice(0, 160);
    }
  }
  return byTicket;
}

/**
 * Every indexed ticket as whole text again, keyed by ticket id -- the chunks put
 * back in order, which is what webGPU/export-tickets.js does to chunks.db.
 *
 * Joined on newlines rather than spaces for the same reason the node exporter
 * gives: the noise filter works line by line, and a header that landed on a
 * chunk boundary would otherwise be welded onto the line before it.
 *
 * chunk_index is dropped from the metadata: a re-cut renumbers, so carrying the
 * old numbering into an export would only be a lie the next build corrects.
 *
 * Deserialises every vector, so this is for a user-initiated export, not for
 * anything on a hot path.
 */
export async function indexedTicketTexts() {
  const rows = await tx(VECTORS, "readonly", (s) => s.getAll());
  const byTicket = new Map();
  for (const r of rows) {
    const id = r.meta?.ticket_id;
    if (id === undefined || id === null) continue;
    const key = String(id);
    const entry = byTicket.get(key) || { ticket_id: key, chunks: [], meta: {} };
    entry.chunks.push({ index: r.meta?.chunk_index ?? 0, text: r.text || "" });
    // Metadata is uniform within a ticket, so chunk 0 speaks for all of them --
    // and only chunk 0 is guaranteed to exist for a ticket that has any rows.
    if ((r.meta?.chunk_index ?? 0) === 0) {
      const { chunk_index, ...meta } = r.meta || {};
      entry.meta = meta;
    }
    byTicket.set(key, entry);
  }

  const out = new Map();
  for (const [key, entry] of byTicket) {
    entry.chunks.sort((a, b) => a.index - b.index);
    out.set(key, {
      ticket_id: key,
      text: entry.chunks.map((c) => c.text.trim()).join("\n"),
      meta: entry.meta,
    });
  }
  return out;
}

// ---- in-memory search matrix -------------------------------------------
let matrix = null; // { vecs: Float32Array, docs: [{id,text,meta}], dim, n }

export function invalidate() {
  matrix = null;
}

async function loadMatrix() {
  if (matrix) return matrix;
  const rows = await tx(VECTORS, "readonly", (s) => s.getAll());
  if (!rows.length) throw new Error("index is empty -- build it first");

  const dim = rows[0].vec.length;
  const vecs = new Float32Array(rows.length * dim);
  const docs = new Array(rows.length);
  rows.forEach((r, i) => {
    vecs.set(r.vec, i * dim);
    docs[i] = { id: r.id, text: r.text, meta: r.meta };
  });
  matrix = { vecs, docs, dim, n: rows.length };
  return matrix;
}

/**
 * The `chunk_index 0` text of each named ticket, keyed by ticket id -- the
 * "Short description" opener that says what the ticket is about.
 *
 * Read off the search matrix rather than through the TICKET_INDEX: the matrix is
 * already resident after a search and its `docs` view holds no vectors, where an
 * index lookup would deserialise every vector of every ticket asked about.
 */
export async function firstChunks(ticketIds) {
  const out = new Map();
  const want = new Set(ticketIds.map(String));
  if (!want.size) return out;

  const { docs } = await loadMatrix();
  for (const d of docs) {
    const id = d.meta?.ticket_id;
    if (d.meta?.chunk_index !== 0 || id === undefined || id === null) continue;
    const key = String(id);
    if (want.has(key)) out.set(key, d.text);
  }
  return out;
}

/**
 * Top-k by cosine similarity. Vectors are stored normalised, so dot == cosine.
 * `filter` narrows the candidate set by doc (classification ranks only the
 * first chunk of each ticket); omit it to scan everything.
 */
export async function search(queryVec, k = 5, filter = null) {
  const { vecs, docs, dim, n } = await loadMatrix();
  const scored = [];
  for (let i = 0; i < n; i++) {
    if (filter && !filter(docs[i])) continue;
    const off = i * dim;
    let dot = 0;
    for (let j = 0; j < dim; j++) dot += vecs[off + j] * queryVec[j];
    scored.push({ score: dot, i });
  }
  // Ties break on insertion order, so the same query cannot rank differently
  // between two runs over the same index.
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.slice(0, k).map(({ score, i }) => ({ ...docs[i], score }));
}
