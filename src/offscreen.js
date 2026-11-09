// Offscreen document: the only extension context with both WebGPU and a
// lifetime that outlives the popup. Both models and the store live here.
//
// Replaces, entirely in the browser:
//   RAGServer embedText()     -> embed()          (arctic-embed via web-llm)
//   RAGServer chunks.db       -> store.js         (IndexedDB)
//   RAGServer cosineSim scan  -> store.search()
//   RAGServer /chat -> Ollama -> ask()            (web-llm)

import { CreateMLCEngine, prebuiltAppConfig } from "./lib/web-llm.js";
import * as store from "./store.js";

const EMBED_MODEL = "snowflake-arctic-embed-m-q0f32-MLC-b4";
const CHAT_MODEL = "gemma-2b-it-q4f16_1-MLC";
// arctic-embed is asymmetric but only on the query side: documents go in bare.
const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";
// The -b4 suffix is the batch size the model was compiled for.
const BATCH = 4;

// The five fields RAGServer classifies on, in the order it lists them. Shared:
// classification votes on them, adding a ticket collects them.
const METADATA_FIELDS = ["service_type", "ticket_type", "request_type", "app_hardware", "assignment_group"];
const TICKET_FIELDS = ["ticket_id", ...METADATA_FIELDS];

const post = (m) => chrome.runtime.sendMessage({ target: "popup", ...m }).catch(() => {});
const status = (text, progress) => post({ type: "status", text, progress });

// ---- engines -------------------------------------------------------------
// web-llm's prebuilt config points model_lib at a .wasm on raw.githubusercontent
// .com, which it then compiles. That is remote code, and Chrome Web Store review
// rejects it under MV3's "all executable code ships in the package" rule -- the
// model *weights* streamed from huggingface are data and stay remote, but the
// compiled kernel library cannot. Both .wasm files are vendored in lib/wasm/ and
// pointed at with chrome.runtime.getURL, so nothing executable is fetched.
//
// Only the two models this extension actually loads are rewritten. Any other
// entry keeps its remote URL and would fail the CSP, which is the intended
// outcome: adding a model means vendoring its .wasm too.
const LOCAL_MODEL_LIBS = {
  [CHAT_MODEL]: "lib/wasm/gemma-2b-it-q4f16_1_cs1k-webgpu.wasm",
  [EMBED_MODEL]: "lib/wasm/snowflake-arctic-embed-m-q0f32-ctx512_cs512_batch32-webgpu.wasm",
};

const appConfig = {
  ...prebuiltAppConfig,
  model_list: prebuiltAppConfig.model_list.map((m) =>
    LOCAL_MODEL_LIBS[m.model_id]
      ? { ...m, model_lib: chrome.runtime.getURL(LOCAL_MODEL_LIBS[m.model_id]) }
      : m,
  ),
};

// A typo in a filename would otherwise surface much later as an opaque compile
// failure, after the multi-hundred-MB weight download.
for (const [modelId, path] of Object.entries(LOCAL_MODEL_LIBS)) {
  const entry = appConfig.model_list.find((m) => m.model_id === modelId);
  if (!entry) throw new Error(`model ${modelId} is not in prebuiltAppConfig`);
  // Compare against the rewrite itself rather than testing for a
  // chrome-extension:// scheme. The invariant that matters is "our rewrite was
  // applied, so nothing is fetched from raw.githubusercontent.com" -- and
  // spelling it this way also holds when offscreen.js is loaded from an ordinary
  // page, which is how testPage runs the real engine.
  if (entry.model_lib !== chrome.runtime.getURL(path)) {
    throw new Error(`model_lib for ${modelId} was not rewritten to ${path}`);
  }
}

const engines = new Map();
// engines holds in-flight promises, so its keys cannot distinguish "downloading
// 1.5 GB" from "ready to answer". The status panel needs that difference, so
// resolution is recorded separately.
const enginesReady = new Set();

async function engine(modelId) {
  if (engines.has(modelId)) return engines.get(modelId);
  // Anything else would try to fetch its kernel library from the network and be
  // stopped by the CSP, long after the weights had downloaded. Fail immediately
  // and say why -- this fires if background.js's model id drifts from CHAT_MODEL.
  if (!LOCAL_MODEL_LIBS[modelId]) {
    throw new Error(
      `No bundled kernel library for "${modelId}". Vendor its .wasm into ` +
        `lib/wasm/ and add it to LOCAL_MODEL_LIBS; remote model_lib URLs are ` +
        `blocked because Chrome Web Store forbids remote code.`,
    );
  }
  const p = CreateMLCEngine(modelId, {
    appConfig,
    initProgressCallback: (r) => status(r.text, r.progress),
  }).catch((e) => {
    // A cached rejection would make every later attempt fail with the original
    // error, including the retry the user is being told to make.
    engines.delete(modelId);
    throw e;
  });
  p.then(() => enginesReady.add(modelId)).catch(() => {});
  engines.set(modelId, p);
  return p;
}

/** What the status panel shows for one model: not loaded, loading, or ready. */
function modelState(modelId) {
  if (enginesReady.has(modelId)) return "ready";
  return engines.has(modelId) ? "loading" : "not loaded";
}

/** Embed texts, L2-normalised so cosine similarity is a plain dot product. */
async function embed(texts, isQuery) {
  const eng = await engine(EMBED_MODEL);
  const input = isQuery ? texts.map((t) => QUERY_PREFIX + t) : texts;
  const { data } = await eng.embeddings.create({ input });

  return data
    .sort((a, b) => a.index - b.index)
    .map((d) => {
      const v = Float32Array.from(d.embedding);
      let n = 0;
      for (const x of v) n += x * x;
      n = Math.sqrt(n) || 1;
      for (let i = 0; i < v.length; i++) v[i] /= n;
      return v;
    });
}

// ---- indexing ------------------------------------------------------------

// The popup dies whenever it loses focus, but this document keeps embedding, so
// a reopened popup can ask for a build that is already running. Join the
// running one: two interleaved runs would have each other's clear() drop
// vectors the other had written, leaving meta describing a store it no longer
// matches.
let building = null;

function buildIndex(opts = {}) {
  building ??= runBuild(opts).finally(() => (building = null));
  return building;
}

// The bundled corpus, in preference order. Both hold whole tickets, not chunks:
// the browser cuts them with chunkConversation() at build time, so a fix to the
// chunker reaches the bundled corpus on the next import instead of needing the
// snapshot regenerated by whoever still has chunks.db.
//
// tickets.local.json is what webGPU/export-tickets.js writes from real ticket
// data. It is gitignored and never shipped, and it wins when present so a
// developer with the real corpus gets it. tickets.json is the fabricated
// starter set that lives in the repo, so a fresh checkout has something to
// search without needing the database.
const BUNDLES = ["data/tickets.local.json", "data/tickets.json"];

/** The tickets in a bundle body that are worth indexing. */
const usableTickets = (body) => (body?.tickets ?? []).filter((t) => t?.ticket_id && t?.text?.trim());

/**
 * First bundle that loads. Returns null -- not an error -- when none is present.
 *
 * `only` narrows it to a single file, for the source picker. It is checked
 * against BUNDLES rather than fetched as given: the list is the whole set of
 * files the panel may ask for, and without that check this handler would be an
 * arbitrary-URL fetcher running inside the extension's own origin.
 */
async function loadBundle(only = null) {
  const problems = [];
  const files = only ? BUNDLES.filter((f) => f === only) : BUNDLES;
  if (only && !files.length) throw new Error(`${only} is not one of the bundled corpus files`);
  for (const file of files) {
    try {
      const res = await fetch(chrome.runtime.getURL(file));
      // A packaged build ships neither file. Chrome answers a missing extension
      // resource with a network error rather than a 404, but check status too.
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const tickets = usableTickets(body);
      if (tickets.length) return { file, tickets, generatedAt: body.generatedAt ?? null };
      problems.push(`${file}: no usable tickets`);
    } catch (e) {
      problems.push(`${file}: ${e.message}`);
    }
  }
  // Falling back is right when nothing was asked for -- a released build has no
  // bundle and uploads carry it. It is wrong when a specific file was chosen and
  // could not be read: building from something else would answer a question the
  // user did not ask.
  if (only) throw new Error(`could not load ${only} — ${problems.join("; ")}`);
  return { file: null, tickets: [], generatedAt: null, problems };
}

/**
 * Where a build gets its tickets.
 *
 * `sourceFile` names one of BUNDLES; `tickets` supplies a corpus outright,
 * which is how the panel's file picker works -- an extension page cannot fetch
 * a path off the disk, so the file arrives already read. Neither given means
 * the old behaviour: first bundle that loads.
 */
async function resolveBundle({ sourceFile, tickets, sourceName }) {
  if (tickets) {
    const usable = usableTickets({ tickets });
    if (!usable.length) {
      throw new Error(
        `${sourceName || "that file"} has no usable tickets — each one needs a ticket_id and text. ` +
          `Expected {"tickets": [{ "ticket_id": "INC…", "text": "…", "meta": {…} }]}.`,
      );
    }
    return { file: sourceName || "a chosen file", tickets: usable, generatedAt: null };
  }
  return loadBundle(sourceFile || null);
}

/**
 * Import a corpus into the index.
 *
 * `replace` is the whole of the old Build/Rebuild split, asked as a question
 * instead of answered by which button was pressed:
 *
 *   replace: true   the index is emptied first, so it ends up holding exactly
 *                   this import plus the uploaded tickets -- the old Rebuild.
 *   replace: false  the import is added to what is already there, and only the
 *                   tickets it actually carries are rewritten.
 *
 * Keeping is the additive case, so it does not re-embed the uploads: they are
 * already indexed, and re-cutting them would be minutes of GPU time to arrive
 * back where it started. Replacing has to, because the clear takes them too.
 */
async function runBuild({ replace, sourceFile, tickets, sourceName, uploadsOnly } = {}) {
  const bundle = uploadsOnly
    ? { file: null, tickets: [], generatedAt: null }
    : await resolveBundle({ sourceFile, tickets, sourceName });

  const added = await store.addedTickets();

  if (!bundle.tickets.length && !added.length) {
    // A released build has no bundle by design, so this is the normal state for
    // a real user and the message has to be the upload path, not a dev hint.
    throw new Error(
      `This build ships no starter tickets and you have not uploaded any yet, so ` +
        `there is nothing to build from. ${UPLOAD_HINT} ` +
        `(Developers: ${(bundle.problems || []).join("; ")})`,
    );
  }

  // Uploads go last so a ticket that is in both sources overwrites the bundled
  // copy rather than voting twice -- ticketDocs() keys on `${ticket_id}#${i}`,
  // so the ids collide on purpose. Tagged with their origin because only the
  // uploads are counted on the index card.
  const sources = [
    ...bundle.tickets.map((t) => ({ record: t, uploaded: false })),
    // Uploads are re-embedded when the index is being replaced (the clear takes
    // them too) and when they are the thing being imported. An additive import
    // of some other corpus leaves them alone: they are already indexed, and
    // re-cutting them would be minutes of GPU time to arrive back where it
    // started.
    ...(replace || uploadsOnly ? added.map((t) => ({ record: t, uploaded: true })) : []),
  ];

  if (!sources.length) {
    // Keeping existing records and importing nothing new. Clearing and
    // re-embedding the uploads would be the *other* answer to the dialog.
    throw new Error(
      "Nothing to import: that source has no tickets, and existing records are being kept. " +
        'Choose "Delete them first" to rebuild the index from your uploaded tickets.',
    );
  }

  const t0 = performance.now();
  let dim = 0;
  let cleared = false;
  // The old index survives until the first successful batch: an import that dies
  // while loading the model used to leave the user with no index at all.
  // Clearing here also drops vectors whose ids are gone from a changed corpus,
  // which putBatch alone would leave behind.
  const clearOnce = async () => {
    if (cleared || !replace) return;
    await store.clear();
    cleared = true;
  };

  // An additive import still replaces the tickets it carries, or a re-cut that
  // produces fewer chunks would leave the tail of the old one behind.
  let replaced = 0;
  if (!replace) replaced = await store.removeTickets(sources.map((s) => s.record.ticket_id));

  let count = 0;
  for (const [n, { record, uploaded }] of sources.entries()) {
    status(
      `${uploaded ? "re-embedding uploaded" : "embedding"} ticket ${record.ticket_id} (${n + 1}/${sources.length})…`,
      (n + 1) / sources.length,
    );
    const chunks = await ticketDocs(record);
    await clearOnce();
    dim ||= chunks[0]?.vec?.length || 0;
    await store.putBatch(chunks);
    count += chunks.length;
  }

  const seconds = +((performance.now() - t0) / 1000).toFixed(1);
  const meta = {
    model: EMBED_MODEL,
    dim,
    // The whole index, not this import's share of it. They are the same number
    // after a replace, and after an additive import the difference is exactly
    // the records the user chose to keep -- which is what the card should show.
    count: await store.count(),
    added: await store.addedCount(),
    bundled: bundle.tickets.length,
    builtAt: new Date().toISOString(),
    sourceFile: bundle.file,
    sourceGeneratedAt: bundle.generatedAt,
    // The index card reads this to choose its wording; uploads-only is the
    // normal shape of a released build.
    source: bundle.tickets.length ? "bundle" : "uploads",
    seconds,
  };
  await store.setMeta(meta);
  const kept = replace ? "" : `, keeping the ${meta.count - count} already there`;
  status(
    `imported ${count} chunks from ${sources.length} ticket${sources.length === 1 ? "" : "s"} ` +
      `in ${seconds}s${kept}`,
  );
  post({ type: "index-updated" });
  return { meta, imported: count, tickets: sources.length, replaced, replace: Boolean(replace) };
}

// ---- adding tickets ------------------------------------------------------
// Port of RAGServer's /upload_only, but no longer a straight copy of its
// chunkConversation(): that function splits on a bare /(?<=[.!?])/, which fires
// inside every email address and phone number. 53% of the exported corpus
// carries a "hms. harvard. edu" scar from it, and each fragment burns one of the
// six slots a chunk is allowed, so chunks land at half their intended size and
// cut mid-thought. Both bundled tickets and uploaded ones are cut here, so
// there is one chunker and a fix to it reaches everything on the next import.

// Quoted-reply headers, signature blocks and legal disclaimers are the bulk of a
// ServiceNow email thread and none of it answers a question. 94 chunks of the
// exported corpus are pure headers and 42 are confidentiality notices; dropping
// them before chunking keeps real content from being crowded out of the top-k.
const NOISE_LINE = [
  /^\s*(from|sent|to|cc|bcc|subject|date|reply-to)\s*:/i,
  /^\s*on\b.{0,160}\bwrote:\s*$/i,
  /^\s*[-_=*~]{3,}\s*$/,
  /^\s*>+/,
  /^\s*(this (e-?mail|message|transmission)|confidentiality notice|the information (contained )?in this)\b/i,
  /^\s*(o|c|f|t|p|tel|phone|fax|mobile|cell|direct)\s*:\s*[+(\d]/i,
];

const stripEmailNoise = (text) =>
  String(text || "")
    .split("\n")
    .filter((line) => !NOISE_LINE.some((re) => re.test(line)))
    .join("\n");

// A period ends a sentence only when whitespace and a capital follow it. That
// keeps "hms. harvard. edu" and "617. 432. 8326" whole while still cutting
// "…done. Please try again". Blank lines break too, so a bulleted list or a log
// dump -- which carries no sentence punctuation at all -- does not arrive as one
// undivided piece.
const SENTENCE_BREAK = /(?<=[.!?])["')\]]*\s+(?=["'(\[]*[A-Z])/;

// A blank line separates one thing from the next -- a signature from the reply
// under it, a narrative from the "Resolution:" that follows, one turn from the
// next. Treating it only as a sentence break welded those together and let a
// six-sentence window straddle the seam, so a stated answer arrived diluted by
// the chit-chat above it. It ends a chunk.
const BLOCK_BREAK = /\n\s*\n+/;

// Blocks are often a line or two -- "Thank You," and a name. Alone they are
// retrieval noise, so anything under this is merged forward into the next block
// rather than indexed on its own.
const MIN_CHUNK_CHARS = 200;

const CHUNK_SENTENCES = 6;
// arctic-embed reads 512 tokens and its tokenizer silently truncates past that,
// so an oversize chunk is half-embedded and ranks on its opening only. ~4 chars
// per token, with room for the query prefix.
const MAX_CHUNK_CHARS = 1600;

function splitSentences(text) {
  const out = [];
  for (const piece of text.split(SENTENCE_BREAK)) {
    const s = (piece || "").trim();
    if (!s) continue;
    // One "sentence" can still be longer than the embedder reads -- a pasted
    // stack trace, a base64 blob. Cut it deliberately rather than let the
    // tokenizer drop the tail.
    if (s.length <= MAX_CHUNK_CHARS) out.push(s);
    else for (let i = 0; i < s.length; i += MAX_CHUNK_CHARS) out.push(s.slice(i, i + MAX_CHUNK_CHARS));
  }
  return out;
}

function chunkConversation(convo) {
  const chunks = [];

  for (const block of stripEmailNoise(convo).split(BLOCK_BREAK)) {
    let cur = [];
    let len = 0;

    const flush = () => {
      const text = cur.join(" ").trim();
      if (text) chunks.push(text);
      cur = [];
      len = 0;
    };

    for (const s of splitSentences(block)) {
      // Six sentences, but never more than the embedder can read: six long ones
      // would otherwise rebuild the truncation splitSentences just prevented.
      if (cur.length && (cur.length >= CHUNK_SENTENCES || len + s.length + 1 > MAX_CHUNK_CHARS)) flush();
      cur.push(s);
      len += s.length + 1;
    }
    flush();
  }

  // Fold the slivers forward. Done after the fact rather than by relaxing the
  // split, so a short block joins the section it introduces instead of being
  // glued to the one it followed.
  const merged = [];
  for (const chunk of chunks) {
    const prev = merged[merged.length - 1];
    if (prev && prev.length < MIN_CHUNK_CHARS && prev.length + chunk.length + 1 <= MAX_CHUNK_CHARS) {
      merged[merged.length - 1] = prev + " " + chunk;
    } else {
      merged.push(chunk);
    }
  }
  return merged;
}

/** Chunk, embed, and shape one ticket into store records. */
async function ticketDocs({ ticket_id, text, meta }) {
  const chunks = chunkConversation(text);
  if (!chunks.length) throw new Error(`ticket ${ticket_id} produced no chunks — is the text empty?`);

  const docs = [];
  for (let i = 0; i < chunks.length; i += BATCH) {
    const slice = chunks.slice(i, i + BATCH);
    const vecs = await embed(slice, false);
    slice.forEach((chunk, j) => {
      const chunk_index = i + j;
      docs.push({
        // Exported ids are SQLite integers, so a string key cannot collide with
        // one, and re-adding the same ticket overwrites rather than duplicates.
        id: `${ticket_id}#${chunk_index}`,
        text: chunk,
        meta: { ...meta, ticket_id, chunk_index },
        vec: vecs[j],
      });
    });
  }
  return docs;
}

async function addTicket({ text, meta = {} }) {
  const ticket_id = String(meta.ticket_id ?? "").trim();
  if (!ticket_id) throw new Error("a ticket id is required — it is what duplicate detection keys on");
  if (!text?.trim()) throw new Error("nothing to add — paste the ticket text first");
  // Same guard as /upload_only: a ticket indexed twice votes twice in
  // classification and repeats itself in answers. Both stores are checked --
  // the vectors may be cleared while the ticket is still a known source.
  if ((await store.hasTicket(ticket_id)) || (await store.getAdded(ticket_id))) {
    throw new Error(`ticket ${ticket_id} was already uploaded earlier — duplicates are refused, as in /upload_only`);
  }

  const record = {
    ticket_id,
    text,
    meta: Object.fromEntries(TICKET_FIELDS.map((f) => [f, meta[f] || null]).filter(([, v]) => v)),
    addedAt: new Date().toISOString(),
  };
  status(`embedding ticket ${ticket_id}…`);
  const docs = await ticketDocs(record);
  await store.putBatch(docs);
  // Recorded as a source too, so an import that replaces the index -- which
  // re-reads the bundle, a file that has never heard of this ticket -- does not
  // silently drop it.
  await store.putAdded(record);
  await noteAddedChunks(docs.length, docs[0].vec.length);

  status(`added ticket ${ticket_id} as ${docs.length} chunks`);
  post({ type: "index-updated" });
  return { ticket_id, chunks: docs.length };
}

/** Keep the index card honest after an add, without a full rebuild. */
async function noteAddedChunks(added, dim) {
  const meta = await store.getMeta();
  if (meta) {
    await store.setMeta({ ...meta, count: meta.count + added, added: await store.addedCount() });
    return;
  }
  // No corpus was ever built, so the uploads *are* the index. Without a meta
  // record the options panel reads the store as unbuilt and keeps Classify
  // disabled no matter how many tickets have been uploaded.
  await store.setMeta({
    model: EMBED_MODEL,
    dim,
    count: await store.count(),
    added: await store.addedCount(),
    builtAt: new Date().toISOString(),
    source: "uploads",
  });
}

// ---- retrieval + generation ---------------------------------------------
async function retrieve(query, k = 5, filter = null) {
  const t0 = performance.now();
  const [qv] = await embed([query], true);
  const embedMs = Math.round(performance.now() - t0);

  const t1 = performance.now();
  const hits = await store.search(qv, k, filter);
  return { hits, embedMs, searchMs: +(performance.now() - t1).toFixed(2) };
}

// ---- classification ------------------------------------------------------
// Port of RAGServer's /classify_conversation. Two things make it different from
// the search above: it ranks only chunk_index 0 -- the "Short description"
// opener, the one part of a ticket shaped like an inbound question, where the
// later chunks are resolution notes a new question cannot resemble -- and it
// answers with a vote over the neighbours' metadata rather than their text.
// Same fixed neighbourhood as the server. 146 first chunks in this corpus, so
// the vote sees roughly a tenth of the tickets.
const CLASSIFY_K = 15;

// A packaged build ships no corpus, so "run the exporter" is wrong advice for
// most people who hit an empty index: uploading tickets is the path that works,
// and it is also the only way the index ever improves.
const UPLOAD_HINT =
  'No tickets have been indexed yet. Open a ticket in ServiceNow and use "Upload to server" ' +
  "to add it as a reference — a handful is enough to start, and every ticket you upload makes " +
  "the classification better.";

const isReference = (d) => d.meta?.chunk_index === 0 && METADATA_FIELDS.some((f) => d.meta?.[f]);

/**
 * A retrieval filter that drops the ticket currently being worked on.
 *
 * A ticket that has already been uploaded is its own nearest neighbour -- the
 * query *is* its text -- so without this it wins classification outright and
 * the verdict is "whatever this ticket already says". That is circular: it
 * confirms the fields instead of checking them, and it is worst exactly when
 * the fields are wrong, which is the case the check exists for. On the answer
 * side it quotes the ticket back at the person who wrote it.
 *
 * `base` is the filter that would otherwise apply, kept rather than replaced.
 */
function withoutTicket(excludeTicketId, base = null) {
  const skip = String(excludeTicketId ?? "").trim();
  if (!skip) return base;
  return (d) => String(d.meta?.ticket_id ?? "") !== skip && (!base || base(d));
}

/** The ticket id that retrieval will actually have to skip, or null. */
async function selfInIndex(excludeTicketId) {
  const skip = String(excludeTicketId ?? "").trim();
  if (!skip) return null;
  if ((await store.hasTicket(skip)) || (await store.getAdded(skip))) return skip;
  return null;
}

// The five values a hit carries, as one key. A field the reference left blank
// stays blank rather than being filled from a neighbour: a blank is an honest
// "this ticket never said", where borrowing the value rebuilds the composite
// this vote exists to avoid.
const comboKey = (meta) => METADATA_FIELDS.map((f) => meta?.[f] || "").join("\u0000");

/**
 * Sum each candidate *combination's* cosine scores; confidence is the winner's
 * share.
 *
 * Each field used to be voted on separately and the five winners returned
 * together, which reported combinations no ticket carries: on the bundled
 * corpus an HPC question came back as "Identity and Access Management" with
 * "Computer", a pairing that appears on none of the 17 tickets, because
 * `Computer` won app_hardware off three tickets whose service was something
 * else entirely. Marginalising the fields also handed each one to whatever
 * label the corpus merely has most of -- five of seventeen tickets are
 * Identity and Access Management, enough for that service to win on frequency
 * while the nearest ticket by cosine sat at the top of the list, ignored.
 *
 * Voting on the whole tuple keeps the two properties that matter: the answer is
 * always a combination someone filled in on a real ticket, and neighbours that
 * agree still pool their scores, so two half-convincing tickets can outrank one
 * slightly better single hit.
 */
function voteCombination(hits) {
  const combos = new Map();
  for (const h of hits) {
    // A negative score is evidence against, not weak evidence for.
    if (h.score <= 0) continue;
    if (!METADATA_FIELDS.some((f) => h.meta?.[f])) continue;
    const key = comboKey(h.meta);
    const combo = combos.get(key) || {
      fields: Object.fromEntries(METADATA_FIELDS.map((f) => [f, h.meta?.[f] || null])),
      weight: 0,
      top: h.score,
      tickets: [],
      rank: combos.size, // insertion order, so ties break the same way every run
    };
    combo.weight += h.score;
    combo.top = Math.max(combo.top, h.score);
    if (h.meta?.ticket_id) combo.tickets.push(String(h.meta.ticket_id));
    combos.set(key, combo);
  }

  const empty = Object.fromEntries(METADATA_FIELDS.map((f) => [f, null]));
  if (!combos.size) return { fields: empty, confidence: 0, votes: 0, tickets: [], runnerUp: null };

  const ranked = [...combos.values()].sort(
    (a, b) => b.weight - a.weight || b.top - a.top || a.rank - b.rank,
  );
  const total = ranked.reduce((sum, c) => sum + c.weight, 0);
  const [winner, second] = ranked;
  return {
    fields: winner.fields,
    confidence: +(winner.weight / total).toFixed(4),
    votes: winner.tickets.length,
    tickets: winner.tickets,
    // What it beat, so a near-tie reads as a near-tie rather than a verdict.
    runnerUp: second
      ? { tickets: second.tickets, confidence: +(second.weight / total).toFixed(4) }
      : null,
  };
}

async function classify({ query, k = CLASSIFY_K, excludeTicketId = null }) {
  if (!query?.trim()) throw new Error("nothing to classify — type a question first");
  // Check the store before touching the embedder. Loading it is a 539 MB
  // download on a cold profile, and there is no sense paying that to search
  // nothing -- which is what an empty index used to do before failing.
  if ((await store.count()) === 0) throw new Error(UPLOAD_HINT);

  // Resolved before retrieval so the caller can be told the ticket was left
  // out, and so the "nothing to vote on" message below can say why.
  const excluded = await selfInIndex(excludeTicketId);
  const { hits, embedMs, searchMs } = await retrieve(query, k, withoutTicket(excluded, isReference));
  if (!hits.length) {
    // Vectors exist, but none of them is a first chunk carrying metadata --
    // classification votes only on those.
    throw new Error(
      "The index has no tickets that can be voted on: a reference needs its first chunk plus " +
        "the Service / Ticket Type / App-Hardware / Assignment group fields filled in when uploaded. " +
        "Upload a few complete tickets and try again." +
        (excluded
          ? ` Ticket ${excluded} is in the index but was skipped: a ticket cannot be a reference for itself.`
          : ""),
    );
  }
  // One combination wins as a unit, so every field carries the same confidence
  // and the same vote count -- they are five views of a single verdict, not
  // five verdicts. Kept in the per-field shape the panel and the ServiceNow
  // alert already render.
  const combo = voteCombination(hits);
  const fields = Object.fromEntries(
    METADATA_FIELDS.map((f) => [
      f,
      { value: combo.fields[f], confidence: combo.confidence, votes: combo.votes },
    ]),
  );
  const match = { tickets: combo.tickets, confidence: combo.confidence, runnerUp: combo.runnerUp };
  return { fields, match, hits, embedMs, searchMs, excluded };
}

// Answering scans the whole corpus, every chunk of every ticket -- unlike
// classification, the useful passage is usually a resolution note buried deep
// in a ticket, which is exactly what chunk_index 0 is not.
//
// Chunks are small (median 94 tokens), so six of them cost well under 1k of a
// 2B model's context while giving it more than one ticket to reason across.
const ASK_K = 6;

// Rank far wider than we keep. Taking the raw top 6 gave the model one ticket's
// email thread rather than six sources: the corpus has tickets 48 chunks long,
// and a verbose one wins every slot on a query it merely mentions.
const ASK_POOL = 40;
const MAX_PER_TICKET = 2;

// How far below the best hit a passage may fall and still be worth showing the
// model, as a fraction of that best score.
//
// This was an absolute floor of 0.5, chosen from what arctic-embed's cosine
// scores were *supposed* to look like. That number was wrong: on this corpus a
// passage repeating the query almost verbatim scores about 0.38, so the floor
// sat above the highest score the model can produce and every question fell
// through to "no ticket is close enough" no matter how good the ticket was.
//
// A ratio has no such failure mode. It asks "which of these are comparable to
// the best one?", which is the question that matters, and it holds whatever
// range the embedder outputs -- so changing the model or the corpus cannot
// silently re-break retrieval the way a hard-coded cosine did.
const RELATIVE_FLOOR = 0.75;

// A last-resort guard, not a quality bar: it catches a query that matches
// nothing at all. Deliberately far below anything a real match scores, because
// this constant being too high is the exact bug described above.
const ABSOLUTE_FLOOR = 0.15;

// Below this the best hit is weak enough to warn the model about. A hint in the
// prompt, not a refusal -- deciding the archive does not cover a question is the
// model's job, and it can read the passages.
const WEAK_MATCH = 0.3;

const NO_MATCH =
  "Nothing in the index matches this question at all.\n\n" +
  "Every chunk scored below the absolute guard, which normally means the index is " +
  "empty or holds nothing on this subject. Upload a ticket that covers it and try " +
  "again.";

/**
 * Top `k` hits, at most `perTicket` from any one ticket. Hits arrive sorted, so
 * dropping a ticket's third chunk promotes the next ticket rather than reordering
 * anything -- the best passage of each source still outranks the rest.
 */
function capPerTicket(hits, k, perTicket) {
  const taken = new Map();
  const out = [];
  for (const h of hits) {
    const id = String(h.meta?.ticket_id ?? h.id);
    const n = taken.get(id) || 0;
    if (n >= perTicket) continue;
    taken.set(id, n + 1);
    out.push(h);
    if (out.length === k) break;
  }
  return out;
}

/**
 * `query` is what gets embedded and retrieved on. `task` is optional and only
 * reaches the model: it says what to *do* with the ticket.
 *
 * The two are separate because a ServiceNow page asks with a whole ticket --
 * "User:\nShort description:…" -- which is the right text to search with and
 * the wrong thing to put after "Question:". Given a transcript where a question
 * belongs, a 2B model describes the retrieved passages one by one instead of
 * answering, which is what the ticket page used to get back.
 */
async function ask({ query, task, modelId, k = ASK_K, excludeTicketId = null }) {
  if (!query?.trim()) throw new Error("nothing to answer — type a question first");
  // Same reason as classify: fail before the embedder and the chat model are
  // downloaded, not after.
  if ((await store.count()) === 0) throw new Error(UPLOAD_HINT);

  // An already-uploaded ticket retrieves itself ahead of everything else, and
  // the suggested reply is then this ticket's own resolution note handed back
  // -- which reads as a confident answer while adding nothing.
  const excluded = await selfInIndex(excludeTicketId);
  const pool = await retrieve(query, ASK_POOL, withoutTicket(excluded));
  const { embedMs, searchMs } = pool;
  // Keep the best hit and everything close to it, rather than everything over a
  // fixed number. Nothing above the guard means there is genuinely nothing in the
  // index to read, which is the only case worth refusing outright.
  const best = pool.hits.length ? pool.hits[0].score : 0;
  const cutoff = Math.max(ABSOLUTE_FLOOR, best * RELATIVE_FLOOR);
  const hits = capPerTicket(
    pool.hits.filter((h) => h.score >= cutoff),
    k,
    MAX_PER_TICKET,
  );

  if (!hits.length) {
    post({ type: "hits", hits: pool.hits.slice(0, k), embedMs, searchMs, excluded });
    // Say it here rather than loading gemma to say it. That download is 1.5 GB
    // and it does not reliably decline -- it answers from whatever it was given.
    post({
      type: "delta",
      delta:
        NO_MATCH +
        (excluded
          ? `\n\nTicket ${excluded} is itself in the index, but a ticket is not a reference for ` +
            "itself, so it was left out of this search."
          : ""),
    });
    post({ type: "done", firstTokenMs: 0, totalMs: 0, stats: null });
    return;
  }
  post({ type: "hits", hits, embedMs, searchMs, excluded });

  // A mid-thread chunk reads "Tony, can you please help Alex with ordering this
  // laptop?" and carries no clue what the ticket is about -- the subject lives in
  // chunk_index 0, which retrieval had no reason to pick. Hand the model both.
  const openers = await store.firstChunks(hits.map((h) => h.meta?.ticket_id).filter(Boolean));

  const eng = await engine(modelId);
  const t0 = performance.now();
  // Context goes in the user turn, not a system message: Gemma has no system
  // role (its template injects one as bare text before the first turn), and a
  // user-turn instruction is valid for every model in the catalog.
  //
  // Each passage is labelled with its ticket, so a citation points at something
  // the reader can go open, and so the model can tell that two passages from
  // one ticket are one account rather than two agreeing sources.
  const context = hits
    .map((h, i) => {
      const id = h.meta?.ticket_id;
      // Skipped when the hit *is* the opener, or the passage would repeat itself.
      const opener = id && h.meta?.chunk_index !== 0 ? openers.get(String(id)) : null;
      return (
        `[${i + 1}]${id ? ` ticket ${id}` : ""}\n` +
        (opener ? `Ticket opens: ${opener.slice(0, 400)}\n` : "") +
        h.text
      );
    })
    .join("\n\n");
  // Warn rather than refuse: the model can read the passages and decline itself.
  const weak =
    best < WEAK_MATCH
      ? "The passages below are only loosely related to the question. Say you do " +
        "not have the answer unless one of them plainly contains it.\n\n"
      : "";
  // A task turns the trailing slot from "here is some text" into an
  // instruction, and names the ticket as material rather than as the question.
  const request = task
    ? `Task: ${task}\n\nThe ticket to act on:\n${query}\n\nAnswer:`
    : `Question: ${query}\nAnswer:`;
  const prompt =
    weak +
    "You are answering from a help-desk ticket archive. Use only the numbered " +
    "passages below. Cite the numbers you used, like [2]. Prefer what was " +
    "actually done to resolve a ticket over what was first reported. If the " +
    "passages do not contain the answer, say so plainly instead of guessing. " +
    "Do not summarise the passages one by one.\n\n" +
    context +
    "\n\n" +
    request;

  const stream = await eng.chat.completions.create({
    stream: true,
    stream_options: { include_usage: true },
    messages: [{ role: "user", content: prompt }],
  });

  let firstTokenMs = null;
  let usage = null;
  for await (const chunk of stream) {
    if (chunk.usage) usage = chunk.usage;
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      firstTokenMs ??= Math.round(performance.now() - t0);
      post({ type: "delta", delta });
    }
  }
  post({
    type: "done",
    firstTokenMs,
    totalMs: Math.round(performance.now() - t0),
    stats: usage?.extra ?? null,
  });
}

// ---- message plumbing ----------------------------------------------------
const handlers = {
  "webgpu-probe": async () => {
    const a = await navigator.gpu?.requestAdapter();
    return {
      hasNavigatorGpu: "gpu" in navigator,
      vendor: a?.info?.vendor ?? null,
      architecture: a?.info?.architecture ?? null,
    };
  },
  // Which engine is actually answering, and what it has in memory. The panel
  // used to leave this to be inferred from a "(mock)" suffix in a status line,
  // which is a poor way to learn that your models never loaded.
  "engine-status": async () => {
    const adapter = await navigator.gpu?.requestAdapter().catch(() => null);
    const vram = (id) => appConfig.model_list.find((m) => m.model_id === id)?.vram_required_MB ?? null;
    return {
      engine: "web-llm",
      real: true,
      hasNavigatorGpu: "gpu" in navigator,
      vendor: adapter?.info?.vendor ?? null,
      architecture: adapter?.info?.architecture ?? null,
      models: [
        { role: "embedding", id: EMBED_MODEL, state: modelState(EMBED_MODEL), vram: vram(EMBED_MODEL) },
        ...Object.keys(LOCAL_MODEL_LIBS)
          .filter((id) => id !== EMBED_MODEL)
          .map((id) => ({ role: "chat", id, state: modelState(id), vram: vram(id) })),
      ],
    };
  },
  "index-status": async () => ({
    meta: (await store.getMeta()) ?? null,
    count: await store.count(),
    added: await store.addedCount(),
    // Lets a popup reopened mid-build show that one is running instead of
    // offering buttons that would start a second.
    building: Boolean(building),
  }),
  // What the source picker offers. Probed rather than hardcoded: a released
  // build ships neither file, and tickets.local.json exists only on a machine
  // that has the real corpus, so the only honest list is the one that comes
  // from trying to load them.
  "list-bundles": async () => {
    const bundles = [];
    for (const file of BUNDLES) {
      try {
        const res = await fetch(chrome.runtime.getURL(file));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        const count = usableTickets(body).length;
        if (count) bundles.push({ file, count, generatedAt: body.generatedAt ?? null });
      } catch {
        // Missing is the normal case for both files, not a condition to report.
      }
    }
    return { bundles };
  },
  "build-index": (m) => buildIndex(m),
  "add-ticket": (m) => {
    // A build owns the whole store: clear() mid-add would drop the vectors this
    // just wrote, and the add would not be in that build's source list yet.
    if (building) throw new Error("a build is in progress — add the ticket once it finishes");
    return addTicket(m);
  },
  classify: (m) => classify(m),
  ask: (m) => ask(m),
  clear: async () => {
    if (building) throw new Error("a build is in progress — wait for it to finish");
    await store.clear();
    post({ type: "index-updated" });
    return {};
  },
  // Lists what is INDEXED, not what the sources could supply. That is the
  // distinction that makes Delete legible: clearing the vectors empties this
  // list, where listing the bundle file would go on showing 17 tickets and make
  // the button look broken.
  //
  // Uploads come first so the limit cannot push them behind the bundled ones,
  // and they are the only rows Delete can remove on their own.
  "list-tickets": async (m) => {
    const limit = Math.max(0, m.limit ?? 10);
    const indexed = await store.indexedTickets();

    // Every upload, not a page of them: the slice happens after the two join.
    const added = await store.listAdded(Number.MAX_SAFE_INTEGER);
    const uploaded = added.tickets.map((t) => ({
      ...t,
      source: "upload",
      // An uploaded ticket that has not been built yet has text but no vectors.
      chunks: indexed.get(String(t.ticket_id))?.chunks ?? 0,
      indexed: indexed.has(String(t.ticket_id)),
    }));

    const uploadedIds = new Set(uploaded.map((t) => String(t.ticket_id)));
    const bundled = [...indexed.values()]
      .filter((t) => !uploadedIds.has(t.ticket_id))
      .map((t) => ({
        ticket_id: t.ticket_id,
        source: "bundle",
        addedAt: null,
        chars: t.chars,
        chunks: t.chunks,
        indexed: true,
        preview: t.preview,
        meta: {},
      }));

    const all = [...uploaded, ...bundled];
    return {
      total: all.length,
      uploaded: uploaded.length,
      bundled: bundled.length,
      // What Delete would actually remove from the index, which is everything.
      indexedTickets: indexed.size,
      tickets: all.slice(0, limit),
    };
  },

  // Whole tickets, in the shape loadBundle() reads: an export dropped in at
  // srcRaw/data/tickets.local.json is a corpus the next import picks up, and
  // the same file is the backup that survives "Delete uploaded tickets".
  //
  // Both sources, because neither covers the other: an upload made since the
  // last build has text but no vectors, and a bundled ticket has vectors but no
  // entry in ADDED. Uploads win where both hold a ticket -- their text is the
  // original, where the indexed copy has been through the chunker.
  "export-tickets": async () => {
    const indexed = await store.indexedTicketTexts();
    const uploaded = await store.addedTickets();

    // ticket_id is the row's own key, so it is not repeated inside meta -- the
    // shape webGPU/export-tickets.js writes, and the one ticketDocs() fills back
    // in on the way into the index.
    const metaOf = ({ ticket_id, chunk_index, ...meta } = {}) => meta;

    const byId = new Map();
    for (const [id, t] of indexed) {
      byId.set(id, { ticket_id: id, text: t.text, meta: metaOf(t.meta) });
    }
    for (const t of uploaded) {
      byId.set(String(t.ticket_id), {
        ticket_id: String(t.ticket_id),
        text: t.text || "",
        meta: metaOf(t.meta),
      });
    }

    const tickets = [...byId.values()].filter((t) => t.text.trim());
    return {
      generatedAt: new Date().toISOString(),
      source: "browser index (chrome.storage / IndexedDB)",
      count: tickets.length,
      indexed: indexed.size,
      uploaded: uploaded.length,
      tickets,
    };
  },

  // Deletes the uploaded ticket text, not just the index built from it. The
  // derived vectors go too: leaving them would keep the ticket answerable and
  // votable in classification, so "deleted" would not mean deleted.
  "delete-tickets": async () => {
    if (building) throw new Error("a build is in progress — wait for it to finish");
    const removed = await store.addedCount();
    await store.clearAdded();
    await store.clear();
    post({ type: "index-updated" });
    return { removed };
  },
};

chrome.runtime.onMessage.addListener((msg, _s, respond) => {
  const fn = msg?.target === "offscreen" && handlers[msg.type];
  if (!fn) return;
  Promise.resolve(fn(msg))
    .then((r) => respond({ ok: true, ...r }))
    .catch((e) => {
      post({ type: "error", error: String(e?.stack || e) });
      respond({ ok: false, error: String(e) });
    });
  return true;
});
