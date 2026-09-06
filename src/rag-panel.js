// Local AI (WebGPU) panel for the options page.
//
// Kept out of options.js on purpose: that file owns #popup and is 2000 lines of
// unrelated config UI. This one builds its own section and talks to the
// offscreen document, which is where the models and the vector store live.
//
// The panel is how you drive the local engine directly -- build the index, add
// a ticket, try a classification. The ServiceNow menu actions reach the same
// engine through background.js. There is no backend to choose: this is the only
// one.

const FIELD_LABELS = {
  service_type: "Service",
  ticket_type: "Ticket type",
  request_type: "Request type",
  app_hardware: "App/Hardware",
  assignment_group: "Assignment group",
};
const TICKET_FIELDS = ["ticket_id", ...Object.keys(FIELD_LABELS)];
const LABEL_W = Math.max(...Object.values(FIELD_LABELS).map((l) => l.length));

const CSS = `
#rag-panel { font: 16px/1.45 -apple-system, system-ui, sans-serif; border-top: 1px solid #ddd; margin-top: 16px; padding: 10px 12px; }
#rag-panel .h1 { font-size: 20px; font-weight: 600; padding: 4px 0 8px; }
#rag-panel .h2 { font-size: 16px; font-weight: 600; padding: 4px 0; }
#rag-panel .mono { font: 13px/1.4 ui-monospace, Menlo, monospace; }
#rag-panel .box { background: #f5f5f5; border-radius: 5px; padding: 7px; white-space: pre-wrap; margin: 8px 0; }
#rag-panel .row { display: flex; gap: 6px; margin-bottom: 6px; align-items: flex-start; }
#rag-panel .row > * { flex: 1; }
#rag-panel button { padding: 6px; cursor: pointer; font: inherit; }
#rag-panel textarea, #rag-panel input, #rag-panel select { font: inherit; box-sizing: border-box; width: 100%; padding: 5px; }
#rag-panel textarea { height: 52px; margin: 6px 0; }
#rag-panel progress { width: 100%; height: 4px; display: block; margin: 4px 0; }
#rag-status { font-size: 13px; color: #555; min-height: 15px; margin: 4px 0; }
#rag-engine b { color: #087443; }
#rag-engine .c { color: #888; }
#rag-engine .warn { color: #8d2803; font-weight: 600; }
#rag-answer { border: 1px solid #ddd; border-radius: 5px; padding: 8px; min-height: 40px; max-height: 200px; overflow: auto; white-space: pre-wrap; }
#rag-fields { white-space: pre; overflow-x: auto; margin-bottom: 8px; }
#rag-fields:empty { display: none; }
#rag-fields b { color: #087443; }
#rag-fields .c { color: #888; }
#rag-hits .hit { border-top: 1px solid #eee; padding: 5px 0; font-size: 13px; }
#rag-hits .hit b { color: #087443; }
#rag-hits .hit .t { color: #444; display: block; max-height: 52px; overflow: hidden; }
#rag-add { margin-top: 10px; border-top: 1px solid #eee; padding-top: 8px; }
#rag-stored { margin-top: 10px; border-top: 1px solid #eee; padding-top: 8px; }
#rag-limit-label { flex: 0 0 auto; font-size: 13px; color: #555; display: flex; align-items: center; gap: 5px; }
#rag-limit { width: 70px; }
#rag-list-out { margin: 6px 0; max-height: 220px; overflow: auto; }
#rag-list-status { font-size: 13px; color: #555; min-height: 15px; margin: 4px 0 6px; }
#rag-list-out .tk { border-top: 1px solid #eee; padding: 5px 0; font-size: 13px; }
#rag-list-out .tk b { color: #087443; }
#rag-list-out .tk .c { color: #888; }
#rag-list-out .tk .t { color: #444; display: block; max-height: 38px; overflow: hidden; }
#rag-delete-tickets { width: 100%; color: #8d2803; }

/* Dark theme. options.js stamps data-bw-theme on <html> from the "darkMode"
   Variables row; this panel only has to answer to it. */
html[data-bw-theme="dark"] #rag-panel { border-top-color: #3a3d44; color: #e3e3e3; }
html[data-bw-theme="dark"] #rag-panel .box { background: #26282c; }
html[data-bw-theme="dark"] #rag-status,
html[data-bw-theme="dark"] #rag-list-status { color: #9aa0a6; }
html[data-bw-theme="dark"] #rag-engine b { color: #6ede9a; }
html[data-bw-theme="dark"] #rag-engine .c { color: #9aa0a6; }
html[data-bw-theme="dark"] #rag-engine .warn { color: #ff8a80; }
html[data-bw-theme="dark"] #rag-answer { border-color: #3a3d44; background: #1e1f22; }
html[data-bw-theme="dark"] #rag-add,
html[data-bw-theme="dark"] #rag-stored { border-top-color: #3a3d44; }
html[data-bw-theme="dark"] #rag-hits .hit,
html[data-bw-theme="dark"] #rag-list-out .tk { border-top-color: #3a3d44; }
html[data-bw-theme="dark"] #rag-hits .hit .t,
html[data-bw-theme="dark"] #rag-list-out .tk .t { color: #c9ccd1; }
html[data-bw-theme="dark"] #rag-fields b,
html[data-bw-theme="dark"] #rag-hits .hit b,
html[data-bw-theme="dark"] #rag-list-out .tk b { color: #6ede9a; }
html[data-bw-theme="dark"] #rag-fields .c,
html[data-bw-theme="dark"] #rag-list-out .tk .c,
html[data-bw-theme="dark"] #rag-limit-label { color: #9aa0a6; }
html[data-bw-theme="dark"] #rag-delete-tickets { color: #ff8a80; }
`;

const HTML = `
<div id="rag-panel-body">
  <div class="h1">Local AI (WebGPU) — index, classify and answer without the server</div>
  <div class="h2">Local LLM status</div>
  <div id="rag-engine" class="mono box">checking…</div>
  <div id="rag-idx" class="mono box">index: checking…</div>

  <div class="row">
    <button id="rag-build">Build index</button>
    <button id="rag-rebuild" title="Discard the index and re-cut, re-embed and re-store every ticket — the bundled ones and your uploads">Rebuild</button>
  </div>

  <progress id="rag-bar" value="0" max="1" hidden></progress>
  <div id="rag-status"></div>

  <textarea id="rag-query">How do I reset a user password?</textarea>
  <div class="row">
    <select id="rag-model">
      <option value="SmolLM2-360M-Instruct-q4f16_1-MLC">SmolLM2-360M — 376 MB VRAM</option>
      <option value="gemma-2b-it-q4f16_1-MLC" selected>gemma-2b-it — 1477 MB VRAM</option>
    </select>
  </div>
  <div class="row">
    <button id="rag-classify" title="Vote on the metadata fields using the first chunk of each ticket">Classify question</button>
    <button id="rag-ask">Search + answer</button>
  </div>

  <div id="rag-fields" class="mono"></div>
  <div id="rag-answer"></div>
  <div id="rag-stats" class="mono"></div>
  <div id="rag-hits"></div>

  <div id="rag-add">
    <div class="h2">Add a ticket to the index</div>
    <input id="rag-a_ticket_id" placeholder="Ticket ID — required, e.g. INC00812345">
    <textarea id="rag-a_text" placeholder="Ticket conversation. Email headers, quoted replies and signatures are stripped, then it is cut into chunks of 6 sentences."></textarea>
    <div class="row">
      <input id="rag-a_service_type" placeholder="Service">
      <input id="rag-a_ticket_type" placeholder="Ticket type">
    </div>
    <div class="row">
      <input id="rag-a_request_type" placeholder="Request type">
      <input id="rag-a_app_hardware" placeholder="App/Hardware">
    </div>
    <input id="rag-a_assignment_group" placeholder="Assignment group">
    <button id="rag-add-ticket" title="Chunk, embed and store this ticket — it survives Rebuild">Add to index</button>
  </div>

  <div id="rag-stored">
    <div class="h2">Stored tickets — review, and delete your uploads</div>
    <div class="row">
      <label id="rag-limit-label">Show first
        <input id="rag-limit" type="number" min="1" max="500" value="10">
      </label>
      <button id="rag-list">List tickets</button>
    </div>
    <div id="rag-list-out" class="mono">Press “List tickets” to see what is indexed.</div>
    <div id="rag-list-status"></div>
    <button id="rag-delete-tickets" title="Empties the search index and permanently deletes the text of every ticket uploaded here. Bundled tickets are not deleted from the file — Build puts them back.">
      Delete uploaded tickets and clear the index
    </button>
  </div>
</div>
`;

const $ = (id) => document.getElementById("rag-" + id);

/** Start the offscreen document if needed, then ask it to do something. */
async function call(message) {
  await chrome.runtime.sendMessage({ target: "background", type: "ensure-offscreen" });
  return chrome.runtime.sendMessage(Object.assign({ target: "offscreen" }, message));
}

let answer = "";
let hasIndex = false;

function busy(b) {
  ["build", "rebuild", "add-ticket", "list", "delete-tickets"].forEach(
    (id) => ($(id).disabled = b),
  );
  ["classify", "ask"].forEach((id) => {
    $(id).disabled = b || !hasIndex;
    $(id).title = hasIndex
      ? $(id).dataset.hint
      : 'Nothing indexed yet — upload some tickets first (ServiceNow → "Upload to server")';
  });
}

function renderHits(hits, embedMs, searchMs) {
  $("hits").textContent = "";
  hits.forEach((h, i) => {
    const d = document.createElement("div");
    d.className = "hit";
    const head = document.createElement("b");
    head.textContent = `[${i + 1}] ${h.score.toFixed(3)}`;
    const id = document.createElement("span");
    id.textContent = h.meta && h.meta.ticket_id ? " · " + h.meta.ticket_id : "";
    const t = document.createElement("span");
    t.className = "t";
    t.textContent = (h.text || "").slice(0, 220);
    d.append(head, id, t);
    $("hits").appendChild(d);
  });
  $("stats").textContent = `embed query ${embedMs}ms · cosine scan ${searchMs}ms`;
}

/**
 * Fill the stored-ticket list from the honest source. Called by refresh() so the
 * table has content the moment the page opens -- it is always on screen now, and
 * an empty box under a Delete button would read as "nothing stored" whether or
 * not that were true.
 */
async function listTickets() {
  const limit = Math.max(1, Number($("limit").value) || 10);
  const r = await call({ type: "list-tickets", limit });
  if (!r.ok) {
    $("list-out").textContent = "could not read stored tickets: " + r.error;
    return { total: 0, uploaded: 0, bundled: 0, count: 0 };
  }
  renderStoredTickets(r.tickets, r.total, limit);
  return {
    total: r.total,
    uploaded: r.uploaded ?? 0,
    bundled: r.bundled ?? 0,
    indexedTickets: r.indexedTickets ?? 0,
    count: r.tickets.length,
  };
}

/** Ticket text came off a web page, so every value here goes in as textContent. */
function renderStoredTickets(tickets, total, limit) {
  const box = $("list-out");
  box.textContent = "";

  if (!total) {
    box.textContent = "No tickets are indexed — nothing bundled, and nothing uploaded here.";
    return;
  }

  tickets.forEach((t, i) => {
    const row = document.createElement("div");
    row.className = "tk";

    const head = document.createElement("b");
    head.textContent = `[${i + 1}] ${t.ticket_id}`;

    // Say which rows Delete can actually remove. A bundled ticket is read-only
    // because Rebuild would restore it from the file moments later.
    const c = document.createElement("span");
    c.className = "c";
    const size = `${t.chunks ? `${t.chunks} chunk${t.chunks === 1 ? "" : "s"} · ` : ""}${t.chars} chars`;
    if (t.source === "bundle") {
      c.textContent = ` · bundled · ${size}`;
    } else {
      const when = t.addedAt ? new Date(t.addedAt).toLocaleString() : "unknown date";
      c.textContent = ` · uploaded ${when} · ${size}${t.indexed ? "" : " · not indexed yet"}`;
    }

    const preview = document.createElement("span");
    preview.className = "t";
    preview.textContent = t.preview;

    row.append(head, c, preview);
    box.appendChild(row);
  });

  if (total > tickets.length) {
    const more = document.createElement("div");
    more.className = "tk c";
    more.textContent = `… ${total - tickets.length} more not shown (showing first ${limit})`;
    box.appendChild(more);
  }
}

function renderFields(fields, n) {
  const box = $("fields");
  box.textContent = "";
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const { value, confidence, votes } = fields[key] || {};
    const line = document.createElement("div");
    line.append(`${label.padEnd(LABEL_W)} : `);
    if (value) {
      const v = document.createElement("b");
      v.textContent = value; // ticket data, never innerHTML
      const c = document.createElement("span");
      c.className = "c";
      c.textContent = `  ${Math.round(confidence * 100)}% · ${votes}/${n} votes`;
      line.append(v, c);
    } else {
      line.append("— no neighbour carries this field");
    }
    box.appendChild(line);
  }
}

/**
 * The engine card. Its first job is to say which engine answered, because the
 * test page can run either the real models or a keyword stub and the two are
 * otherwise told apart only by a "(mock)" suffix on a status line.
 *
 * Everything here is written with textContent: model ids and GPU vendor strings
 * come from outside this file.
 */
function renderEngine(info) {
  const box = $("engine");
  box.textContent = "";
  const line = (label, build) => {
    const d = document.createElement("div");
    d.append(`${label.padEnd(10)} : `);
    build(d);
    box.appendChild(d);
  };
  const tag = (parent, text, cls) => {
    const el = document.createElement(cls === "plain" ? "span" : cls === "warn" ? "span" : "b");
    if (cls && cls !== "plain") el.className = cls === "warn" ? "warn" : "";
    el.textContent = text;
    parent.append(el);
    return el;
  };

  if (!info) {
    box.textContent = "engine     : did not answer — no offscreen document is running";
    return;
  }

  line("engine", (d) => {
    if (info.real) {
      tag(d, "web-llm — real models on WebGPU");
    } else {
      const w = document.createElement("span");
      w.className = "warn";
      w.textContent = info.engine || "mock";
      d.append(w);
      const c = document.createElement("span");
      c.className = "c";
      c.textContent = "  no language model is running" + (info.hint ? ` · ${info.hint}` : "");
      d.append(c);
    }
  });

  line("gpu", (d) => {
    if (!info.hasNavigatorGpu) {
      const w = document.createElement("span");
      w.className = "warn";
      w.textContent = "navigator.gpu MISSING — models cannot run here";
      d.append(w);
      return;
    }
    const b = document.createElement("b");
    b.textContent = "available";
    d.append(b);
    if (info.vendor) {
      const c = document.createElement("span");
      c.className = "c";
      c.textContent = `  ${info.vendor}${info.architecture ? "/" + info.architecture : ""}`;
      d.append(c);
    }
  });

  (info.models || []).forEach((m) => {
    line(m.role, (d) => {
      const c = document.createElement("span");
      c.className = "c";
      c.textContent = m.id + (m.vram ? `  ${Math.round(m.vram)} MB VRAM` : "");
      // "ready" is the only state worth highlighting; the other two are the
      // normal resting state of a model nobody has asked for yet.
      if (m.state === "ready") {
        const b = document.createElement("b");
        b.textContent = "ready";
        d.append(b, "  ", c);
      } else {
        d.append(`${m.state}`, "  ", c);
      }
    });
  });
}

async function refresh() {
  const sw = await chrome.runtime.sendMessage({ target: "background", type: "probe-sw-webgpu" });
  const off = await call({ type: "webgpu-probe" });
  const idx = await call({ type: "index-status" });
  // Optional: an older offscreen document has no handler for this and answers
  // nothing, which renderEngine reports rather than throwing.
  const eng = await call({ type: "engine-status" }).catch(() => null);
  renderEngine(eng && eng.ok !== false ? eng : null);

  // The service-worker probe stays: it is the one fact the engine card cannot
  // report, because it is about a context the engine does not run in.
  if (!sw.hasNavigatorGpu && off.hasNavigatorGpu) {
    // Expected on every build -- worth stating once, not as a warning.
    $("status").textContent =
      $("status").textContent ||
      "service worker has no navigator.gpu, as expected — the models run in the offscreen document";
  }

  hasIndex = Boolean(idx.meta) && idx.count > 0;
  const added = idx.added
    ? `\n${idx.added} ticket${idx.added === 1 ? "" : "s"} uploaded here — kept across Rebuild and Clear`
    : "";

  let card;
  if (idx.building) {
    card = `index: building… (${idx.count || 0} vectors written so far)`;
  } else if (idx.meta) {
    const built = new Date(idx.meta.builtAt).toLocaleString();
    // Name the bundle file. There are two -- the fabricated tickets.json in the
    // repo and the real tickets.local.json a developer exports -- and answering
    // from the wrong one is otherwise invisible.
    const bundled = idx.meta.bundled
      ? ` · ${idx.meta.bundled} from ${idx.meta.sourceFile || "the bundle"}`
      : "";
    card =
      `index: ${idx.meta.count} chunks · ${idx.meta.dim}d · ${idx.meta.model}\n` +
      (idx.meta.source === "uploads"
        ? `built from uploaded tickets · last change ${built}`
        : `built ${built} in ${idx.meta.seconds}s${bundled}`);
  } else {
    // The reminder that matters most: with no bundled corpus, uploading is the
    // only way this ever has anything to say.
    card =
      "index: empty — nothing to classify against yet.\n" +
      'Open a ticket in ServiceNow and use "Upload to server" to add it as a\n' +
      "reference. A handful is enough to start; every ticket makes it better.";
  }
  $("idx").textContent = card + added;

  // A build outlives this page, so one may already be running when it opens.
  $("bar").hidden = !idx.building;
  busy(Boolean(idx.building));

  // The stored-ticket list is deliberately NOT populated here. Reading it
  // deserialises every vector in the store, and doing that on every refresh --
  // which also fires on any index-updated broadcast -- is a lot of work for a
  // table nobody has asked to see. Press "List tickets".
}

// Re-read real state before reporting: a failed build may have left the index
// in a different shape than the buttons assume.
async function fail(text) {
  await refresh().catch(() => busy(false));
  $("bar").hidden = true;
  $("status").textContent = text;
}

async function run(fn) {
  busy(true);
  try {
    await fn();
  } catch (e) {
    await fail("error: " + e);
    return;
  }
  busy(false);
  $("bar").hidden = true;
}

function wire() {
  const build = (force) =>
    run(async () => {
      $("bar").hidden = false;
      const r = await call({ type: "build-index", force });
      if (r && r.skipped) $("status").textContent = "already built — use Rebuild to redo it";
      await refresh();
    });

  $("build").onclick = () => build(false);
  $("rebuild").onclick = () => build(true);

  $("add-ticket").onclick = () =>
    run(async () => {
      const meta = {};
      TICKET_FIELDS.forEach((f) => {
        const v = $("a_" + f).value.trim();
        if (v) meta[f] = v;
      });
      const r = await call({ type: "add-ticket", text: $("a_text").value, meta });
      if (!r.ok) {
        $("status").textContent = "error: " + r.error;
        return;
      }
      // Only clear the form on success, so a rejected add does not cost the text.
      TICKET_FIELDS.forEach((f) => ($("a_" + f).value = ""));
      $("a_text").value = "";
      $("status").textContent = `added ticket ${r.ticket_id} as ${r.chunks} chunks`;
      await refresh();
    });

  $("list").onclick = () =>
    run(async () => {
      const shown = await listTickets();
      $("list-status").textContent = shown.total
        ? `showing ${shown.count} of ${shown.total} ticket${shown.total === 1 ? "" : "s"} — ` +
          `${shown.uploaded} uploaded, ${shown.bundled} bundled`
        : "nothing indexed — press “Build index” first";
    });

  $("delete-tickets").onclick = () =>
    run(async () => {
      // Guard on both: there may be an index built from the bundle with nothing
      // uploaded, and clearing that is still a real action.
      const { uploaded, indexedTickets } = await call({ type: "list-tickets", limit: 0 });
      if (!uploaded && !indexedTickets) {
        $("list-status").textContent = "nothing to delete — the index is already empty";
        return;
      }

      // Two different kinds of loss, so the prompt names them separately: the
      // uploaded text is the only copy and is gone for good, while the index is
      // derived and Build regenerates it from the bundled file.
      const parts = [];
      if (uploaded) {
        parts.push(`permanently delete the text of ${uploaded} uploaded ticket${uploaded === 1 ? "" : "s"}`);
      }
      if (indexedTickets) {
        parts.push(`empty the search index (${indexedTickets} ticket${indexedTickets === 1 ? "" : "s"})`);
      }
      const ok = window.confirm(
        `This will ${parts.join(", and ")}.\n\n` +
          (uploaded ? "The uploaded ticket text cannot be recovered.\n" : "") +
          `Bundled tickets are not removed from the extension — “Build index” puts them back.`,
      );
      if (!ok) {
        $("list-status").textContent = "delete cancelled — nothing was removed";
        return;
      }

      const r = await call({ type: "delete-tickets" });
      if (!r.ok) {
        $("list-status").textContent = "error: " + r.error;
        return;
      }
      $("list-out").textContent = "Press “List tickets” to see what is indexed.";
      $("list-status").textContent =
        `index cleared` +
        (r.removed ? `, and ${r.removed} uploaded ticket${r.removed === 1 ? "" : "s"} deleted` : "") +
        ` — press “Build index” to rebuild from the bundled tickets`;
      await refresh();
    });

  $("classify").onclick = () =>
    run(async () => {
      $("answer").textContent = "";
      $("fields").textContent = "";
      const r = await call({ type: "classify", query: $("query").value });
      if (!r.ok) {
        $("status").textContent = "error: " + r.error;
        return;
      }
      renderFields(r.fields, r.hits.length);
      renderHits(r.hits, r.embedMs, r.searchMs);
      $("status").textContent = `voted from ${r.hits.length} first-chunk neighbours`;
    });

  $("ask").onclick = () => {
    answer = "";
    $("answer").textContent = "";
    $("fields").textContent = "";
    $("stats").textContent = "";
    busy(true);
    call({ type: "ask", query: $("query").value, modelId: $("model").value }).catch(() => {});
  };
}

chrome.runtime.onMessage.addListener((m) => {
  if (!m || m.target !== "popup") return;
  if (m.type === "status") {
    $("status").textContent = m.text;
    if (typeof m.progress === "number") {
      $("bar").hidden = false;
      $("bar").value = m.progress;
    }
  }
  if (m.type === "hits") renderHits(m.hits, m.embedMs, m.searchMs);
  if (m.type === "delta") {
    answer += m.delta;
    $("answer").textContent = answer;
    $("answer").scrollTop = $("answer").scrollHeight;
  }
  if (m.type === "done") {
    busy(false);
    $("bar").hidden = true;
    const s = m.stats;
    $("stats").textContent += ` · first token ${m.firstTokenMs}ms · total ${m.totalMs}ms${
      s && s.decode_tokens_per_s ? ` · decode ${s.decode_tokens_per_s.toFixed(1)} tok/s` : ""
    }`;
  }
  // A build or clear that this page did not start -- it may have been closed
  // for the whole build, or a ServiceNow tab may have added a ticket.
  if (m.type === "index-updated") refresh().catch(() => {});
  if (m.type === "error") fail("error: " + m.error);
});

/**
 * The panel sits at the very bottom of a long options page. It is always
 * expanded, so the "Local AI database" nav link only has to bring it into view.
 */
function revealPanel() {
  const host = document.getElementById("rag-panel");
  if (host) host.scrollIntoView({ behavior: "smooth", block: "start" });
}

function wireNavLink() {
  // Delegated from document: options.js writes that nav link into #popup and the
  // two modules have no guaranteed ordering. Clicks rather than hashchange,
  // because clicking the link a second time leaves the hash unchanged and fires
  // no hashchange at all.
  document.addEventListener("click", (e) => {
    const el = e.target instanceof Element ? e.target.closest('a[href="#rag-panel"]') : null;
    if (!el) return;
    e.preventDefault();
    revealPanel();
  });
  if (location.hash === "#rag-panel") revealPanel();
}

function mount() {
  if (document.getElementById("rag-panel")) return;
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const host = document.createElement("div");
  host.id = "rag-panel";
  host.innerHTML = HTML; // static markup only, no interpolation
  document.body.appendChild(host);

  // Remember each button's real tooltip: busy() overwrites it while no index
  // exists, and must be able to put it back.
  ["classify", "ask"].forEach((id) => ($(id).dataset.hint = $(id).title));

  wire();
  wireNavLink();
  refresh().catch((e) => ($("engine").textContent = "probe failed: " + e));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();
