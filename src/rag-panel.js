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
/* The panel is one of the option page's sections, so it borrows the page's own
   idiom rather than bringing its own: a 20px label as the heading, controls in a
   fieldset, a #06038D status line, "Back to top". Only what the page has no rule
   for is styled here. */
#rag-panel .mono { font: 13px/1.4 ui-monospace, Menlo, monospace; }
#rag-panel .box { background: #f5f5f5; border-radius: 5px; padding: 7px; white-space: pre-wrap; margin: 6px 0; }
#rag-panel .row { display: flex; gap: 6px; margin: 3px 0; }
#rag-panel .row > input { flex: 1; min-width: 0; }
#rag-panel fieldset input, #rag-panel fieldset textarea, #rag-panel fieldset select { font: inherit; box-sizing: border-box; padding: 3px; }
#rag-panel fieldset textarea { width: 100%; height: 52px; margin: 6px 0; }
#rag-panel #rag-a_ticket_id, #rag-panel #rag-a_assignment_group { width: 100%; margin: 3px 0; }
#rag-panel #rag-limit { width: 70px; }
#rag-panel progress { width: 100%; height: 4px; display: block; margin: 4px 0; }
#rag-panel .status { min-height: 15px; }
#rag-engine b { color: #087443; }
#rag-engine .c { color: #888; }
#rag-engine .warn { color: #8d2803; font-weight: 600; }
#rag-answer { border: 1px solid #ddd; border-radius: 5px; padding: 8px; min-height: 40px; max-height: 200px; overflow: auto; white-space: pre-wrap; margin: 6px 0; }
/* Nothing asked, nothing answered: the box is only ever empty before the first
   question, where it reads as a stray frame above the next section. It is set to
   "" and nothing else when cleared, so :empty matches exactly then. */
#rag-answer:empty { display: none; }
#rag-fields { white-space: pre; overflow-x: auto; margin-bottom: 8px; }
#rag-fields:empty { display: none; }
#rag-fields b { color: #087443; }
#rag-fields .c { color: #888; }
#rag-hits .hit { border-top: 1px solid #eee; padding: 5px 0; font-size: 13px; }
#rag-hits .hit b { color: #087443; }
#rag-hits .hit .t { color: #444; display: block; max-height: 52px; overflow: hidden; }
#rag-limit-label { font-size: inherit; display: inline-flex; align-items: center; gap: 5px; margin-right: 6px; }
#rag-list-out { margin: 6px 0; max-height: 220px; overflow: auto; }
#rag-list-out .tk { border-top: 1px solid #eee; padding: 5px 0; font-size: 13px; }
#rag-list-out .tk b { color: #087443; }
#rag-list-out .tk .c { color: #888; }
#rag-list-out .tk .t { color: #444; display: block; max-height: 38px; overflow: hidden; }

/* Batch classification runs. Same row styling as the ticket list, except the
   detail body must not be clipped -- unlike a ticket preview, it is the
   content, and it only appears because someone opened it. */
#rag-batch-out .tk { border-top: 1px solid #eee; padding: 5px 0; font-size: 13px; }
#rag-batch-out .tk b { color: #087443; }
#rag-batch-out .tk .c { color: #888; white-space: pre-wrap; }
#rag-batch-out .tk .t { color: #444; }
#rag-batch-out details > summary { cursor: pointer; list-style-position: outside; }
#rag-batch-out details[open] > summary { margin-bottom: 4px; }
#rag-batch-out details > .t { margin-left: 18px; }
#rag-batch-out button { margin: 6px 0; }
#rag-delete-tickets { color: #8d2803; }
#rag-source-dialog { border: 1px solid #ccc; border-radius: 6px; padding: 14px; max-width: 30em; color: inherit; }
#rag-source-dialog::backdrop { background: rgba(0, 0, 0, 0.35); }
#rag-source-dialog h2 { font-size: 15px; margin: 0 0 8px; }
#rag-source-dialog .opt { display: block; margin: 7px 0; }
#rag-source-dialog .opt input[type="radio"] { margin-right: 6px; }
#rag-source-dialog .c { color: #888; font-size: 12px; display: block; margin: 2px 0 0 20px; }
#rag-source-dialog #rag-source-file { display: block; margin: 4px 0 0 20px; max-width: 100%; }
#rag-source-dialog menu { display: flex; gap: 6px; justify-content: flex-end; margin: 12px 0 0; padding: 0; }
#rag-source-error { color: #8d2803; display: block; margin-top: 8px; min-height: 15px; }

/* Dark theme. options.js stamps data-bw-theme on <html> from the "darkMode"
   Variables row; the page's own rules already cover label, fieldset, button,
   input and textarea, so this only has to fix what is panel-specific. */
html[data-bw-theme="dark"] #rag-panel { color: #e3e3e3; }
html[data-bw-theme="dark"] #rag-panel .box { background: #26282c; }
/* The page leaves the #06038D status colour alone in dark mode; on #1e1f22 it is
   unreadable, so the panel's own status lines take the page's dark link blue. */
html[data-bw-theme="dark"] #rag-panel .status { color: #7cb7ff !important; }
html[data-bw-theme="dark"] #rag-engine b { color: #6ede9a; }
html[data-bw-theme="dark"] #rag-engine .c { color: #9aa0a6; }
html[data-bw-theme="dark"] #rag-engine .warn { color: #ff8a80; }
html[data-bw-theme="dark"] #rag-answer { border-color: #3a3d44; background: #1e1f22; }
html[data-bw-theme="dark"] #rag-hits .hit,
html[data-bw-theme="dark"] #rag-batch-out .tk,
html[data-bw-theme="dark"] #rag-list-out .tk { border-top-color: #3a3d44; }
html[data-bw-theme="dark"] #rag-batch-out .tk b { color: #6ede9a; }
html[data-bw-theme="dark"] #rag-batch-out .tk .c { color: #9aa0a6; }
html[data-bw-theme="dark"] #rag-batch-out .tk .t { color: #c9ccd1; }
html[data-bw-theme="dark"] #rag-hits .hit .t,
html[data-bw-theme="dark"] #rag-list-out .tk .t { color: #c9ccd1; }
html[data-bw-theme="dark"] #rag-fields b,
html[data-bw-theme="dark"] #rag-hits .hit b,
html[data-bw-theme="dark"] #rag-list-out .tk b { color: #6ede9a; }
html[data-bw-theme="dark"] #rag-fields .c,
html[data-bw-theme="dark"] #rag-list-out .tk .c { color: #9aa0a6; }
html[data-bw-theme="dark"] #rag-delete-tickets { color: #ff8a80; }
html[data-bw-theme="dark"] #rag-source-dialog { background: #26282c; border-color: #3a3d44; color: #e3e3e3; }
html[data-bw-theme="dark"] #rag-source-dialog .c { color: #9aa0a6; }
html[data-bw-theme="dark"] #rag-source-error { color: #ff8a80; }
`;

const HTML = `
<label for="explicit-label-name" style="font-size:20px;">Local AI database (WebGPU) \u2014 import tickets, and review, export or delete what is stored:</label>
<fieldset>
  <button id="rag-build" title="Cut, embed and store a set of tickets. You choose where they come from, and whether the records already in the index are kept or deleted first.">Import ticket</button>
  <button id="rag-export" title="Download every stored ticket as JSON \u2014 the bundle format, so the file can be dropped in at srcRaw/data/tickets.local.json and rebuilt from. It contains the full ticket text.">Export tickets (JSON)</button>
  <a href="#top">Back to top</a>
  <div id="rag-status" class="status" style="color: #06038D"></div>
  <label id="rag-limit-label">Show first
    <input id="rag-limit" type="number" min="1" max="500" value="10">
  </label>
  <button id="rag-list">List tickets</button>
  <button id="rag-delete-tickets" title="Empties the search index and permanently deletes the text of every ticket uploaded here. Bundled tickets are not deleted from the file \u2014 Build puts them back.">Delete uploaded tickets and clear the index</button>
  <div id="rag-list-status" class="status" style="color: #06038D"></div>
  <button id="rag-batch-review" title="Show what the batch classification runs found: for each ticket, whether the predicted assignment group matched the one already on the ticket. Recorded by the ServiceNow menu entry &quot;Ask webllm to classify for 5 tickets&quot;.">Review classification runs</button>
  <button id="rag-batch-clear" title="Delete the recorded classification runs. The tickets themselves and the index are untouched.">Clear runs</button>
  <div id="rag-batch-status" class="status" style="color: #06038D"></div>
</fieldset>
<progress id="rag-bar" value="0" max="1" hidden></progress>
<div id="rag-engine" class="mono box">checking\u2026</div>
<div id="rag-idx" class="mono box">index: checking\u2026</div>
<div id="rag-list-out" class="mono">Press \u201cList tickets\u201d to see what is indexed.</div>
<div id="rag-batch-out" class="mono">Press \u201cReview classification runs\u201d to see how the batch runs scored.</div>

<label for="explicit-label-name" style="font-size:20px;">Ask the local model:</label>
<fieldset>
  <textarea id="rag-query">How do I reset a user password?</textarea>
  <select id="rag-model">
    <option value="SmolLM2-360M-Instruct-q4f16_1-MLC">SmolLM2-360M \u2014 376 MB VRAM</option>
    <option value="gemma-2b-it-q4f16_1-MLC" selected>gemma-2b-it \u2014 1477 MB VRAM</option>
  </select>
  <button id="rag-classify" title="Vote on the metadata of the first chunk of each ticket, and report the best combination a real ticket carries">Classify question</button>
  <button id="rag-ask">Search + answer</button>
  <a href="#top">Back to top</a>
</fieldset>
<div id="rag-fields" class="mono"></div>
<div id="rag-answer"></div>
<div id="rag-stats" class="mono"></div>
<div id="rag-hits"></div>

<label for="explicit-label-name" style="font-size:20px;">Add a ticket to the index:</label>
<fieldset>
  <input id="rag-a_ticket_id" placeholder="Ticket ID \u2014 required, e.g. INC00812345">
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
  <button id="rag-add-ticket" title="Chunk, embed and store this ticket \u2014 it survives an import that deletes existing records">Add to index</button>
  <a href="#top">Back to top</a>
</fieldset>

<dialog id="rag-source-dialog">
  <form method="dialog">
    <h2 id="rag-source-title">Import tickets from</h2>
    <div id="rag-source-options"></div>
    <label class="opt">
      <input type="radio" name="rag-source" value="file">
      A .json file on this computer
      <span class="c">Same format as the bundle: {"tickets": [{ "ticket_id", "text", "meta" }]}. An extension cannot read a typed-in path, so the file is chosen here and read in the browser.</span>
      <input type="file" id="rag-source-file" accept=".json,application/json">
    </label>
    <label class="opt">
      <input type="radio" name="rag-source" value="uploads">
      Only the tickets uploaded here
      <span class="c">No starter corpus at all \u2014 just what you added yourself.</span>
    </label>
    <h2 id="rag-existing-title">Do you want to delete existing records?</h2>
    <label class="opt">
      <input type="radio" name="rag-existing" value="keep" checked>
      No \u2014 keep them, and add this import to the index
      <span class="c">A ticket that is already indexed is replaced by the version being imported; everything else stays.</span>
    </label>
    <label class="opt">
      <input type="radio" name="rag-existing" value="delete">
      Yes \u2014 delete every record first, then import
      <span class="c">The index ends up holding this import and your uploaded tickets, and nothing else. The uploaded ticket text itself is not deleted, so it is re-indexed as part of the import.</span>
    </label>
    <span id="rag-source-error"></span>
    <menu>
      <button value="cancel" id="rag-source-cancel">Cancel</button>
      <button value="ok" id="rag-source-ok">Import</button>
    </menu>
  </form>
</dialog>
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
  ["build", "export", "add-ticket", "list", "delete-tickets"].forEach(
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

// ---- batch classification runs -------------------------------------------
// Recorded by the ServiceNow menu entry "Ask webllm to classify for 10
// tickets", which walks a queue of tickets, classifies each one and compares
// the predicted assignment group with the one the ticket already carries.
// Nothing here talks to the offscreen document: this is a read of what those
// runs wrote to chrome.storage.

const STATUS_MARK = { same: "✅", different: "❌" };

/** A dim one-line note inside a ticket's detail block. */
function batchNote(label, text) {
  const line = document.createElement("div");
  line.className = "c";
  const name = document.createElement("b");
  name.textContent = label + ": ";
  line.append(name, document.createTextNode(text));
  return line;
}

/**
 * Everything recorded about one ticket, beyond the verdict itself.
 *
 * Collapsed behind a <details>, because the value of the list above is that
 * ten tickets fit on a screen -- and each of these blocks is a dozen lines.
 * Entries recorded before a field existed simply omit it rather than showing
 * an empty row.
 */
function batchEntryDetail(entry) {
  const body = document.createElement("div");
  body.className = "t";

  if (entry.classification) body.appendChild(batchNote("prediction", entry.classification));

  const fields = entry.currentFields;
  if (fields && Object.keys(fields).length) {
    body.appendChild(batchNote(
      "on the ticket",
      Object.keys(fields).map((k) => `${k}: ${fields[k] || "(empty)"}`).join(" | "),
    ));
  }

  const matched = Array.isArray(entry.matchedTickets) ? entry.matchedTickets : [];
  if (matched.length) {
    const share = Number.isFinite(Number(entry.confidence))
      ? ` (${Math.round(Number(entry.confidence) * 100)}% of the vote)`
      : "";
    const runnerUp =
      entry.runnerUp && Array.isArray(entry.runnerUp.tickets) && entry.runnerUp.tickets.length
        ? ` · runner-up ${entry.runnerUp.tickets.join(", ")}` +
          ` (${Math.round(Number(entry.runnerUp.confidence) * 100)}%)`
        : "";
    body.appendChild(batchNote("copied from", matched.join(", ") + share + runnerUp));
  }

  if (entry.excluded) {
    body.appendChild(batchNote(
      "excluded",
      `${entry.excluded} was already in the index and was left out of its own classification`,
    ));
  }

  const refs = Array.isArray(entry.references) ? entry.references : [];
  if (refs.length) {
    body.appendChild(batchNote("closest references", ""));
    refs.forEach((r) => {
      const meta = r.meta || {};
      const score = Number.isFinite(Number(r.score)) ? Number(r.score).toFixed(4) : "?";
      const line = document.createElement("div");
      line.className = "c";
      // ">>" marks a reference the winning combination actually came from,
      // the same marker the ServiceNow alert uses.
      line.textContent =
        `${r.matched ? ">> " : "   "}${r.ticket || "?"} · ${score} · ` +
        [meta.service_type, meta.ticket_type, meta.request_type, meta.app_hardware, meta.assignment_group]
          .map((v) => v || "N/A")
          .join(" | ");
      body.appendChild(line);
    });
  }

  // entry.note is deliberately not repeated here: it is already the summary
  // line for the statuses that carry one, and an expander whose only content
  // is the row you clicked is worse than no expander at all.
  return body.childNodes.length ? body : null;
}

/**
 * One ticket's line: the mark, the id, and what the two values were --
 * expandable into everything else that was recorded about it.
 */
function batchEntryLine(entry) {
  const summaryText =
    entry.status === "same"
      ? " " + (entry.current || "(empty)")
      : entry.status === "different"
        ? ` current ${entry.current || "(empty)"} · predicted ${entry.predicted || "(empty)"}`
        : entry.status === "nocompare"
          ? " the prediction carried no assignment group"
          : " " + (entry.note || entry.status || "not compared");

  const head = document.createElement("b");
  head.textContent = (STATUS_MARK[entry.status] || "❓") + " " + (entry.ticket || "?");
  const detail = document.createElement("span");
  detail.className = "t";
  detail.textContent = summaryText;

  const body = batchEntryDetail(entry);
  // No detail recorded -- an older run, or a ticket that failed before the
  // classifier answered. A <details> that opens onto nothing is worse than a
  // plain row, so it stays a plain row.
  if (!body) {
    const row = document.createElement("div");
    row.className = "tk";
    row.append(head, detail);
    return row;
  }

  const row = document.createElement("details");
  row.className = "tk";
  // A disagreement is the reason to look at a run at all, so it is open
  // already: the matches are the part worth collapsing.
  row.open = entry.status === "different";
  const summary = document.createElement("summary");
  summary.append(head, detail);
  row.append(summary, body);
  return row;
}

function formatWhen(iso) {
  const d = new Date(iso);
  return isNaN(d) ? String(iso || "unknown") : d.toLocaleString();
}

/** One run: a heading, the match rate, then every ticket it looked at. */
function renderBatchRun(run, index) {
  const box = document.createElement("div");
  box.className = "tk";

  const log = Array.isArray(run.log) ? run.log : [];
  // Recomputed rather than trusted: a run recorded before these counts were
  // stored still renders, and the numbers cannot drift from the rows below.
  const matched = log.filter((e) => e.status === "same").length;
  const missed = log.filter((e) => e.status === "different").length;
  const compared = matched + missed;
  const rate = compared ? ` (${Math.round((matched / compared) * 1000) / 10}%)` : "";

  const head = document.createElement("b");
  head.textContent = run.inProgress
    ? `Run in progress — started ${formatWhen(run.startedAt)}`
    : `Run ${index + 1} — ${formatWhen(run.finishedAt)}`;

  const score = document.createElement("div");
  score.textContent =
    `matched ${matched} of ${compared} compared${rate}` +
    (log.length !== compared ? ` · ${log.length - compared} not compared` : "") +
    ` · ${log.length} ticket${log.length === 1 ? "" : "s"}` +
    (run.limit && log.length < run.limit
      ? ` of ${run.limit}` + (run.inProgress ? " so far" : " (stopped early)")
      : "");

  const why = document.createElement("div");
  why.className = "c";
  why.textContent = run.inProgress
    ? "still running — these are the tickets it has done so far"
    : "stopped: " + (run.reason || "unknown");

  box.append(head, score, why);

  // Names the disagreements up front. The rows below carry the same
  // information, but a run is scanned for exactly this and it should not
  // take reading ten rows to find which two went wrong.
  const missedIds = log.filter((e) => e.status === "different").map((e) => e.ticket);
  if (missedIds.length) {
    const line = document.createElement("div");
    line.className = "c";
    line.textContent = "did not match: " + missedIds.join(", ");
    box.appendChild(line);
  }

  // Why an old run shows no expanders, rather than leaving it a mystery.
  if (log.length && !log.some((e) => e.classification || e.currentFields || e.references)) {
    const line = document.createElement("div");
    line.className = "c";
    line.textContent = "(this run was recorded before the per-ticket detail was kept)";
    box.appendChild(line);
  }
  const rows = log.map((entry) => batchEntryLine(entry));
  rows.forEach((row) => box.appendChild(row));

  // Ten rows are worth opening one at a time; ten rows you want to read end
  // to end are not, and there is no other way to see them all at once.
  const expandable = rows.filter((r) => r.tagName === "DETAILS");
  if (expandable.length > 1) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = "Expand all";
    toggle.onclick = () => {
      const opening = toggle.textContent === "Expand all";
      expandable.forEach((r) => { r.open = opening; });
      toggle.textContent = opening ? "Collapse all" : "Expand all";
    };
    box.insertBefore(toggle, rows[0]);
  }
  return box;
}

async function reviewBatchRuns() {
  const stored = await chrome.storage.local.get([
    "classifyBatchRuns",
    "classifyBatchLastRun",
    "classifyBatch",
  ]);
  let runs = Array.isArray(stored.classifyBatchRuns) ? stored.classifyBatchRuns : [];
  // A run recorded before the history existed left only this one key behind,
  // and it is the run most likely to be wanted.
  if (!runs.length && stored.classifyBatchLastRun) runs = [stored.classifyBatchLastRun];

  // A run only writes its record when it finishes, so one that is still going
  // -- or that broke halfway and never finished -- would otherwise show
  // nothing at all, which is exactly when someone comes looking. The
  // in-progress state is written after every ticket, so it is never behind by
  // more than one.
  const live = stored.classifyBatch;
  if (live && Array.isArray(live.log) && live.log.length) {
    runs = [Object.assign({}, live, { inProgress: true })].concat(runs);
  }

  $("batch-out").textContent = "";
  if (!runs.length) {
    $("batch-out").textContent =
      'No classification runs recorded yet — run "Ask webllm to classify for 5 tickets" from the ServiceNow menu.';
    $("batch-status").textContent = "";
    return;
  }

  runs.forEach((run, i) => $("batch-out").appendChild(renderBatchRun(run, i)));

  const totals = runs.reduce(
    (acc, run) => {
      (Array.isArray(run.log) ? run.log : []).forEach((e) => {
        if (e.status === "same") acc.matched++;
        else if (e.status === "different") acc.missed++;
        else acc.other++;
      });
      return acc;
    },
    { matched: 0, missed: 0, other: 0 },
  );
  const compared = totals.matched + totals.missed;
  $("batch-status").textContent =
    `${runs.length} run${runs.length === 1 ? "" : "s"} · ` +
    (compared
      ? `matched ${totals.matched} of ${compared} compared ` +
        `(${Math.round((totals.matched / compared) * 1000) / 10}%)`
      : "nothing comparable") +
    (totals.other ? ` · ${totals.other} not compared` : "");
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
    // because the next import would restore it from the file moments later.
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

// One combination wins as a unit, so the share and the vote count belong to the
// answer, not to each field -- printing them on all five said "five independent
// verdicts agreed", which was never what the vote measured.
function renderFields(fields, n, match) {
  const box = $("fields");
  box.textContent = "";
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const { value } = fields[key] || {};
    const line = document.createElement("div");
    line.append(`${label.padEnd(LABEL_W)} : `);
    if (value) {
      const v = document.createElement("b");
      v.textContent = value; // ticket data, never innerHTML
      line.append(v);
    } else {
      line.append("— no reference filled this field in");
    }
    box.appendChild(line);
  }

  const m = match || {};
  const tickets = m.tickets || [];
  const summary = document.createElement("div");
  summary.className = "c";
  // Ticket ids and the numbers around them, as text: this is ticket data.
  summary.textContent = tickets.length
    ? `copied from ${tickets.join(", ")} · ` +
      `${Math.round((m.confidence || 0) * 100)}% of the vote · ${tickets.length}/${n} neighbours` +
      (m.runnerUp && m.runnerUp.tickets.length
        ? ` · runner-up ${m.runnerUp.tickets.join(", ")} at ${Math.round(m.runnerUp.confidence * 100)}%`
        : "")
    : "no neighbour carried any of these fields";
  box.appendChild(summary);
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
    ? `\n${idx.added} ticket${idx.added === 1 ? "" : "s"} uploaded here — kept when an import deletes existing records`
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

/**
 * Hand the file to the browser's download machinery.
 *
 * An object URL rather than a data: URL -- a real corpus runs to megabytes, and
 * data: URLs are both size-capped and copied through the address bar. Revoked on
 * the next tick: revoking synchronously can beat the download that is starting.
 */
function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Ask which corpus to build from, and return it as build-index arguments.
 *
 * Resolves to null when the dialog is cancelled. The bundled files are listed by
 * the engine rather than assumed: a released build ships none of them, and
 * offering a file that is not there would be the picker's first lie.
 *
 * A chosen file is read here, in the page, and passed as tickets. That is not a
 * detour around a path input -- an extension page cannot fetch a path off the
 * disk at all, so the file contents are the only form the corpus can arrive in.
 */
async function chooseSource() {
  const dialog = $("source-dialog");
  const options = $("source-options");
  const error = $("source-error");

  const r = await call({ type: "list-bundles" }).catch(() => null);
  const bundles = (r && r.bundles) || [];

  options.textContent = "";
  bundles.forEach((b, i) => {
    const label = document.createElement("label");
    label.className = "opt";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "rag-source";
    radio.value = "bundle:" + b.file;
    // The first is what a plain build would have used anyway, so it is the one
    // already selected: the dialog costs a press, not a decision.
    radio.checked = i === 0;
    label.append(radio, ` ${b.file} \u2014 ${b.count} ticket${b.count === 1 ? "" : "s"}`);
    if (b.generatedAt) {
      const when = document.createElement("span");
      when.className = "c";
      when.textContent = `exported ${new Date(b.generatedAt).toLocaleString()}`;
      label.appendChild(when);
    }
    options.appendChild(label);
  });

  if (!bundles.length) {
    const none = document.createElement("span");
    none.className = "c";
    none.style.marginLeft = "0";
    none.textContent = "This build ships no starter corpus — choose a file, or build from your uploads.";
    options.appendChild(none);
    // Nothing bundled to default to, so the file picker is the live option.
    dialog.querySelector('input[value="file"]').checked = true;
  }

  error.textContent = "";
  $("source-file").value = "";
  // Defaults to keeping, every time the dialog opens: a destructive answer given
  // once should not be remembered and applied to the next import silently.
  dialog.querySelector('input[name="rag-existing"][value="keep"]').checked = true;

  // A file implies the option it belongs to; picking one and leaving the radio
  // on the bundle would silently build the wrong corpus.
  $("source-file").onchange = () => {
    dialog.querySelector('input[value="file"]').checked = true;
  };

  for (;;) {
    // Cleared each round: Escape does not always overwrite returnValue, so a
    // stale "ok" from a previous pass would read as a second confirmation.
    dialog.returnValue = "";
    dialog.showModal();
    const choice = await new Promise((resolve) => {
      dialog.addEventListener("close", () => resolve(dialog.returnValue), { once: true });
    });
    if (choice !== "ok") return null;

    const picked = dialog.querySelector('input[name="rag-source"]:checked');
    const value = picked ? picked.value : "";
    const replace = dialog.querySelector('input[name="rag-existing"]:checked')?.value === "delete";

    if (value.startsWith("bundle:")) return { replace, sourceFile: value.slice("bundle:".length) };
    if (value === "uploads") return { replace, uploadsOnly: true };

    const file = $("source-file").files[0];
    if (!file) {
      // Reopened rather than accepted: closing on an empty choice would look
      // like a build that started and did nothing.
      error.textContent = "Choose a .json file first, or pick one of the other options.";
      continue;
    }
    try {
      const body = JSON.parse(await file.text());
      // A bare array is accepted too: it is what someone trimming an export by
      // hand ends up with, and refusing it teaches nothing.
      const tickets = Array.isArray(body) ? body : body && body.tickets;
      if (!Array.isArray(tickets)) throw new Error('no "tickets" array in the file');
      return { replace, tickets, sourceName: file.name };
    } catch (e) {
      error.textContent = `${file.name}: ${e.message}`;
      continue;
    }
  }
}

function wire() {
  $("build").onclick = () =>
    run(async () => {
      // Asked before the progress bar appears: cancelling should leave the panel
      // exactly as it was, not as one that started something.
      const choice = await chooseSource();
      if (!choice) {
        $("status").textContent = "import cancelled";
        return;
      }
      $("bar").hidden = false;
      const r = await call({ type: "build-index", ...choice });
      if (r && !r.ok) {
        $("status").textContent = "error: " + r.error;
        return;
      }
      await refresh();
    });

  $("export").onclick = () =>
    run(async () => {
      const r = await call({ type: "export-tickets" });
      if (!r.ok) {
        $("status").textContent = "error: " + r.error;
        return;
      }
      if (!r.count) {
        $("status").textContent =
          "nothing to export — no ticket is indexed or uploaded yet";
        return;
      }
      // `ok` is the envelope the message plumbing adds, not part of the bundle
      // format: leaving it in would put a stray key in a file whose whole point
      // is to be readable by loadBundle().
      const { ok, ...snapshot } = r;
      // Stamped with the export time so a second export does not land next to
      // the first as "(1)". Rename it to tickets.local.json to build from it.
      const stamp = snapshot.generatedAt.replace(/[:.]/g, "-").slice(0, 19);
      download(`tickets.local.${stamp}.json`, JSON.stringify(snapshot, null, 2));
      $("status").textContent =
        `exported ${r.count} ticket${r.count === 1 ? "" : "s"} ` +
        `(${r.indexed} indexed, ${r.uploaded} uploaded) — check your downloads`;
    });

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
        : "nothing indexed — press “Import ticket” first";
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
          `Bundled tickets are not removed from the extension — “Import ticket” puts them back.`,
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
        ` — press “Import ticket” to index the bundled tickets again`;
      await refresh();
    });

  // Not wired through run()/busy(): this reads chrome.storage only, so it
  // works with no index, no model and no offscreen document -- exactly when
  // someone wants to look back at what a run found.
  $("batch-review").onclick = () => {
    reviewBatchRuns().catch((e) => {
      $("batch-status").textContent = "error: " + e.message;
    });
  };

  $("batch-clear").onclick = async () => {
    const stored = await chrome.storage.local.get(["classifyBatchRuns"]);
    const count = Array.isArray(stored.classifyBatchRuns) ? stored.classifyBatchRuns.length : 0;
    if (!confirm(`Delete ${count || "the"} recorded classification run${count === 1 ? "" : "s"}?\n\n` +
        "Only the records go; the tickets and the index are untouched.")) {
      $("batch-status").textContent = "nothing was deleted";
      return;
    }
    await chrome.storage.local.remove(["classifyBatchRuns", "classifyBatchLastRun"]);
    $("batch-out").textContent = "No classification runs recorded.";
    $("batch-status").textContent = "runs deleted";
  };

  $("classify").onclick = () =>
    run(async () => {
      $("answer").textContent = "";
      $("fields").textContent = "";
      const r = await call({ type: "classify", query: $("query").value });
      if (!r.ok) {
        $("status").textContent = "error: " + r.error;
        return;
      }
      renderFields(r.fields, r.hits.length, r.match);
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
 * The panel is the second section of the options page, between Variables and
 * Auto expand. It is always expanded, so the "Local AI database" nav link only
 * has to bring it into view.
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
  // options.js leaves #rag-panel-slot as the second section of the page. Both
  // modules are ES modules on the same document, so that template has been
  // written by the time this runs -- but fall back to the end of the page rather
  // than dropping the panel if the slot is ever removed.
  (document.getElementById("rag-panel-slot") || document.body).appendChild(host);

  // Remember each button's real tooltip: busy() overwrites it while no index
  // exists, and must be able to put it back.
  ["classify", "ask"].forEach((id) => ($(id).dataset.hint = $(id).title));

  wire();
  wireNavLink();
  refresh().catch((e) => ($("engine").textContent = "probe failed: " + e));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();
