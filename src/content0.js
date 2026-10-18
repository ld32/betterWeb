if (!window.__betterWebContentLoaded) {
window.__betterWebContentLoaded = true;

// ---- dev reload ------------------------------------------------------------
// Editing this file needs two things to happen: the extension has to reload so
// Chrome re-reads it from disk, and every already-open tab has to reload so the
// stale copy running in it is replaced. Alt+R does the first (see background.js).
// This does the second, by itself.
//
// Reloading the extension orphans the content scripts already injected: their
// chrome.runtime context is invalidated, so chrome.runtime.id disappears and
// touching it can throw. Either way, that is the signal to refresh.
//
// Dev-only, using a flag that already exists: tools/release.sh rewrites the name
// from "Better web dev" to "Better web", so this is inert in every release.
try {
  if (chrome.runtime.getManifest().name.endsWith(' dev')) {
    setInterval(function () {
      try {
        if (!chrome.runtime.id) location.reload();
      } catch (e) {
        location.reload(); // "Extension context invalidated"
      }
    }, 1000);
  }
} catch (e) {
  /* no manifest access: not a context worth reloading */
}

//alert("start")

// jQuery is gone: this file uses the qs/qsa/val helpers defined below instead.
// The notes that used to live here explained how to inject jQuery from devtools
// for testing, which no longer applies.

//"comments": "["https://outlook.live.com/*", "https://mail.google.com/*\", \"https://mail.yahoo.com/*\"], [ \"<all_urls>\"],",

// outlook send button, click does not work: qsa("#docking_InitVisiblePart_0> div:nth-child(1)  > div:nth-child(3) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) button")[0].click()


var iFrameID = ""
var newFormat = false
var currentURL;
var iframeURL = ""

var urlMap = new Map()
urlMap.set("bookmarkTicketColor", 'yellow')
urlMap.set('bookmarkTicketColor1', 'red')
urlMap.set('newTicketColor', 'pink')
urlMap.set('holdTicketColor', 'blue')
urlMap.set('assignedTicketColor', 'yellow')
urlMap.set('closedTicketColor', 'white')

var keywordMap = new Map()
var shortcutMap = new Map()
var shortcutCommentMap = new Map()
var sentenceMap = new Map()
var hideMap = new Map()
var controlMap = new Map()
//var favorMap = new Map()

var urlArray = {}; //new Array(); 
var keywordArray = {}; //new Array(); 
var controlArray = {}; //new Array(); 
var shortcutArray = {}; //new Array(); 
var sentenceArray= {}; //new Array();
var hideArray = {}; //new Array(); 
var fillArray = {};
var favorArray = {};

//var wordMap = new Map()
var fillButtonMap = new Map()
var xpathMap = new Map()
var controlButtonMap = new Map()
var excelRowValue = "";
var lastText = ""
var lastTarget = null
var chatTarget = null
var sending = false
var timeOuts = {}
var currentText = ""
var currentTxt = ''; 
var currentInstLoc=0; 
var firstName = ""
var myFirstName = 'myFirstName'
var myID = ''
var myIDColumn=0; 
var classColumn=0;
var classificationPrompt = '' 
var classificationColor = []; 
var greeting = '';
var listPagePaths = []
var detailPagePaths = []
var leftLinePositionListPage = 0
var rightLinePositionListPage = 0; 
var leftLinePositionDetailPage = 0; 
var rightLinePositionDetailPage = 0; 

var leftLineActionDetailPage = ''
var rightLineActionDetailPage = ''

var firstLineX = 0
var firstLineX1 = 0; 
let userID = ""

//var myLastName = 'Dong'
var firstNameWarning = ''
//var newTicket = false
var hintIndex = 0
var hintText = new Map()

var lastInsertStart = 0
var lastInsertLength = 0
var lastTextWithoutInsert = ""
var isHiding = false

var insertLength = 0
var insertStart = 0
var ctrlDown = false
var cmdString=''
var ctrlKey = 17

var totalInsertLengthToday = 0
var totalInsertLengthThisMonth = 0
var todayTickets = {};

let currentConfig = ""
let configMap = new Map()
let editableDiv = false;
let outsideKeyPress = false;
let lastKeyTime = 0;

let alarm = new Map();
let interv;
let cUrl = "";
let helpMsg = new Map();
let savedDate = ""; let gotNewData = "no"
let isSelfClick = false;
let currentID = "empty";
let ticketLink = ''; 
let autoRun = "";
let lastChar = "";
let lastKey = "";
let updateTimeout;
let myPrompt = "";
let jobID = '';
let chatContext = '';
let leftURL = '';
let rightURL = ''; 
let chatgptURL = ''
// A second chat destination, so "Ask sandbox to suggest" can go somewhere
// other than chatgptURL. Set it as a Variables row named sandboxURL.
let sandboxURL = ''
let saveDrafTimeout = null; 
let chatConfirmOpen = false; // the send-approval dialog is up; hot keys stand down
let ticketURL = ''


// ---- DOM helpers, replacing jQuery ---------------------------------------
// These exist because the selectors reaching them come from the user's config,
// so they have to be as forgiving as jQuery was: a selector that matches
// nothing yields an empty result rather than a crash, and one that does not
// parse is skipped instead of aborting the caller.

/**
 * jQuery's selector engine accepted `#8687fbcc...` -- a ServiceNow sys_id used
 * as an id -- but a CSS identifier may not start with an unescaped digit and
 * querySelectorAll throws on it. The attribute form has no such restriction.
 */
function cssSelector(selector) {
  return String(selector).replace(/#(\d[\w-]*)/g, '[id="$1"]');
}

/**
 * querySelectorAll that cannot throw.
 *
 * Handles the two things config selectors do that CSS does not: a leading `!`
 * turns a row off, and `:first` is jQuery's "first of the matched set".
 */
function qsa(selector, root = document) {
  const raw = String(selector).trim();

  // A row is disabled by prefixing it with '!', which keeps the selector intact
  // and readable. The older habit was to corrupt it instead -- appending 'x' or
  // '1' -- which only stopped it matching when the suffix happened to land on a
  // class name; on a ']' or ')' it made the selector unparsable, and before the
  // catch below one such row aborted the whole hide loop.
  if (raw.startsWith('!')) return [];

  const first = /^(.*):first$/.exec(raw);
  try {
    const els = (root || document).querySelectorAll(cssSelector(first ? first[1] : raw));
    return first ? (els.length ? [els[0]] : []) : els;
  } catch (e) {
    // A typo in a config row, then -- not a disabled one, which returns above.
    console.warn('skipping unparsable selector:', selector, e.message);
    return [];
  }
}

/** First match, or null. */
function qs(selector, root = document) {
  return qsa(selector, root)[0] || null;
}

/** jQuery's .val() read: undefined when nothing matched, never a throw. */
function val(selector) {
  const el = qs(selector);
  return el ? el.value : undefined;
}

/** jQuery's .val(v) write: every match, and a no-op when there are none. */
function setVal(selector, value) {
  qsa(selector).forEach((el) => { el.value = value; });
}

/** jQuery's .text(): '' for a missing node rather than a crash. */
function txt(node) {
  return node ? node.textContent : '';
}

/** jQuery's .attr()/.removeAttr() over a whole set, tolerant of an empty one. */
function setAttr(selector, name, value) {
  qsa(selector).forEach((el) => el.setAttribute(name, value));
}

function removeAttr(selector, name) {
  qsa(selector).forEach((el) => el.removeAttribute(name));
}

/** jQuery's .show()/.hide(): '' restores the stylesheet's value, as jQuery did
 *  for anything it had hidden itself. */
function showEls(selector) {
  qsa(selector).forEach((el) => { el.style.display = ''; });
}

function hideEls(selector) {
  qsa(selector).forEach((el) => { el.style.display = 'none'; });
}

/** jQuery's .click() fired on every match, not just the first. */
function clickEls(selector) {
  qsa(selector).forEach((el) => el.click());
}

/**
 * jQuery's $(document).ready(). The manifest runs this script at document_end,
 * so the DOM is already parsed and DOMContentLoaded has passed -- listening for
 * it would wait forever. jQuery deferred a late callback with a timer; keep that
 * so the callback still runs after this file finishes evaluating.
 */
function onDomReady(fn) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
  else setTimeout(fn, 0);
}




let lastWord = ''
var draftMarker = '';
var draft = '';

let mostRecentMessage = "";
var hintMsg = '';
let tmpHintOn = false;
let lastSentence = '';
let lastTabTime = 0;
let mousePosition = { x: 0, y: 0 };
let distanceTraveled = 0;
var backgroundChangeable = false; 
var shortDescrtionYValue = 0; 
var pageOpenTime = 0;
var pageCloseTime = 0;
var caretPosition = 0; 
var delayTimeout; 
var searchTerms = [];

var allTicketIDs = []; 
var orderedTicketNavigationStorageKey = 'orderedTicketNavigation';
var domain = "";
var editingMode = false;
var mouseX = 0; 
var mouseY = 0; 

var profileIsFound = true; 

// Edit/Control mode is one row of the status panel; the panel itself is built
// further down, next to the ticket state it shares a box with. renderStatusPanel
// is a hoisted function declaration, so calling it from here is fine.
function updateEditControlMode(isEditing) {
  editingMode = !!isEditing;
  console.log('Edit/Control mode changed:', editingMode ? 'Edit mode' : 'Control mode');
  renderStatusPanel();
}

function setupEditControlModeStatus() {
  updateEditControlMode(false);

  // document.addEventListener('input', function (event) {
  //   if (event.target && event.target.tagName === 'TEXTAREA') {
  //     updateEditControlMode(true);
  //   }
  // }, true);

  // document.addEventListener('keydown', function (event) {
  //   if (event.target && event.target.tagName === 'TEXTAREA') {
  //     updateEditControlMode(true);
  //   }
  // }, true);

  // document.addEventListener('paste', function (event) {
  //   if (event.target && event.target.tagName === 'TEXTAREA') {
  //     updateEditControlMode(true);
  //   }
  // }, true);

  // document.addEventListener('focusout', function (event) {
  //   if (!(event.target && event.target.tagName === 'TEXTAREA')) return;
  //   setTimeout(function () {
  //     updateEditControlMode(document.activeElement && document.activeElement.tagName === 'TEXTAREA');
  //   }, 0);
  // }, true);
}

function isTrustedServiceNowOrigin(origin) {
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'https:' && (parsed.hostname === 'service-now.com' || parsed.hostname.endsWith('.service-now.com'));
  } catch (e) {
    return false;
  }
}

function appendSafeExternalLink(targetContainer, candidateUrl) {
  // jQuery's .append() on an empty set was a no-op, and callers still pass a
  // container that may not be on the page.
  if (!targetContainer) return;
  try {
    const parsed = new URL(candidateUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return;
    }
    if (parsed.hostname.endsWith('complianceline')) {
      return;
    }

    const wrapper = document.createElement('div');
    const anchor = document.createElement('a');
    anchor.href = parsed.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = parsed.href;
    wrapper.appendChild(anchor);
    targetContainer.append(wrapper);
  } catch (e) {
    // Ignore invalid URL candidates.
  }
}

function escapeHtmlContent(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* A hint bubble is white-on-black and carries two accent colours of its own: the
   completion suffix in red and the "[1 or double tab key]" badge in green. Every
   one of those three colours is inline !important, and the bubble is marked
   data-bw-ui, because the dark theme (dark.css) would otherwise repaint the lot:
   an element with an inline background is assumed to be the page's own, so it
   and everything under it is forced to near-black -- which on this bubble's black
   panel means invisible text. Inline !important is the one declaration that beats
   a stylesheet's !important, and data-bw-ui additionally keeps the theme's
   "inherit" rule for extension overlays from flattening red and green to white. */
function createHintBubble(baseText, suffixText, badgeText, options = {}) {
  const wrap = document.createElement('div');
  wrap.setAttribute('data-bw-ui', '');
  const panel = document.createElement('div');
  panel.style.cssText = 'font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: white !important; display: inline-block; white-space: pre-wrap; background-color: black !important; padding: 10px;';
  if (options.withBorder) {
    panel.style.border = '1px solid #606060';
  }

  panel.appendChild(document.createTextNode(baseText));

  const hi = document.createElement('span');
  hi.style.setProperty('color', '#FF4C4C', 'important');
  if (options.highlightId) {
    hi.id = options.highlightId;
  }
  hi.appendChild(document.createTextNode(suffixText));

  const badge = document.createElement('span');
  badge.id = 'textPredictionTabHint';
  badge.style.cssText = 'width: 49px; height: 19px; border-radius: 2px; border-style: solid; border-width: 1px; border-color: #606060; white-space: nowrap; font-size: 0.7em; color: #32CD32 !important; padding-left: 3px; padding-right: 3px; padding-top: 1px; margin-left: 4px; position: relative; top: -2px;';
  badge.textContent = badgeText;

  hi.appendChild(badge);
  panel.appendChild(hi);
  wrap.appendChild(panel);
  return wrap;
}

// ---- local answers, from web-llm ----------------------------------------
// The engine streams its answer token by token, but a half-written sentence is
// not useful on a ticket page: the whole answer is accumulated here and shown
// once, in the alert this extension already uses for everything else.
//
// Progress still comes through, because the first local answer downloads a
// 1.5 GB model and silence for that long reads as a hang.
let localAnswerText = '';
let localAnswerHits = [];
// The ticket retrieval skipped because it is the one being asked about. Shown
// with the sources: a list missing the obvious ticket is confusing otherwise.
let localAnswerExcluded = null;

/** Reset the accumulator for a new question. */
function localAnswerStart() {
  localAnswerText = '';
  localAnswerHits = [];
  localAnswerExcluded = null;
  tmpAlert('Asking the local model\u2026 the first answer has to download it, which is slow.', 6000);
}

/** Progress, not content: model download percentages and retrieval timings. */
function localAnswerStatus(text) {
  if (text) tmpAlert(text, 5000);
}

/** Tokens are collected, not displayed -- localAnswerDone shows the result. */
function localAnswerChunk(chunk) {
  localAnswerText += chunk;
}

/** The tickets retrieval chose, listed under the answer so it can be checked. */
function localAnswerSources(hits, excluded) {
  localAnswerHits = Array.isArray(hits) ? hits : [];
  localAnswerExcluded = excluded || null;
}

/**
 * The answer alone, ready to paste into a reply.
 *
 * `localAnswerText` is the model's output and nothing else -- the Sources block
 * is added by localAnswerDone when it builds the alert, not by the model. The
 * strip is still here because the model is told to cite, and sometimes it ends
 * with a sources list of its own; what goes in a reply to a user should not
 * carry the archive's internal ticket numbers.
 */
function localAnswerForReply() {
  let text = (localAnswerText || '').trim();
  // Cut at a "Sources:" / "Source:" heading on its own line, wherever it starts.
  const cut = text.search(/(^|\n)\s*sources?\s*:/i);
  if (cut > -1) text = text.slice(0, cut);
  return text.trim();
}

/** The whole answer, once. */
function localAnswerDone(info) {
  info = info || {};
  if (info.error) {
    tmpAlert('Local model failed: ' + info.error, 8000);
    return;
  }

  const answer = localAnswerText.trim();
  if (!answer) {
    tmpAlert('The local model returned nothing.', 6000);
    return;
  }

  const sources = localAnswerHits.length
    ? '\n\nSources:\n' + localAnswerHits.map((h, i) => {
        const meta = h.meta || {};
        const score = Number.isFinite(Number(h.score)) ? Number(h.score).toFixed(3) : '?';
        return `[${i + 1}] ${meta.ticket_id || h.id || '?'} (${score})`;
      }).join('\n')
    : '';

  const excludedNote = localAnswerExcluded
    ? '\n(ticket ' + localAnswerExcluded + ' is in the index but was excluded — a ticket is '
      + 'not a reference for itself)'
    : '';

  const secs = Number.isFinite(Number(info.totalMs))
    ? ' (' + (Number(info.totalMs) / 1000).toFixed(1) + 's)'
    : '';

  tmpAlert('Local model answer' + secs + ':\n\n' + answer + sources + excludedNote, 120000);
}

function getDate() {
  const dateObj = new Date();

  let year = dateObj.getFullYear();
  let month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
  let date = ('0' + dateObj.getDate()).slice(-2);
  let hour = ('0' + dateObj.getHours()).slice(-2);
  let minute = ('0' + dateObj.getMinutes()).slice(-2);
  let second = ('0' + dateObj.getSeconds()).slice(-2);

  return `${year} -${month} -${date} -${hour} -${minute} -${second} `;
}



function updateInsertLength(length) {
  const addedLength = Number(length) || 0;
  if (addedLength <= 0) return;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);    // "2025-11-17"
  const currentMonth = now.getFullYear() + "-" + 
          String(now.getMonth() + 1).padStart(2, "0"); // "2025-11"

  // Determine current week start (Monday) in YYYY-MM-DD
  const dayOfWeek = now.getDay(); // Sunday=0, Monday=1, ...
  const diffToMonday = (dayOfWeek + 6) % 7; // converts Sunday->6, Monday->0, etc.
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const currentWeekStart = monday.toISOString().slice(0,10);

  chrome.storage.local.get({
    insertLengthToday: 0,
    totalInsertLengthThisMonth: 0,
    insertLengthThisWeek: 0,
    lastUpdateDate: null,      // for daily reset
    lastMonthTracked: null,    // for monthly reset
    weekStartDate: null        // for weekly reset (Monday anchor)
  }, (result) => {
    let {
      insertLengthToday = 0,
      totalInsertLengthThisMonth = 0,
      insertLengthThisWeek = 0,
      lastUpdateDate = null,
      lastMonthTracked = null,
      weekStartDate = null
    } = result;

    // Reset daily counter if new day
    if (lastUpdateDate !== today) {
      insertLengthToday = 0;
    }

  //lastMonthTracked='2025-11'; 

   console.log("lastMonthTracked", lastMonthTracked, 'currentMonth', currentMonth)

    // Reset monthly counter if new month
    if (lastMonthTracked !== currentMonth) {
      totalInsertLengthThisMonth = 0;
    }

    // Reset weekly counter if new week (Monday anchor changed)
    if (weekStartDate !== currentWeekStart) {
      insertLengthThisWeek = 0;
    }

    // Add the new length
    insertLengthToday += addedLength;
    totalInsertLengthThisMonth += addedLength;
    insertLengthThisWeek += addedLength;

    // Save everything back
    chrome.storage.local.set({
      insertLengthToday: insertLengthToday,
      totalInsertLengthThisMonth: totalInsertLengthThisMonth,
      insertLengthThisWeek: insertLengthThisWeek,
      lastUpdateDate: today,
      lastMonthTracked: currentMonth,
      weekStartDate: currentWeekStart
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log("Updated → Today:", insertLengthToday,
                    " | This week:", insertLengthThisWeek,
                    " | This month:", totalInsertLengthThisMonth);

        tmpAlert(`Inserted ${addedLength} chars. Today: ${insertLengthToday}, Week: ${insertLengthThisWeek}, Month: ${totalInsertLengthThisMonth}`, 20000);
      }
    });
  });
}

onDomReady(function () {
  

  pageOpenTime = new Date().getTime(); 
  currentURL = window.location.href;

  if(currentURL.startsWith('file://')) {
    domain = 'file://Users/ld32/projects/betterWebPrivate';
  } else if (currentURL.indexOf('testPage') != -1) {
    domain = 'https://ld32.github.io/betterWeb'; //';
  } else {  
    domain = "https://" + currentURL.match(/https:\/\/([^\/]+)/)[1];
  }
  //if( ! domain) { domain = 'file'; } 

  console.log('got currentURL: ', currentURL, 'domain: ', domain)



  loadCon(); 
  // Wait for chatgptURL to be ready, then run dependent code
  function waitForConfigReady(callback) {
    // if(profileIsFound == false) {
    //   console.warn("Profile not found, skipping wait for config ready.");
    //   return;
    // }
    const MAX_WAIT = 20; // 20 * 500ms = 10 seconds
    let waitCount = 0;
    const interval = setInterval(() => {
      if (ticketURL != '' && typeof ticketURL !== 'undefined') {
        clearInterval(interval);
        console.log("currentConfig is ready:", ticketURL);
        callback();
      } else if (++waitCount >= MAX_WAIT || profileIsFound == false) {
        clearInterval(interval);
        console.warn("Timed out waiting for ticketURL or profile not found. Ignore this site.");
      } else {
        console.log("Waiting for ticketURL to be ready...", ticketURL);
      }
    }, 500);
  }

  waitForConfigReady(function() {
    // work on chat window
    // 'sandbox' is a substring match, the way it was before the sandbox host was
    // dropped: the host is whatever sandboxURL points at, and this script has no
    // config of its own once it is running on that page.
    if (currentURL.indexOf('chatgpt.com') != -1 || currentURL.indexOf('cloude.ai') != -1 || currentURL.indexOf('openai.com') != -1 || currentURL.indexOf('sandbox') != -1) {
      console.log("should start to chat ")

      chrome.storage.local.get(['askChatgpt'], function (result) {

        if (result.askChatgpt != undefined) {

          console.log(result.askChatgpt)
          let lastOne = null;

          // `selectors` is a list, tried in order on every tick: a composer can
          // appear late, and which selector fits depends on the host.
          //
          // It also gives up. Polling forever is how a renamed element turned
          // into a silent failure -- the tab opened, nothing filled, and the
          // console said nothing at all.
          function waitForElement(selectors, callback) {
            const list = Array.isArray(selectors) ? selectors : [selectors];
            let ticks = 0;
            const MAX_TICKS = 60; // 60 * 500ms = 30s
            const interval = setInterval(() => {
              let texbox = null;
              for (const sel of list) {
                try {
                  texbox = document.querySelector(sel);
                } catch (e) {
                  console.log('composerSelector is not a valid CSS selector:', sel, e.message);
                }
                if (texbox) break;
              }

              if (!texbox && ++ticks >= MAX_TICKS) {
                clearInterval(interval);
                console.log(
                  'betterWeb: no composer found on this host after 30s, so the question could not '
                  + 'be filled in. Inspect the input box and add a Variables row "composerSelector" '
                  + 'with a CSS selector that matches it. Tried: ' + list.join('  |  ')
                );
                return;
              }

              if (texbox) {
                clearInterval(interval);

                console.log("Textbox is now visible:", texbox);
                // Your logic here

                // No per-host branch any more: fillComposer dispatches on what
                // the element is. The sandbox's composer is a real textarea and
                // takes .value; chatgpt.com's is a ProseMirror contenteditable
                // that ignores .value and reconciles an innerText assignment
                // away, so it needs the input path instead.
                console.log('composer filled via', fillComposer(texbox, result.askChatgpt));
                setTimeout(() => {

                  // console.log, not console.error: nothing has failed here.
                  // As an error it showed up red with a stack trace in devtools,
                  // which reads as a bug in a path that is working.
                  console.log("dispatching input so the send button appears");
                  var evt = new Event('input', { bubbles: true, cancelable: true });
                  texbox.dispatchEvent(evt);

                  // 5 x 200ms was under a second. The button stays disabled
                  // until the editor's own state catches up with the text, which
                  // on a long prompt takes longer than that -- so the retries ran
                  // out while the button was still there but not yet pressable.
                  const MAX_RETRIES = 20;
                  let retries = 0;

                  function tryClick() {
                    const button = findSendButton();

                    if (button) {
                      button.click();
                      console.log("Clicked submit button!")
                    } else if (retries < MAX_RETRIES) {
                      console.log("try", retries)
                      retries++;
                      setTimeout(tryClick, 300);
                    } else if (pressEnterToSend(texbox)) {
                      // Neither the selector list nor run-time discovery found
                      // anything, so send the way a person would. If this host
                      // treats Enter as a newline nothing happens, and the
                      // message below still says what to configure.
                      console.log(
                        'betterWeb: no send button found by name or by shape after ' + MAX_RETRIES
                        + ' tries, so Enter was pressed in the composer instead. If the question did '
                        + 'not send, inspect the send button and add a Variables row "sendSelector" '
                        + 'with a CSS selector that matches it. Tried: ' + chatSendSelectors().join('  |  ')
                      );
                    } else {
                      console.log(
                        'betterWeb: no enabled send button found after ' + MAX_RETRIES + ' tries. '
                        + 'Inspect the send button and add a Variables row "sendSelector" with a CSS '
                        + 'selector that matches it. Tried: ' + chatSendSelectors().join('  |  ')
                      );
                    }
                  }

                  tryClick();
                }, 400); // wati for click

                var updateTimeout;
                const observer = new MutationObserver(mutationsList => {
                  const elements = chatAnswerElements();
                  // Nothing to read yet, or no selector fits this host. Either
                  // way there is no answer to act on, and reading .innerText off
                  // an undefined element would kill this callback for good.
                  if (!elements.length) return;
                  lastOne = elements[elements.length - 1];

                  console.log("final output:", lastOne.innerText)
                  clearTimeout(updateTimeout);

                  const el = document.querySelector(".result-thinking");
                  if (!el) {

                    // Wait for a specified duration before considering the update complete
                    console.log('start timer')
                    updateTimeout = setTimeout(() => { // note: if this does not work, we can try to conpare the answer length and return the longest answer
                      console.log("answer from final output:", lastOne.innerText)
                      observer.disconnect();

                     // add a thumbs up button after the answer
                      if (lastOne != null) {


                        // chatgpt is classifying the tickets and got the results
                        chrome.storage.local.get(['classifyTicketList'], function (result) {
                          if (result.classifyTicketList && result.classifyTicketList.length > 0) {
                            // directly save the results here
                            let tics = lastOne.innerText.split('\n');
                            
                            for (let i = 0; i < tics.length; i++) {
                                //ignore   empty line and line without classification result
                                if(tics[i].indexOf(' Classification: ') == -1) {
                                  continue
                                }
                                let tic = tics[i].split(' Classification: ')[0].trim();
                                let cla = tics[i].split(' Classification: ')[1].trim();
                                chrome.storage.local.set({[tic + 'classificationResult']: cla}, function () {
                                  if (chrome.runtime && chrome.runtime.lastError) {
                                    console.error("Error saving classification result for", tic, cla, chrome.runtime.lastError);
                                  } else {
                                    console.log("classification result saved for ", tic, cla);
                                  }
                                });
                            }  

                            chrome.storage.local.remove('classifyTicketList', function () {
                              console.log('No more items left, classifyTicketList has been cleared.');
                            }); // xxx 
                            chrome.storage.local.set({ 'upDownClicked': 'yes' }, function () {
                                console.log("upDownClicked is set");
                              });
                            chrome.runtime.sendMessage({ greeting: "closeTab, the chat tab" }, response => {
                              if (response && response.farewell) {
                                const activeTabId = response.farewell;
                                console.log('Received active tab ID:', activeTabId);
                              }
                            });
                      

                          } else {
                            const existingButton = document.getElementById('thumbsUpButton');
                            if (!existingButton) {
                              const thumbsUpButton = document.createElement('button');
                              thumbsUpButton.id = 'thumbsUpButton';
                              thumbsUpButton.textContent = '👍'
                              thumbsUpButton.style.position = 'fixed'
                              thumbsUpButton.style.right = '20px'
                              thumbsUpButton.style.top = '50%'
                              thumbsUpButton.style.transform = 'translateY(-50%)'
                              thumbsUpButton.style.fontSize = '48px'
                              thumbsUpButton.style.width = '80px'
                              thumbsUpButton.style.height = '80px'
                              thumbsUpButton.style.borderRadius = '50%'
                              thumbsUpButton.style.border = '2px solid #ccc'
                              thumbsUpButton.style.backgroundColor = '#fff'
                              thumbsUpButton.style.cursor = 'pointer'
                              thumbsUpButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
                              thumbsUpButton.style.zIndex = '10000'
                              thumbsUpButton.title = 'Send positive feedback'
                              thumbsUpButton.onclick = function() { 
                                console.log('Thumbs up clicked!')
                                chrome.runtime.sendMessage({ greeting: "answerFromChatgpt " + lastOne.innerText }, function (response) {
                                  console.log(response.farewell)  
                                  })  ;
                              };
                              document.body.appendChild(thumbsUpButton);
                            }


                          }
                        });

                      
                    //  chrome.runtime.sendMessage({ greeting: "answerFromChatgpt " + lastOne.innerText }, function (response) {
                     //   console.log(response.farewell);

                        // close chat window
                        //  open(location, '_self').close();

                     // });
                      }
                    }, 4000); // Adjust the timeout duration as
                  }  
                });
                observer.observe(document.body, { attributes: true, characterData: true, subtree: true });

                // Without this the failure is silent: no selector matches, the
                // observer returns early every time, and the thumbs-up simply
                // never appears with nothing in the console to say why. Checked
                // once, late enough that an answer has had time to render.
                setTimeout(() => {
                  if (chatAnswerElements().length) return;
                  console.log(
                    'betterWeb: no answer element matched on this host, so the thumbs-up button '
                    + 'cannot be placed. Inspect one answer, then add a Variables row '
                    + '"answerSelector" with a CSS selector that matches it. Tried: '
                    + chatAnswerSelectors().join('  |  ')
                  );
                }, 15000);
              } else {
                console.log("Textbox not found, retrying...");
              }
            }, 500); // Adjust the interval as needed (e.g., 100ms)
          }

          waitForElement(chatComposerSelectors(), (textbox) => {

          });

          chrome.storage.local.remove('askChatgpt', function () {
            console.log('Value with has been removed.');
          });

        } else {
          console.log("chat question not found")
        }
      })
    }




 // });

  if ( currentURL.indexOf('classic') != -1)  {
    console.log('new format')
    newFormat = true; 
  }  

    
  if (currentURL.indexOf('service-now.com/sys_attachment.do') != -1) {
    document.addEventListener('click', (e) => {
      console.log('click attachment')
      window.close();
    })
  


  // pop up window to selete item from list  
  } else if (currentURL.indexOf("service-now.com/cmdb_ci") != -1 || currentURL.indexOf("service-now.com/sys_user_list.do") != -1) {

    chrome.storage.local.get(['assignTicket'], function (result) {
      if (result.assignTicket != undefined) {

        console.log("processing button popup")
        console.log("currentURL", currentURL)
        let arry = result.assignTicket.split(':')

        if (currentURL.indexOf(arry[0]) != -1) {
          let rows = qsa('tbody tr td:nth-child(3)')

          for (let i = 0; i < rows.length; i++) {

            console.log('text is', rows[i].textContent)

            // if (rows[i].textContent.startsWith(arry[1])) { // only check first name to make it simple

            //as long as the row contain the string we are looking for, we select it
            if (rows[i].innerHTML.indexOf(arry[1]) != -1) {
              console.log("try to tell new tab closed");
              chrome.storage.local.set({ newTabOpened: 'no' }, function () {
                console.log("new tab closed");
                rows[i].firstChild.click();
              });

              console.log('find it')
              break
            }
          };
        }
        chrome.storage.local.set({ 'assignTicket': null }, function () {
          console.log("you removed");
        });
        return
      }
    })
  } else if (currentURL.indexOf("service-now.com/sys_user_group_list.do") != -1) {

    chrome.storage.local.get(['assignTicket'], function (result) {
      if (result.assignTicket != undefined) {

        console.log("processing button popup. for: ", result.assignTicket)
        console.log("currentURL", currentURL)
        let arry = result.assignTicket.split(':')

        if (currentURL.indexOf(arry[0]) != -1) {

          setTimeout(() => {
            let rows = document.querySelectorAll('a')

            console.log('find rows', rows.length)

            for (let i = 0; i < rows.length; i++) {

              console.log('text is', rows[i].innerText)

              if (rows[i].innerText === arry[1]) {
                console.log("try to tell new tab closed");
                chrome.storage.local.set({ newTabOpened: 'no' }, function () {
                  console.log("new tab closed");
                  rows[i].click();
                });

                console.log('find it')
                break
              }
            };


          }, 1000);

        }
        chrome.storage.local.set({ 'assignTicket': null }, function () {
          console.log("you removed");
        });
        return
      }
    })
 
  }  // user page to assign ticket to user or group
  


  if (listPagePaths.some(path => currentURL.includes(path))) {
    console.log("servicenow main page or servicenow dev main page");  

    // Monitor ServiceNow's sidebar toggle; when enabled, warn because extension interactions can break.
    function monitorSidebarToggleButton() {
      let lastToggleState = null;

      function isSidebarToggleOn(button) {
        if (!button) return false;
        const ariaPressed = (button.getAttribute('aria-pressed') || '').toLowerCase();
        const dataState = (button.getAttribute('data-state') || '').toLowerCase();
        const className = (button.className || '').toLowerCase();
        return ariaPressed === 'true' || dataState === 'on' || dataState === 'open' ||
          className.indexOf('active') !== -1 || className.indexOf('selected') !== -1;
      }

      function checkToggleState(button) {
        const isOn = isSidebarToggleOn(button);
        if (isOn && lastToggleState !== true) {
          console.log("Sidebar toggle is ON. Opening all incidents in new tabs.");
          // loop through the incidents in the list

          // here is one row of the table: 
          // <div class="sn-widget-list-content sn-connect-widget-list-wrapper ng-scope ng-isolate-scope" ng-if="::!isHelpDesk" conversation="conversation"><div snap-toggle="left" class="sn-widget-list-content sn-widget-list-content_static"><!-- ngIf: ::!conversation.isGroup --><!-- ngIf: ::conversation.isGroup --><span class="sn-avatar_sm sn-avatar_v2 ng-scope ng-isolate-scope" ng-class="avatarType()" ng-if="::conversation.isGroup" members="conversation.avatarMembers" group-avatar="images/document.pngx"><!-- ngRepeat: user in users | limitTo: 4 --><div class="sn-avatar-container ng-scope" ng-repeat="user in users | limitTo: 4"><span class="sn-avatar-initials ng-binding">LD</span><span class="sn-avatar-image" ng-style="::getBackgroundStyle(user)" style="background-image: url(&quot;images/document.pngx&quot;);"></span></div><!-- end ngRepeat: user in users | limitTo: 4 --></span><!-- end ngIf: ::conversation.isGroup --></div><div class="sn-widget-list-content"><span class="sn-widget-list-title ng-binding">OpenEye academic license</span><span aria-hidden="true" class="sn-widget-list-subtitle ng-binding" ng-bind-html="conversation.lastMessage.cleanText | truncate">Lingsheng Dong has been added to the group</span></div><!-- ngIf: conversation.visible --><div class="sn-widget-list-content sn-widget-list-content_static sn-widget-list-content_hidden sn-widget-list-content_actions default-focus-outline ng-scope" ng-if="conversation.visible" tabindex="0" role="button" aria-label="Remove conversation from sidebar: OpenEye academic license" title="" ng-keypress="remove($event)" ng-click="remove($event)" id="remove_conversation_button_e63d21ac2b0e0b90f505f8a3c891bf61" data-original-title="Remove From Sidebar"><div class="sn-widget-list-action icon-cross"></div></div><!-- end ngIf: conversation.visible --><!-- ngIf: conversation.unreadCount > 0 --><div ng-if="conversation.unreadCount &gt; 0" class="sn-widget-list-content sn-widget-list-content_static sn-widget-list-content_badge sn-connect-widget-list-badge ng-scope"><span class="sn-badge default ng-binding">1</span></div><!-- end ngIf: conversation.unreadCount > 0 --></div>
          function isVisible(el) {
            if (!el || !el.ownerDocument || !el.ownerDocument.defaultView) return false;
            const styles = el.ownerDocument.defaultView.getComputedStyle(el);
            return styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0';
          }

          function getVisibleIncidentLinks() {
            const itemMap = new Map();
            const sourceCounts = { top_document: 0 };
            const sidebarRoot = document.querySelector('.sn-connect-content.sn-pane-visible, .sn-connect-content[ng-controller="chatFloating"]');
            if (!sidebarRoot) {
              console.log('Incident link sources:', sourceCounts);
              return [];
            }

            const openList = sidebarRoot.querySelector('ul[aria-label="Open Conversations"]');
            if (!openList || !isVisible(openList)) {
              console.log('Incident link sources:', sourceCounts);
              return [];
            }

            const items = Array.from(openList.querySelectorAll('li[role="listitem"][id^="conversation_item_"]'));
            items.forEach(function(item) {
              if (!isVisible(item)) return;

              const titleEl = item.querySelector('.sn-widget-list-title');
              const subtitleEl = item.querySelector('.sn-widget-list-subtitle');
              const title = (titleEl && titleEl.textContent || '').trim();
              const subtitle = (subtitleEl && subtitleEl.textContent || '').trim();
              const itemId = item.id || title || subtitle;
              if (!itemId) return;

              if (!itemMap.has(itemId)) {
                itemMap.set(itemId, {
                  item: item,
                  ticketId: title || itemId,
                  source: 'top_document'
                });
                sourceCounts.top_document += 1;
              }
            });

            console.log('Incident link sources:', sourceCounts);

            return Array.from(itemMap.values());
          }

          function openLinksWhenReady(retryLeft) {
            const incidentLinks = getVisibleIncidentLinks();
            console.log(`Found ${incidentLinks.length} visible conversation items to process.`);

            if (incidentLinks.length === 0 && retryLeft > 0) {
              setTimeout(function() {
                openLinksWhenReady(retryLeft - 1);
              }, 600);
              return;
            }

            chrome.storage.local.set({ 'followUpWorking': window.location.href }, function() {
              if (chrome.runtime.lastError) {
                console.error("Error setting followUpWorking:", chrome.runtime.lastError);
              } else {
                console.log("Set followUpWorking to '", currentURL, "'");
              }
            });


            const popupDelayMs = 1500;
            const stepDelayMs = 1500;

            function processConversationAt(index) {
              if (index >= incidentLinks.length) {
                console.log('Finished processing visible conversation items in the current tab.');
                return;
              }

              const item = incidentLinks[index];
              if (!item || !item.item) {
                console.log('No conversation item found for index', index);
                setTimeout(function() {
                  processConversationAt(index + 1);
                }, stepDelayMs);
                return;
              }

              console.log(`Opening conversation item ${index + 1}/${incidentLinks.length}: ${item.ticketId}`);

              const clickTargets = [
                item.item.querySelector('.sn-navhub'),
                item.item.querySelector('.sn-navhub-content[role="presentation"]'),
                item.item.querySelector('button[aria-label="Open record"]'),
                item.item.querySelector('button[aria-label]'),
                item.item.querySelector('button'),
                item.item
              ];

              const target = clickTargets.find(function(el) {
                return !!el && typeof el.click === 'function';
              });

              if (!target) {
                console.log(`No clickable target found for ${item.ticketId}`);
                setTimeout(function() {
                  processConversationAt(index + 1);
                }, stepDelayMs);
                return;
              }

              target.click();
              console.log(`Clicked conversation row for ${item.ticketId}`);

              setTimeout(function() {
                const popup = Array.from(document.querySelectorAll('.sn-connect-floating-wrapper')).find(function(el) {
                  return isVisible(el);
                });
                console.log('Found conversation pop-up:', popup);
                if (popup) {
                  const closeButton = popup.querySelector('a[aria-label="Close"]');
                  const messageBodies = popup.querySelectorAll('.sn-feed-body span[aria-live="polite"]');
                  const lastMessageElement = messageBodies[messageBodies.length - 1];
                  const lastMessage = ((lastMessageElement &&
                    (lastMessageElement.getAttribute('aria-label') || lastMessageElement.textContent)) || '').trim();
                  const isAddedToGroupMessage = /\bhas been added to the group\.?$/i.test(lastMessage);

                  if (isAddedToGroupMessage) {
                    console.log('Last message is an added-to-group system message; closing pop-up:', lastMessage);
                    if (closeButton) {
                      closeButton.click();
                    } else {
                      console.log('No "Close" button found in the conversation pop-up.');
                    }
                  } else {
                    const viewDocButton = popup.querySelector('a[aria-label="View Document"]');
                    if (viewDocButton) {
                      console.log('Found "View Document" button:', viewDocButton);
                      viewDocButton.click();
                    } else {
                      console.log('No "View Document" button found in the conversation pop-up.');
                    }
                    if (closeButton) {
                      console.log('Found "Close" button in the conversation pop-up:', closeButton);
                      closeButton.click();
                    } else {
                      console.log('No "Close" button found in the conversation pop-up.');
                    }
                  }

                }

                setTimeout(function() {
                  processConversationAt(index + 1);
                  if (index + 1 >= incidentLinks.length) {
                    console.log("Processing complete. Removing followUpWorking from storage.");
                    console.log('currentURL', currentURL)

                    // click the toggle button to close the sidebar
                    const toggleButton = document.getElementById('connect_toggle_sidebar_header_button');
                    if (toggleButton && isSidebarToggleOn(toggleButton)) {
                      console.log("Closing the sidebar toggle button.");
                      toggleButton.click();
                    } else {
                      console.log("Sidebar toggle button not found or already closed.");
                    }

                    // 
                    console.log("Cleanig up", currentURL  );
                    chrome.storage.local.get(['followUpWorking'], function(result) {
                      if (result.followUpWorking !== undefined) {
                        
                        console.log("open the original tab");
                        chrome.runtime.sendMessage({ greeting: "Open " + result.followUpWorking + ' in new tab' }, response => {
                          console.log("Sent message to open follow-up link:", result.followUpWorking);
                        });
                      } else if (chrome.runtime.lastError) {
                        console.error("Error reading followUpWorking:", chrome.runtime.lastError);
                      } 

                      chrome.storage.local.remove('followUpWorking', function() {
                        if (chrome.runtime.lastError) {
                          console.error("Error removing followUpWorking:", chrome.runtime.lastError);
                        } else {
                          console.log("Removed followUpWorking from storage after processing all items.");
                        }   
                      })

                        // chrome.runtime.sendMessage({ greeting: "closeTab" }, response => {
                        //   console.log("Sent message to close tab:", result.followUpWorking);
                        // });

                        setTimeout(() => {
                         chrome.runtime.sendMessage({ greeting: "switchToLeftTab" }, response => {
                          console.log("Switched back to the left tab after processing all items.");
                        });
                      }, 1000); // wait 1 second before switching back to the left tab

                   });


                  }     

                }, stepDelayMs);
              }, popupDelayMs);
            }

            // chrome.storage.local.remove('followUpWorking', function() {
            //   
            // });
            processConversationAt(0);
          }

          openLinksWhenReady(6);




        }
        lastToggleState = isOn;
      }

      function attachWatchers(button) {
        if (!button) return;
        checkToggleState(button);

        const observer = new MutationObserver(function() {
          checkToggleState(button);
        });
        observer.observe(button, { attributes: true, attributeFilter: ['class', 'aria-pressed', 'data-state'] });

        button.addEventListener('click', function() {
          setTimeout(function() { checkToggleState(button); }, 150);
        });
      }

      const toggleSidebarButton = document.getElementById('connect_toggle_sidebar_header_button');
      if (toggleSidebarButton) {
        attachWatchers(toggleSidebarButton);
        return;
      }

      let retryCount = 0;
      const maxRetries = 30;
      const interval = setInterval(function() {
        const delayedButton = document.getElementById('connect_toggle_sidebar_header_button');
        if (delayedButton) {
          clearInterval(interval);
          attachWatchers(delayedButton);
        } else if (++retryCount >= maxRetries) {
          clearInterval(interval);
        }
      }, 1000);
    }

    //monitorSidebarToggleButton();
    




    // check if it is a new day
    const today = new Date();

    // Get the year, month, and day components of the date
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, so add 1
    const day = String(today.getDate()).padStart(2, '0');

    // Create the date string in the format "YYYY-MM-DD"
    const dateString = `${year}-${month}-${day}`;

    console.log(dateString); // Output: "2023-08-16" (for example, if today is August 16, 2023)
    //let todayTickets = {};

    chrome.storage.local.get(['todayTickets'], function (result) {
      if (chrome.runtime.lastError) {
        console.error("Error reading data: " + chrome.runtime.lastError);
      } else {
        todayTickets = result.todayTickets;
        console.log("If it is new day, delete all ticket openning records:", todayTickets);
        if (typeof (todayTickets) != 'undefined' && todayTickets['today'] != dateString) {
          todayTickets = {};
          chrome.storage.local.remove('todayTickets', function () {
            console.log('ticket records has been removed.');
          });
        }
      }
    });

    chrome.storage.local.get(['searchTicket'], function (result) {
      if (result.searchTicket != undefined) {
        console.log("searching ticket");
        if(newFormat) {
          setTimeout(() => { 
            console.log("new format");
            document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector("div").firstElementChild.firstElementChild.children[0].shadowRoot.querySelectorAll("div")[5].querySelector('div').firstElementChild.shadowRoot.firstElementChild.querySelector('div').children[2].firstElementChild.firstElementChild.firstChild.firstChild.shadowRoot.firstChild.shadowRoot.firstChild.firstChild.firstChild.firstChild.click();

            document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector("div").firstElementChild.firstElementChild.children[0].shadowRoot.querySelectorAll("div")[5].querySelector('div').firstElementChild.shadowRoot.firstElementChild.querySelector('div').children[2].firstElementChild.firstElementChild.firstChild.firstChild.shadowRoot.firstChild.shadowRoot.firstChild.firstChild.firstChild.querySelector("#sncwsgs-typeahead-input").select(); 

            setTimeout(() => {
              document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector("div").firstElementChild.firstElementChild.children[0].shadowRoot.querySelectorAll("div")[5].querySelector('div').firstElementChild.shadowRoot.firstElementChild.querySelector('div').children[2].firstElementChild.firstElementChild.firstChild.firstChild.shadowRoot.firstChild.shadowRoot.firstChild.firstChild.firstChild.querySelector("#sncwsgs-typeahead-input").value = result.searchTicket;

              setTimeout(() => {
                const enterEvent = new KeyboardEvent('keydown', {
                  bubbles: true,
                  cancelable: true,
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13  // 13 is the keyCode for Enter key
                });

                document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector("div").firstElementChild.firstElementChild.children[0].shadowRoot.querySelectorAll("div")[5].querySelector('div').firstElementChild.shadowRoot.firstElementChild.querySelector('div').children[2].firstElementChild.firstElementChild.firstChild.firstChild.shadowRoot.firstChild.shadowRoot.firstChild.firstChild.firstChild.querySelector("#sncwsgs-typeahead-input").dispatchEvent(enterEvent)
              }, 2000);
              
            }, 2000);
          }, 8000);
        } else {
          clickEls(".input-group-addon-transparent.icon-search.sysparm-search-icon");
          console.log(result.searchTicket);
          setVal("#sysparm_search", result.searchTicket)
          qs(".form-inline.navpage-global-search.ng-non-bindable")?.requestSubmit();
        }
        chrome.storage.local.remove('searchTicket', function () {
          console.log('Value with has been removed.');
        });
        
        setTimeout(() => {
          //window.location.reload();

          // after the ticket is find. Let's open the ticket without header part
          var iframe = document.getElementById('gsft_main');
          if (iframe != null) {
            console.log("iframe is found1");
            iframeURL = iframe.contentWindow.location.href;
            console.log('iframe url: ')
            console.log(iframeURL);

            if (iframeURL.indexOf('incident.do') != -1) {

                  chrome.runtime.sendMessage({ greeting: "Open " + iframeURL }, function (response) {
                    console.log(response.farewell);
                  });
        
            } else {
              processIFrame(iframe);
            }
          } else {
            console.log("iframe is not found1");
            processIFrame(iframe); 
          }
        }, 3000);

      // not search ticket  
      } else {

        // ticket list page inside iframe, need to process it
        console.log("not searching ticket");
        var iframe = document.getElementById('gsft_main');

        if (iframe != null) {
          console.log("iframe is found");
          iframe.onload = function () {
            console.log('Iframe content has loaded.');
            iframeURL = iframe.contentWindow.location.href;
            console.log('iframe url: ')
            console.log(iframeURL);
            // main page with a ticket, let open it directly
            if (iframeURL.indexOf('incident.do') != -1) {
              
              chrome.storage.local.get('followUpWorking', function (result) {
                if (result.followUpWorking != undefined) {
                  console.log("followUpWorking is yes, do open the ticket in new tab");
                  chrome.runtime.sendMessage({ greeting: "Open " + iframeURL + " in new tab" }, function (response) {
                    console.log(response.farewell);
                  });
                } else {
                  console.log("followUpWorking is not yes, do not open the ticket in new tab");
                  chrome.runtime.sendMessage({ greeting: "Open " + iframeURL }, function (response) {
                    console.log(response.farewell);
                  });
                }
              });
            } else {
              processIFrame(iframe);
            }
          }
          if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            iframe.onload();
          }

        } else {
          console.log("iframe is not found");
          processIFrame(iframe);
        }
      }
    })
    
    // addd a floating button for user to classify tickets
    // Create a floating button at the top center of the main page (not inside any iframe)
    // let classifyButton = document.createElement('button');
    // classifyButton.innerText = 'Classify Tickets';
    // classifyButton.style.position = 'fixed';
    // classifyButton.style.top = '5px';
    // classifyButton.style.left = '50%';
    // classifyButton.style.transform = 'translateX(-50%)';
    // classifyButton.style.padding = '10px 20px';
    // classifyButton.style.backgroundColor = '#007bff';
    // classifyButton.style.color = '#fff';
    // classifyButton.style.border = 'none';
    // classifyButton.style.borderRadius = '5px';
    // classifyButton.style.cursor = 'pointer';
    // classifyButton.style.zIndex = '10000';
    // classifyButton.onclick = function() {

    //   function showButtonSpinner(button, spinnerText = "Working...") {
    //     button._originalText = button.textContent;
    //     const spinner = document.createElement('span');
    //     spinner.className = 'spinner';
    //     spinner.style.cssText = 'display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top:2px solid #007bff;border-radius:50%;animation:spin 1s linear infinite;vertical-align:middle;margin-right:8px;';
    //     button.replaceChildren(spinner, document.createTextNode(spinnerText));
    //     button.disabled = true;
    //   }

      
    //   // // test backgournd donwlod tiket list csv file
    //   // need get token /session id from cookie or somewhere to make it work, and also need to know the url to download the file, which I have not found yet.
    //   // chrome.runtime.sendMessage({ greeting: "downloadTickets" }, function (response) {
    //   //   console.log(response.farewell);
    //   // });

    //   // if(1==1) {
    //   //   return;
    //   // }

    //   // loop through allTicketIDs and print out
    //   let classifyTicketList = [];

    //   function processTicket(i) {
    //     if (i >= allTicketIDs.length) {
    //       // All done, save and open if any
    //       if (classifyTicketList.length > 0) {
    //         showButtonSpinner(classifyButton);

    //         // for tesing, give one ticket only xxx
    //         classifyTicketList = classifyTicketList.slice(0, 5);

    //         chrome.storage.local.set({ 'classifyTicketList': classifyTicketList }, function () {
    //           console.log("classifyTicketList saved");
    //         });
    //         let url = domain + "/incident.do?sys_id=" + classifyTicketList[0].split(':')[1];

    //         console.log("classifying incident omain: ", domain)
    //         console.log("currentURL: ", currentURL)
    //         if(currentURL.indexOf('testPage') != -1) {
    //           url = domain + "/testPage/incident.do.html?sys_id=" + classifyTicketList[0].split(':')[1];
    //         } 

    //         console.log("try to open ticket for classification2: ", url);
    //         chrome.runtime.sendMessage({ greeting: "Open " + url}, function (response) {
    //           console.log(response.farewell);
    //         });
          
    //       } else {
    //        tmpAlert("No tickets need to be classified on this page.", 5000); 
    //       }
    //       console.log('Classify Tickets button clicked!');
    //       return;
    //     }

    //     const ticketID = allTicketIDs[i];
    //     const key1 = ticketID + 'classificationResult';
    //     chrome.storage.local.get([key1], function (result) {
    //       if (result[key1]) {
    //         console.log("Found existing classification result:", result[key1]);
    //         processTicket(i + 1);
    //       } else {
    //         console.log("No classification result found for:", ticketID);
    //         let tid = ticketID + 'sysid';
    //         chrome.storage.local.get([tid], function (result2) {
    //           if (result2[tid] != undefined) {
    //             let ticketInfo = result2[tid];
    //             classifyTicketList.push(ticketID + ':' + ticketInfo);
    //           } else {
    //             console.log("No sysid found for:", ticketID);
    //           }
    //           processTicket(i + 1);
    //         });
    //       }
    //     });
    //   }

    //   processTicket(0);
    // };
    // // Ensure the button is added to the main document body, not inside any iframe
    // document.body.appendChild(classifyButton);





  } else { // individual ticket, task, or teams page
    

  if(searchTerms.length > 0) {

    document.addEventListener('dblclick', (e) => {
      console.log('doubleclick single ticket, slack or email');
      let tem = window.getSelection().toString()
      copyToClipboard(tem);
      if (tem.startsWith(searchTerms[0]) || tem.startsWith(searchTerms[1]) || tem.startsWith(searchTerms[2]) || tem.startsWith(searchTerms[3]) || tem.startsWith(searchTerms[4])) {

        //chrome.storage.local.get(['ticketURL'], function (result) {
          //console.log("checking returned:")
          if (ticketURL != '') {
            chrome.storage.local.set({ 'searchTicket': tem }, function () {
              console.log("ticket Id saved");

              var value = "Open " + ticketURL + " in new tab"
              chrome.runtime.sendMessage({ greeting: value }, function (response) {
                console.log(response.farewell);
                // if (response.farewell != "urls will opened.") {
                //   chrome.storage.local.remove('searchTicket', function () {
                //     console.log('Value with has been removed.');
                //   });
                //   //alert(response.farewell)
                // }
              });
            });
          } else {
            alert("Please set value for variable ticketURL in option page.");

          }
        //})
      }
    })
  }


    
    if(detailPagePaths.some(path => currentURL.includes(path))) {
       console.log("individla ticket, task, or teams page");
      

       setupEditControlModeStatus();

      // check to see if it is new format and headbar is not disabled in individual ticket page
      let mac = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010")
      if (mac != null) alert("Please disable 'Always show top navigation' in 'Settings' > 'Display' or enable 'Turn off Next Experience' in 'Settings' > 'User experience' > 'Turn off Next Experience'")
      
      console.log("individual ticket without navigation bar");

      console.log('CurrentURL', "should click submit button here?")
      chrome.storage.local.get(['delayKeyPressAfterReload'], function (result) {

        if (chrome.runtime.lastError) {
          console.error("Error reading data: " + chrome.runtime.lastError);
        } else {
          console.log("Retrieved data:", result.delayKeyPressAfterReload);

          let dataWithTimestamp = result.delayKeyPressAfterReload;

          if (typeof (dataWithTimestamp) != 'undefined') {
            const currentTimestamp = Date.now();
            const storedTimestamp = dataWithTimestamp.timestamp;
            console.log("currentTimestamp", currentTimestamp, "storedTimestamp", storedTimestamp)

            if (currentTimestamp - storedTimestamp > 20000) {
              chrome.storage.local.remove('delayKeyPressAfterReload', function () {
                console.log('Key deleted successfully');
              });
            } else {
              let re = dataWithTimestamp.data;

              if (typeof (re) != 'undefined') {



                let labelValuesPair = re.split(" ")

                console.log("Key value pair:", labelValuesPair);

                delayTimeout = setTimeout(() => {

                  //document.dispatchEvent(new KeyboardEvent('keyup', { 'key': labelValuesPair[1].trim() }));

                  labelValuesPair[1].trim().split('').forEach((char) => {
                      document.dispatchEvent(new KeyboardEvent('keyup', { 'key': char }));
                      console.log(char);
                  });

                // delay keypress for 4 seconds
                }, 2000);

                if (labelValuesPair.length > 2) {

                  const timestamp = Date.now(); // Current timestamp in milliseconds

                  //remove the first two item and continue to save the rest of the string, which is the ticket number
                  const dataWithTimestamp = { data: 'Delay ' + labelValuesPair.slice(2).join(' ').trim(), timestamp: timestamp };

                  console.log("Saving data with timestamp:", dataWithTimestamp);
                  chrome.storage.local.set({ 'delayKeyPressAfterReload': dataWithTimestamp }, function () {
                    console.log("delay keypress saved");
                  });


                } else {
                  chrome.storage.local.remove('delayKeyPressAfterReload', function () {
                    console.log('Key deleted successfully');
                  });
                }
              }
            }
          }
        }
      })

      


      // only show yellow after ticket open for 10 seconds 
      setTimeout(() => {  

        // Create a new Date object for today's date
        const today = new Date();

        // Get the year, month, and day components of the date
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, so add 1
        const day = String(today.getDate()).padStart(2, '0');

        // Create the date string in the format "YYYY-MM-DD"
        const dateString = `${year}-${month}-${day}`;

        console.log(dateString); // Output: "2023-08-16" (for example, if today is August 16, 2023)
        let todayTickets1 = {};

        chrome.storage.local.get(['todayTickets'], function (result) {
          if (chrome.runtime.lastError) {
            console.error("Error reading data: " + chrome.runtime.lastError);
          } else {
            todayTickets1 = result.todayTickets;
            console.log("Retrieved data:", todayTickets1);
            if (typeof (todayTickets1) != 'undefined' && todayTickets1['today'] === dateString) {
              todayTickets1[currentID] = today.getTime();
            } else {
              todayTickets1 = {};
              todayTickets1['today'] = dateString;
              todayTickets1[currentID] = today.getTime();
            }
            console.log("Saving data:", todayTickets1);

            chrome.storage.local.set({ todayTickets: todayTickets1 }, function () {
              if (chrome.runtime.lastError) {
                console.error("Error saving data: " + chrome.runtime.lastError);
              } else {
                console.log("Data saved successfully");
              }
            });
          }
        });
      }, 100); // wait for 10 seconds to make sure the page is loaded
    
    
      // read userID from storage 
      chrome.storage.local.get([currentID + '_userID'], function (result) {

        if (chrome.runtime.lastError) {
          console.error("Error reading userID: " + chrome.runtime.lastError);
        } else {
          userID = result[currentID + '_userID'];
          console.log("Retrieved userID:", userID);
        }
      }); 

    } // individual ticket 
  }

  }); // wait for config to ready 
}); // end of doeument ready 

function loadCon(){

   currentID = document.title.split(" ")[0]; //0sys_id=')[1]; // for ticket page, 
   ticketLink = currentURL.split('&')[0]; 
   // currentID is ticket number + sysid, for list page, currentID is just date to make sure the highlight works for today tickets only
   console.log(currentID);

  chrome.storage.local.get({ myConfigs: "myConfigs" }, function (ob) {
      // this si the firstime to run it
      if (ob.myConfigs === 'myConfigs') return
      var obj = JSON.parse(ob.myConfigs);
      console.log('read myConfigs');
      var keys = Object.keys(obj);

      let findURL = false;
      for (let i = 0; i < keys.length; i++) {
        console.log(obj[keys[i]][0], obj[keys[i]][1]);
        //document.getElementById(obj[keys[i]][0]).value = obj[keys[i]][1];  
        configMap.set(obj[keys[i]][0], obj[keys[i]][1])  // config, url
        if (obj[keys[i]][0].startsWith("Config") && obj[keys[i]][1].length > 3) {
          let urls = obj[keys[i]][1].split(/\s+/)
          for (let j = 0; j < urls.length; j++) {
            if (currentURL.indexOf(urls[j]) != -1) {
              cUrl = urls[j];
              currentConfig = obj[keys[i]][0]
              findURL = true;
            }
          }
        }
      }
      if (!findURL) {

        //currentConfig = 'config1'
        //exit
        console.log('Profile not find');
        profileIsFound = false;
        return;
      }


      loadConfig()
    });

}


function loadConfig() {

    

    chrome.storage.local.get(['lastDownloadDate'], function(result) {
      let lastDownloadDate = null;
      if (chrome.runtime.lastError) {
        console.error("Error reading last download date: " + chrome.runtime.lastError);
      } else {
        lastDownloadDate = result.lastDownloadDate; // || 10000;
        console.log('Last download date:', lastDownloadDate);

        if (lastDownloadDate) {
          // Accept both new numeric timestamps and old date-string values.
          const lastMs = (typeof lastDownloadDate === 'number')
            ? lastDownloadDate
            : Date.parse(lastDownloadDate);

          if (Number.isNaN(lastMs)) {
            console.warn('Invalid lastDownloadDate value:', lastDownloadDate);
            return;
          }

          const nowMs = Date.now();
          const diffTime = Math.abs(nowMs - lastMs);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          console.log('Days since last download:', diffDays);
          if (diffDays >= 7) {
            tmpAlert("It has been over a week since you last exported the config file. To make sure you have a backup of the config, please consider exporting and backing up in the configure page. Please open the option page and export the congig file.", 5000);
          }
        } else if (lastDownloadDate === null || typeof lastDownloadDate === 'undefined') {

        tmpAlert ("Looks like you never backed up your config file. It is highly recommended to export and back up your config in the configure page, so you will not lose your settings and data when you switch to a new computer or need to reset the extension. Please open the option page and export the congig file.", 5000);
        }
      }
    });

  if (currentConfig === "Config1") {

    chrome.storage.local.get({ configa: "configa" }, function (dat) {
      console.log('read configa', dat);
      if (dat.configa === 'configa') return
      var ob = JSON.parse(dat.configa);
      processData(ob)
    });
  } else if (currentConfig === "Config2") {

    chrome.storage.local.get({ configb: "configb" }, function (dat) {
      console.log('read configb', dat);
      if (dat.configb === 'configb') return
      var ob = JSON.parse(dat.configb);
      processData(ob)
    });
  } else if (currentConfig === "Config3") {

    chrome.storage.local.get({ configc: "configc" }, function (dat) {
      console.log('read configc', dat);
      if (dat.configc === 'configc') return
      var ob = JSON.parse(dat.configc);
      processData(ob)
    });
  } else if (currentConfig === "Config4") {

    chrome.storage.local.get({ configd: "configd" }, function (dat) {
      console.log('read configd', dat);
      if (dat.configd === 'configd') return
      var ob = JSON.parse(dat.configd);
      processData(ob)
    });
  }
}

function processData(ob) {
  console.log("processing")
  let obj = ob[1];
  var keys = Object.keys(obj)
  for (let i = 0; i < keys.length; i++) {
    console.log("processing", obj[keys[i]][0], obj[keys[i]][1]);
    urlMap.set(obj[keys[i]][0], obj[keys[i]][1])
    urlArray[i] = [obj[keys[i]][0], obj[keys[i]][1]];
  }
 
  ticketURL = urlMap.get('ticketURL') || ''; 


  console.log("got ticketURL", ticketURL);

  const splitWords = function (value) {
    return ((value || '').trim() === '') ? [] : value.trim().split(/\s+/);
  };
  const splitSpace = function (value) {
    return ((value || '').trim() === '') ? [] : value.trim().split(' ');
  };

  searchTerms = splitWords(urlMap.get('searchTerms'));


  console.log("urlMap", urlMap);
  chatgptURL = urlMap.get('chatgptURL')? urlMap.get('chatgptURL') : '';
  sandboxURL = urlMap.get('sandboxURL')? urlMap.get('sandboxURL') : '';
  myID = urlMap.get('myID'); 
  myFirstName = urlMap.get('myFirstName')
  //myIDColumn = parseInt(urlMap.get('myIDColumn'))
  classificationColors = splitSpace(urlMap.get('classificationColors'));
  classColumn = 0; //parseInt(urlMap.get('classColumn')) || 0;
  classificationPrompt = urlMap.get('classificationPrompt')
  const leftLineParts = splitSpace(urlMap.get('leftLinePositionListPage'));
  const rightLineParts = splitSpace(urlMap.get('rightLinePositionListPage'));
  leftLinePositionListPage = parseFloat(leftLineParts[0] || '0')
  rightLinePositionListPage = parseFloat(rightLineParts[0] || '0')
  //leftLinePositionDetailPage = parseFloat(urlMap.get('leftLinePositionDetailPage').split(' ')[0])
 // rightLinePositionDetailPage = parseFloat(urlMap.get('rightLinePositionDetailPage').split(' ')[0])
 // leftLineActionDetailPage = urlMap.get("leftLinePositionDetailPage").split(' ')[1]; 
 // rightLineActionDetailPage = urlMap.get('rightLinePositionDetailPage').split(' ')[1]; 

  leftURL = leftLineParts[1] || ''
  rightURL = rightLineParts[1] || ''

  // if(currentURL.startsWith('file://')) {

  //   leftURL = 'file:///Users/ld32/projects/betterWebPrivate/testPage/' + leftURL
  //   rightURL = 'file:///Users/ld32/projects/betterWebPrivate/testPage/' + rightURL
  // } else if (currentURL.indexOf('betterWebPrivate') !== -1) {
  //   leftURL = 'https://ld32.github.io/betterWebPrivate/testPage/' + leftURL
  //   rightURL = 'https://ld32.github.io/betterWebPrivate/testPage/' + rightURL
  // } else if (currentURL.indexOf('betterWeb') !== -1) {
  //   leftURL = 'https://ld32.github.io/betterWeb/testPage/' + leftURL
  //   rightURL = 'https://ld32.github.io/betterWeb/testPage/' + rightURL
  // } 

  console.log("leftURL", leftURL)
  console.log("rightURL", rightURL)
  greeting = urlMap.get('greeting')
  listPagePaths = splitWords(urlMap.get('listPagePaths'));
  detailPagePaths = splitWords(urlMap.get('detailPagePaths'));
  //detailPagePaths.push("teams.microsoft.com");   // add teams channel page to detail page list, which need different handling than list page;

 
  if (! detailPagePaths.some(path => currentURL.includes(path))) {
     console.log("Not servicenow detail page, stop loading other configs");  
    return;
  }

  console.log("myID", myID);


          


      
  
  
  if (myFirstName === undefined || myFirstName.length == 0) myFirstName = "myFirstName"

  console.log("checking myFirstName here", myFirstName)
  if (myFirstName === 'myFirstName' && currentURL.indexOf('service-now')!= -1) {
    alert("Please set up your name in option page.");
    // // moz-extension://0471f12d-4126-4ac2-b0c9-b61bf889242b/options.html")
  }

  //shortcut for link and paragraphs
  obj = ob[2]
  var keys = Object.keys(obj)
  for (let i = 0; i < keys.length; i++) {

    console.log("Auto click for: " + [obj[keys[i]][0], obj[keys[i]][1]])
    keywordArray[i] = [obj[keys[i]][0], obj[keys[i]][1]]
    keywordMap.set(obj[keys[i]][0], obj[keys[i]][1])
  }

  console.log("set up mutation")
  var mutationObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.target && mutation.target.innerText) {
        let k = mutation.target.innerText; 
       // for (let k of keywordMap.keys()) {
          //  console.log('need auto click: ', mutation.target.innerText, " looing for: ", k)

          if (keywordMap.has(k)) {
            mutation.target.style.pointerEvents = "auto";
            console.log("Need click: ", mutation.target) 
            console.log("Need click: ", mutation.target.pointerEvents) 
            //mutation.target.click()

            if (typeof mutation.target.click === 'function') {

              setTimeout(() => mutation.target.click(), 500); // 

              //mutation.target.click();
            } else {
              console.log("Target is not clickable:", mutation.target);
            }
            // <button class="ytp-skip-ad-button ytp-ad-component--clickable" id="skip-button:19" style="opacity: 0.5;"><div class="ytp-skip-ad-button__text">Skip</div><span class="ytp-skip-ad-button__icon"><svg height="100%" viewBox="-6 -6 36 36" width="100%"><path d="M5,18l10-6L5,6V18L5,18z M19,6h-2v12h2V6z" fill="#fff"></path></svg></span></button>
          }
        //}
      }
    })
  })
  mutationObserver.observe(document.body, { attributes: true, subtree: true, childList: true, characterData: true })
  
  // controls
  obj = ob[3]
  var keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    if(obj[keys[i]][0].indexOf("#") != -1 ) {
      continue; // currently we do not support control for element with id, because it is usually more stable and can be directly defined in the code, instead of relying on user to set up in config, which may have error.
    }
    console.log(obj[keys[i]][0], obj[keys[i]][1])
    let k = obj[keys[i]][0].replace(/ .*/, '');

    if (k.length < 4) {
      // contain non-alphabet and non-numiric
      if (/[^a-zA-Z0-9]/.test(k)) { 
        continue;
      }
      // remove the first word if it is only one word and start with a-z, which is usually a modifier key like "ctrl", "shift", "alt" and "option"
      helpMsg.set(k, "<p><strong>" + k + ": </strong>" + obj[keys[i]][0].split(" ").slice(1).join(" ") + "</p>")

      controlArray[i] = [obj[keys[i]][0], obj[keys[i]][1]]
      // if(controlMap.has(k)) { 
      //   alert("Duplicated control hot key: \n" + k + ": " + controlMap.get(k) + "\n" + k + ":" + obj[keys[i]][1])
      //   return
      // } controlMap

      controlMap.set(k, obj[keys[i]][1]);
      controlButtonMap.set(obj[keys[i]][0], k);
    }
  }

  // shortcuts
  obj = ob[4]
  var keys = Object.keys(obj);
  var map = new Map()
  for (let i = 0; i < keys.length; i++) {
    var k = obj[keys[i]][0].replace(/ .*/, '')
    shortcutMap.set(k, obj[keys[i]][1]);
    map.set(k, obj[keys[i]][0].substring(obj[keys[i]][0].indexOf(' ') + 1));
  }
  shortcutCommentMap = new Map([...map.entries()].sort((a, b) => a[1].localeCompare(b[1])))

  // sentences
  obj = ob[5]
  var keys = Object.keys(obj);
  var map = new Map()
  for (let i = 0; i < keys.length; i++) {
    //sentenceArray[i] = [obj[keys[i]][0], obj[keys[i]][1]] 
    map.set(obj[keys[i]][1], parseInt(obj[keys[i]][0]))

    //   chatContext = chatContext + obj[keys[i]][1] + "\n"
    //   let arr = obj[keys[i]][1].split((/\s+/))
    //   for(let j=0; j<arr.length; j++){
    //     if(arr[j].length > 4) {
    //       if(wordMap.has(arr[j])){
    //         wordMap.set(arr[j], wordMap.get(arr[j])+1)
    //       } else {
    //         wordMap.set(arr[j], 1);
    //       }
    //     }  
    //   }
  }
  sentenceMap = new Map([...map.entries()].sort((a, b) => b[1] - a[1]))
  //wordMap = new Map([...wordMap.entries()].sort((a, b) => b[1] - a[1]))

  // hide elements
  obj = ob[6]
  var keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    hideArray[i] = [obj[keys[i]][0], obj[keys[i]][1]]
    hideMap.set(obj[keys[i]][1], obj[keys[i]][0]);
    // console.log(obj[keys[i]][1], obj[keys[i]][0])
  }

  // auto fill
  obj = ob[7]
  var keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    if(obj[keys[i]][0].indexOf("#") != -1) {
      continue; // currently we do not support control for element with id, because it is usually more stable and can be directly defined in the code, instead of relying on user to set up in config, which may have error.
    }

    fillArray[i] = [obj[keys[i]][0], obj[keys[i]][1]]
    let k = obj[keys[i]][0].replace(/ .*/, ''); // anything before the first space
    if (k.length < 4) {
      //helpMsg=helpMsg + "\n" + obj[keys[i][0]]
      helpMsg.set(k, "<p><strong>" + k + ": </strong>" + obj[keys[i]][0].replace(/^[a-z] /, '') + "</p>")
      controlMap.set(k, 'fill\n' + obj[keys[i]][1].replace('myFirstName', myFirstName));
      fillButtonMap.set(obj[keys[i]][0], k);

    } else if (k === 'Label:Xpath') {
      //console.log('findit')
      //let labelXpaths = obj[keys[i]][1].replace(/\n/g, " ").split(/\s+/)
      let labelXpaths = obj[keys[i]][1].split(/\n/);
      //console.log(labelXpaths)
      for (let j = 0; j < labelXpaths.length; j++) {
        //console.log(j)
        //console.log('b', xpathMap)  
        //anything before the first:        // anything after the first :
        xpathMap.set(labelXpaths[j].replace(/:.*/, '').trim(), labelXpaths[j].replace(/.+?:/, '').trim());
        //  console.log('f', xpathMap)
      }
    } else if (k == 'autoRun') {
      autoRun = obj[keys[i]][1]
    }
    if (obj[keys[i]][1].startsWith("FromExcel")) {
      excelRowValue = 'fill\n' + obj[keys[i]][1];
      // console.log("got excel")
      chrome.runtime.sendMessage({ greeting: "setupSaveFromExcelMemu" }, function (response) {
        console.log(response.farewell);

        chrome.runtime.onMessage.addListener(
          function (request, sender, sendResponse) {
            console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension", 'info:', request.greeting);
            let tex = request.greeting;
            if (tex === "FromExcel") {
              designPrimer()
            }
          }
        );

      });
    }
  }

  obj = ob[8]
  var keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    favorArray[i] = [obj[keys[i]][0], obj[keys[i]][1]]
    //favorMap.set(obj[keys[i]][1], obj[keys[i]][0]);
    //console.log(obj[keys[i]][1], obj[keys[i]][0])
  }

  // this is primer page  
  if (currentURL.startsWith("https://www.ncbi.nlm.nih.gov/tools/primer-blast/primertool.cgi")) {


    const totalRows = qsa('#userGuidedForm table tbody tr').length;
    //console.log('CurrentURL total rows', totalRows)
    if (totalRows > 0) {

      console.log('CurrentURL', "should click submit button here?")
      chrome.storage.local.get(['primerResults'], function (result) {
        console.log("adding new tab url1 to primer table", result)
        let re = result.primerResults;
        let candi = currentURL;
        setTimeout(() => {
          chrome.storage.local.set({ 'primerResults': re + candi + "\n" }, function () {
            console.log("url1  saved");
          });
          clickEls('input[type="submit"]');
        }, 500);

      })

      return;

    } else {
      console.log('CurrentURL', "should be primer page?")
    }

    chrome.storage.local.get(['primerResults'], function (result) {
      console.log("adding primer to:", result)
      let re = result.primerResults;

      let index = 0;
      let rtext = currentURL + "\n"
      qsa('.prPairInfo table tbody').forEach((tbody) => {
        console.log("data")
        index++;
        let row = tbody.querySelector('tr:nth-child(2)');
        rtext += index + '\tforward'
        if (row) row.querySelectorAll('td').forEach((td) => { rtext += "\t" + txt(td) });
        //console.log(rtext)
        rtext += "\treverse"
        row = tbody.querySelector('tr:nth-child(3)');
        if (row) row.querySelectorAll('td').forEach((td) => { rtext += "\t" + txt(td) });
        rtext += '\n'
      })
      console.log(rtext)

      if (index != 0) {
        console.log("findPrimers on page")
        chrome.storage.local.set({ 'primerResults': re + rtext }, function () {
          console.log("primers saved");
          chrome.storage.local.set({ 'newTabOpened': 'no' }, function () {
            console.log("new tab closed");
            window.close();
          });
        });
      }
      //  else {
      //   setTimeout(() => {
      //     console.log("clicking submit button")
      //     clickEls('input[type="submit"]'); 
      //   }, 10000);
      // } 
    })
    return
  }

  if (cUrl != "") {


    // check if we got new data
    chrome.storage.local.get('savedNewData', function (result) {
      gotNewData = result.savedNewData;
    })

    if (currentConfig === "Config1") {

      chrome.storage.local.get('savedDate1', function (result) {
        savedDate = result.savedDate1;
        saveConfig();
      })


    } else if (currentConfig === "Config2") {

      chrome.storage.local.get('savedDate2', function (result) {
        savedDate = result.savedDate2;
        saveConfig();
      })

    } else if (currentConfig === "Config3") {

      chrome.storage.local.get('savedDate3', function (result) {
        savedDate = result.savedDate3;
        saveConfig();
      })

    } else if (currentConfig === "Config4") {

      chrome.storage.local.get('savedDate4', function (result) {
        savedDate = result.savedDate4;
        saveConfig();
      })

    }
  }

    let alarmAudio = null; // Declare the audio variable globally
    // Function to start audio playback
    function startAudio() {
      const audioURL = chrome.runtime.getURL('audios/audio.ogg');

      // Safely handle existing audio instances
      if (alarmAudio) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0; // Reset
      }

      // Initialize and configure audio object
      alarmAudio = new Audio(audioURL);
      alarmAudio.loop = true;
      alarmAudio.play().catch(error => {
        console.error("Error playing audio:", error);
      });
    }

    // Function to stop audio playback
    function stopAudio() {
      if (alarmAudio) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0; // Reset to the start }; 
      }
    }


  if (currentURL.indexOf("office.com/calendar") != -1) {
    console.log("calendar page")

    var mutationObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if(mutation.target) console.log("M: " + mutation.target.className) 

        if (mutation.target && mutation.target.className === "ms-List-surface") {
          console.log("mutation", mutation.target.className + " -- " +  mutation.target.innerHTML )

          let elements = document.getElementsByClassName('setNowButton');
          while (elements.length > 0) {
            console.log('removing hint: ')
            elements[0].parentNode.removeChild(elements[0]);
          }

          clearInterval(interv)
          console.log("setting timer alarm link") 

          qsa(".ms-List-cell").forEach(function (cell) {
            // arr = txt(cell).split(" ");
            let text = cell.innerHTML;
            
            if (text.indexOf("All day") === -1) {
              //let eventElement = document.querySelector('div[data-is-focusable="true"]');

              // Get the 'aria-label' attribute
              //let ariaLabel = eventElement.getAttribute('aria-label');

              // Regular expression to extract start time, end time, and date
              let fullPattern = /(\d{1,2}:\d{2} [APM]{2}) to (\d{1,2}:\d{2} [APM]{2}), ([A-Za-z]+), ([A-Za-z]+ \d{1,2}, \d{4})/;
              let match = text.match(fullPattern);

              if (match) {
                let startTime = match[1]; // 9:00 AM
                let endTime = match[2];   // 10:50 AM
                let day = match[3];       // Thursday
                let fullDate = match[4];  // October 3, 2024

                console.log("Start Time:", startTime);
                console.log("End Time:", endTime);
                console.log("Day:", day);
                console.log("Full Date:", fullDate);
                
                // Function to convert to 24-hour format and build the ISO 8601 string
                function convertToISO(startTime, fullDate) {
                  // Parse the date (October 3, 2024 -> YYYY-MM-DD)
                  let date = new Date(fullDate); // Converts to Date object, time is set to 00:00:00

                  // Extract hours and minutes from the start time
                  let [time, modifier] = startTime.split(" ");
                  let [hours, minutes] = time.split(":").map(Number);

                  // Convert 12-hour time to 24-hour format
                  if (modifier === "PM" && hours !== 12) {
                    hours += 12;
                  } else if (modifier === "AM" && hours === 12) {
                    hours = 0;
                  }

                  // Set the correct time (hours and minutes) to the date object
                  date.setUTCHours(hours, minutes, 0); // Assuming the event times are in UTC

                  // Format date as ISO string
                  return date.toISOString();
                }
                function convertToLocalTime(startTime, fullDate) {
                  // Parse the date (October 3, 2024 -> YYYY-MM-DD)
                  let date = new Date(fullDate); // Converts to Date object, time is set to 00:00:00

                  // Extract hours and minutes from the start time
                  let [time, modifier] = startTime.split(" ");
                  let [hours, minutes] = time.split(":").map(Number);

                  // Convert 12-hour time to 24-hour format
                  if (modifier === "PM" && hours !== 12) {
                    hours += 12;
                  } else if (modifier === "AM" && hours === 12) {
                    hours = 0;
                  }

                  // Set the correct time (hours and minutes) to the date object
                  date.setHours(hours, minutes, 0, 0); // Sets time in local time zone

                  // Format date as local string (can be adjusted for specific format needs)
                  return date.toLocaleString(); // Converts date to a string in local time zone
                }

                let time = convertToLocalTime(startTime, fullDate);

                //let time = fullDate + 'T' + startTime.replace(' ', ''); // text.split("event from ")[1].split(" to ")[0]
                //time = '2024-10-01T13:45:00Z'; //time.split(", ")[1] + ", " + time.split(", ")[2]
                console.log(time)
              // time ='2024-10-01T20:45:10.000Z'

                if (new Date(time).getTime() > new Date().getTime()) {
                  var div = document.createElement("div");
                  if (alarm.has(new Date(time).getTime())) {

                    interv = setInterval(() => {
                      var diff = new Date(time).getTime() - new Date().getTime()

                      if (diff < 0) clearInterval(interv)
                      var msec = diff;
                      var hh = Math.floor(msec / 1000 / 60 / 60);
                      msec -= hh * 1000 * 60 * 60;
                      var mm = Math.floor(msec / 1000 / 60);
                      msec -= mm * 1000 * 60;
                      var ss = Math.floor(msec / 1000);
                      msec -= ss * 1000;

                      let elements = document.getElementById(time);
                      while (elements != null && elements.length > 0) {
                        //console.log('removing hint: ')
                        elements[0].parentNode.removeChild(elements[0]);
                      }


                      const alarmButton = document.createElement('button');
                      alarmButton.className = 'setNowButton';
                      alarmButton.style.cssText = 'color:red; border-color:red';
                      alarmButton.id = time;
                      alarmButton.textContent = 'Alarm off in ' + hh + 'h ' + mm + 'm ' + ss + 's ';
                      div.replaceChildren(alarmButton);


                    }, 1000);



                  } else {
                    const alarmButton = document.createElement('button');
                    alarmButton.className = 'setNowButton';
                    alarmButton.style.cssText = 'color:red; border-color:red';
                    alarmButton.id = time;
                    alarmButton.textContent = 'Set Alarm';
                    div.replaceChildren(alarmButton);
                  }
                  this.append(div)

                }
              } else {
                console.log("exprired")
              }
            }

          })
        }
        // if(mutation.target && mutation.target.innerText && mutation.target.innerText.indexOf(keywordMap.get("bc")) != -1) {
        //    // mutation.target.click()
        // }
      })
    })
    mutationObserver.observe(document.body, { attributes: true, subtree: true, childList: true, characterData: true })


    // for outlook canlendar to set alarm
    document.addEventListener('click', (e) => {

      
      


      console.log('single click: ' + e.target.id + " text: ." + e.target.textContent + "." + e.target.className)

      if (e.target.className == "setNowButton") {
        console.log("set up alerm")

      

        // chrome.runtime.onMessage.addListener(
        //   function (request, sender, sendResponse) {
        //     console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension", 'info:', request.greeting);

        //     let tex = request.greeting;
        //     if (tex === "startAudio") {
        //       startAudio()
        //     }
        //   }
        // );


        // audioURL = "https://upload.wikimedia.org/wikipedia/commons/5/5d/%22Into_the_Oceans_and_the_Air%22.ogg"
        // chrome.storage.local.get(['audioURL'], function (result) {
        //   console.log("trying to restore draft")
        //   if (result.audioURL == undefined ) {
        //     audioURL = prompt("Please enter the URL for your audio alert, for example: https://upload.wikimedia.org/wikipedia/commons/5/5d/%22Into_the_Oceans_and_the_Air%22.ogg You can find more here:https://commons.wikimedia.org/wiki/Category:Audio_files");
        //     chrome.storage.local.set({ 'audioURL': audioURL }, function () {
        //       console.log('Saved date is updated to ' + audioURL);
        //     });
        //   } else {
        //     audioURL = result.audioURL;
        //   };
        // })


        //startAudio()
        // fetch('https://upload.wikimedia.org/wikipedia/commons/5/5d/%22Into_the_Oceans_and_the_Air%22.ogg')
        //   .then(response => response.blob())
        //   .then(blob => {
        //     var blobUrl = URL.createObjectURL(blob);
        //     var audio = new Audio(blobUrl);

        //     audio.loop = true;
        //     audio.play().catch(error => {
        //       console.error("Error playing audio via blob: ", error);
        //     });
        //   }).catch(error => {
        //     console.error("Error fetching audio: ", error);
        //   });

        // var myAudio = new Audio(chrome.runtime.getURL('audio.ogg'));
        // myAudio.loop = true;
        // myAudio.play().catch(error => console.error("Error playing audio: ", error));

        //return; 
        console.log("data is" + e.target.id); //e.target.textContent.split("m to ")[1])

        // let d = new Date().toLocaleDateString();
        // let then = new Date(e.target.textContent.split("m to ")[1]).getTime();
        let then = new Date(e.target.id).getTime();
        // text.value = text.value % 12 || 12;
        let diff = then - new Date().getTime();

        console.log( 'diff is: ', diff)

        if (alarm.has(then)) {
          alert("Alarm already set up!")

        } else if (confirm("Set up the alarm?")) {
          alarm.set(then, true);

          chrome.runtime.sendMessage({ greeting: "setAlarm " + (diff - 120000)/1000/60 }, function (response) {
            console.log(response.farewell);
          });

          // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          //   if (request.action === "playAudio") {
          //     startAudio();
          //     sendResponse({ status: 'playing' });
          //   }
          // });
          // setTimeout(() => {

          //   startAudio();
          //   // var myAudio = new Audio();
          //   // myAudio.loop = true;
          //   // myAudio.src = "https://upload.wikimedia.org/wikipedia/commons/5/55/En-us-house-noun.ogg";
          //   // myAudio.play();
          //   //myAudio.src = "En-us-house-noun.ogg";
          //   // more audio files: https://commons.wikimedia.org/wiki/Category:Audio_files

          //   //  myAudio.src = "Into_the_Oceans_and_the_Air.ogg"
          //   // myAudio.src = "https://upload.wikimedia.org/wikipedia/commons/7/7d/05KhongPhai-TangDuyTanTRI-6284366.ogg"

          //   // setTimeout(() => {
          //   //   //myAudio.pause();
          //   //   stopAudio();
          //   //   alarm.delete(then)
          //   // }, 60000) // after play for 10 minutes, auto stop


          // }, diff - 300000);  // 5 minutes before the meeting

          // //tell background to start timer and send autoStart command 2 minutes before the meeting
          // chrome.runtime.sendMessage({ greeting: "alarm " + String(diff - 120000) }, function (response) {
          //   console.log(response.farewell);
          // });

          // chrome.runtime.sendMessage({ greeting: "alarm 1000" }, function (response) {
          //   console.log(response.farewell);
          // });

          setTimeout(() => {
            if (confirm("Stop the alarm?")) {
              //myAudio.pause();
            stopAudio();
            alarm.delete(then)

            }
          }, diff - 120000);

          //var div = document.createElement("div");
          var interv = setInterval(() => {
            let dif = new Date(e.target.id).getTime() - new Date().getTime()
            if (dif < 0) clearInterval(interv)
            var msec = dif;
            var hh = Math.floor(msec / 1000 / 60 / 60);
            msec -= hh * 1000 * 60 * 60;
            var mm = Math.floor(msec / 1000 / 60);
            msec -= mm * 1000 * 60;
            var ss = Math.floor(msec / 1000);
            msec -= ss * 1000;

            e.target.textContent = 'Alarm off in ' + hh + 'h ' + mm + 'm ' + ss + 's ';
          }, 1000);
        }

      }
    })
        
  } else {
    console.log("individual ticket, gmail, outlook or yahoo, chatgpt ")
    if (currentURL.indexOf("outlook.office.com") != -1) {
      console.log('outlook main page ');

      window.onfocus = function () {
        console.log('outlook main page is activated');
        // tab is active. this does not work
        chrome.storage.local.get(['searchEmail'], function(result) {
          if(result.searchEmail != undefined ) { 
            document.querySelector('#topSearchInput').value = result.searchEmail
            document.querySelector('#topSearchInput').dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter'
            }));
            var evt = new Event('input', { bubbles: true, cancelable: true });
            document.querySelector('#topSearchInput').dispatchEvent(evt);
            document.querySelector('[data-testid="send-button"]');
            qs(".form-inline.navpage-global-search.ng-non-bindable")?.requestSubmit();
            chrome.storage.local.remove('searchEmail', function () {
              console.log('Value with has been removed.');
            });
          }
        })  
      }
    }

    // document.addEventListener("select", function() {
    //   // Get the selected text
    //   console.log("select in individla ticket, youtube or office.com");
    //   var tem = window.getSelection().toString();
    //   copyToClipboard(tem); 
    // });
    else if (currentURL.indexOf('chatgpt.come') != -1 || currentURL.indexOf('chatgpt.ai1') != -1) {
      // console.log("trying disable enter button0");
      // let texbox = document.getElementById("prompt-textarea");
      // // this works fine, but we might want to move to enter text section
      // if (urlMap.get('enterToSubmit') === 'yes') {

      //   console.log("trying disable enter button");

      //   let form = texbox.closest('form');

      //   // // Add event listener for keydown event on form and disable enter button
      //   form.addEventListener('keydown', function (event) {
      //     // Check if Enter key is pressed and prevent default action
      //     if (event.key === 'Enter') {
      //       event.preventDefault();
      //       event.stopImmediatePropagation();
      //     }
      //   });
      // }

      document.addEventListener('click', (e) => {
        if (e.target.nodeName == "TEXTAREA") {
          // Nothing to undo: the state indicator does not cover the field.
        }
      })

      console.log("set up mutation ")
      // MutationObserver to monitor changes in textbox1
      const observer = new MutationObserver(mutationsList => {
        const elements = document.querySelectorAll('.min-h-\\[20px\\].flex.flex-col.items-start.gap-3.whitespace-pre-wrap.break-words.overflow-x-auto');
        let lastOne = elements[elements.length - 1];
 
        console.log("last one is: ", lastOne.innerText)
        for (const mutation of mutationsList) {
          if (mutation.target) console.log("M: " + mutation.target.className)
          if (mutation.target === lastOne) {
            console.log("Find it: " + mutation.target.innerText)
          }
        }
      });

      // todo: need to wait for this element and set mution observer over it afbout submite the prompt
      const element = document.querySelector('.react-scroll-to-bottom--css-bvdkg-1n7m0yu');

      // Check if the element was successfully selected
      if (element) {
        // Do something with the selected element
        console.log(element);
      } else {
        console.error('Element not found');
      }
      observer.observe(element, { attributes: true, characterData: true, subtree: true });

      //observer.observe(document.body, { attributes: true, characterData: true, subtree: true });
      window.addEventListener('message', (event) => {
        console.log("received message", event.data)
        if (isTrustedServiceNowOrigin(event.origin)) {
          // Display the received message
          //document.getElementById('messageDisplay').textContent = event.data;
          texbox.textContent = event.data
        }
      });


    } else if(detailPagePaths.some(path => currentURL.includes(path))) { // individual ticket page
      console.log(currentURL, "Working on individual ticket page");



      
      const labels = Array.from(document.querySelectorAll('label'));
      const label = labels.find(el => el.textContent.trim() === 'Assigned to');

      let element = null; let button = null;
      // Step 2: Use the 'for' attribute to find the associated input field
      if (label) {
        let inputId = label.getAttribute('for');
        element = document.getElementById(inputId);      
                
        if (element) {
            console.log('Input element found:', element);

            if(element.tagName.toLowerCase() === 'input') {


              let originalValue = element.value;

              console.log('Original value:', originalValue);

              if (originalValue === 'Unassigned') {
                console.log('Value is Unassigned, changing to myFirstName:', myFirstName);
                //element.value = myFirstName;





              }
            }
          }
        }
      























    // let classifyButton = document.createElement('button');
    // classifyButton.innerText = 'Classify Tickets';
    // classifyButton.style.position = 'fixed';
    // classifyButton.style.top = '5px';
    // classifyButton.style.left = '50%';
    // classifyButton.style.transform = 'translateX(-50%)';
    // classifyButton.style.padding = '10px 20px';
    // classifyButton.style.backgroundColor = '#007bff';
    // classifyButton.style.color = '#fff';
    // classifyButton.style.border = 'none';
    // classifyButton.style.borderRadius = '5px';
    // classifyButton.style.cursor = 'pointer';
    // classifyButton.style.zIndex = '10000';
    // classifyButton.onclick = async function() {
    //   console.log('Classify Tickets button clicked');

    //   const urlParams = new URLSearchParams(window.location.search);
    //   const sysid = urlParams.get('sys_id') || '';
    //   const classificationKey = currentID + 'classificationResult';

    //   const shortDesc = (val('textarea[name="incident.short_description"]')
    //     || val('input[name="incident.short_description"]')
    //     || val('textarea[name="u_incident_task.short_description"]')
    //     || val('textarea[name="sc_task.short_description"]')
    //     || '');
    //   const longDesc = (val('textarea[name="incident.description"]')
    //     || val('textarea[name="sc_task.description"]')
    //     || '');
    //   const fallbackDescription = 'Short description: ' + shortDesc + '\nLong description: ' + longDesc;

    //   chrome.storage.local.get([classificationKey, currentID + 'description'], async function (result) {
    //     const classificationResult = result[classificationKey] || 'NA';
    //     const description = result[currentID + 'description'] || fallbackDescription;

    //     const modalDecision = await showClassificationDecisionModal(
    //       classificationResult,
    //       description,
    //       classificationKey
    //     );

    //     if (!modalDecision || !modalDecision.action) return;
    //     if (modalDecision.action === 'assign') {
    //       if (!sysid) {
    //         console.log('sys_id is missing, cannot assign classification.');
    //         return;
    //       }
    //       assignClassification(modalDecision.shortcut, sysid);
    //       return;
    //     }
    //     if (modalDecision.action === 'remove') {
    //       deleteClassification(classificationKey, null, null);
    //     }
    //   });
    // }
     
    // // Ensure the button is added to the main document body, not inside any iframe
    // document.body.appendChild(classifyButton);


  





  
      window.addEventListener('message1', (event) => {
        console.log("received message", event.data)
        if (isTrustedServiceNowOrigin(event.origin)) {
          texbox.textContent = event.data
        }
      });

      var clickCount = 0;
      var clickTimeout;
      var saveDrafTimeout;
      var cmdProcessTimeout;

      // use mouse up so that selection is available
      document.addEventListener('click', (e) => {
        let bgColor = window.getComputedStyle(e.target).backgroundColor;
        console.log('background', bgColor)
        if (bgColor === 'rgba(0, 0, 0, 0)' && (e.target.nodeName === "DIV" || e.target.nodeName === "TD" || currentURL.indexOf('testPage') != -1)) {
      //    console.log('The background color is rgba(0, 0, 0, 0)');
          
      //    $('textarea[name="u_incident_task.short_description"]').css('background-color', urlMap.get('bookmarkTicketColor'));

       let targetElement = qsa('textarea[name="incident.short_description"]');
  
          if (targetElement == null || targetElement.length === 0) {
            targetElement = qsa('input[name="incident.short_description"]');
          }
          if (targetElement == null || targetElement.length === 0) {
            targetElement = qsa('textarea[name="u_incident_task.short_description"]');
          }

          if (targetElement == null || targetElement.length === 0) {
            targetElement = qsa('textarea[name="sc_task.short_description"]');
          }

          if (targetElement == null || targetElement.length === 0) {
            targetElement = qsa('textarea[name="pm_project_task.description"]');
          }
          //pm_project_task.description
          
           if (targetElement == null || targetElement.length === 0) {
            targetElement = qsa('#form_main');
          }

        
          if (targetElement == null || targetElement === undefined) {
            console.log('short_decription is not found')
          } else {
            const rect = targetElement[0].getBoundingClientRect();
   
           // console.log('rect', rect) // xxxxx
            console.log('clientY', e.clientY, 'clientX', e.clientX, 'left', rect.left, 'right', rect.right, 'top', rect.top, 'bottom', rect.bottom)
            if (e.clientX < rect.left -  20 || e.clientX > rect.right) {
              
              if (delayTimeout) {

                tmpAlert('clearing delay timeout')
                clearTimeout(delayTimeout); delayTimeout = null; 
              } else {

                chrome.storage.local.get('delayKeyPressAfterReload', function(result) {
                  if (result.hasOwnProperty('delayKeyPressAfterReload')) {
                    // Key exists, now remove it
                    chrome.storage.local.remove('delayKeyPressAfterReload', function () {
                      console.log('delayKeyPressAfterReloadKey existed and was deleted.');
                    });
                  } else {
                    // Key did not exist
                    console.log('delayKeyPressAfterReload Key did not exist, nothing to delete.');

                    console.log('sending close tab message to background script');
                      chrome.runtime.sendMessage({ greeting: "closeTab" }, response => {
                        if (response && response.farewell) {
                          const activeTabId = response.farewell;
                          console.log('Received active tab ID:', activeTabId);
                        }
                      }); 

                  }
                });

                  

                //tmpAlert('no delay timeout to clear');
              

                
              }

              if(currentURL.indexOf('incident.do.html') != -1) {

                console.log('testing page, so close it')
                 chrome.runtime.sendMessage({ greeting: "closeTab" }, response => {
                        if (response && response.farewell) {
                          const activeTabId = response.farewell;
                          console.log('Received active tab ID:', activeTabId);
                        }
                      }); 
              }  
            }  
          }
       } else {
          console.log('The background color is', bgColor);
       }

        // cursor location changed, so disable backSpace to delete last insert
       // if(caretPosition != getCaretPosition(e.target)) lastTextWithoutInsert = ''; 

        console.log("Single click");
        console.log('id: ' + e.target.id);
        console.log('class: ' + e.target.className);
        console.log("nodename: " + e.target.nodeName);
       // console.log(e.target.textContent); // alarm
        console.log("selection: " + window.getSelection().toString());

        // clicked a text hint
        if(e.target.id.indexOf('addhere') != -1) {
          let selectedIndex = parseInt(e.target.id.replace(/^addhere/, ''))
          console.log("clicked: ", selectedIndex)
          if (hintText.has(selectedIndex)) {
            console.log('hint', hintText.get(selectedIndex))
            currentText = currentText.substring(0, insertStart + 1) + hintText.get(selectedIndex); //+ " " + currentText.substring(insertStart, currentText.length - 2);
            insertLength = hintText.get(selectedIndex).length + 1
            console.log("fultext: '" + currentText + "'")
            //currentText = "abdddd"
            lastTarget.value = currentText;

            updateInsertLength(insertLength)

          }
          removeHints();
          if (hintIndex > 0) {
            hintIndex = 0;
            hintText.clear();
          }
        } else {
          lastTarget = e.target;
        }
        // need to ignore self click here 
        if (isSelfClick) {
          console.log('this is self click, ignore');
          return; 
        } else { 
          console.log('this is not self click, process it');
        }
        if (e.target.nodeName === "TEXTAREA" && e.target.id != "incident.description") {

          currentTxt = e.target.value;
          currentInstLocation = e.target.selectionStart;

          console.log('textarea clicked, currentTxt: ' + currentTxt + ' currentInstLocation: ' + currentInstLocation) 

          updateEditControlMode(true);
          selectedText = e.target.value.substring(e.target.selectionStart, e.target.selectionEnd);
          console.log(e.target.value.substring(e.target.selectionStart, e.target.selectionEnd));
          //lastTarget.style.background = 'white'; 
          //$('textarea[name="incident.description"]').style.background = 'white'; 
          //$('textarea[name="incident.description"]').css('background-color', 'white');
          //$('textarea[name="incident.short_description"]').css('background-color', 'white'); 
          // State stays put while editing; it is off to the side, not in the way.
        } else {
          console.log('not textarea or description, so not change background')
          if ((currentURL.indexOf('incident_do') != -1 && val('[name*="assigned_to"], [id*="assigned_to"]') == '') || (currentURL.indexOf('incident_task') != -1 && val('input[name="sys_display.u_incident_task.assigned_to"]') === '') || (currentURL.indexOf('sc_task') != -1 && val('input[name="sys_display.sc_task.assigned_to"]') === '')) {
            console.log('new ticket, no assigned to,  so change background to new ticket color');
            changeBackground(urlMap.get('newTicketColor'))
            showEls('.sn-controls.row');
          } else if (val('select[name="incident.state"]') === '3' || val('select[name="u_incident_task.state"]') == '4' || val('select[name="sc_task.state"]') == '-5') {
            changeBackground(urlMap.get('holdTicketColor'))
            console.log('hold ticket, so change background to hold ticket color')
          } else {
            changeBackground('#FFFFCC');
            console.log('other ticket, so change background to default color')
          }
        }
      })
      
      //restore draft if we have one
      chrome.storage.local.get([ currentID +'draft'], function (result) {
        console.log("trying to restore draft")
        
        if (result[currentID + 'draft'] != undefined) {  
          draft = result[currentID + 'draft'];

          console.log('draft', draft)

          
          //}
        }
        getFirstName();

        greeting=greeting.replace("userFirstName", firstName)

        makeDescriptionReadOnly()

      })


    }
    setupKeyDownEventListerner(false)
  
    setupKeyUpEventListerner(false)

    document.addEventListener("mousemove", (e) => {
      //const margin = 8;
      mouseX = e.clientX //+ 12;
      mouseY = e.clientY //- el.offsetHeight - margin;

      // if (mouseY < 0)
      //   mouseY = e.clientY + 20;

      // if (mouseX + el.offsetWidth > window.innerWidth)
      //   mouseX = window.innerWidth - el.offsetWidth - margin;

    });


  }
}

function waitForLinks() {
  console.log("Waiting for links")
  let findLinks = false;

  try {
    let table = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.getElementsByTagName('table')
    if (table != null) {
      setTimeout(() => {
        let ls = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelectorAll('a.linked.formlink')
        if (ls != null && ls.length > 0) {
          console.log('find links')
          for (var i = 0; i < ls.length; i++) {
            //findLinks = true; 
            console.log('working on ', i, ls[i].className)

            ls[i].target = "_blank";
          }
          setupKeyDownEventListerner(false)
          setupKeyUpEventListerner(false)
        }
      }, 2000);
    }
  } catch (e) {
    console.log('wait for links but got error')
    setTimeout(() => {
      waitForLinks();
    }, 1000);
  }
}

function saveConfig() {

  gotNewData = "no"
  if (gotNewData === 'no') {
    //alert ("no new data1") 
    return
  }

  chrome.storage.local.set({ 'savedNewData': "no" }, function () {
    console.log('Saved new data.');
  });

  // run daily save on this url
  // Get the current date
  var currentDate = new Date().toDateString() + cUrl;

  // Compare the current date with the saved date
  if (currentDate !== savedDate) { //} && currentURL.indexOf("options.html") === -1) {
    // If they are different, update the saved date in local storage


    if (currentConfig === "Config1") {

      chrome.storage.local.set({ 'savedDate1': currentDate }, function () {
        console.log('Saved date is updated to ' + currentDate);
      });

    } else if (currentConfig === "Config2") {

      chrome.storage.local.set({ 'savedDate2': currentDate }, function () {
        console.log('Saved date is updated to ' + currentDate);
      });
    } else if (currentConfig === "Config3") {

      chrome.storage.local.set({ 'savedDate3': currentDate }, function () {
        console.log('Saved date is updated to ' + currentDate);
      });
    } else if (currentConfig === "Config4") {

      chrome.storage.local.set({ 'savedDate4': currentDate }, function () {
        console.log('Saved date is updated to ' + currentDate);
      });
    }

    let shortcutArray = {};
    let c = 0;
    for (let k of shortcutMap.keys()) {

      if (k === shortcutCommentMap.get(k)) {
        shortcutArray[c++] = [k, shortcutMap.get(k)];
      } else {
        shortcutArray[c++] = [k + " " + shortcutCommentMap.get(k), shortcutMap.get(k)];
      }

    }

    let sentenceArray = {};
    c = 0;
    for (let k of sentenceMap.keys()) {
     
      sentenceArray[c++] = [sentenceMap.get(k), k];
      //console.log("owrking on", k); 
      //console.log(sentenceArray); 
    }


    var obj = {
      "urls": urlArray,
      //'firstName': {'0': ['myFirstName', document.getElementById('myFirstName').value]},
      'keywords': keywordArray,
      'controls': controlArray,
      'shortcuts': shortcutArray,
      'sentences': sentenceArray,
      'hides': hideArray,
      'fills': fillArray,
      'bookmark': favorArray
    }

    console.log(JSON.stringify(obj));

    //let today = getDate(); 
    //console.log('today', today)

    let filename = "Config." + currentDate.replace(/\s+/g, '-') + ".json";

    let text = JSON.stringify(obj).replace(/#/g, "&NPOUND").replace(/:{/g, ":\n {").replace(/],/g, "],\n  ").replace(/},/g, "},\n\n");

    //if(document.getElementById("myFirstName").value.length > 5){
    //console.log('old text:', text);
    let fileContent = text.replace(new RegExp(myFirstName, 'g'), 'myFirstName');
    console.log('new text:', fileContent);

    // Create the text file content
    //var fileContent = 'This is the content of the text file.';
    // Encrypt the file content using AES encryption
    //const encryptionKey = myFirstName + " " + myLastName;
    // from: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js
    //const encryptedContent = CryptoJS.AES.encrypt(fileContent, encryptionKey).toString();
    // Create a new Blob object with the file content and type
    var blob = new Blob([fileContent], { type: 'text/plain' });

    // Set the relative path of the file within the downloaded archive
    blob.webkitRelativePath = 'myfolder/file.txt';

    // Create a new URL object with the Blob object URL
    var url = URL.createObjectURL(blob);

    // Create a new anchor element with the URL object
    var downloadLink = document.createElement('a');
    downloadLink.href = url;

    downloadLink.download = filename; // set the archive name
    // Trigger the download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
}

function getFirstName() {
  firstNameWarning = '';
  firstName = "";
  let sureAboutFirstName = false;
  console.log("get user name from comments")
  let cs = qsa('.h-card.h-card_md.h-card_comments');
                                   // replace all space and new line to make sure we can compare comment with draft, because user might add some space or new line in the draft but not in the comment, or the opposite.
  let draftNeedDelete = false; let draft1 = draft.replace(/\s+/g, "");
  if (cs != null && cs.length > 0) {
    console.log('find comments');
    for (var i = 0; i < cs.length; i++) {
      //console.log("working on ", i); 
      let cType = cs[i].childNodes[1].innerText;
      //console.log("working on ", i, cType);

      if (draftMarker === '') draftMarker = cType;

      // console.log("working on ", cs[i].childNodes[0].innerText);

      // console.log("working on1 ", cs[i].childNodes[1].innerText);
      // console.log("working on2 ", cs[i].childNodes[2].innerText);
      // console.log("working on3 ", cs[i].childNodes[3].innerText);
      // console.log("working on4 ", cs[i].childNodes[4].innerText);

      if (cType.indexOf("Additional comments") != -1 || cType.indexOf("Work notes") != -1) {
        //console.log(cs[i].childNodes[2].innerText)
        let from = cs[i].childNodes[0].innerText;
        let comt = cs[i].childNodes[3].innerText;

        if ( ! draftNeedDelete && draft1 === comt.replace(/\s+/g, "")) {
          console.log("find draft in comment, ignore it", comt)
          draftNeedDelete = true;
        } //else {
         // console.log("draft...", draft1 , "...")
         // console.log("comment...", comt.replace(/\s+/g, ""), "...")
        //}
        

        console.log("working on ", i, from, comt);
        // console.log('firstname', firstName, 'sure about first name', sureAboutFirstName); 

        if (from.indexOf(myFirstName) != -1) {

          if ((firstName === undefined || firstName.length < 3) && comt.startsWith(greeting.split(" ")[0])) {
            let arr = comt.split(/,\n/)[0].split(/ /)

            firstName = arr[1].replace(/,/g, '').replace(/:/g, '').replace(/\n/g, '').trim();
            sureAboutFirstName = true;
            console.log('find firstname from old comments', firstName)
          }
          console.log('find assistant', comt);
          // chrome.runtime.sendMessage({ assistant: com });
          // myPrompt = "Assistant: " + com + "\n" + myPrompt; 

         // if (myPrompt == "") {
         //   console.log("Ignore own final answer", com)
         // } else {
            myPrompt = myFirstName + "(me):\n" + comt + "\n" + myPrompt;
         // }
        } else {
          // remove orignal message from user reply
          //console.log('Orignal message',com)
          //com = getReplyOnly(com)
          //console.log('New message', com)
          if (mostRecentMessage == "" && myPrompt == "") {
            console.log('find last message', comt); // from old comments', firstName)
            mostRecentMessage = comt
          } else {
            console.log('find user', comt);
            // chrome.runtime.sendMessage({ user: com });
          }
          myPrompt = "User:\n" + comt + "\n" + myPrompt
        }
      }
    }
  }
  if(! draftNeedDelete) {
    //chrome.storage.local.remove(currentID + 'draft', function () {
    //  console.log('Draft removed after submiting, because we found it in comments');
    //});
  //} else {

    //if (currentID + draftMarker === draft.split("myDraftDividerHere")[0]) {
      let textarea = document.getElementById("activity-stream-comments-textarea");
      if (textarea === null) textarea = document.getElementById("activity-stream-work_notes-textarea")
      if (textarea != null)  textarea.value = draft; //.split("myDraftDividerHere")[1]
      currentText = draft; //.split("myDraftDividerHere")[1]
  }





  // check if we are downloading tickets
  chrome.storage.local.get(['downloadTickets', 'rawTickets', 'ticketDownloadCount'], function (result) {
    if (result.downloadTickets) { 
      console.log("start to download tickets");
      let rawTickets = result.rawTickets || '';
      let ticketDownloadCount = result.ticketDownloadCount || 1;
      
      console.log("Retrieved data:", rawTickets);
      console.log("Current download count:", ticketDownloadCount);
      tmpAlert("Downloading ticket " + (ticketDownloadCount + 1), 3000);
      
      if (typeof(rawTickets) !== 'undefined') {
        let desc = "User:\nShort description:\n" + val('textarea[name="incident.short_description"]') + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n";
        rawTickets = rawTickets + "=== Conversation " + ticketDownloadCount + " ===\n" + desc + myPrompt;
        
        // Increment the download count
        ticketDownloadCount++;
        
        chrome.storage.local.set({ 'rawTickets': rawTickets, 'ticketDownloadCount': ticketDownloadCount }, function () {
          if (chrome.runtime.lastError) {
            console.error("Error saving data: " + chrome.runtime.lastError);
          } else {  
            console.log("rawTickets saved for download:", rawTickets);
            console.log("Updated download count:", ticketDownloadCount);
            
            // Only go to next ticket if we haven't reached 10
            if (ticketDownloadCount < 5) {
              setTimeout(() => {
                // go to the next ticket
                document.dispatchEvent(new KeyboardEvent('keyup', { key: 'f' }));
              }, 500);
            } else {
              console.log("Downloaded 10 tickets. Stopping download.");
              tmpAlert("Downloaded 10 tickets. Download complete.", 5000);
              chrome.storage.local.remove('downloadTickets', function () {
                console.log("downloadTickets flag removed");
              });
             
            }
          }
        });
      }
    }
  });




  //don't need this right now. It is for webllm
  if (mostRecentMessage == "") {
    mostRecentMessage = val('textarea[name="incident.description"]');
  } //else { 
  // chrome.runtime.sendMessage({ user: val('textarea[name="incident.description"]') });  
  //}
  // chrome.runtime.sendMessage({
  //   user: "Prompt: Work as computing consultant named " + myFirstName + ", responding to "+ firstName + "'s questions. " + firstName + " is computer user and need help. Craft responses that reflect the computing assistant's expertise and insights in the field, providing informative and engaging answers to " + firstName + " inquiries." 
  // })

  //if(mostRecentMessage != "") 
  //  chrome.runtime.sendMessage({ chatInput: mostRecentMessage });

  //myPrompt = "Prompt: Imagine you are User B, responding to User A's questions. User A is computer user and need help. Craft responses that reflect User B's expertise and insights in the field, providing informative and engaging answers to User A's inquiries.\n" + "User A: " + val('textarea[name="incident.description"]') + "\n" + myPrompt; 
  //chatContext='';



  console.log("set up listener for service now");
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    console.log('received message sent from background:', message.greeting);
     
    // The local engine's stream, relayed by background.js. Each token used to be
    // flashed in its own tmpAlert, which replaced the previous one -- so the
    // answer was only ever visible one fragment at a time and never as a whole.
    // The tokens are accumulated instead, and shown once when "done" arrives.
    if (message.type === 'phi3-stream-chunk') {
      console.log('Received chunk:', message.chunk);
      localAnswerChunk(message.chunk);
      hideLoadingSpinner();
      return;

    } else if (message.type === 'phi3-stream-hits') {
      localAnswerSources(message.hits, message.excluded);
      return;

    } else if (message.type === 'phi3-stream-status') {
      localAnswerStatus(message.text);
      return;

    } else if (message.type === 'phi3-stream-done') {
      localAnswerDone(message);
      hideLoadingSpinner();
      return;

    // Guarded on the type: a message without a greeting used to throw here, and
    // every message the local engine sends is one of those.
    } else if (currentURL.indexOf('service-now') != -1 && typeof message.greeting === 'string' && message.greeting.startsWith("answerFromChatgptBackground")) {
      console.log("sevice-now received message:", message.greeting, message.chatAnswer );
      
      // Hide loading spinner
      hideLoadingSpinner();

     
      if (message.chatAnswer === undefined || message.chatAnswer.trim() === "") {
        console.log("Empty answer received, ignoring.");
        return;
      } else {
      
              // The suggested answer rides in the same bubble as the shortcut
              // hints. It used to be built by hand with black text on whatever
              // background the page happened to have, which is invisible once the
              // dark theme is on; createHintBubble owns the colours instead.
              var div = createHintBubble(message.chatAnswer, '', 'tab');

            div.className = "addedhere";
         
            let textarea = document.getElementById("activity-stream-comments-textarea");
          
            textarea.parentElement.append(div);
    

      }
    }

  });

  let el;
  if (firstName === undefined || firstName.length < 2) {
    console.log("get user name from name")

    //var htmlContent = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector('#bf1d96e3c0a801640190725e63f8ac80 > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)').children('div').eq(1).html();
    let tName = null;
    if (newFormat)
      document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector('#bf1d96e3c0a801640190725e63f8ac80 > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > input:nth-child(3)').value
    else //(! newFormat) 
      el = qsa('#bf1d96e3c0a801640190725e63f8ac80 > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > input:nth-child(3)')
    
      if(el === null) { 
      // developer site
      el = qsa('#4fc4979ec0a8016401e142a5a0c599ce > div: nth - child(1) > div: nth - child(1) > div: nth - child(2)')
    }
    
    if (el != null && el[0] != null && el[0].value != undefined && el[0].value.length > 5) {
      firstName = el[0].value.split(/\s+/)[0];

      console.log('got', firstName)
      sureAboutFirstName = true;
    } 

    // task page, name has different xpath 
    if(firstName === undefined || firstName.length < 2) {
      let t = val('#sc_task\\2e request\\2e requested_for_label'); 
      if(t) {
        firstName = t.split(/\s+/)[0];
        console.log("get first name from name for task ", firstName)
        sureAboutFirstName = true;
      }  
    }
  }

  //  this does not work somehow
  if (firstName === undefined || firstName.length < 2) {
    console.log("get user name from name1")
    //added vip, so have to change div:nth-child(4) to div:nth-child(6)
    let tName = null

    el = qsa('#bf1d96e3c0a801640190725e63f8ac80 > div:nth-child(2) > div:nth-child(1) > div:nth-child(6) > div:nth-child(2) > input:nth-child(2)');
    console.log(tName)
    if (el != null && el[0] != null && el[0].value.length > 5) { //} htmlContent.indexOf('value="') != -1 && htmlContent.indexOf('value=""') == -1) 
      firstName = el[0].value.split(/\s+/)[0] // htmlContent.split('value="')[1].split(' ')[0];
      console.log(firstName)
      sureAboutFirstName = true;
    }
  }

  // dev server now page
  if (firstName === undefined || firstName.length < 2) {
    console.log("get user name from name for dev page")
    //added vip, so have to change div:nth-child(4) to div:nth-child(6)
    let el = qsa('#4fc4979ec0a8016401e142a5a0c599ce > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(4)')

    console.log(el);

    if (el.length != 0) {
      firstName = el[0].innerHTML.split('value=')[1].split("\"")[1].split(" ")[0];
      console.log("got it", firstName);
      if (firstName.length > 2) sureAboutFirstName = true;
    }
  }

  // get user name from email address
  if (firstName === undefined ||firstName.length < 2) { 
    console.log("get user name from email1")
    let tMail = null
    if (newFormat)
      tMail = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector('#bf1d96e3c0a801640190725e63f8ac80 > div:nth-child(2) > div:nth-child(1) > div:nth-child(7) > div:nth-child(2) > input').value;
    else
      el = document.getElementById("incident.u_caller_email"); 
    
    console.log(tMail)
    if (el != null && el != null && el.value.length > 5) {
      //if(tMail != null && tMail.length > 5) {
      firstName = el.value.split('@')[0]
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

      //sureAboutFirstName = true;
      let firstName1 = ''
      if (firstName.indexOf(".") != -1) firstName1 = firstName.split('.')[0];
      if (firstName.indexOf("_") != -1) firstName1 = firstName.split('_')[0];
      if (firstName.indexOf("-") != -1) firstName1 = firstName.split('-')[0];
      if (firstName1.length > 0) {
        sureAboutFirstName = true;
        firstName = firstName1
        console.log("got it from email1", firstName);
      } else {
        firstNameWarning = "First name from email may not correct: " + firstName
      }
    }
    console.log(firstName);

    // task page, get email of user
    if(firstName === undefined ||firstName.length < 2) {
      var preferredEmail = val('#sc_task\\2e u_preferred_email');

      if (preferredEmail) {

        firstName = preferredEmail.split('@')[0];

        let firstName1 = ''
        if (firstName.indexOf(".") != -1) firstName1 = firstName.split('.')[0];
        if (firstName.indexOf("_") != -1) firstName1 = firstName.split('_')[0];
        if (firstName.indexOf("-") != -1) firstName1 = firstName.split('-')[0];
        if (firstName1.length > 0) {
          sureAboutFirstName = true;
          firstName = firstName1
        } else {
          firstNameWarning = "First name from email may not correct: " + firstName
        }
      }
    }
  }

  // name from email might not correct, let's look for it in descriptoin
  if (firstName === undefined || firstName.length > 2 && !sureAboutFirstName) {
    let des = null;
    if (newFormat)
      des = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector('textarea[name="incident.description"]').value;
    else
      des = qsa('textarea[name="incident.description"]')[0].value;
    if (des != null && des.length > 0) {
      if (des.indexOf(firstName) == -1) {
        console.log(firstName, ' not find in ', des)
        // let arr = des.split('\n')
        // for(let j=0; j<arr.length; j++){

        //   // not the first row, only has one word, not starting with Best, Thanks, Dear
        //   if(j > 0 && arr[j].length > 1 &&  arr[j].split(' ').length == 1 && ! arr[j].startsWith('Best') && ! arr[j].startsWith('Thanks') && ! arr[j].startsWith('Dear') && ! arr[j].startsWith('Thanks')  ) { // this row only has one word
        //     firstName = arr[j]
        firstNameWarning = "First name from desc may not correct: " + firstName
        //  }
        //}
      }
    }
  }
  firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  // get first name from testing page: 

  if (firstName === undefined || firstName.length < 2) {
    console.log("get user name from caller field")
    const callerText = document.querySelector('label[for="caller"]')
  ?.closest('.row')
  ?.querySelector('a.linked')
  ?.textContent?.trim() || '';
  firstName = callerText.split(/\s+/)[0] || '';
    console.log('got first hame for testin page:',firstName);
  }


}

function shortDescriptionReadOnly() {
  // try {
  //   console.log("try to select short_description");
  //   if (val('input[name="incident.short_description"]') != '')
  //     setAttr('input[name="incident.short_description"]', 'readonly', 'readonly');
  
  // if (val('textarea[name="incident.short_description"]') != '')
  //     setAttr('textarea[name="incident.short_description"]', 'readonly', 'readonly');
  
  // if (val('textarea[name="incident.description"]') != '')
  //     setAttr('textarea[name="incident.description"]', 'readonly', 'readonly');

  // if (val('textarea[name="u_incident_task.short_description"]') != '')
  //     setAttr('textarea[name="u_incident_task.short_description"]', 'readonly', 'readonly');

  // if (val('textarea[name="sc_task.short_description"]') != '')
  //     setAttr('textarea[name="sc_task.short_description"]', 'readonly', 'readonly');
  // } catch (e) {

  // }

  // make sure cursor not focuc on any input box, textaree, or select box, otherwise user can still type in it.
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT')) {
    document.activeElement.blur();
  }

}

function shortDescriptionEditable() {
  try {
    console.log("try to select short_description");
    if (val('input[name="incident.short_description"]') != '')
      removeAttr('input[name="incident.short_description"]', 'readonly');
  if (val('textarea[name="incident.short_description"]') != '')
      removeAttr('textarea[name="incident.short_description"]', 'readonly');
  if (val('textarea[name="incident.description"]') != '')
      removeAttr('textarea[name="incident.description"]', 'readonly');
  if (val('textarea[name="u_incident_task.short_description"]') != '')
      removeAttr('textarea[name="u_incident_task.short_description"]', 'readonly');
  if (val('textarea[name="sc_task.short_description"]') != '')
      removeAttr('textarea[name="sc_task.short_description"]', 'readonly');   

  } catch (e) {
  }
}


function makeDescriptionReadOnly() {
  console.log("make it readonly")
  var element = qsa('textarea[name="incident.description"]')[0];
  if (element) {  // undefined or null will evaluate to false
    console.log('Element exists');

  } else {
    //console.log('Element does not exist'); //sc_task
    element = qsa('textarea[name="sc_task.description"]')[0];
    
  }

  if (element) {  // undefined or null will evaluate to false
    console.log('Element exists1');
    let arr = element.value.split(/\n\s+|\s+|<|>|\)|\(/)
    for (let i = 0; i < arr.length; i++) {
      //console.log(i, arr[i])
      if (arr[i].endsWith(",") || arr[i].endsWith(".")) {
        arr[i] = arr[i].slice(0, -1);
      }
      if ((arr[i].startsWith("https://") || arr[i].startsWith("http://")) && !arr[i].endsWith("complianceline")) {
        appendSafeExternalLink(qs('textarea[name="incident.description"]')?.parentElement, arr[i]);
      } else {
        const regex = /^\d{8}$/; // job ID should be 8 digits
        if (regex.test(arr[i])) {
          jobID = jobID + " " + arr[i];

        };
      }
      //console.log('job ids: ', jobID)
    }
  } else {
    console.log('Element does not exist'); //sc_task
    //return; 

  }

  // make clibable url for comments
  var cms = qsa('#sn_form_inline_stream_entries > ul > li')
  for (let j = 0; j < cms.length; j++) {
    //console.log(cms[j].textContent);
    let arr = cms[j].textContent.split(/\n\s+|\s+|<|>|\)|\(/)
    for (let i = 0; i < arr.length; i++) {
      //console.log(i, arr[i])
      if (arr[i].endsWith(",") || arr[i].endsWith(".")) {
        arr[i] = arr[i].slice(0, -1);
      }
      if ((arr[i].startsWith("https://") || arr[i].startsWith("http://")) && !arr[i].endsWith("complianceline")) {
        appendSafeExternalLink(cms[j], arr[i]);
      }
    }
  }

  // $('input[name="incident.description"]').select();
  // $('textarea[name="incident.short_description"]').select();
  // $('textarea[name="u_incident_task.short_description"]').select();
  // $('textarea[name="sc_task.short_description"]').select();

  var selectElement = document.getElementById('incident.state');
  if (selectElement === null) {
    selectElement = document.getElementById('sc_task.state');
  }  
  if (selectElement === null) {
    selectElement = document.getElementById('u_incident_task.state');
  }  


  var selectedOption = ''; 
  if(selectElement && selectElement.options) selectedOption = selectElement.options[selectElement.selectedIndex].text;

  // This will log "Assigned"
  console.log(selectedOption);

  if (selectedOption === 'New' || selectedOption === '-- None --' || selectedOption === 'Unassigned') {
    changeBackground(urlMap.get('newTicketColor'))
  } else if (selectedOption === 'Assigned') { 
    changeBackground(urlMap.get('assignedTicketColor'));
    hideMap.set('.sn-controls.row', ""); 
  
  } else if ( selectedOption === 'On Hold') {
    changeBackground(urlMap.get('holdTicketColor'))
    console.log('hold')
    hideMap.set('.sn-controls.row', ""); 
  } else if (selectedOption === 'Resolved' || selectedOption === 'Closed') {
      changeBackground(urlMap.get('closedTicketColor'))
      hideMap.set('.sn-controls.row', "");
  } else {
    console.log('other')
    //changeBackground('white');
    changeBackground(urlMap.get('newTicketColor'));
    //hideMap.set('.sn-controls.row', ""); 
  }

  console.log('.' + val('[name*="assigned_to"], [id*="assigned_to"]') + '.')

  console.log(val('select[name="u_incident_task.state"]'))
  
  try {
    console.log("try to select short_description");
    if (val('input[name="incident.short_description"]') != '')
      setAttr('input[name="incident.short_description"]', 'readonly', 'readonly');
  
  if (val('textarea[name="incident.short_description"]') != '')
      setAttr('textarea[name="incident.short_description"]', 'readonly', 'readonly');
  
  if (val('textarea[name="incident.description"]') != '')
      setAttr('textarea[name="incident.description"]', 'readonly', 'readonly');

  if (val('textarea[name="u_incident_task.short_description"]') != '')
      setAttr('textarea[name="u_incident_task.short_description"]', 'readonly', 'readonly');

  if (val('textarea[name="sc_task.short_description"]') != '')
      setAttr('textarea[name="sc_task.short_description"]', 'readonly', 'readonly');
  } catch (e) {

  }

  console.log("set bookmark color for ticket", currentID);
  chrome.storage.local.get([currentID + 'color'], function(result) {
    if (result[currentID + 'color'] !== undefined) {
      console.log("bookmark color found:", result[currentID + 'color']);

      let color = result[currentID + 'color'];

      let assignedTo = val('[name*="assigned_to"], [id*="assigned_to"]');

      if(color === 'green' && assignedTo && assignedTo.indexOf(myFirstName) != -1) {
        console.log("my ticket, ignore green")
      } else {

        showBookmarkTag(color);
      }
      
    } else {
      console.log("tick clor not found in storage!");
    }
  });

  for (var key in favorArray) {
    if (favorArray.hasOwnProperty(key)) {
      if (favorArray[key][1] === currentID) {
        showBookmarkTag(urlMap.get('bookmarkTicketColor'));
        break 
      }
    }
  }
  
  if (autoRun != "") {

    console.log("autoRun is not empty, run automatically");
    chrome.storage.local.get(['lastTicketID'], function (result) {
      if (result.lastTicketID != undefined) {
        setTimeout(() => {

          let arr = autoRun.split(" ");

          if (currentID == result.lastTicketID) {
            // go to the next ticket
            arr[1].split('').forEach((char) => {
              document.dispatchEvent(new KeyboardEvent('keyup', { 'key': char }));
              console.log(char);
            });
          } else {
            //automatic set up assign ticket 
            arr[0].split('').forEach((char) => {
              document.dispatchEvent(new KeyboardEvent('keyup', { 'key': char }));
              console.log(char);
            });
          }
        }, 1000);
      }
    })

    chrome.storage.local.set({ 'lastTicketID': currentID }, function () {
      console.log("ticket Id saved");
    });
  } else {

    console.log("autoRun is empty, not run automatically");
    console.log("hide all here");
    if (hideMap.size != 0) 
      hideAll()
    else 
      console.log("hideMap is empty, no need to hide anything");
  }
 

  let desc = "Short description: " + val('textarea[name="incident.short_description"]') + "\nLong description: " + val('textarea[name="incident.description"]') + "\n"

  chrome.storage.local.set({ [currentID + 'description']: desc }, function () {
      console.log("description saved for later use:", desc);
  });
            

  // invividual ticket, and still need to open new ticket for classification
  chrome.storage.local.get(['classifyTicketList'], async function (result) {
    if (result.classifyTicketList && result.classifyTicketList.length > 0) {
      
      if (chatgptURL == '') {
            alert("Please set up the value for chatgptURL in option page, or enable 'Use Background API' in options.");
            return;


      }

     
      

      const newArry = result.classifyTicketList;
      let allDone = true; 
      for (let i=0; i<newArry.length; i++) {

        console.log("check ticket ", newArry[i].split(':')[0], " for classification");
        
        if (newArry[i].split(':')[0] == currentID) {
          console.log("current ticket is in the classifyTicketList, not need to go to itself.");
        } else {
          let des = await getFromStorage(newArry[i].split(':')[0] + 'description');
          if(des === undefined) {
            allDone = false;
            let sisid = newArry[i].split(':')[1]; 
            let url = domain + "/incident.do?sys_id=" + sisid; 
            if(currentURL.indexOf('testPage') != -1) {
              url = domain + "/testPage/incident.do.html?sys_id=" + sisid;
            }
            console.log("try to open ticket for classification3: ", url);


            chrome.runtime.sendMessage({ greeting: "Open " + url}, function (response) {
              console.log(response.farewell);
            }); 
            break; 
          }    
        } 
      } 
      if(allDone) {
        //console.log("current ticket is not in the classifyTicketList, no need to classify, just set up for next ticket");
         console.log("all done");
         let myPromptAll = "Prompt: There are some requests from computer users. Please classify each one:\n"
         let tics = "";
         for (let j=0; j<newArry.length; j++) {
            let des = await getFromStorage(newArry[j].split(':')[0] + 'description');
            if(des !== undefined) {
              myPromptAll = myPromptAll + "\n" + des 
              tics = tics + newArry[j].split(':')[0] + " Classification: [your classification]\n"

            }
          } 
          myPromptAll = myPromptAll + "\n" + tics + "\n" + classificationPrompt + "\nThanks."
          

         // Awaited: the close below can target this very tab, and closing it
         // out from under an open dialog would lose the answer.
         await sendToChatSession(myPromptAll);

        
        chrome.runtime.sendMessage({ greeting: "closeTab, the last ticket tab" }, response => {

          console.log("try to close last ticket tab");
          if (response && response.farewell) {
            const activeTabId = response.farewell;
            console.log('Received active tab ID:', activeTabId);
          }
        });  
      }
    }  else {
      console.log("classifyTicketList is empty, no need to classify");
    }
  });

      
  chrome.storage.local.get(['autoRun'], function (result) {
      if (result.autoRun != undefined) {
        
        // time, ticketID, action 
        let arr = result.autoRun.split(" ");
        let time = new Date().getTime();
        console.log("autoRun info:", arr, "current time", time);

        if (time - parseInt(arr[0]) < 50000) { // only auto run within 30s after last action5 avoid accidentally trigger
          console.log("auto run action:", arr[2], " for ticket ", arr[1]);

          setTimeout(() => {

            chrome.storage.local.set({'autoRun': time + " " + currentID + " " + arr[2]}, function () {
              console.log("update autoRun time");
            });
            
            arr[2].split('').forEach((char) => {
                document.dispatchEvent(new KeyboardEvent('keyup', { 'key': char }));
                console.log(char);
              });
    
          }, 2000);
        } else {
          chrome.storage.local.remove('autoRun', function () {
            console.log("autoRun removed");
          });
        }
      }
  })

   // mark classification result in page

   const key1 = currentID + 'classificationResult';
    chrome.storage.local.get([key1], function (result) {
      if (result[key1]) {
        console.log("Found existing classification result:", result[key1]);
        
          const div = document.createElement("div");
          const answer = document.createElement("div");
          answer.style.cssText = "font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(256, 94, 92); display: inline-block; white-space: pre-wrap;";
          answer.textContent = "Suggested answer:" + result[key1];
          div.appendChild(answer);

          //div.className = "addedhere";
         
          let textarea = document.getElementById("activity-stream-comments-textarea");
          
         textarea.parentElement.append(div);
      }
      else {
        console.log("No existing classification result found for this ticket.", key1);
      }
    });
}


function getFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], function(result) {
      resolve(result[key]);
    });
  });
}

function assignClassification(shortcut, ssid) {
  console.log("assign classification for ", ssid, " with shortcut ", shortcut);

  const timestamp = Date.now(); // Current timestamp in milliseconds
      const dataWithTimestamp = { data: 'Delay ' +shortcut, timestamp: timestamp };
      //if not set yet
      
    //  chrome.storage.local.get("delayKeyPressAfterReload"), funtion (result) {
    //   if (!result){
    //     chrome.storage.local.set({ 'delayKeyPressAfterReload': dataWithTimestamp }, function () {
    //     console.log("delay keypress saved");
    //   });
    //   }
    //  }
     chrome.storage.local.get("delayKeyPressAfterReload", function(result) {
    // Check if the key does NOT exist or is empty
    if (!result || !result.delayKeyPressAfterReload) {
        chrome.storage.local.set({ 
            'delayKeyPressAfterReload': dataWithTimestamp 
        }, function() {
            console.log("delay keypress saved");
        });
    }
});

      
  setTimeout(() => {
    const url = domain + "/incident.do?sys_id=" + ssid;
    console.log("try to open ticket for classification1: ", url);
    // chrome.runtime.sendMessage({ greeting: "Open " + url + " in new tab"}, function (response) {
    //     console.log(response.farewell);
    // });
  }, 1000);
}

function deleteClassification(key, highlightField, hoverField) {
  chrome.storage.local.remove(key, function () {
    console.log("Classification result removed for key: " + key);
  });

  if (highlightField) {
    
    highlightField.style.color = "black";
    let link = highlightField.querySelector('a');
    if (link) {
      link.style.color = "black";
    }
    console.log("reset classification highlight for ", highlightField);
  }

  if (hoverField) {
    hoverField.style.backgroundColor = "";
    if (hoverField.originalClickHandler) {
      hoverField.removeEventListener("click", hoverField.originalClickHandler);
      hoverField.originalClickHandler = null;
    }
    if (hoverField.originalMouseEnter) {
      hoverField.removeEventListener("mouseenter", hoverField.originalMouseEnter);
      hoverField.originalMouseEnter = null;
    }
  }
  // refresh current page: 
  // setTimeout(() => {
  //   location.reload();
  // }, 500);
}

function showClassificationDecisionModal(classificationResult, description, classificationKey) {
  return new Promise(function (resolve) {
  console.log('[ClassificationDebug] showClassificationDecisionModal called', {
    classificationResult: classificationResult,
    classificationKey: classificationKey,
    hasDescription: !!description,
    descriptionLength: description ? description.length : 0
  });

  const existing = document.getElementById('classificationDecisionOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'classificationDecisionOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '120vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.45)';
  overlay.style.zIndex = '2147483647';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';

  const modal = document.createElement('div');
  modal.style.width = 'min(900px, 92vw)';
  modal.style.maxHeight = '85vh';
  modal.style.overflow = 'hidden';
  modal.style.backgroundColor = '#fff';
  modal.style.borderRadius = '10px';
  modal.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.35)';
  modal.style.padding = '14px';
  modal.style.fontFamily = 'Arial, sans-serif';

  const title = document.createElement('div');
  //title.textContent = 'Classification Review';
  title.style.fontSize = '18px';
  title.style.fontWeight = '700';
  title.style.marginRight = 'auto';
  title.style.marginLeft = '50px';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';

  const headerActions = document.createElement('div');
  headerActions.style.display = 'flex';
  headerActions.style.gap = '8px';
  headerActions.style.alignItems = 'center';

  const body = document.createElement('div');
  body.style.whiteSpace = 'pre-wrap';
  body.style.overflowY = 'auto';
  body.style.maxHeight = '55vh';
  body.style.border = '1px solid #ddd';
  body.style.borderRadius = '8px';
  body.style.padding = '10px';
  body.style.lineHeight = '1.35';
  body.textContent = 'Classification Result:\n' + classificationResult + '\n\nTicket details:\n' + description;

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.gap = '8px';
  footer.style.justifyContent = 'flex-end';
  footer.style.marginTop = '12px';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.padding = '14px 10px';
  closeBtn.style.minWidth = '64px';
  closeBtn.style.minHeight = '46px';
  closeBtn.style.fontSize = '15px';
  closeBtn.style.border = '1px solid #999';
  closeBtn.style.background = '#f6f6f6';
  closeBtn.style.cursor = 'pointer';


  // const otherBtn = document.createElement('button');©©
  // otherBtn.textContent = 'Other Classification';
  // otherBtn.style.padding = '12px 20px';
  // otherBtn.style.minWidth = '80px';
  // otherBtn.style.fontSize = '15px';
  // otherBtn.style.border = '1px solid #999';
  // otherBtn.style.background = '#f6f6f6';
  // otherBtn.style.cursor = 'pointer';

  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'Remove Classification';
  removeBtn.style.padding = '14px 10px';
  removeBtn.style.minWidth = '64px';
  removeBtn.style.minHeight = '46px';
  removeBtn.style.fontSize = '15px';
  removeBtn.style.border = '1px solid #999';
  removeBtn.style.background = '#f6f6f6';
  removeBtn.style.cursor = 'pointer';


  // const agreeBtn = document.createElement('button');
  // agreeBtn.textContent = 'Agree';
  // agreeBtn.style.padding = '12px 20px';
  // agreeBtn.style.minWidth = '80px';
  // agreeBtn.style.fontSize = '15px';
  // agreeBtn.style.border = '1px solid #2a7f62';
  // agreeBtn.style.background = '#2f9e7a';
  // agreeBtn.style.color = '#fff';
  // agreeBtn.style.cursor = 'pointer';

  


  const closeModal = function () {
    overlay.remove();
  };

  let isResolved = false;
  const finish = function (result) {
    if (isResolved) return;
    isResolved = true;
    closeModal();
    resolve(result);
  };

  closeBtn.addEventListener('click', function () {
    finish({ action: 'close' });
  });

  removeBtn.addEventListener('click', function () {
    // if (classificationKey) {
    //   chrome.storage.local.remove(classificationKey, function () {
    //     console.log('Classification result removed for key: ' + classificationKey);
    //   });
    // }
    finish({ action: 'remove' });
  });

  //  otherBtn.addEventListener('click', function () {
  //     //share a popup and lset user type in the shortcut key for the classification 
  //     const note = window.prompt("Enter shortcut commands to apply for this ticket:", "");
  //     if (note === null) {
  //       console.log("User canceled");
  //       return;
  //     } else {
  //       console.log("User typed:", note);
  //     }

  //     if (note.trim() === '') {
  //       console.log("Empty note, skip saving classification update");
  //       return;
  //     }
      
  //     // how to save the new classication to the ticket?
  //     chrome.storage.local.set({ [classificationKey]: 'Other (' + note + ')' }, function () {
  //         if (chrome.runtime.lastError) {
  //           console.error("Error reading data: " + chrome.runtime.lastError);
  //         } else {
  //           console.log("set new classification for ticket with key:", classificationKey, " value: ", 'Other (' + note + ')');


    
  //           const timestamp = Date.now(); // Current timestamp in milliseconds
  //     const dataWithTimestamp = { data: 'Delay ' +note, timestamp: timestamp };
  //       chrome.storage.local.set({ 
  //           'delayKeyPressAfterReload': dataWithTimestamp 
  //       }, function() {
  //           console.log("delay keypress saved");
  //          if(onAgree) onAgree(); 
  //       });
    

           
  //        }
  //     });
  //   closeModal();
  // });

  // agreeBtn.addEventListener('click', function () {
  //   closeModal();
  //   if (onAgree) onAgree();
  // });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) finish({ action: 'close' });
  });

  modal.addEventListener('mouseleave', function () {
    finish({ action: 'close' });
  });

  footer.appendChild(closeBtn);
  

 
  headerActions.appendChild(closeBtn);
  
  headerActions.appendChild(removeBtn);
  //headerActions.appendChild(agreeBtn);
  //headerActions.appendChild(otherBtn);


  const topics = classificationPrompt.split('topics: ')[1].split('; '); 
  const topicBtns = [];
  topics.forEach(topic => {
    const topicBtn = document.createElement('button');
    topicBtn.textContent = topic;
    topicBtn.style.padding = '14px 10px';
    topicBtn.style.minWidth = '64px'; 
    topicBtn.style.minHeight = '46px';
    
    if(classificationResult === topic) {
      topicBtn.style.border = '1px solid #2a7f62';
      topicBtn.style.background = '#2f9e7a';
      topicBtn.style.color = '#fff';
    } else {
      topicBtn.style.border = '1px solid #999';
      topicBtn.style.background = '#f6f6f6';  
    }
    // add click action to assign the topick to the ticket
    topicBtn.addEventListener('click', function () {
      console.log('topic:', topic, topic.split('(')[1].split(')')[0]); 
      const shortcut = topic.split('(')[1].split(')')[0];
      console.log('topic:', topic, shortcut); 
      finish({ action: 'assign', shortcut: shortcut });
    });
    headerActions.appendChild(topicBtn)
  }); 

  // Create the text box
const inputField = document.createElement('input');
inputField.type = 'text';
inputField.placeholder = 'Type your classification and press Enter...';
inputField.style.width = '100%';
inputField.style.padding = '10px';
inputField.style.marginTop = '10px';
inputField.style.boxSizing = 'border-box';

// Add the Enter key listener
inputField.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevents accidental form submission
    
    const textValue = inputField.value.trim();
    if (textValue) {
      finish({ action: 'assign', shortcut: textValue });
    }
  }
});

headerActions.appendChild(inputField);
// Append it to your modal or a specific container
//modal.appendChild(inputField); 
  
  header.appendChild(headerActions);
  header.appendChild(title);
  
  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Browsers cannot move the real mouse cursor, but we can default focus to Agree.
  // setTimeout(function () {
  //   agreeBtn.focus();
  //   agreeBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  // }, 0);
  });
}
// Make available to inline event handlers
//window.deleteClassification = deleteClassification;

function parseStoredTicketUrl(rawUrl, baseUrl) {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl, baseUrl || window.location.href);
    let sysId = url.searchParams.get('sys_id');

    // Workspace URLs can contain an encoded incident URL in another parameter.
    if (!sysId) {
      let decodedUrl = url.href;
      try {
        decodedUrl = decodeURIComponent(decodedUrl);
      } catch (_error) {
        // Keep the original URL when it contains malformed escape sequences.
      }
      const sysIdMatch = decodedUrl.match(/[?&]sys_id=([^&#]+)/i);
      if (sysIdMatch) sysId = sysIdMatch[1];
    }

    if (!sysId || !/^https?:$/.test(url.protocol)) return null;
    return { url: url.href, sysId: sysId };
  } catch (_error) {
    return null;
  }
}

function getTicketIdFromListLink(link) {
  const linkText = link && link.textContent ? link.textContent.trim() : '';
  const ariaLabel = link && link.getAttribute ? (link.getAttribute('aria-label') || '') : '';
  const combinedText = `${linkText} ${ariaLabel}`;
  const ticketMatch = combinedText.match(/\b(?:INC|ITSK|TASK|RITM|REQ)\d+\b/i);

  if (ticketMatch) return ticketMatch[0].toUpperCase();

  const ariaWords = ariaLabel.trim().split(/\s+/);
  return ariaWords.length > 0 ? ariaWords[ariaWords.length - 1] : linkText;
}

function saveOrderedTicketNavigation(links, sourceUrl) {
  const tickets = [];
  const seenSysIds = new Set();

  Array.from(links || []).forEach((link) => {
    const parsed = parseStoredTicketUrl(
      link.href || (link.getAttribute && link.getAttribute('href')),
      sourceUrl
    );
    if (!parsed || seenSysIds.has(parsed.sysId)) return;

    seenSysIds.add(parsed.sysId);
    tickets.push({
      ticketId: getTicketIdFromListLink(link),
      sysId: parsed.sysId,
      url: parsed.url
    });
  });

  if (tickets.length === 0) {
    console.log('No valid ticket URLs found; keeping the existing navigation list.');
    return Promise.resolve(false);
  }

  const storageUpdate = {
    [orderedTicketNavigationStorageKey]: {
      capturedAt: Date.now(),
      sourceUrl: sourceUrl || window.location.href,
      tickets: tickets
    }
  };

  // Preserve the existing per-ticket sysid keys used by classification features.
  tickets.forEach((ticket) => {
    if (ticket.ticketId) storageUpdate[ticket.ticketId + 'sysid'] = ticket.sysId;
  });

  return new Promise((resolve) => {
    chrome.storage.local.set(storageUpdate, function () {
      if (chrome.runtime.lastError) {
        console.error('Failed to save ordered ticket navigation:', chrome.runtime.lastError);
        resolve(false);
        return;
      }
      console.log(`Saved ${tickets.length} ordered ticket URLs from ${storageUpdate[orderedTicketNavigationStorageKey].sourceUrl}`);
      resolve(true);
    });
  });
}

function getServiceNowEmbeddedFrames() {
  const frames = [];
  const classicFrame = document.getElementById('gsft_main');
  if (classicFrame) frames.push(classicFrame);

  try {
    const macroponent = document.querySelector('macroponent-f51912f4c700201072b211d4d8c26010');
    const workspaceFrame = macroponent && macroponent.shadowRoot
      ? macroponent.shadowRoot.querySelector('iframe')
      : null;
    if (workspaceFrame && !frames.includes(workspaceFrame)) frames.push(workspaceFrame);
  } catch (_error) {
    // The workspace shell is optional.
  }

  return frames;
}

function getCurrentTicketLocation() {
  const frames = getServiceNowEmbeddedFrames();

  for (const frame of frames) {
    try {
      const frameUrl = frame.contentWindow && frame.contentWindow.location
        ? frame.contentWindow.location.href
        : frame.src;
      const parsed = parseStoredTicketUrl(frameUrl, window.location.href);
      if (parsed) return { ...parsed, frame: frame };
    } catch (_error) {
      const parsed = parseStoredTicketUrl(frame.src, window.location.href);
      if (parsed) return { ...parsed, frame: frame };
    }
  }

  const parsedWindowUrl = parseStoredTicketUrl(window.location.href, window.location.href);
  return parsedWindowUrl ? { ...parsedWindowUrl, frame: null } : null;
}

function isSafeStoredTicketUrl(rawUrl) {
  try {
    const targetUrl = new URL(rawUrl, window.location.href);
    const parsed = parseStoredTicketUrl(targetUrl.href, window.location.href);
    const isTicketPath = /\/incident\.do(?:\.html)?$/i.test(targetUrl.pathname);
    return parsed && targetUrl.origin === window.location.origin && isTicketPath;
  } catch (_error) {
    return false;
  }
}

/**
 * The control the "Click .icon-arrow-down" entry presses, wherever it lives.
 *
 * On the current ServiceNow shell the form is inside an iframe in a custom
 * element's shadow root, so a plain document query finds nothing there.
 */
function nextTicketControl() {
  const selector = '.icon-arrow-down';
  if (newFormat) {
    try {
      const macroponent = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010");
      const frame = macroponent && macroponent.shadowRoot
        ? macroponent.shadowRoot.querySelector('iframe')
        : null;
      return frame && frame.contentWindow && frame.contentWindow.document.body
        ? frame.contentWindow.document.body.querySelector(selector)
        : null;
    } catch (_error) {
      // Cross-origin iframe, or the shell mid-navigation.
      return null;
    }
  }
  return qs(selector);
}

/**
 * Whether there is a next ticket to move to.
 *
 * Reads the saved navigation list the way goToStoredNextTicket does, but
 * without navigating: that list is the only thing that knows a run has
 * reached its last ticket rather than merely that a button is missing.
 *
 * Falls back to the arrow-down control, but only a control that is present
 * and disabled counts as "no next". A control that cannot be found means
 * this page does not keep it where we looked -- it moves between the classic
 * form, the iframe shell and whatever selector the Click entry is configured
 * with -- and reading that as "no next" ended every run on its first ticket.
 * The caller's watchdog catches a hop that really does go nowhere, so the
 * safe answer when unsure is "keep going".
 */
async function hasNextTicket() {
  const navigation = await getFromStorage(orderedTicketNavigationStorageKey);
  const tickets = navigation && Array.isArray(navigation.tickets) ? navigation.tickets : null;

  if (tickets && tickets.length) {
    const currentLocation = getCurrentTicketLocation();
    let currentIndex = -1;
    if (currentLocation && currentLocation.sysId) {
      currentIndex = tickets.findIndex(t => String(t.sysId) === String(currentLocation.sysId));
    }
    if (currentIndex === -1 && currentID && currentID !== 'empty') {
      currentIndex = tickets.findIndex(
        t => String(t.ticketId || '').toUpperCase() === String(currentID).toUpperCase()
      );
    }
    // A known position in a known list is the authoritative answer.
    if (currentIndex !== -1) {
      const more = currentIndex < tickets.length - 1;
      console.log('hasNextTicket: saved list puts', currentID, 'at', currentIndex + 1,
        'of', tickets.length, '->', more);
      return more;
    }
  }

  const control = nextTicketControl();
  if (!control) {
    console.log('hasNextTicket: no saved list entry and no arrow-down control found, '
      + 'so assuming there is a next ticket');
    return true;
  }
  const enabled = !control.disabled && control.getAttribute('aria-disabled') !== 'true';
  console.log('hasNextTicket: arrow-down control is', enabled ? 'enabled' : 'disabled');
  return enabled;
}

async function goToStoredNextTicket() {
  const navigation = await getFromStorage(orderedTicketNavigationStorageKey);
  if (!navigation || !Array.isArray(navigation.tickets) || navigation.tickets.length === 0) {
    console.log('No ordered ticket navigation list is available; using the existing next button.');
    return false;
  }

  const currentLocation = getCurrentTicketLocation();
  let currentIndex = -1;

  if (currentLocation && currentLocation.sysId) {
    currentIndex = navigation.tickets.findIndex(
      ticket => String(ticket.sysId) === String(currentLocation.sysId)
    );
  }

  if (currentIndex === -1 && currentID && currentID !== 'empty') {
    currentIndex = navigation.tickets.findIndex(
      ticket => String(ticket.ticketId || '').toUpperCase() === String(currentID).toUpperCase()
    );
  }

  if (currentIndex === -1) {
    console.log(`Ticket ${currentID} is not in the saved navigation list; using the existing next button.`);
    return false;
  }

  if (currentIndex >= navigation.tickets.length - 1) {
    console.log('Current ticket is the last ticket in the saved navigation list.');
    tmpAlert('Last ticket in saved list.', 3000);
    return true;
  }

  const nextTicket = navigation.tickets[currentIndex + 1];
  if (!nextTicket || !isSafeStoredTicketUrl(nextTicket.url)) {
    console.warn('Saved next-ticket URL is invalid; using the existing next button.', nextTicket);
    return false;
  }

  console.log(`Navigating directly from ${navigation.tickets[currentIndex].ticketId} to ${nextTicket.ticketId}: ${nextTicket.url}`);

  try {
    if (currentLocation && currentLocation.frame && currentLocation.frame.contentWindow) {
      currentLocation.frame.contentWindow.location.assign(nextTicket.url);
      setTimeout(() => {
        if (newFormat) processIFrame(null);
      }, 4000);
    } else {
      window.location.assign(nextTicket.url);
    }
    return true;
  } catch (error) {
    console.error('Direct next-ticket navigation failed; using the existing next button.', error);
    return false;
  }
}

async function processIFrame(iframe) {
  console.log('checking iframe...')
  console.log(currentURL)

  let ls = null;
  let lsTime = null;
  // Resolve a document-like context: use iframe's document when provided, otherwise fall back to top document
  const rootDoc = (function() {
    try {
      if (iframe && (iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document))) {
        return iframe.contentDocument || iframe.contentWindow.document;
      }
    } catch (e) {
      // cross-origin, fall back to top document
    }
    return document;
  })();

  // for old service-now with side bar and iframe gtfs_main list_row list_odd
  if (iframe != null || rootDoc === document) {
    // Support both iframe list pages and top-level list pages (no iframe)

    const th = rootDoc && rootDoc.body ? rootDoc.body.querySelector('th[name="sys_updated_by"]') : null;
console.log('Found:', !!th);
console.log('0-based column index:', th ? th.cellIndex : -1);
console.log('1-based column number:', th ? th.cellIndex + 1 : -1);

    myIDColumn = th? th.cellIndex - 1: 3; //rootDoc && rootDoc.body ? rootDoc.body.querySelector('th[name="sys_updated_by"]') : null;
    //if(myIDColumn ==- -1) myIDColumn = 3; 

    ls = rootDoc && rootDoc.body ? rootDoc.body.querySelectorAll('a.linked.formlink') : null;


    lsTime = rootDoc && rootDoc.body ? rootDoc.body.querySelectorAll('.datex.date-timeago') : null;



    // ls = document.getElementById('gsft_main').contentWindow.document.body.querySelectorAll('a.linked.formlink')
    if (ls != null && ls.length > 0) {
      console.log('find links')
      let listSourceUrl = window.location.href;
      try {
        if (rootDoc.location && rootDoc.location.href) listSourceUrl = rootDoc.location.href;
      } catch (_error) {
        // Fall back to the top-level list URL.
      }
      await saveOrderedTicketNavigation(ls, listSourceUrl);

      //let todayTickets = {};
      const today = new Date();
      // Get the year, month, and day components of the date
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, so add 1
      const day = String(today.getDate()).padStart(2, '0');

      // Create the date string in the format "YYYY-MM-DD"
      const dateString = `${year}-${month}-${day}`;

      console.log(dateString); // Output: "2023-08-16" (for example, if today is August 16, 2023)

   //   chrome.storage.local.get(['todayTickets'], function (result) {
   //     if (chrome.runtime.lastError) {
   //       console.error("Error reading data: " + chrome.runtime.lastError);
    //    } else {
         // todayTickets = {}; //result.todayTickets;
         // console.log("Retrieved data:", todayTickets);

          if (typeof (todayTickets) == 'undefined' || todayTickets['today'] != dateString) {
            todayTickets = {};
          }
        } else {
          console.log("no ticket link is found in this page"); 
        }
       
        for (let i = 0; i < ls.length; i++) {

          //make bigger to easier to click
          // ls[i].style.fontSize = "18px";

          const lastSpaceIndex = ls[i].getAttribute('aria-label').lastIndexOf(" ");
          let ticketID = ls[i].getAttribute('aria-label').substring(lastSpaceIndex + 1);
          //const ticketTime = new Date(lsTime[i].getAttribute('title')).getTime();

          console.log("working on " + ticketID)
      
          
          // const dateString = "08-16-2023 16:08:50";
          const [datePart, timePart] = lsTime[i].getAttribute('title').split(' ');
          const [month, day, year] = datePart.split('-');
          const [hours, minutes, seconds] = timePart.split(':');

          const dateObject = new Date(year, month - 1, day, hours, minutes, seconds);
          const ticketTime = dateObject.getTime();

          console.log(lsTime[i].getAttribute('title'));
          console.log(ticketTime);
         // console.log('ticket viewed time: ', todayTickets[ticketID]);

          allTicketIDs.push(ticketID);
          let key = ticketID + 'sysid';
          let sysid = ls[i].getAttribute('href').split('sys_id=')[1].split('&')[0];

          chrome.storage.local.set({ [key]: sysid }, function () {
            console.log("Set ticket sysid to storage:", key, sysid);  
          }); 

          // old ticket and has read it today
          if (typeof todayTickets != "undefined" && ticketID in todayTickets && ticketTime < todayTickets[ticketID]) {
            console.log("highlight for ticket viewed today:", ticketID);
            ls[i].style.color = "red";
            ls[i].style.backgroundColor = "yellow";
          }
          
          // chrome.storage.local.get([ticketID], function(result) {
          //   if (result[ticketID] !== undefined) {
          //     console.log("Found:", result[ticketID]);

          //     let color = result[ticketID];

          //       //ls[i].style.color = color;
          //       ls[i].style.backgroundColor = color;


              
          //   } else {
          //     console.log("Not found!");
          //   }
          // });

          
          ls[i].target = "_blank";


          // check who is the last replier
          // Get the parent row of the selected element
          let parentRow = ls[i].closest("tr");

           



          console.log("entire row:");
          console.log(txt(parentRow)); // Get the text content

          // // Get all <td> elements within the row
          let fields = parentRow.querySelectorAll("td");

          
          let link=fields[2].querySelector("a.linked.formlink").getAttribute("href");

          // // Access the third field using JavaScript indexing
          let thirdField = fields[myIDColumn + 1];

          if (txt(thirdField).toLowerCase().indexOf(myID.toLowerCase()) === -1) {
            thirdField.style.color = 'red'
            // Also set color on the <a> tag inside, if it exists
            const link = thirdField.querySelector('a');
            if (link) link.style.color = 'red';
          }

          // // Output or manipulate the third field
          console.log(txt(thirdField)); // Get the text content
          //console.log("ticket", ticketID, "link", link);

          const [color, description, classificationResult] = await Promise.all([
      getFromStorage(ticketID + 'color'),
      getFromStorage(ticketID + 'description'),
      getFromStorage(ticketID + 'classificationResult')
    ]);
          
        //  Promise.all([
        //    getFromStorage(ticketID),
        //    getFromStorage(ticketID + 'classificationResult')
         // ]).then(([color, classificationResult]) => {
            console.log("ticketID", ticketID);
            console.log("color and classification result from storage:", color, classificationResult);
            if (color !== undefined) {
              console.log("Found:", color);

               console.log("entire row look for:", myFirstName);
               console.log(txt(parentRow)); // Get the text content

              if(color === 'green' && txt(parentRow).indexOf(myFirstName) != -1) {
                console.log("my ticket, ignore green")
              } else {
                console.log("set color", color);
                ls[i].style.backgroundColor = color;
              }  

            } else {
              console.log("ticket color is not found in storage!");
            }

            // let findmatch = false;
            // let classColor = 'rgb(220, 220, 220, 0.5)'; 
            // const fouthField = fields[classColumn + 1];
            // if (classificationResult !== undefined) {
            //   console.log("Classification Result for ticket", ticketID, ":", classificationResult);
              
            //   const topics = classificationPrompt.split('topics: ')[1].split('; ');
              
            //   // loop through topics, if the classification result contains the topic, set the color accordingly

            //   for (let i = 0; i < topics.length; i++) {
            //     const topic = topics[i].split(': ')[0];
            //     classColor = classificationColors[i];
            //     //    console.log("checking topic", topic, color,  "  with classification result", result[key1])

            //     if (classificationResult.toLowerCase().indexOf(topic.toLowerCase()) != -1) {
            //       findmatch = true;
            //       fouthField.style.color = classColor;
            //       //fouthField.style.backgroundColor = color;
            //       console.log("found classification color", classColor, 'for', ticketID);

            //       const link = fouthField.querySelector('a');
            //       if (link) link.style.color = classColor;
            //       break; // stop at the first match
            //     } else {
            //       console.log("does not match");
            //       //fouthField.style.color = 'yellow';
            //     }
            //   }             
            // }
            
  //           if (!findmatch) {
  //               fouthField.style.color = 'black';
  //               const link = fouthField.querySelector('a');
  //               if (link) link.style.color = 'black';
  //               chrome.storage.local.remove(ticketID + 'classificationResult', function () {
  //                 console.log('No more items left, classification result removed for ' + ticketID);
  //               });

  //             }

  //               let cfield = fields[classColumn ];
  //               cfield.style.backgroundColor = classColor; // "rgb(220, 220, 220, 0.5)"; //"rgb(256, 94, 92, 0.2)";
  //               cfield.style.textAlign = 'center';
  //               cfield.textContent = classificationResult ? classificationResult : 'NA'; 

  //               cfield.style.cursor = 'pointer';
  //               console.log('[ClassificationDebug] candidate field prepared for click', {
  //                 ticketID: ticketID,
  //                 classColumn: classColumn,
  //                 classificationResult: classificationResult,
  //                 alreadyBound: !!cfield.originalClickHandler,
  //                 fieldText: cfield && cfield.innerText ? cfield.innerText.trim().slice(0, 120) : ''
  //               });
  //               if (!cfield.originalClickHandler) {
  //                 cfield.originalClickHandler = async function (ev) {
  //   console.log('[ClassificationDebug] classification field clicked', {
  //     ticketID: ticketID,
  //     targetTag: ev && ev.target ? ev.target.tagName : null,
  //     currentTargetTag: ev && ev.currentTarget ? ev.currentTarget.tagName : null,
  //     classificationResult: classificationResult
  //   });
  //   ev.preventDefault();
  //   ev.stopPropagation();
  //   const modalDecision = await showClassificationDecisionModal(
  //     classificationResult,
  //     description,
  //     ticketID + 'classificationResult'
  //   );

  //   if (!modalDecision || !modalDecision.action) return;
  //   if (modalDecision.action === 'assign') {
  //     assignClassification(modalDecision.shortcut, sysid);
  //     return;
  //   }
  //   if (modalDecision.action === 'remove') {
  //     deleteClassification(ticketID + 'classificationResult', fouthField, cfield);
  //   }
  // };
  //                 cfield.addEventListener('click', cfield.originalClickHandler);
  //                 console.log('[ClassificationDebug] click listener attached', {
  //                   ticketID: ticketID,
  //                   classColumn: classColumn
  //                 });

  //               } else {
  //                 console.log('[ClassificationDebug] click listener already exists, skipped attach', {
  //                   ticketID: ticketID,
  //                   classColumn: classColumn
  //                 });

  //               }

          }
      

          
      //add vertical line: 
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Calculate the positions for the lines
      firstLineX = windowWidth * leftLinePositionListPage;
      firstLineX1 = windowWidth * rightLinePositionListPage;

      // Function to create and append an SVG line
      function createLine(xPosition) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "10");
        svg.setAttribute("height", windowHeight);
        svg.setAttribute("style", `position: absolute; left: ${xPosition}px; top: 0;`);

        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", "5");
        line.setAttribute("y1", "120");
        line.setAttribute("x2", "5");
        line.setAttribute("y2", windowHeight);
        line.setAttribute("stroke", "#FFFF00");
        line.setAttribute("stroke-width", "2");

        svg.appendChild(line);
        document.body.appendChild(svg);
      }

      // Draw the first line
      createLine(firstLineX);
      createLine(firstLineX1);

  // Target body for events (iframe body if available, else top document body)
  var iframeBody = (rootDoc && rootDoc.body) ? rootDoc.body : document.body;

  //setupIncidentRowHoverHint(iframeBody);

  // For coordinate calculations, if no iframe, treat left offset as 0
  const iframeRect = iframe ? iframe.getBoundingClientRect() : { left: 0 };
      // Add an event listener to the iframe body
      iframeBody.addEventListener('click', function (ev) {

        chrome.storage.local.remove('classifyTicketList', function () {
           console.log('No more items left, classifyTicketList has been cleared.');
        }); 


        let backgroundColor = window.getComputedStyle(ev.target).backgroundColor;
        console.log('background: ', backgroundColor);  // Outputs the background color, e.g., "rgb(255, 255, 0)" for yellow
        console.log('e.target.textContent', ev.target.textContent)
        if (ev.target.nodeName ==='A') { //} && (ev.target.textContent.startsWith('INC') || ev.target.textContent.startsWith('ITSK'))) {
          console.log('Click event!', ev.target);
          ev.target.style.backgroundColor = "yellow";
          ev.target.style.color = "red";
        }

        console.log('id: ' + ev.target.id);
        console.log('class: ' + ev.target.className);
        console.log("nodename: " + ev.target.nodeName);
        console.log("selection: " + window.getSelection().toString());
        if (backgroundColor === "rgba(0, 0, 0, 0)" || backgroundColor === "rgb(255, 255, 255)" ||  backgroundColor === "rgb(245, 245, 245)" || backgroundColor === "rgb(238, 238, 238)") {
          var clickX = iframeRect.left + ev.clientX;
          var clickY = ev.clientY;

          console.log(clickX, windowWidth)
          if (clickX > windowWidth * leftLinePositionListPage && clickX < windowWidth  * rightLinePositionListPage ) {
            console.log("left")

            if (!isValidURL(leftURL)) {
              alert("Please set value for variable leftURL in option page.");
            } else {
              // chrome.runtime.sendMessage({ greeting: "Open " + leftURL + " in current tab" }, function (response) {
              //   console.log(response.farewell);
              // });

              window.location.href = leftURL; 
            }
          } else if (clickX > windowWidth * rightLinePositionListPage) {
            console.log("right")

            if (!isValidURL(rightURL)) {  
              alert("Please set value for variable rightURL in option page.");
            } else {
             // chrome.runtime.sendMessage({ greeting: "Open " + rightURL + " in current tab" }, function (response) {
             //   console.log(response.farewell);
             // });

              //window.open(rightURL);
              window.location.href = rightURL;

            }
          } else if (ev.target.nodeName != 'A') { // not the link

            console.log("Need click to open ticket hiere", ev.target)

            let row = ev.target.closest("tr");
            if (!row) return; // Exit if not inside a row

            function getLinkFromRow(targetRow) {
              if (!targetRow) return null; // If no row, return null

              let secondColumn = targetRow.cells[2]; // Get the second column
              if (!secondColumn) return null; // If no second column, return null

              let linkText = secondColumn.querySelector('a.linked.formlink')
             
              if(linkText) {
                console.log('link find', linkText)

                linkText.style.backgroundColor = "yellow";
                linkText.style.color = "red";
              } 
              return secondColumn.querySelector("a"); // Return the link if found

            }

            // Try to get the link from the current row
            let link = getLinkFromRow(row);

            // If no link, check the previous row
            if (!link) {
              let previousRow = row.previousElementSibling; // Get the previous row
              link = getLinkFromRow(previousRow);
            }

            // Open the link in a new tab if found
            if (link) {
              console.log("Opening link:", link.href);
              //window.open(link.href, "_blank");
              chrome.runtime.sendMessage({ greeting: "Open " + link.href + " in new tab"}, function (response) {
                  console.log(response.farewell);
              });
           
            } else {
              console.log("No link found in the second column of the current or previous row.");
            }

          }

        } else if (ev.target.className.startsWith("container-fluid")) {

          // does not work some how
          //window.close();
          chrome.storage.local.remove('autoRun', function () {
            console.log("autoRun removed");
          });

          console.log('close: ' + ev.target.id);
          chrome.runtime.sendMessage({ greeting: "closeTab" }, response => {
            if (response && response.farewell) {
              const activeTabId = response.farewell;
              console.log('Received active tab ID:', activeTabId);
            }
          });
        }
      });
    
    return;
  }

  // try{
  let iframeN = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010");

  
  if (iframeN == null || iframeN.shadowRoot == null || iframeN.shadowRoot.querySelector('iframe') == null || iframeN.shadowRoot.querySelector('iframe').contentWindow.document.body == null || iframeN.shadowRoot.querySelector('iframe').contentWindow.document.body.querySelectorAll('a.linked.formlink') == null || iframeN.shadowRoot.querySelector('iframe').contentWindow.document.body.querySelectorAll('a.linked.formlink').length == 0) {
    setTimeout(() => {
      processIFrame(iframe);
    }, 1000);
    //return;
    
  } else { // new format gui ticket list

    console.log("new format, ticket list page")
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate the positions for the lines
      firstLineX = windowWidth * leftLinePositionListPage;
      firstLineX1 = windowWidth * rightLinePositionListPage;

    // Function to create and append an SVG line
    function createLine(xPosition) {
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "10");
      svg.setAttribute("height", windowHeight);
      svg.setAttribute("style", `position: absolute; left: ${xPosition}px; top: 0;`);

      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", "5");
      line.setAttribute("y1", "120");
      line.setAttribute("x2", "5");
      line.setAttribute("y2", windowHeight);
      line.setAttribute("stroke", "#FFFF00");
      line.setAttribute("stroke-width", "2");

      svg.appendChild(line);
      document.body.appendChild(svg);
    }

    // Draw the first line
    createLine(firstLineX);
    createLine(firstLineX1);
    
    iFrameID = iframeN.shadowRoot.querySelector('iframe').id
    //        newFormat = true

    //console.log(iframe.src)
    iframeURL = iframeN.shadowRoot.querySelector('iframe').src;
    // console.log('iframe src', iframe.src); 
    //  if(iframeN.querySelector('iframe').src.indexOf("assigned_toISEMPTY") != -1) {
    //    newTicket = true;
    //  }
    console.log("got iframe id1", iFrameID)
    //   


    ls = iframeN.shadowRoot.querySelector('iframe').contentWindow.document.body.querySelectorAll('a.linked.formlink');
    lsTime = iframeN.shadowRoot.querySelector('iframe').contentWindow.document.body.querySelectorAll('.datex.date-timeago');

    // ls = document.getElementById('gsft_main').contentWindow.document.body.querySelectorAll('a.linked.formlink')
    if (ls != null && ls.length > 0) {
      console.log('find links in new format');
      let workspaceListUrl = iframeURL || window.location.href;
      try {
        workspaceListUrl = iframeN.shadowRoot.querySelector('iframe').contentWindow.location.href;
      } catch (_error) {
        // Fall back to the iframe src captured above.
      }
      await saveOrderedTicketNavigation(ls, workspaceListUrl);
      let todayTickets1 = {};
      const today = new Date();
      // Get the year, month, and day components of the date
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, so add 1
      const day = String(today.getDate()).padStart(2, '0');

      // Create the date string in the format "YYYY-MM-DD"
      const dateString = `${year}-${month}-${day}`;

      console.log(dateString); // Output: "2023-08-16" (for example, if today is August 16, 2023)

      //chrome.storage.local.get(['todayTickets'], function (result) {
      //  if (chrome.runtime.lastError) {
       //   console.error("Error reading data: " + chrome.runtime.lastError);
       // } else {
        //  todayTickets = result.todayTickets;
         // console.log("Retrieved data:", todayTickets);

          if (typeof (todayTickets) == 'undefined' || todayTickets['today'] != dateString) {
            todayTickets = {};
          }
        //}
        chrome.storage.local.get(['bookmarkTickets'], function (result) {
          if (chrome.runtime.lastError) {
            console.error("Error reading data: " + chrome.runtime.lastError);
          } else {
            bookmarkTickets = result.bookmarkTickets || ""; // Default to an empty string if bookmarkTickets is undefined
            for (var i = 0; i < ls.length; i++) {

              const lastSpaceIndex = ls[i].getAttribute('aria-label').lastIndexOf(" ");
              const ticketID = ls[i].getAttribute('aria-label').substring(lastSpaceIndex + 1);
              //const ticketTime = new Date(lsTime[i].getAttribute('title')).getTime();

              // const dateString = "08-16-2023 16:08:50";
              const [datePart, timePart] = lsTime[i].getAttribute('title').split(' ');
              const [year, month, day] = datePart.split('-');
              const [hours, minutes, seconds] = timePart.split(':');

              const dateObject = new Date(year, month - 1, day, hours, minutes, seconds);
              const ticketTime = dateObject.getTime();

              console.log("working on " + ticketID)
              console.log(lsTime[i].getAttribute('title'));
              console.log(ticketTime);
              console.log("record:", todayTickets[ticketID])

              // old ticket and has read it today
              if (typeof todayTickets != "undefined" && ticketID in todayTickets && ticketTime < todayTickets[ticketID]) {
                console.log("highlight")
                ls[i].style.color = "red";
                ls[i].style.backgroundColor = "yellow";


              }




              if (bookmarkTickets.includes(ticketID)) {

                ls[i].style.color = "yellow";
                ls[i].style.backgroundColor = "red";

              }
              ls[i].target = "_blank";


              // check who is the last replier
              // Get the parent row of the selected element
              let parentRow = ls[i].closest("tr");

             

              console.log(txt(parentRow)); // Get the text content

              // // Get all <td> elements within the row
              let fields = parentRow.querySelectorAll("td");

              // // Access the third field using JavaScript indexing
              let thirdField = fields[4];
              
              console.log(thirdField); 

              console.log(txt(thirdField))


              if (txt(thirdField).toLowerCase().indexOf(myID.toLowerCase()) === -1) {
                thirdField.style.color = 'red'
                // Also set color on the <a> tag inside, if it exists
                const link = thirdField.querySelector('a');
                if (link) link.style.color = 'red';
              }

              // // Output or manipulate the third field
              console.log(txt(thirdField)); // Get the text content


            }
          }
        });
     // });
  
      var iframeDocument = iframeN.shadowRoot.querySelector('iframe').contentDocument || iframeN.shadowRoot.querySelector('iframe').contentWindow.document;

      // Get the body element of the iframe
      var iframeBody = iframeDocument.body;

      const iframeRect = iframeN.shadowRoot.getElementById('gsft_main').getBoundingClientRect();

      // Add an event listener to the iframe body
      iframeBody.addEventListener('click', function (ev) {
        // Your event handling code here

        let backgroundColor = window.getComputedStyle(ev.target).backgroundColor;
        console.log('background: ', backgroundColor);  // Outputs the background color, e.g., "rgb(255, 255, 0)" for yellow

        // if (backgroundColor === "rgba(0, 0, 0, 0)") {
        //   console.log('Click event occurred in the iframe body!');
        //   ev.target.style.backgroundColor = "yellow";
        //   ev.target.style.color = "red";

        // }

        console.log('id: ' + ev.target.id);
        console.log('class: ' + ev.target.className);
        console.log("nodename: " + ev.target.nodeName);
        //console.log(ev.target.innerHTML); // alarm
        console.log("selection: " + window.getSelection().toString());
        //if (backgroundColor === "rgb(255, 255, 255)" || backgroundColor === "rgba(255, 255, 255, 0.5)" || backgroundColor === "rgba(209, 210, 238, 0.5)" || backgroundColor === "rgb(209, 210, 238)") {
        if (backgroundColor === "rgba(0, 0, 0, 0)" || backgroundColor === "rgba(255, 255, 255, 0.5)" || backgroundColor === "rgba(209, 210, 238, 0.5)" || backgroundColor === "rgb(209, 210, 238)") {

          console.log("click in white area") 
          var clickX = iframeRect.left + ev.clientX;
          var clickY = ev.clientY;

          console.log(clickX, windowWidth)
          // Determine the click region within the row based on X position

          if (clickX > windowWidth * leftLinePositionListPage && clickX < windowWidth *rightLinePositionListPage) {
            console.log("left")
          

            if (!isValidURL(leftURL)) {
              alert("Please set value for variable leftURL in option page.");
            } else {
              chrome.runtime.sendMessage({ greeting: "Open " + leftURL + " in current tab" }, function (response) {
                console.log(response.farewell);
              });
            }
          } else if (clickX > windowWidth + rightLinePositionListPage) {
            console.log("right")
          
            if (!isValidURL(rightURL)) {
              alert("Please set value for variable rightURL in option page.");
            } else {
              chrome.runtime.sendMessage({ greeting: "Open " + rightURL + " in current tab" }, function (response) {
                console.log(response.farewell);
              });
            }
          
          } else if (ev.target.nodeName != 'A') { // not the link

            console.log("Need click to open ticket hiere", ev.target)

            let row = ev.target.closest("tr");
            if (!row) return; // Exit if not inside a row

            function getLinkFromRow(targetRow) {
              if (!targetRow) return null; // If no row, return null

              let secondColumn = targetRow.cells[2]; // Get the second column
              if (!secondColumn) return null; // If no second column, return null

              // secondColumn.style.color = "yellow";
              // secondColumn.style.backgroundColor = "red";

              let linkText = secondColumn.querySelector('a.linked.formlink')

              if (linkText) {
                console.log('link find', linkText)

                linkText.style.backgroundColor = "yellow";
                linkText.style.color = "red";
              }
              return secondColumn.querySelector("a"); // Return the link if found
            }

            // Try to get the link from the current row
            let link = getLinkFromRow(row);

            // If no link, check the previous row
            if (!link) {
              let previousRow = row.previousElementSibling; // Get the previous row
              link = getLinkFromRow(previousRow);
            }

            // Open the link in a new tab if found
            if (link) {
              console.log("Opening link:", link.href);
              window.open(link.href, "_blank");
            } else {
              console.log("No link found in the second column of the current or previous row.");
            }

          }

        } else if (ev.target.className.startsWith("container-fluid")) {

          // does not work some how
          //window.close();

          chrome.storage.local.remove('autoRun', function () {
            console.log("autoRun removed");
          });

          console.log('clost: ' + ev.target.id);
          chrome.runtime.sendMessage({ greeting: "closeTab" }, response => {
            if (response && response.farewell) {
              const activeTabId = response.farewell;
              console.log('Received active tab ID:', activeTabId);
            }
          });
        }
      });
    }
  } 
}

function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Don't need this for service-now, because the text field can be found by babel
function processButton0(newTabOpened, labelIndex, labelValuesPairs) {
  //console.log("timeout", new Date());
  if (!newTabOpened) {
    //if(labelIndex < labelValuesPairs.length){
    labelIndex++
    if (labelIndex === labelValuesPairs.length) return;

    // single letter hotkey command  
    if (labelValuesPairs[labelIndex].length == 1) {
      document.dispatchEvent(new KeyboardEvent('keyup', { 'key': labelValuesPairs[labelIndex] }));
    } else if (labelValuesPairs[labelIndex].startsWith("Click submitButton")) {

      chrome.storage.local.set({ [currentID + 'draft']: currentText }, function () {
                  console.log("draft saved!");
                });

      if (sureAboutFirstName && currentText.length != 0 && (!currentText.trimStart().startsWith(greeting.split(" ")[0]) || !currentText.trim().endsWith(myFirstName)) && currentURL.indexOf("service") != -1 && lastTarget.id === "activity-stream-comments-textarea") {
                  alert("Not starting with greeting, or signature not found in your message!")

                 // showAll();

                  return;
                }

      qsa(urlMap.get('submit'))[0].click();
    } else if (labelValuesPairs[labelIndex].startsWith("Click")) {
      clickEls(labelValuesPairs[labelIndex].split(' ')[1]);

    }  else if (labelValuesPairs[labelIndex].startsWith('Delay')) {
      const timestamp = Date.now(); // Current timestamp in milliseconds
      const dataWithTimestamp = { data: labelValuesPairs[labelIndex], timestamp: timestamp };
      chrome.storage.local.set({ 'delayKeyPressAfterReload': dataWithTimestamp }, function () {
        console.log("delay keypress saved");
      });
    } else {
      // For example: Service:High-Performance-Compute
      let labelValuesPair = labelValuesPairs[labelIndex].split(":")
      console.log('woring on', labelValuesPair[0].trim(), xpathMap.get(labelValuesPair[0].trim()), labelValuesPair[1].trim())
      //console.log('labelValuesPair[0]', xpathMap.get(labelValuesPair[0]))
      // select[name="incident.category"] 
      let xpaths = xpathMap.get(labelValuesPair[0].trim()).split(':')
      console.log('xpath:', xpaths)

      // this part is not called so far!!!
      if (xpaths[0].startsWith("button")) {
        newTabOpened = true;
        chrome.storage.local.set({ 'assignTicket': xpaths[2] + ":" + labelValuesPair[1].trim() }, function () {
          console.log("you saved:", xpaths[2] + ":" + labelValuesPair[1].trim(), new Date());
        });

        chrome.storage.local.set({ 'newTabOpened': 'yes' }, function () {
          console.log("saved1", new Date());
          document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0]).click();
          console.log("should open new here", labelIndex)
          //labelIndex++
        });
        // for example: // select[name="incident.category"] 
      } else if (xpaths[0].startsWith('select')) {

        //may have multiple possible values
        for (let t1 = 1; t1 < labelValuesPair.length; t1++) {
          var va = labelValuesPair[t1].trim()
          console.log("should seting", xpaths[0], " to value", va)

          // document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelectorAll(xpaths[0] + ' option').filter(function(index) { 
          //   //console.log('working on ', $(this).text());   
          //   if($(this).text() === va) console.log("find it")
          //   return $(this).text() === va; 
          // }).prop('selected', true);

          if (newFormat) {
            let o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(2)')
            console.log(2)
            if (o1 != null && o1.text === va) {
              console.log(2)
              o1.selected = "SELECTED"
            } else {
              o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(3)')
              console.log(3)
              if (o1 != null && o1.text === va) {
                console.log(3)
                o1.selected = "SELECTED"
              } else {
                o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(4)')
                console.log(4)
                if (o1 != null && o1.text === va) {
                  console.log(4)
                  o1.selected = "SELECTED"
                } else {
                  o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(5)')
                  console.log(5)
                  if (o1 != null && o1.text === va) {
                    console.log(5)
                    o1.selected = "SELECTED"
                  } else {
                    o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(6)')
                    console.log(6)
                    if (o1 != null && o1.text === va) {
                      console.log(6)
                      o1.selected = "SELECTED"
                    } else {
                      o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(7)')
                      console.log(7)
                      if (o1 != null && o1.text === va) {
                        console.log(7)
                        o1.selected = "SELECTED"
                      } else {
                        o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(8)')
                        console.log(8)
                        if (o1 != null && o1.text === va) {
                          console.log(8)
                          o1.selected = "SELECTED"
                        } else {
                          o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(9)')
                          console.log(9)
                          if (o1 != null && o1.text === va) {
                            console.log(9)
                            o1.selected = "SELECTED"
                          } else {
                            o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(10)')
                            // console.log(o1.text)
                            if (o1 != null && o1.text === va) {
                              console.log(6)
                              o1.selected = "SELECTED"
                            } else {
                              o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(11)')
                              //console.log(o1.text)
                              if (o1 != null && o1.text === va) {
                                console.log(6)
                                o1.selected = "SELECTED"
                              } else {
                                o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(12)')
                                //console.log(o1.text)
                                if (o1 != null && o1.text === va) {
                                  console.log(6)
                                  o1.selected = "SELECTED"
                                } else {
                                  o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(13)')
                                  // console.log(o1.text)
                                  if (o1 != null && o1.text === va) {
                                    console.log(6)
                                    o1.selected = "SELECTED"
                                  } else {
                                    o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(14)')
                                    //console.log(o1.text)
                                    if (o1 != null && o1.text === va) {
                                      console.log(6)
                                      o1.selected = "SELECTED"
                                    } else {
                                      o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(15)')
                                      // console.log(o1.text)
                                      if (o1 != null && o1.text === va) {
                                        console.log(6)
                                        o1.selected = "SELECTED"
                                      } else {
                                        o1 = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0] + ' option:nth-child(16)')
                                        // console.log(o1.text)
                                        if (o1 != null && o1.text === va) {
                                          console.log(6)
                                          o1.selected = "SELECTED"
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          } else {
            [...qsa(xpaths[0] + ' option')]
              .filter((opt) => {
                //console.log('working on ', txt(opt));
                if (txt(opt) === va) console.log("find it")
                return txt(opt) === va;
              })
              .forEach((opt) => { opt.selected = true; });
          }
        }
        // xpaths[0] = xpaths[0].split('"')[1]; 
        if (newFormat)
          document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0]).dispatchEvent(new Event('change'))
        else
          qsa(xpaths[0])[0].dispatchEvent(new Event('change'))
      } else if (xpaths[0].startsWith('textarea')) {
        var va = labelValuesPair[1]
        console.log('setting textarea to ', va)

        if (newFormat) {
          document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0]).value = va
        } else {
          qsa(xpaths[0])[0].value = va
        }

        // input[name="sys_display.incident.u_service_offering"]:button[name="lookup.incident.u_service_offering"]:service_list 
      } else if (xpaths[0].startsWith('input')) {
        console.log('input', xpaths[0].split('"')[1]);
        let originalValue = null
        if (newFormat)

          originalValue = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[0]).value;
        else
          originalValue = val(xpaths[0]);


        console.log('original value', originalValue);


        if (originalValue != null && originalValue.length > 0 && labelValuesPair[0].trim() != "Assignment group" || labelValuesPair[0] === "On hold expiration date") {
          var va = labelValuesPair[1]
          
          if (va.endsWith('week') || va.endsWith('weeks')){
            function addWeeks(date, weeks) {
              let newDate = new Date(date);
              newDate.setDate(newDate.getDate() + weeks * 7);
              return newDate;
            }

            function formatDate(date) {
              // Extract the date components
              let day = date.getDate();
              let month = date.getMonth() + 1; // Months are zero-based
              let year = date.getFullYear();

              // Add leading zeros if necessary
              if (month < 10) month = '0' + month;
              if (day < 10) day = '0' + day;

              return `${month}-${day}-${year}`;
            }          
            let today = new Date();
            va = formatDate(addWeeks(today, va.replace(/weeks/, "").replace(/week/, "")));

          }
          console.log('new date', va);
          setVal(xpaths[0], va);
          //$(xpaths[0]).val('02-02-2025');
          qsa(xpaths[0]).forEach((el) => el.dispatchEvent(new Event('change', { bubbles: true })));
          qs(xpaths[0])?.focus();
          //$(xpaths[0]).dispatchEvent(new Event('change'))
          //$(xpaths[0]).dispatchEvent(new Event('focus'))   
        } else if (xpaths.length == 3 && xpaths[1].startsWith('button')) {
          newTabOpened = true;
          //urlKeyword  : value to set to
          chrome.storage.local.set({ 'assignTicket': xpaths[2] + ":" + labelValuesPair[1].trim() }, function () {
            console.log("you saved:", xpaths[2] + ":" + labelValuesPair[1].trim(), new Date());
          });

          chrome.storage.local.set({ 'newTabOpened': 'yes' }, function () {
            console.log("saved1", new Date());
            if (newFormat)
              document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(xpaths[1]).click();
            else
              qsa(xpaths[1])[0].click();

            console.log("should open new here", labelIndex)
          });
        }
      }
    }
  } else {
    console.log("checking status")
    chrome.storage.local.get(['newTabOpened'], function (result) {
      console.log("checking returned:")
      if (result.newTabOpened != undefined && result.newTabOpened == "no") {
        newTabOpened = false
      }
    })
  }

  // if the next one is single letter, wait for 2 seconds
  if (labelIndex + 1 < labelValuesPairs.length && labelValuesPairs[labelIndex + 1].length == 1) {
    setTimeout(() => {
      processButton(newTabOpened, labelIndex, labelValuesPairs)
    }, 1000);
  } else {
    setTimeout(() => {
      processButton(newTabOpened, labelIndex, labelValuesPairs)
    }, 500);
  }
}

function processButton(newTabOpened, labelIndex, labelValuesPairs) {
  console.log("processButton", labelIndex, labelValuesPairs[labelIndex], newTabOpened, new Date());

  if (labelIndex > -1 ) tmpAlert(labelIndex + " : " + labelValuesPairs[labelIndex], 1000);
  
  //console.log("timeout", new Date());
  if (!newTabOpened) {
    //if(labelIndex < labelValuesPairs.length){
    labelIndex++
    if (labelIndex === labelValuesPairs.length) return;

    // single letter hotkey command  
    if (labelValuesPairs[labelIndex].length == 1) {
      document.dispatchEvent(new KeyboardEvent('keyup', { 'key': labelValuesPairs[labelIndex] }));

    // submit button  
    } else if (labelValuesPairs[labelIndex].startsWith("Click submitButton")) {

      chrome.storage.local.set({ [currentID + 'draft']: currentText }, function () {
                  console.log("draft saved!");
                });

      if (currentText.length != 0 && (!currentText.trimStart().startsWith(greeting.split(" ")[0]) || !currentText.trim().endsWith(myFirstName)) && currentURL.indexOf("service") != -1 && lastTarget.id === "activity-stream-comments-textarea") {
                  alert("Not starting with greeting, or signature not found in your message!")

                 // showAll();

                  return;
                }

      qsa(urlMap.get('submit'))[0].click();

    // click button with id  
    } else if (labelValuesPairs[labelIndex].startsWith("Click")) {
      clickEls(labelValuesPairs[labelIndex].split(' ')[1]);

    // delay keypress after reload  
    }  else if (labelValuesPairs[labelIndex].startsWith('Delay')) {
      const timestamp = Date.now(); // Current timestamp in milliseconds
      const dataWithTimestamp = { data: labelValuesPairs[labelIndex], timestamp: timestamp };
      chrome.storage.local.set({ 'delayKeyPressAfterReload': dataWithTimestamp }, function () {
        console.log("delay keypress saved");
      });


   
   // input, select, textarea, button, etc.
    } else {
      // For example: Service:High-Performance-Compute
      let labelValuesPair = labelValuesPairs[labelIndex].split(":")
    
      const labels = Array.from(document.querySelectorAll('label'));
      const label = labels.find(el => el.textContent.trim() === labelValuesPair[0].trim());

      let element = null; let button = null;
      // Step 2: Use the 'for' attribute to find the associated input field
      if (label) {
        let inputId = label.getAttribute('for');

        if(labelValuesPair[0].trim().startsWith("Additional comments"))   
          inputId = "activity-stream-comments-textarea"
        if(labelValuesPair[0].trim().startsWith("Work notes")) 
          inputId = "activity-stream-work_notes-textarea"
        
        console.log('labelValuesPair[0]', labelValuesPair[0].trim(), 'inputId:', inputId);
        element = document.getElementById(inputId);      
       
       
        // Step 3: The button has an id of "lookup." + inputId
        const buttonId = 'lookup.' + inputId.replace("sys_display.", "");
        button = document.getElementById(buttonId);

        if (button) {
          console.log('Button found:', button);
          // If the button is found, click it
          newTabOpened = true;
          //urlKeyword  : value to set to          // or group list or other list
          chrome.storage.local.set({ 'assignTicket': '_list' + ":" + labelValuesPair[1].trim() }, function () {
            console.log("you saved:", '_list' + ":" + labelValuesPair[1].trim(), new Date());
          });

          chrome.storage.local.set({ 'newTabOpened': 'yes' }, function () {
            console.log("saved1", new Date());
            
            button.click();

          });
          
          
          
        } else {
          console.log('Button not found for id:', buttonId);

          if (element) {
            console.log('Input element found:', element);

            let va = labelValuesPair[1].trim();
            if(element.tagName.toLowerCase() === 'input') {


              let originalValue = element.value;

              console.log('original value', originalValue);

              
              if (originalValue != null && originalValue.length > 0 && labelValuesPair[0].trim() != "Assignment group" || labelValuesPair[0] === "On hold expiration date") {
                
        
                if (va.endsWith('week') || va.endsWith('weeks')){
                  function addWeeks(date, weeks) {
                    let newDate = new Date(date);
                    newDate.setDate(newDate.getDate() + weeks * 7);
                    return newDate;
                  }

                  function formatDate(date) {
                    // Extract the date components
                    let day = date.getDate();
                    let month = date.getMonth() + 1; // Months are zero-based
                    let year = date.getFullYear();

                    // Add leading zeros if necessary
                    if (month < 10) month = '0' + month;
                    if (day < 10) day = '0' + day;

                    return `${month}-${day}-${year}`;
                  }          
                  let today = new Date();
                  va = formatDate(addWeeks(today, va.replace(/weeks/, "").replace(/week/, "")));

                }
                console.log('new date', va);
              }  
                
              
                //if (shortcutMap.has(va)) va = 'Hi, ' + firstName + '\n' + shortcutMap.get(va).replace('myFirstName', myFirstName); // Replace placeholders with actual values
                console.log('setting input to ', '.'+va+'.')

                element.value = va; //.replace('firstName', firstName).replace('myFirstName', myFirstName); // Trim whitespace from the value
                //$(xpaths[0]).val('02-02-2025');
                //element.trigger('change');
             
                // not sure if this works
                element.dispatchEvent(new Event('change')); // Trigger change event
              
            } else if (element.tagName.toLowerCase() === 'select') {
              // If it's a select field, set its value
              const options = element.querySelectorAll('option');
              options.forEach(option => {
                if (option.textContent.trim() === labelValuesPair[1].trim()) {
                  option.selected = true;
                }
              });
              element.dispatchEvent(new Event('change')); // Trigger change event
            } else if (element.tagName.toLowerCase() === 'textarea') {
              

              if (shortcutMap.has(va)) va = greeting + ',\n' + shortcutMap.get(va).replace('myFirstName', myFirstName); // Replace placeholders with actual values
              console.log('setting textarea to ', '.'+va+'.')

              element.value = va;
              element.dispatchEvent(new Event('input')); // Trigger input event
            }      
          }

        }
      }
    }
  } else {
    console.log("checking status")
    chrome.storage.local.get(['newTabOpened'], function (result) {
      console.log("checking returned:")
      if (result.newTabOpened != undefined && result.newTabOpened == "no") {
        newTabOpened = false
      }
    })
  }

  // if the next one is single letter, wait for 2 seconds
  if (labelIndex + 1< labelValuesPairs.length && labelValuesPairs[labelIndex + 1].length == 1) {
    setTimeout(() => {
      processButton(newTabOpened, labelIndex, labelValuesPairs)
    }, 800);
  // } else if (labelIndex < labelValuesPairs.length && labelValuesPairs[labelIndex + 1].startsWith("Delay"))  {
  //   // need the new page to load before next keypress, so wait for 5 seconds
  //   setTimeout(() => {
  //     processButton(newTabOpened, labelIndex, labelValuesPairs)
  //   }, 5000);
  } else {
    setTimeout(() => {
      processButton(newTabOpened, labelIndex, labelValuesPairs)
    }, 500);
  }
}

function checkMonth(index, rs, fileName, r) {
  // current month: 
  let currentDate = qsa('.monthAndYear-180')[0].firstChild.textContent
  console.log("current date", currentDate, 'looking for', r.date)
  let month = currentDate.split(/\s+/)[0]
  let year = currentDate.split(/\s+/)[1]
  console.log('month', month, 'year', year)

  if (r.date.indexOf(month) != -1) {

    setTimeout(() => {
      //                         Thursday, September 01, 2022
      let day = r.date.split(', ')[1].split(/\s+/)[1].replace(/^0+/, '');
      console.log("looking for ", day)
      let findFirstDay = false;
      // schedule in outlook calendar: 
      cells = qsa('tbody tr td');
      for (let i = 0; i < cells.length; i++) {
        console.log(i, cells[i].className, cells[i].textContent)
        if (cells[i].textContent === '1') {
          findFirstDay = true;
        }
        if (findFirstDay && cells[i].textContent === day) {
          console.log('find it', day)
          cells[i].click()
          break;
        }
      }
      //return; 
      setTimeout(() => {
        // new event
        qsa('.flexContainer-158')[4].click()
        setTimeout(() => {
          //qsa('#TextField346')[0].value = r.topic; 
          qsa('.ms-TextField-field')[1].value = r.topic

          // click from time button
          qsa('.ms-Button.kIT8h.ms-Button--icon.ms-ComboBox-CaretDown-button')[0].click()
          setTimeout(() => {
            let ops = qsa('.ms-Button.ms-Button--action.ms-Button--command.ms-ComboBox-option');
            for (let i = 0; i < ops.length; i++) {
              console.log(i)
              console.log(ops[i].firstChild.innerText, r.timeFrom)
              if (ops[i].firstChild.innerText === r.timeFrom) {
                ops[i].click();
                break;
              }
            }
            // click to time button
            qsa('.ms-Button.kIT8h.ms-Button--icon.ms-ComboBox-CaretDown-button')[1].click()
            setTimeout(() => {
              let ops = qsa('.ms-Button.ms-Button--action.ms-Button--command.ms-ComboBox-option');
              for (let i = 0; i < ops.length; i++) {
                console.log(i)
                console.log(ops[i].firstChild.innerText, r.timeTo)
                if (ops[i].firstChild.innerText === r.timeTo) {
                  ops[i].click();
                  break;
                }
              }
              qsa('#innerRibbonContainer div:nth-child(4) button')[1].click() // zoom
              setTimeout(() => {
                //qsa('.root-564')[0].click()  // add zoom meeting
                qsa('.ms-FocusZone li button')[0].click()


                setTimeout(() => {
                  let meetingID = qsa('tbody')[1].textContent.split('?pwd')[0].split('j/')[1]
                  let zoomlink = 'https://xy.zoom.us/j/' + meetingID // todo: this is not right, need double check this url

                  let zoomEditLink = "Open https://zoom.us/meeting/" + meetingID

                  console.log("zoom", zoomlink)

                  // save event: 
                  qsa('.ms-Button.ms-Button--action.ms-Button--command')[1].click()

                  chrome.storage.local.get(['calResults'], function (result) {
                    console.log("adding candi to cal table", result)
                    let re = result.calResults;
                    let candi = re + r.subject + " " + r.date + " " + r.timeFrom + " " + r.timeTo + " " + r.who + " " + zoomlink + " " + zoomEditLink;
                    setTimeout(() => {
                      chrome.storage.local.set({ 'calResults': candi + "\n" }, function () {
                        console.log("cal saved");
                      });
                    }, 500);

                  })

                  setTimeout(() => {
                    processCalendarRow(index, rs, fileName)

                  }, 5000); // wait current row to finish
                }, 5000); //wait for zoom meeting to set up
              }, 500);  // wait for zoom menu to set up
            }, 1000);   // timeTo to set up
          }, 1000);        // time From to set up

          //qsa('.ms-ComboBox-Input.fpig1.css-592')[0].value = r.timeFrom 
          // qsa('.ms-ComboBox-container')[0].firstChild.firstChild.value = r.timeFrom; 

          // qsa('.ms-ComboBox-container')[0].firstChild.firstChild.dispatchEvent(new Event("change"));
          // //qsa('.ms-ComboBox-Input.fpig1.css-592')[1].value = r.timeTo
          // qsa('.ms-ComboBox-container')[1].firstChild.firstChild.value = r.timeTo; 
          // qsa('.ms-ComboBox-container')[0].firstChild.firstChild


        }, 4000);  // wait for new event
      }, 2000); // wait for day
    }, 500);  // wait for next month
  } else {
    console.log("click next month");
    qsa('.headerIconButton-182')[1].click()
    setTimeout(() => {
      checkMonth(index, rs, fileName, r)
    }, 1000);
  }
}

function processCalendarRow(index, rs, fileName) {
  console.log("processRow:", index)

  index++; //index++; 
  if (index != rs.length) {
    console.log('All done. Trying save results.', fileName)
    chrome.runtime.sendMessage({ greeting: "saveCal " + fileName }, function (response) {
      console.log(response.farewell);
    });
    return;
  }

  let r = rs[index]



  console.log("working on ", r.subject, 'date', r.date);
  //fill outlook calendar
  // click today

  qsa('.ms-Button.ms-Button--default.Ca7_4.root-209')[0].click()

  setTimeout(() => {
    checkMonth(index, rs, fileName, r)
  }, 1000);

}
function processPrimerRow(newTabOpened, index, rs, hotkey, fileName) {
  console.log("processRow:", index)
  if (!newTabOpened) {
    newTabOpened = true;
    index++
    if (index == rs.length) {
      console.log('trying save primer')
      chrome.runtime.sendMessage({ greeting: "savePrimer " + fileName }, function (response) {
        console.log(response.farewell);
      });
      return;
    }

    let r = rs[index]

    chrome.storage.local.get(['primerResults'], function (result) {
      console.log("adding candi to primer table", result)
      let re = result.primerResults;
      let candi = re + r.seq + " " + r.PRIMER5_START + " " + r.PRIMER5_END + " " + r.PRIMER3_START + " " + r.PRIMER3_END
      setTimeout(() => {
        chrome.storage.local.set({ 'primerResults': candi + "\n" }, function () {
          console.log("primers saved");
        });
      }, 500);

    })

    document.getElementById('seq').value = r.seq
    document.getElementById('PRIMER5_START').value = r.PRIMER5_START
    document.getElementById('PRIMER5_END').value = r.PRIMER5_END
    document.getElementById('PRIMER3_START').value = r.PRIMER3_START
    document.getElementById('PRIMER3_END').value = r.PRIMER3_END

    chrome.storage.local.set({ 'newTabOpened': 'yes' }, function () {
      console.log("saved1", new Date());
      //$("#" + iFrameID).contents().find(xpaths[1]).click();
      console.log("should open new here", index)
      document.dispatchEvent(new KeyboardEvent('keyup', { 'key': hotkey }));
    });


  } else {
    console.log("checking to see tab finished for", index)
    chrome.storage.local.get(['newTabOpened'], function (result) {
      console.log("checking returned:")
      if (result.newTabOpened != undefined && result.newTabOpened == "no") {
        newTabOpened = false;
      }
    })
  }
  setTimeout(() => {
    processPrimerRow(newTabOpened, index, rs, hotkey, fileName)

  }, 5000);
}

function remvoveHintWindow() {
  // Check if an existing alert is present and remove it
  var existingAlert = document.getElementById('tempAlertDiv1');
  if (existingAlert) {
    existingAlert.parentNode.removeChild(existingAlert);
  }
}

function hintWindow(msg) {
  var el = document.createElement("div");
  el.setAttribute("id", "tempAlertDiv1");
  el.setAttribute("data-bw-ui", ""); // white-on-black; the dark theme (dark.css) must not touch it

  //el.style.cssText = "position:fixed;top:20%;left:30%;background-color:black;padding:10px;color:white;border-radius:5px;font-size:12pt;z-index: 1000;";

  //el.style.cssText = "background-color:black;padding:10px;color:white;border-radius:5px;font-size:12pt;z-index: 1000;";

  el.style.cssText = `
    position: fixed;
    background: black !important;
    color: white !important;
    padding: 10px;
    border-radius: 5px;
    font-size: 12pt;
    white-space: pre-wrap;
    pointer-events: none;
    z-index: 1000;
`;

  el.textContent = msg; // Render as text to avoid DOM injection

  // Position the hint window near the mouse cursor
  const marginx = - 60;
  const marginy = -20;
  let x = mouseX + marginx;
  let y = mouseY - el.offsetHeight - marginy; 

  // if outside of viewport, adjust position
  if (x + el.offsetWidth > window.innerWidth) {
    x = window.innerWidth - el.offsetWidth - marginx;
  }
  if (y < 0) {
    y = mouseY + marginy; // Position below the cursor if above is out of viewport
  }

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
}

// ---- sending to the configured chat session --------------------------------
// Nine hot keys hand a prompt to chatgptURL. The receiving content script
// does not just pre-fill the composer, it clicks send, so pressing the key is
// the only action between a ticket and a third party's servers. Everything else
// in this extension stays on the machine (the RAG index and classification run
// locally in the offscreen document), which makes this the one path that has to
// ask first -- both because it is the honest thing to do and because Chrome Web
// Store review treats undisclosed transmission of user content as a violation.
//
// Every caller goes through here so there is exactly one place consent can be
// granted, and no way to add a tenth hot key that quietly skips it.

/**
 * Host of a chat destination, for display. Falls back to the raw value.
 *
 * Takes the url rather than reading chatgptURL, because there is more than
 * one destination now and the consent record is keyed by host -- approving the
 * sandbox must not speak for chatgpt.com, or the other way round.
 */
function chatSessionHost(url) {
  const target = url || chatgptURL;
  try {
    return new URL(target).host;
  } catch (e) {
    return target;
  }
}

// Per-host "stop asking me" answers, keyed by the chat session's hostname so
// approving chatgpt.com never speaks for claude.ai. A Variables row
// `disableChatAutoApprove` set to 1 overrides every stored answer and forces the
// dialog back -- the same escape hatch `disableHiding` gives the hide feature.
const CHAT_AUTO_APPROVE_KEY = 'chatSendAutoApprove';

/** True when this host has been pre-approved and the override is not set. */
async function chatSendPreApproved(host) {
  const off = urlMap.get('disableChatAutoApprove');
  if (off && String(off).trim().endsWith('1')) return false;
  const stored = await getFromStorage(CHAT_AUTO_APPROVE_KEY);
  return Boolean(stored && stored[host]);
}

function rememberChatSendApproval(host) {
  chrome.storage.local.get([CHAT_AUTO_APPROVE_KEY], function (result) {
    const next = Object.assign({}, result[CHAT_AUTO_APPROVE_KEY] || {});
    next[host] = true;
    chrome.storage.local.set({ [CHAT_AUTO_APPROVE_KEY]: next });
  });
}

/**
 * Confirmation naming the destination and showing what will be sent.
 *
 * A real dialog rather than window.confirm, because confirm() cannot carry the
 * "do not ask again" checkbox -- which is why this resolves a promise instead of
 * returning a boolean. Everything that came off the page goes in as textContent.
 */
function confirmSendToChatSession(promptText, url) {
  const text = promptText == null ? '' : String(promptText);
  const LIMIT = 700;
  const preview = text.length > LIMIT
    ? text.slice(0, LIMIT) + '\n\n... and ' + (text.length - LIMIT) + ' more characters'
    : text;
  const host = chatSessionHost(url);

  return new Promise((resolve) => {
    const previous = document.getElementById('betterWebSendConfirm');
    if (previous) previous.remove();

    const overlay = document.createElement('div');
    overlay.id = 'betterWebSendConfirm';
    overlay.setAttribute('data-bw-ui', '');
    overlay.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;background:rgba(0,0,0,0.55) !important;' +
      'z-index:2147483647;display:flex;align-items:center;justify-content:center;';

    const box = document.createElement('div');
    box.style.cssText =
      'background:#ffffff !important;color:#111111 !important;border-radius:8px;padding:18px 20px;' +
      'max-width:640px;width:80%;max-height:80vh;overflow:auto;box-shadow:0 8px 40px rgba(0,0,0,0.5);' +
      'font-family:Calibri, Arial, Helvetica, sans-serif;font-size:12pt;text-align:left;';

    const title = document.createElement('div');
    title.style.cssText = 'font-size:14pt;font-weight:600;margin-bottom:8px;color:#111111 !important;';
    title.textContent = 'Send this to ' + host + '?';

    const warn = document.createElement('div');
    warn.style.cssText = 'margin-bottom:10px;color:#8d2803 !important;';
    warn.textContent = 'This text leaves your computer and is submitted to that site automatically.';

    const body = document.createElement('pre');
    body.style.cssText =
      'background:#f5f5f5 !important;color:#111111 !important;border:1px solid #ddd;border-radius:5px;' +
      'padding:8px;max-height:40vh;overflow:auto;white-space:pre-wrap;word-break:break-word;' +
      'font:12px/1.4 ui-monospace, Menlo, monospace;margin:0 0 12px;';
    body.textContent = preview;

    const remember = document.createElement('label');
    remember.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:14px;color:#111111 !important;';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'betterWebSendConfirmRemember';
    checkbox.style.cssText = 'width:16px;height:16px;';
    const rememberText = document.createElement('span');
    rememberText.textContent = 'Do not ask again for ' + host + ' — send automatically from now on';
    remember.append(checkbox, rememberText);

    const buttons = document.createElement('div');
    buttons.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    cancel.style.cssText = 'padding:6px 14px;font:inherit;cursor:pointer;';
    const send = document.createElement('button');
    send.type = 'button';
    send.textContent = 'Send';
    send.style.cssText = 'padding:6px 14px;font:inherit;cursor:pointer;font-weight:600;';
    buttons.append(cancel, send);

    box.append(title, warn, body, remember, buttons);
    overlay.appendChild(box);

    let settled = false;
    function close(approved) {
      if (settled) return;
      settled = true;
      // Only record the answer the checkbox was attached to: ticking it and then
      // cancelling must not pre-approve anything.
      if (approved && checkbox.checked) rememberChatSendApproval(host);
      document.removeEventListener('keydown', onKey, true);
      chatConfirmOpen = false;
      overlay.remove();
      resolve(approved);
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); }
      // Enter confirms, but not while the checkbox has focus -- there space and
      // enter are how you toggle it.
      else if (e.key === 'Enter' && e.target !== checkbox) { e.preventDefault(); e.stopPropagation(); close(true); }
    }

    cancel.addEventListener('click', () => close(false));
    send.addEventListener('click', () => close(true));
    // A click on the backdrop is a cancel: the safe answer for a dialog that
    // sends data off the machine.
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', onKey, true);

    // Suppresses the hot-key handler, which is a capture listener on the
    // document and would otherwise read every keystroke typed at this dialog.
    chatConfirmOpen = true;
    document.body.appendChild(overlay);
    send.focus();
  });
}

/**
 * Ask, then hand the prompt to the chat session tab.
 * Returns false if the user declined, so callers can skip follow-up work.
 */
/**
 * The elements holding a chat answer, newest last.
 *
 * `.w-full.text-token-text-primary` is chatgpt.com's own class pair and matches
 * nothing anywhere else. That was fatal rather than merely useless: the caller
 * read .innerText off the last match, so on any other host it threw a TypeError
 * inside the MutationObserver callback and everything after it -- including the
 * thumbs-up button -- never ran.
 *
 * A host whose markup is not chatgpt's sets a Variables row named
 * `answerSelector` to whatever wraps one answer there. Returns an empty list
 * rather than throwing when nothing matches yet, which is also the normal state
 * before the first answer renders.
 */
let answerSelectorWarned = false;

/**
 * Selectors for the button that sends the composed question, most specific
 * first. Same story as the composer: chatgpt dropped data-testid="send-button",
 * leaving a plain submit button labelled "Send".
 *
 * aria-label comes before type="submit" because it says what the button *is*,
 * where a submit button is merely the only one of its kind in today's markup.
 */
function chatSendSelectors() {
  const configured = urlMap && urlMap.get ? urlMap.get('sendSelector') : '';
  const selectors = [];
  if (configured && String(configured).trim()) selectors.push(String(configured).trim());
  return selectors.concat([
    '[data-testid="send-button"]',   // older chatgpt, and the sandbox
    'button[aria-label="Send"]',     // chatgpt today
    'form button[type="submit"]',
    'button[type="submit"]',
  ]);
}

/**
 * The send button, if there is one that can actually be pressed.
 *
 * Disabled is skipped rather than clicked: chatgpt disables Send until the
 * composer's own state has the text, so a hit on a disabled button means the
 * fill has not landed yet and the retry should keep waiting instead of giving
 * up on a click that would do nothing.
 *
 * The named selectors above are only a fast path. Every id, data-testid and
 * aria-label in that list belongs to chatgpt, which has already renamed this
 * button twice; when the next rename lands, none of them matches and the
 * button is instead worked out from what it *is* at run time -- an enabled,
 * visible control in the composer's own form that has the shape of a send
 * button. See discoverSendButton.
 */
function findSendButton() {
  for (const sel of chatSendSelectors()) {
    let candidates = [];
    try {
      candidates = [...document.querySelectorAll(sel)];
    } catch (e) {
      console.log('sendSelector is not a valid CSS selector:', sel, e.message);
      continue;
    }
    const usable = candidates.find(b => !b.disabled && b.getAttribute('aria-disabled') !== 'true');
    if (usable) return usable;
  }
  return discoverSendButton();
}

/** The composer on this page, or null. Discovery is anchored on it. */
function findChatComposer() {
  for (const sel of chatComposerSelectors()) {
    try {
      const el = document.querySelector(sel);
      if (el) return el;
    } catch (e) {
      console.log('composerSelector is not a valid CSS selector:', sel, e.message);
    }
  }
  return null;
}

/** Enabled, rendered, and big enough to be a real control rather than a spacer. */
function isPressable(el) {
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none') return false;
  if (Number(style.opacity) === 0) return false;
  return true;
}

// Words that name this button whatever the markup calls it, and words that
// rule one out. The negative list carries more weight than the positive one:
// a composer row is full of enabled buttons -- attach, dictate, stop -- and
// pressing the wrong one is worse than finding nothing, because it uploads or
// starts recording instead of failing where you can see it.
const SEND_WORDS = /(^|[^a-z])(send|submit|ask)([^a-z]|$)/i;
const NOT_SEND_WORDS = /(stop|cancel|abort|attach|upload|file|image|photo|picture|camera|mic|voice|dictate|speech|record|audio|search|model|tool|setting|option|menu|close|dismiss|back|new\s*chat|share|copy|edit|regenerate|retry|scroll|sidebar|profile|account|login|log\s*in|sign|theme|help|feedback)/i;

let discoveredSendLogged = false;

/**
 * Work out which control sends, from structure rather than from a name.
 *
 * Scored rather than first-match, because no single signal holds on its own: a
 * send button is usually type=submit, usually inside the composer's form,
 * usually the last control in that row and usually to the right of the text --
 * and any given version of chatgpt ships one missing two of those. The
 * threshold is set high enough that "some enabled button on the page" never
 * clears it; returning null and logging what to configure is the better
 * failure, since a wrong click has side effects.
 */
function discoverSendButton() {
  const composer = findChatComposer();
  // The composer's form, or -- chatgpt's composer has not always been inside
  // one -- the nearest ancestor that also holds buttons.
  let scope = null;
  if (composer) {
    scope = composer.closest('form');
    if (!scope) {
      let node = composer.parentElement;
      for (let i = 0; i < 5 && node; i++) {
        if (node.querySelector('button, [role="button"], input[type="submit"]')) { scope = node; break; }
        node = node.parentElement;
      }
    }
  }

  const root = scope || document;
  const candidates = [...root.querySelectorAll('button, [role="button"], input[type="submit"], input[type="image"]')]
    .filter(isPressable);
  if (!candidates.length) return null;

  const composerRect = composer ? composer.getBoundingClientRect() : null;

  const scored = candidates.map((el, index) => {
    // Whatever the page says about this button, in whichever attribute it
    // happens to use this month. A renamed id like "composer-submit-button"
    // still reads as "submit" here without being listed anywhere.
    const named = [
      el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('data-testid'),
      el.getAttribute('name'), el.id, el.getAttribute('value')
    ].filter(Boolean).join(' ');
    const text = (el.innerText || el.textContent || '').trim();
    const shortText = text.length <= 24 ? text : '';

    let score = 0;
    if (NOT_SEND_WORDS.test(named + ' ' + shortText)) score -= 20;
    if (SEND_WORDS.test(named)) score += 6;
    if (shortText && SEND_WORDS.test(shortText)) score += 4;
    if (el.type === 'submit' || el.getAttribute('type') === 'submit') score += 5;
    if (scope && scope.contains(el)) score += 4;
    // The send control is the last one in the composer's row often enough to
    // be worth a nudge, and never more than that.
    if (index === candidates.length - 1) score += 2;
    // Icon-only: a lone svg and no text is what an arrow button looks like.
    if (!text && el.querySelector('svg')) score += 2;
    if (composerRect) {
      const rect = el.getBoundingClientRect();
      const sameRow = rect.top < composerRect.bottom + 40 && rect.bottom > composerRect.top - 40;
      if (sameRow && rect.left >= composerRect.left) score += 2;
    }
    return { el, score, named, shortText };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score < 8) return null;

  if (!discoveredSendLogged) {
    discoveredSendLogged = true;
    const label = (best.named + ' ' + best.shortText).trim();
    console.log('betterWeb: no known send selector matched, so the send button was identified at '
      + 'run time by shape (score ' + best.score + '):', best.el,
      label ? '-- labelled "' + label + '"' : '-- unlabelled');
  }
  return best.el;
}

/**
 * Press Enter in the composer: the last resort when no button can be found.
 *
 * This depends on no element identity at all -- it is how a person sends --
 * so it survives a rename that defeats both the selector list and discovery.
 * Tried only after the retries are exhausted, because on a host where Enter
 * inserts a newline instead it silently does nothing useful.
 */
function pressEnterToSend(composer) {
  if (!composer) return false;
  try {
    composer.focus();
    const init = {
      key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
      bubbles: true, cancelable: true, composed: true
    };
    composer.dispatchEvent(new KeyboardEvent('keydown', init));
    composer.dispatchEvent(new KeyboardEvent('keypress', init));
    composer.dispatchEvent(new KeyboardEvent('keyup', init));
    return true;
  } catch (e) {
    console.log('Enter fallback failed:', e.message);
    return false;
  }
}

/**
 * Selectors for the box a question is typed into, most specific first.
 *
 * chatgpt.com dropped id="prompt-textarea"; its composer is now an unnamed
 * ProseMirror div carrying data-composer-markdown. That id was the only thing
 * the old code looked for, and waitForElement polls forever, so the tab opened,
 * nothing filled, and nothing was logged. Host-specific ids and classes move,
 * so the list ends with the role the element plays, which does not.
 */
function chatComposerSelectors() {
  const configured = urlMap && urlMap.get ? urlMap.get('composerSelector') : '';
  const selectors = [];
  if (configured && String(configured).trim()) selectors.push(String(configured).trim());
  return selectors.concat([
    '#prompt-textarea',                        // older chatgpt, and the sandbox
    'div.ProseMirror[contenteditable="true"]', // chatgpt today
    '[data-composer-markdown]',
    '[contenteditable="true"][role="textbox"]',
    'form textarea',
  ]);
}

/**
 * Selectors to try, most specific first. The configured one wins, then
 * chatgpt's own classes, then the patterns most chat UIs use to mark an
 * assistant turn -- enough that a sandbox often works with no configuration.
 *
 * Nothing broader than these: a selector like [class*="message"] would match a
 * container wrapping the whole thread, and the "answer" sent as feedback would
 * be the entire conversation.
 */
function chatAnswerSelectors() {
  const configured = urlMap && urlMap.get ? urlMap.get('answerSelector') : '';
  const selectors = [];
  if (configured && String(configured).trim()) selectors.push(String(configured).trim());
  return selectors.concat([
    '.w-full.text-token-text-primary',            // chatgpt.com
    '[data-message-author-role="assistant"]',     // chatgpt's own data attribute
    // The sandbox: a chatgpt-like Tailwind UI, but its own classes -- note
    // text-text-primary, not chatgpt's text-token-text-primary, which is why
    // none of chatgpt's selectors reach it. message-content wraps exactly one
    // turn's rendered markdown, so .innerText off the last match is the answer
    // and nothing else.
    '.message-content',
    '.message.assistant',
    '.assistant-message',
    '.chat-message.assistant',
    '.message-assistant',
    '[class*="assistant"]',
  ]);
}

function chatAnswerElements() {
  const selectors = chatAnswerSelectors();

  for (const sel of selectors) {
    try {
      const els = document.querySelectorAll(sel);
      if (els.length) return els;
    } catch (e) {
      // A hand-typed selector can be invalid; say so once and try the next.
      if (!answerSelectorWarned) {
        answerSelectorWarned = true;
        console.log('answerSelector is not a valid CSS selector:', sel, e.message);
      }
    }
  }
  return [];
}

/**
 * Put text into a chat composer and leave the editor knowing about it.
 *
 * chatgpt.com's #prompt-textarea is a ProseMirror contenteditable, not a plain
 * box. It holds its own document model and watches the DOM to reconcile it back
 * to that model, so assigning innerText either gets reverted or leaves the
 * editor's state empty -- the text appears and the send button stays disabled,
 * or the message sends blank. Either way the question never arrives.
 *
 * execCommand('insertText') is deprecated but is still the one path that raises
 * beforeinput/input the way typing does, which is how the editor learns the
 * text. The synthetic paste is for editors that ignore execCommand, and the
 * innerText assignment stays as the last resort for a plain contenteditable.
 */
function fillComposer(el, text) {
  if (!el) return 'no element';

  // A real textarea (other hosts, and whatever chatgpt ships next) takes value.
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return 'value';
  }

  try {
    el.focus();
    // Select what is there so the insert replaces a stale draft instead of
    // appending to it.
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    if (document.execCommand('insertText', false, text) && (el.innerText || '').trim()) {
      return 'execCommand';
    }

    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    el.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData: dt, bubbles: true, cancelable: true
    }));
    if ((el.innerText || '').trim()) return 'paste';
  } catch (e) {
    console.log('composer fill failed, falling back to innerText:', e.message);
  }

  el.innerText = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return 'innerText';
}

/**
 * `url` picks the destination; it defaults to chatgptURL, which is what
 * every existing caller wants. "Ask sandbox to suggest" passes sandboxURL.
 */
async function sendToChatSession(promptText, url) {
  const target = url || chatgptURL;
  const host = chatSessionHost(target);
  if (await chatSendPreApproved(host)) {
    // Never silent: the point of the checkbox is to skip the prompt, not to
    // hide that the text left the machine.
    tmpAlert('Sent to ' + host + ' automatically (you chose not to be asked). '
      + 'Set Variables -> disableChatAutoApprove = 1 to be asked again.', 4000);
  } else if (!(await confirmSendToChatSession(promptText, target))) {
    tmpAlert('Not sent to ' + host + '.', 2000);
    return false;
  }
  chrome.storage.local.set({ 'askChatgpt': promptText }, function () {
    chrome.runtime.sendMessage(
      { greeting: 'Open ' + target + ' in new tab' },
      function (response) {
        if (chrome.runtime.lastError) {
          console.log('open chat tab:', chrome.runtime.lastError.message);
          return;
        }
        console.log(response && response.farewell);
      }
    );
  });
  return true;
}

// Callers build alert markup by concatenating a literal label with text that
// came off the page -- a ticket description, the last chat message. Assigning
// that straight to innerHTML let a crafted ticket inject markup into the host
// page. Parse it inert, then rebuild with a tag allowlist and no attributes at
// all, so "<img onerror=...>" and friends come through as text.
const ALERT_ALLOWED_TAGS = new Set(
  ['P', 'BR', 'DIV', 'SPAN', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'CODE', 'PRE']
);

function sanitizeAlertHtml(html) {
  // DOMParser does not run scripts or fetch subresources for the document it
  // builds, so nothing has executed by the time we inspect it.
  const parsed = new DOMParser().parseFromString(String(html), 'text/html');
  const out = document.createDocumentFragment();

  (function copy(from, to) {
    for (const node of Array.from(from.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        to.appendChild(document.createTextNode(node.nodeValue));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (ALERT_ALLOWED_TAGS.has(node.tagName)) {
          // createElement, not cloneNode: every attribute is dropped.
          const el = document.createElement(node.tagName.toLowerCase());
          copy(node, el);
          to.appendChild(el);
        } else {
          // Not allowed: keep whatever text it wrapped, discard the element.
          copy(node, to);
        }
      }
    }
  })(parsed.body, out);

  return out;
}

// ---- ticket metadata, as the ServiceNow form holds it --------------------
// The five fields an upload writes and a classification votes on. Read by
// label text rather than input id: the ids are generated and differ between
// the classic and the current form, while the label is what the page shows.
const TICKET_META_LABELS = ['Service', 'Ticket Type', 'Request Type', 'App/Hardware', 'Assignment group'];

/** The five fields' current values, keyed by label. Missing ones are absent. */
function readTicketMetaValues() {
  const labels = Array.from(document.querySelectorAll('label'));
  const values = {};
  for (const name of TICKET_META_LABELS) {
    const label = labels.find(el => el.textContent.trim() === name);
    if (!label) { console.log('Label not found for:', name); continue; }
    const element = document.getElementById(label.getAttribute('for'));
    if (!element) { console.log('Element not found for label:', name); continue; }
    values[name] = element.value;
  }
  return values;
}

/** "Service: x | Ticket Type: y | …" -> { service: 'x', … }, keys lowercased. */
function parseClassification(classification) {
  const out = {};
  String(classification || '').split('|').forEach(part => {
    const sep = part.indexOf(':');
    if (sep === -1) return;
    out[part.slice(0, sep).trim().toLowerCase()] = part.slice(sep + 1).trim();
  });
  return out;
}

// "N/A" from the classifier and an empty form field both mean "nothing here",
// so they must not read as a difference.
function normFieldValue(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase();
  return (s === 'n/a' || s === 'none' || s === '--none--') ? '' : s;
}

const ASSIGNMENT_FIELD = 'Assignment group';

/**
 * Same or different, judged on the assignment group alone.
 *
 * It is the field that actually routes the ticket, and the other four disagree
 * on wording often enough that comparing all five called nearly every ticket
 * different, which made the verdict worthless.
 */
function assignmentGroupVerdict(metaValues, predicted) {
  const current = metaValues[ASSIGNMENT_FIELD];
  const prediction = predicted[ASSIGNMENT_FIELD.toLowerCase()];
  const shown = (v) => (String(v == null ? '' : v).trim() || '(empty)');
  if (prediction === undefined) {
    return {
      comparable: false, same: false, current, prediction,
      text: '❓ No Assignment group in the classification result — nothing to compare.'
    };
  }
  const same = normFieldValue(current) === normFieldValue(prediction);
  return {
    comparable: true, same, current, prediction,
    text: same
      ? '✅ SAME assignment group: ' + shown(current)
      : '❌ DIFFERENT assignment group: current ' + shown(current)
        + ' vs predicted ' + shown(prediction)
  };
}

/** The ticket text classification and answering both retrieve on. */
function ticketConversationText() {
  return "User:\nShort description:\n" + val('textarea[name="incident.short_description"]')
    + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n";
}

/**
 * A random wait in milliseconds, between min and max inclusive.
 *
 * Used to space out the automated walk through a ticket queue: a fixed
 * interval makes the extension look like a script to ServiceNow and gives the
 * page no slack when a save is slow, so each hop waits a different amount.
 *
 * Arguments are ordered and floored defensively because the callers pass
 * literals that are easy to swap; a NaN here would become setTimeout(0) and
 * the pause -- the whole point of the call -- would silently disappear.
 */
function randomDelay(min, max) {
  let lo = Number(min);
  let hi = Number(max);
  if (!Number.isFinite(lo)) lo = 0;
  if (!Number.isFinite(hi)) hi = lo;
  if (hi < lo) { const t = lo; lo = hi; hi = t; }
  lo = Math.max(0, Math.floor(lo));
  hi = Math.max(lo, Math.floor(hi));
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function tmpAlert(msg, duration=1000, renderHtml=false) {
  // Check if an existing alert is present and remove it
  var existingAlert = document.getElementById('tempAlertDiv');
  if (existingAlert) {
    existingAlert.parentNode.removeChild(existingAlert);
  }

  // Create a new alert element
  var el = document.createElement("div");
  el.setAttribute("id", "tempAlertDiv"); // Set an ID to the alert element
  el.setAttribute("data-bw-ui", ""); // white-on-black; the dark theme (dark.css) must not touch it
  //el.setAttribute("style", "position:absolute;top:6%;left:20%;background-color:black;padding:10px;color:white;border-radius:5px;");

  // colour and background carry !important so no page or theme stylesheet can
  // reach them. An author rule with !important outranks a plain inline style,
  // which is how the dark theme kept turning this black-on-black; an inline
  // !important outranks the author rule in turn, so this ends the argument.
  // Capped and scrollable: this box is fixed at top:10% with no height of its
  // own, so anything longer than the viewport -- a full model answer, the
  // reference-ticket list -- ran off the bottom of the screen with no way to
  // reach it. Short messages are unaffected.
  el.style.cssText = "position:fixed;top:10%;left:10%;max-width:80vw;max-height:80vh;overflow:auto;background-color:black !important;padding:10px;color:white !important;border-radius:5px;font-size:12pt;z-index: 1000;";

  const inner = document.createElement('div');
  inner.style.cssText = 'font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: white !important; display: inline-block; white-space: pre-wrap; background-color: black !important; padding: 10px;';
  if (renderHtml) {
    inner.appendChild(sanitizeAlertHtml(msg));
  } else {
    inner.textContent = msg;
  }
  el.appendChild(inner);
              
  // Set a timeout to remove the alert after the specified duration
  setTimeout(function () {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }, duration);

  // Append the new alert element to the body
  document.body.appendChild(el);
}

function setupIncidentRowHoverHint(rootBody) {
  if (!rootBody || rootBody.dataset.betterWebRowHoverHintBound === 'true') return;

  rootBody.dataset.betterWebRowHoverHintBound = 'true';
  rootBody.addEventListener('mouseover', function (event) {
    const row = event.target.closest('tbody tr');
    if (!row || !row.querySelector('a.linked.formlink')) return;

    // Do not show the hint again when moving between cells in the same row.
    if (event.relatedTarget && row.contains(event.relatedTarget)) return;

    tmpAlert('Click anywhere in this row to open the record. After clicking, incident ID will change color for the day until someone else replies.', 2000);
  });
}

// Add loading spinner functions
function showLoadingSpinner(message = "Processing...") {
  // Remove any existing spinner
  hideLoadingSpinner();
  
  const spinner = document.createElement("div");
  spinner.setAttribute("id", "aiLoadingSpinner");
  spinner.setAttribute("data-bw-ui", ""); // white-on-black; the dark theme (dark.css) must not touch it
  spinner.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background-color:rgba(0,0,0,0.85) !important;padding:30px;color:white !important;border-radius:10px;font-size:14pt;z-index:10000;text-align:center;min-width:250px;box-shadow:0 4px 20px rgba(0,0,0,0.5);";
  
  const spinnerWrap = document.createElement('div');
  spinnerWrap.style.cssText = 'margin-bottom: 15px;';

  const spinnerCircle = document.createElement('div');
  spinnerCircle.className = 'spinner';
  spinnerCircle.style.cssText = 'border: 4px solid #f3f3f3;border-top: 4px solid #4CAF50;border-radius: 50%;width: 50px;height: 50px;animation: spin 1s linear infinite;margin: 0 auto;';
  spinnerWrap.appendChild(spinnerCircle);

  const messageEl = document.createElement('div');
  messageEl.style.cssText = 'font-family: Arial, sans-serif;';
  messageEl.textContent = message;

  spinner.appendChild(spinnerWrap);
  spinner.appendChild(messageEl);
  
  // Add CSS animation for spinner
  if (!document.getElementById('spinnerStyle')) {
    const style = document.createElement('style');
    style.id = 'spinnerStyle';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(spinner);
  return spinner;
}

function hideLoadingSpinner() {
  const spinner = document.getElementById('aiLoadingSpinner');
  if (spinner && spinner.parentNode) {
    spinner.parentNode.removeChild(spinner);
  }
}

function hasKeyWithPrefix(map, prefix) {
  for (let key of map.keys()) {
    if (key != prefix && key.startsWith(prefix)) {
      return true; // A matching key was found
    }
  }
  return false; // No matching key was found
}

function addHints(e){

  console.log('added a or more chrs', currentText.length - lastText.length)
  ///insertLength = currentText.length - lastText.length
  console.log("add hints for", "'" + currentText + "'", 'last word:', lastWord)
  hintIndex = 0;
  //find the last row of changed text
  if (lastWord.length != 0 && lastWord.length < 20) {
    console.log("working for", "'" + lastWord + "'")

    console.log("add hint for shortcut ####################################")
    for (let k of shortcutMap.keys()) {
      //console.log("checking shortcuts:", k)
      if (k.startsWith(lastWord)) {
        //console.log("Got it", k)
        hintIndex++;
        if (hintIndex === 20) break;
        //var chr = String.fromCharCode(64 + hintIndex);
        hintText.set(hintIndex, k.substring(lastWord.length, k.length));
        console.log("adding hint for", k);
        const badgeText = (shortcutCommentMap.get(k) || '') + (hintIndex === 1
          ? ' [' + hintIndex + ' or double tab key]'
          : ' [' + hintIndex + ']');
        const div = createHintBubble(
          lastWord,
          k.substring(lastWord.length, k.length),
          badgeText,
          { withBorder: hintIndex !== 1 }
        );
        div.className = "addedhere";
        
        if (editableDiv) {
          hintMsg = hintMsg + div.textContent + "\n";
          console.log("hint message:", hintMsg);
          hintWindow(hintMsg)
          //tmpAlert(hintMsg, 2000);
        } else {
          e.target.parentElement.append(div);
        }
        console.log('added hint for shortcuts');
      }
    }

    //hint for words
    //  console.log("hint for words", )
    //  for(let k of wordMap.keys()){
    //    //console.log("checking shortcuts:", k)
    //    if(k.startsWith(lastWord)) {  
    //      console.log("Got it",hintIndex,  k)
    //      hintIndex++; 
    //      if(hintIndex === 20) break;
    //      //var chr = String.fromCharCode(64 + hintIndex);
    //      hintText.set(hintIndex, k.substring(lastWord.length, k.length));  
    //      var div = document.createElement("div");

    //      // todo: add a button to delete the setence or shortcut
    //      div.innerHTML='<div style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0); display: inline-block; white-space: pre-wrap;">' + lastWord + '<span style="color: rgb(256, 94, 92);">' + k.substring(lastWord.length, k.length) + '<span id="textPredictionTabHint" style="width: 49px; height: 19px; border-radius: 2px; border-style: solid; border-width: 1px; border-color: rgb(96, 94, 92); white-space: nowrap; font-size: 0.7em; color: rgb(0, 0, 0); padding-left: 3px; padding-right: 3px; padding-top: 1px; margin-left: 4px; position: relative; top: -2px;">' + wordMap.get(k) + ' [' + hintIndex + ']' + '</span></span></div>';

    //      if(hintIndex == 1) { //} && currentURL.indexOf('live.com') == -1){ // hotmail tab key does not work
    //         div.innerHTML='<div style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0); display: inline-block; white-space: pre-wrap;">' + lastWord + '<span style="color: rgb(256, 94, 92);">' + k.substring(lastWord.length, k.length) + '<span id="textPredictionTabHint" style="width: 49px; height: 19px; border-radius: 2px; border-style: solid; border-width: 1px; border-color: rgb(96, 94, 92); white-space: nowrap; font-size: 0.7em; color: rgb(0, 0, 0); padding-left: 3px; padding-right: 3px; padding-top: 1px; margin-left: 4px; position: relative; top: -2px;">' + wordMap.get(k) + ' [' + hintIndex + ' or tab key]' + '</span></span></div>';
    //      }
    //      div.className = "addedhere";  
    //      if(editableDiv) {
    //        $(targetID1).append(div)
    //      } else {
    //        e.target.parentElement.append(div);
    //      }
    //    } 
    //  }
    // hint for words
  }

  if (lastSentence.length != 0 && lastSentence.length < 50){ //} && lastSentence[0] === lastSentence[0].toUpperCase()) {
    console.log("working for", "'" + lastSentence + "'")

    console.log("hint for sentence #####################################")
    for (let k of sentenceMap.keys()) {
      //console.log("checking:", k)
      if (k.startsWith(lastSentence)) {
        //hasSententHint = true; 
        //console.log("Got it", k)
        hintIndex++;
        if (hintIndex === 20) break;
        //var chr = String.fromCharCode(64 + hintIndex); //A-1, B-2
        hintText.set(hintIndex, k.substring(lastSentence.length, k.length));
        const div = createHintBubble(
          lastSentence,
          k.substring(lastSentence.length, k.length),
          hintIndex === 1 ? ' [' + String(hintIndex) + ' or double tab key]' : ' [' + String(hintIndex) + ']',
          { highlightId: 'addhere' + hintIndex }
        );

        div.className = "addedhere";
        div.id="addhere" + hintIndex; 
       if (editableDiv) {
          hintMsg = hintMsg + div.textContent + "\n";
          hintWindow(hintMsg)
          //tmpAlert(div.innerHTML, 2000);
        } else {
          e.target.parentElement.append(div);
        }
      }
    }
  }
}

function processInsert(e) {
  console.log("in function processInsert"); //, insertStart, insertLength, currentText.length, lastText.length, lastWord, lastSentence)
  if (insertLength != 0) {
    if (hintIndex > 0) {
      console.log("found expand, use hint text and clean up hintText")
      hintIndex = 0;
      hintText.clear();
      removeHints();
    }
  } else {
    //if(hintIndex > 0) { // comment out, because we need always find the instart start position
    console.log("Check if auto complete hint or choose 1 to 9 ####################################")
    //for(let i=0; i < Math.max(lastText.length, currentText.length); i++) { 
    //console.log("checking: ",i, "'" + lastText.substring(i,i+1) + "' '" + currentText.substring(i,i+1) + "'" )
    // if(lastText.substring(i,i+1) != currentText.substring(i,i+1)) {
    // insertStart = i; 
    let keyC = currentText.substring(insertStart, insertStart + 1).charCodeAt(0)
    console.log('key code is', keyC)
    var selectedIndex = 0;
    // if(keyC > 64 && keyC < 74 ) { // from A to I
    //   selectedIndex = keyC - 64; 
    //} else if 
    if (keyC > 48 && keyC < 58) { // from 1 to 9
      selectedIndex = keyC - 48;
    }
    // todo: make hint dispear when time is out
    if (selectedIndex > 0 && selectedIndex <= hintIndex ) { //} && (new Date().getTime()) - lastKeyTime < 4000) {
      //   return; ) {

      if (hintText.has(selectedIndex)) {
        lastTextWithoutInsert = currentText.substring(0, insertStart) + currentText.substring(insertStart + 1, currentText.length);  

        let h = lastWord.substring(0, lastWord.length - 1) + hintText.get(selectedIndex)
        console.log("directly use map for ", h)
        if (shortcutMap.has(h)) {
          h = shortcutMap.get(h).replace('myFirstName', myFirstName)
          insertLength = h.length + 1
          currentText = currentText.substring(0, insertStart - lastWord.length + 1) + h + " " + currentText.substring(insertStart + 1, currentText.length);
          insertStart = insertStart - lastWord.length + 1;
          updateInsertLength(insertLength)

        } else {
          currentText = currentText.substring(0, insertStart) + hintText.get(selectedIndex) + " " + currentText.substring(insertStart + 1, currentText.length);
          insertLength = hintText.get(selectedIndex).length + 1
          updateInsertLength(insertLength)
        }
        console.log("fultext: '" + currentText + "'")
      }
    }     
    if (hintIndex > 0) {
      hintIndex = 0;
      hintText.clear();
      removeHints();
    }
    if (insertLength == 0) {
      if ((currentText.length - lastText.length > 0 && currentText.length - lastText.length < 10)) {
        addHints(e)
      } else {
        if (hintIndex > 0) {
          hintIndex = 0;
          hintText.clear();
          removeHints();
        }
      }
    }
    
  }
  // set text for email or chatgpt
  if (editableDiv && insertLength > 0) {
    console.log('set up text for outlook. string length', currentText.length, 'cursor should at', insertStart, '+', insertLength)

    //gmail need this part
    //if(e.srcElement.getElementsByTagName('div')[0] == 'undefined') {
    if (currentURL.indexOf('mail.google.com') != -1 || currentURL.indexOf('chatgpt.com') != -1 || currentURL.indexOf('claude.ai') != -1) {
      const textHolder = document.createElement('div');
      textHolder.style.whiteSpace = 'pre';
      textHolder.innerText = currentText;
      e.srcElement.replaceChildren(textHolder);

    } else {

      e.srcElement.getElementsByTagName('div')[0].innerText = currentText;
    }

    console.log('after html:', e.srcElement.innerHTML)
    //let preText = currentText.substring(0, insertStart + insertLength)
    //console.log("pretext: '" + preText + "'")
    console.log("fultext: '" + currentText + "'")
    //let lines = preText.split(/\n/)

    //console.log("set position to", insertStart , '+', insertLength , 'for total length', currentText.length)

    // sencond parameter is paragh X 2, the third is the position in the paragraph
    let lines = currentText.split('\n');
    let total = 0, para = 0, posi = 0;
    for (let i = 0; i < lines.length; i++) {
      console.log('working on', "'" + lines[i] + "' total ", total, ' should less than', insertStart, insertLength)
      total += lines[i].length + 1
      if (total > insertStart + insertLength) {
        //console.log("got it") 
        posi = lines[i].length - (total - (insertStart + insertLength))
        break;
      } else {
        if (lines[i].length > 0) {
          //console.log('line is not empty') 
          para += 2;
        } else {
          para++;
        }
      }
    }
    console.log('set caret location for: para', para, 'posi', posi + 1)
    setCaret(e.srcElement.getElementsByTagName('div')[0], para, posi + 1);

    let ts = e.srcElement.children[1]
    while (ts != null) {
      console.log("working on1 ", ts.innerText, 'html', ts.innerHTML)
      e.srcElement.removeChild(ts)
      ts = e.srcElement.children[1]
    }


  } else if (!editableDiv && insertLength > 0) {


    e.target.value = currentText;

    console.log("should simulate enter") // so that the last row will show up 

    var evt = new Event('input', { bubbles: true, cancelable: true });
    //   textbox.dispatchEvent(inputEvent);

    e.target.dispatchEvent(evt);

    // Keep caret at end of inserted text instead of jumping to field end.
    if (typeof e.target.setSelectionRange === 'function') {
      let caretPos = insertStart + insertLength;
      if (caretPos < 0) caretPos = 0;
      if (caretPos > currentText.length) caretPos = currentText.length;
      e.target.setSelectionRange(caretPos, caretPos);
    }

  }

  lastTarget = e.target
  //lastTextWithoutInsert = lastText;
  lastInsertLength = insertLength > 0 ? insertLength : lastInsertLength;
  lastInsertStart = insertLength > 0 ? insertStart: lastInsertStart;
  console.log('current', currentText, 'last', lastText)
  
  console.log('added', currentText.length - lastText.length, 'at', insertStart, 'for', insertLength, 'current', e.key)

  // added clickable hyperlinks
  if (currentText.length - lastText.length > 10 && !editableDiv) {
    let t = currentText.substring(insertStart, currentText.length);
    let arr = t.split(/\n\s+|\s+|<|>|\)|\(/)
    for (let i = 0; i < arr.length; i++) {
      // console.log(i, arr[i])
      if (arr[i].endsWith(",") || arr[i].endsWith(".")) {
        arr[i] = arr[i].slice(0, -1);
      }
      if ((arr[i].startsWith("https://") || arr[i].startsWith("http://")) && !arr[i].endsWith("complianceline")) {
        appendSafeExternalLink(e.target.parentElement, arr[i]);
      }
    }
  }
  lastText = currentText;
  chatTarget = lastTarget;
  console.log("Done processInser #####################################################")
}

// control and editing key activity all included in this function
function setupKeyUpEventListerner(isIFrame) {
  console.log('try to set up keyup')

  var doc = document;
  if (isIFrame) {
    console.log("adding keyup for iframe")

    doc = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body

  }
  doc.addEventListener('keyup', function (e) {
    console.log("#####################################################")
    console.log("keyup event. key:", e.key, 'code:', e.keyCode);

    caretPosition = getCaretPosition(e.target)

    console.log('caret locaton: ', caretPosition)

    // The send-approval dialog owns the keyboard while it is open; this is a
    // capture listener, so nothing the dialog does could stop it on its own.
    if (chatConfirmOpen) return;

    if (e.key == 'ArrowLeft' || e.key == 'ArrowRight') return;
    if (e.key == 'ArrowUp' || e.key == 'ArrowDown') return;
    if (e.key == 'Shift' ) return;
    if (e.key == 'Alt') return;  // mac option key 
    if (e.keyCode == ctrlKey) { ctrlDown = false; return; }
    
    let timeoutLimit = 500 
    // tab clicked to add common hintText
    console.log("Working on backspace key. ################################################")
    console.log("caret position is", caretPosition, 'last insert start', lastInsertStart, 'last insert length', lastInsertLength)
    if (e.key === 'Backspace' && caretPosition == lastInsertStart + lastInsertLength - 1) { //} lastTextWithoutInsert != '') { 

      console.log("backspace key is clicked at the end of the last insert")
     // if (insertLength > 0) {
        console.log("backspace key is clicked, remove the last insert")
        // remove the last insert
        currentText = lastTextWithoutInsert; // "ttt"; //currentText.substring(0, insertStart) + currentText.substring(insertStart + insertLength, currentText.length);
        insertLength = 0;
        insertStart = lastInsertStart;
        //lastTextWithoutInsert = ''; //currentText;
        lastText = currentText; 
        e.target.value = currentText; //e.target.value.substring(0, insertStart) + e.target.value.substring(insertStart + insertLength, e.target.value.length);
        if (typeof e.target.setSelectionRange === 'function') {
          let caretPos = insertStart;
          if (caretPos < 0) caretPos = 0;
          if (caretPos > currentText.length) caretPos = currentText.length;
          e.target.setSelectionRange(caretPos, caretPos);
        }
      //}  
        return; 

      // if the first is tab, need setup timer to wait for the second tab
    
    } else if (e.key === 'Tab' && hintText.size === 1) {
      console.log("Working on tab keys. ################################################")
      e.target.value = currentText + hintText.get(1) + " "
      insertLength = hintText.get(1).length + 1
      updateInsertLength(insertLength)

      removeHints();
      hintText.clear();
      tmpHintOn = false;
      clearTimeout(cmdProcessTimeout) // cancel tab timer if exist
      return 
    } else if (e.key === 'Tab' && hintText.size > 1) {
      console.log("Working on tab keys. ################################################")
      //timeoutLimit = 500; 
      console.log("tab key is clicked")
      if ((new Date().getTime()) - lastTabTime < 500) {
        console.log('double tab, get the first hint item.')
        
        // short one is likely a shortcut 
        if (hintText.get(1).length > 10) { 
          e.target.value = currentText + hintText.get(1) + " " 
          currentText = currentText + hintText.get(1) + " "
          insertLength = hintText.get(1).length + 1
          updateInsertLength(insertLength)

        } else {
          e.target.value = currentText + hintText.get(1); // + " " 
          currentText = currentText + hintText.get(1)
          insertLength = hintText.get(1).length
          updateInsertLength(insertLength)
        }
       
        removeHints();
        hintText.clear();
        tmpHintOn = false;
        clearTimeout(cmdProcessTimeout) // cancel the first tab timer
        //timeoutLimit = 100; 
        return 

      } else {
        console.log('Single tab click, should do further processing')
      }
      lastTabTime = new Date().getTime();

      cmdProcessTimeout = setTimeout(() => {
        console.log("time is up")
      
        //if ((new Date().getTime()) - lastTabTime > 500) {
        if (tmpHintOn) {
          //removeHints();
          //tmpHintOn = false;

          tmpAlert("Please type according to the hint, or double tab to choose the first one.")
          
          // todo: need to do something here
          
          return; 

        } else {
          function checkIfAllStartWithSpace(inputMap) {
            // Iterate over the map values
            for (let value of inputMap.values()) {
              if (!value.startsWith(" ")) {
                return ''; // Return false if any value does not start with a space
              }
            }
            return ' '; // Return true if all values start with a space
          }

          function removeDuplicates(arr) {
            return [...new Set(arr)];
          }

          // need find common prefix and add it auto matically
          function findPartialConsensus(inputMap) {
            // Convert Map values to an array of sentences
            const sentences = Array.from(inputMap.values());

            if (sentences.length === 0) {
              console.log('sentences are empty')
              return "";
            }
            
            let leadingSpace = checkIfAllStartWithSpace(inputMap)

            
            // Split sentences into words
            const tokenized = sentences.map(sentence => sentence.split(" "));

            // Find the longest common prefix
            let prefix = [];
            for (let i = 0; i < tokenized[0].length; i++) {
              const currentWords = tokenized.map(tokens => tokens[i] || null); // Handle unequal lengths
              const uniqueWords = new Set(currentWords);

              if (uniqueWords.size > 1) {
                break; // Stop when words diverge
              }

              prefix.push(currentWords[0]); // Add common word to prefix
            }

            // If there is a prefix, return it as a string
            if (prefix.length > 0) {
              return leadingSpace + prefix.join(" ");
            } else {
              if (leadingSpace === ' ') return leadingSpace;
            }

            // // Otherwise, get the unique first letters ordered by frequency
            // const firstLetters = sentences
            //   .map(sentence => sentence[0]) // Get first character of each sentence
            // //.filter(letter => /^[a-zA-Z]$/.test(letter)); // Filter to ensure valid letters


            // Otherwise, get the unique first words ordered by frequency
            const firstWords = sentences
              .map(sentence => sentence.split(" ")[0] + ' ' + sentence.split(" ")[1]) // Get first word of each sentence
              .filter(word => word); // Filter out empty or undefined words

            // const frequencyMap = new Map();

            // // Calculate frequencies of each word
            // for (const word of firstWords) {
            //   frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
            // }

            // // Sort words by frequency (high to low), and alphabetically for ties
            // const sortedWords = Array.from(frequencyMap.entries())
            //   .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            //   .map(entry => entry[0]);

            //return sortedWords.join(", "); // Join sorted words into a string

            return removeDuplicates(firstWords)
          }
          let partial = ''
          if (hintText.size === 1) {
            partial = hintText.get(1)
            removeHints();
          } else {
            console.log("first sentence: ", '.' + hintText.get(1) + '.')
            partial = findPartialConsensus(hintText);
          }

          console.log('out: ', '.' + partial + '.');
          if (partial.constructor === String && partial.length > 0) {
            console.log("The object is a string.");
            if (partial === ' ') {
              e.target.value=currentText + partial
            } else {
              e.target.value = currentText + partial + " "
            }
          } else if (partial.constructor === Array) {
            console.log("The object is a list (array).");
            tmpAlert("Please type " + partial, 4000);
            

            tmpHintOn = true; 
            removeHints();   
            //hintIndex = partial.length; 
            for (let i = 0; i < partial.length; i++) {
              hintIndex = i + 1; 
              hintText.set(hintIndex, partial[i]);
              console.log(partial[i]);
              const div = createHintBubble(
                lastSentence,
                partial[i],
                i === 0 ? '[' + hintIndex + ' or double tab key ]' : '[' + i + ']',
                { highlightId: 'addhere' + hintIndex }
              );

              div.className = "addedhere";
              div.id = "addhere" + hintIndex;
              if (editableDiv) {
                    hintMsg = hintMsg + div.textContent + "\n";
                    hintWindow(hintMsg)
                      //tmpAlert(div.innerHTML, 2000);
                    } else {
                      e.target.parentElement.append(div);
                      
                    }
            }
            return; 
          } else {
            tmpAlert("The object is neither a string nor a list.")
            console.log("The object is neither a string nor a list.");
            return; 
          } 
        } 
      }, timeoutLimit); // this is to wait for the second tab 
      return 
    } else {
      tmpAlert(e.key)

    }

    let targetID1 = null, readonly = null, className = null;
    if ('getAttribute' in e.target) {
      targetID1 = e.target.getAttribute('id')
      readonly = e.target.getAttribute("readonly")
      className = e.target.getAttribute('class')
      if (targetID1 === "demoDiv") {
        className = "editor active"
      } else if (currentURL.indexOf("options.html") != -1) {
        console.log("ignore event. in option page")
        //   return; 
      }
      if (className) className = '.' + className.replace(/\s+/g, '.')
    }
    console.log("currentURL", currentURL)
    console.log('class:', className, 'targetID:', targetID1, 'readonly:', readonly, 'isBody:', e.target === document.body, 'editable: ', e.target.isContentEditable, 'node name:', e.target.nodeName)

    if (e.target.nodeName === "INPUT" || e.target.nodeName === "TEXTAREA") {
      editableDiv = false
      outsideKeyPress = false;
    } else if (e.target.nodeName === "DIV") {
      editableDiv = true;
      outsideKeyPress = false;
    } else {
      console.log("Something to check");
      outsideKeyPress = true;
  
    }

    if (editableDiv) {
      targetID1 = className
    }

    // not activity-stream-comments-textarea activity-stream-work_notes-textarea
    if (!ctrlDown && (outsideKeyPress || readonly == 'readonly')) {
      console.log("Working on control keys ################################################")
      isSelfClick = true;
      setTimeout(() => {
        isSelfClick = false;
      }, 10000);

      // todo: move these 4 lines down after debuging
      //$('.navpage-main').keyup(function(e){  
      var tex = window.getSelection().toString().replace(myFirstName, 'myFirstName');
      if (newFormat) {
        //   tex = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.contentDocument.getSelection().toString()
      }
      var currentKey = e.key
      
      
      
      console.log(' selection: ', tex, " last text: ", lastText, "text in input:", currentText, "lastkey:", lastKey, "currentKey:", currentKey, 'cmdString:', cmdString)

      // wait for 0.3 second for the control command to finish typing xxx
      if ((new Date().getTime()) - lastKeyTime < 1000) {
        console.log("cancel first time out")
        cmdString = cmdString + currentKey;
        clearTimeout(cmdProcessTimeout);
      }  else {
        cmdString = currentKey;
      }
      console.log('cmdString:', cmdString)
      let waitingTime=1000; 
      //let cstr = cmdString;
      if (!hasKeyWithPrefix(controlMap, cmdString) && controlMap.has(cmdString)) {
        console.log("find unique key without waiting for the second char")
        console.log('value is:', controlMap.get(cmdString))
        waitingTime = 0; 
      }
      let value = controlMap.get(cmdString)
      if (value === undefined) value=''
       // make a local copy so the timeout will have its own copy
      cmdProcessTimeout = setTimeout(() => {
        console.log('processing cmdString:', cmdString, 'value:', controlMap.get(cmdString) , 'waittime: ', waitingTime)
        value = controlMap.get(cmdString);
        if (value === undefined || value === null) value=''

        // if(value.startsWith('autoRun ')){
        //   let time = new Date().getTime();
        //   value = value.replace('autoRun ', '')
        //   chrome.storage.local.set({ 'autoRun': time + ' ' + currentID + ' ' + cmdString }, function () {
        //     console.log('autoRunCmd saved:'+ cmdString);
        //   });
        // }
      
          //for (let k of controlMap.keys())
            
            //console.log('checking: ', "'" + k + "' value: '" + value + "'")
              
           // if (cmdString === k) {
              //findKey = true;
              console.log("got it")
              tmpAlert(cmdString + ": " + value, 2000);
              cmdString=''   
              ////console.log('url: ', currentURL)
              if (value.startsWith('Save selection to profile') && tex.length > 10) {
               while (true) {

                  var tenure = prompt("Please enter the shortcut for \"" + tex + "\". Leave blank if you want to save as a sentence without shortcut.");
                  if (tenure != null && tenure.length > 0) {
                    if(shortcutMap.has(tenure.split(/\s+/)[0])) {
                      alert("Please give another shortcut. Duplicate shortcut: " + tenure.split(/\s+/)[0])
                    } else {
                      break;
                    }
                  } else {
                    return;
                  }
                  
                } 
               
                  




                  chrome.storage.local.set({ configSaveTime: getDate() }, function () {
              console.log("Config save time updated.");
            });

                  //if(shortcutMap.size > 20) {
                  //  alert("Current version only allow less than 20 shortcuts")
                  //  return;
                  //} else { 
                  shortcutCommentMap.set(tenure.split(/\s+/)[0], tenure.substring(tenure.indexOf(' ') + 1))
                  shortcutMap.set(tenure.split(/\s+/)[0], tex)
                  // chrome.storage.local.get({myShortcuts:'myShortcuts'}, function (ob) {
                  //   console.log('read myShortcuts', ob.myShortcuts);
                  //   var obj = JSON.parse(ob.myShortcuts); 
                  //   var keys = Object.keys(obj);
                  //   obj[keys.length] = [tenure, tex]; 
                  //   var key = "myShortcuts"; 
                  //   var shortcuts = JSON.stringify(obj);
                  //   chrome.storage.local.set({[key]:shortcuts}, function () {
                  //       console.log('saved myShortcuts:'+ shortcuts);

                  //   });
                  // }); 
                  //shortcutArray[shortcutArray.length] = [tenure, tex]

                  let shortcutArray = {};
                  let c = 0;
                  for (let k of shortcutMap.keys()) {
                    if (k === shortcutCommentMap.get(k)) {
                      shortcutArray[c++] = [k, shortcutMap.get(k)];
                    } else {
                      shortcutArray[c++] = [k + " " + shortcutCommentMap.get(k), shortcutMap.get(k)];
                    }
                  }

                  let sentenceArray = {};
                  c = 0;
                  for (let k of sentenceMap.keys()) {

                    sentenceArray[c++] = [sentenceMap.get(k), k];
                    console.log("owrking on", k);
                    console.log(sentenceArray);
                  }

                  let data = {};
                  data[1] = urlArray
                  data[2] = keywordArray;
                  data[3] = controlArray;
                  data[4] = shortcutArray
                  data[5] = sentenceArray;
                  data[6] = hideArray;
                  data[7] = fillArray;
                  data[8] = favorArray;
                  let keywords = JSON.stringify(data);

                  console.log("saving", keywords);



                  if (currentConfig === "Config1") {

                    chrome.storage.local.set({ ['configa']: keywords }, function () {

                    });
                  } else if (currentConfig === "Config2") {

                    chrome.storage.local.set({ ['configb']: keywords }, function () {

                    });
                  } else if (currentConfig === "Config3") {

                    chrome.storage.local.set({ ['configc']: keywords }, function () {

                    });
                  } else if (currentConfig === "Config4") {

                    chrome.storage.local.set({ ['configd']: keywords }, function () {

                    });
                  }


                  //}
               // } 
                //else {
                  //if(sentenceMap.size > 200) {
                  //  tmpAlert("Current version only allow less than 20 sentences.")
                    //return; 
                  //} else {
                    saveSentences(tex);
                  //}
                //}

              } else if (value.startsWith('Search bookmark')) {
                let tm = prompt("Please type in the keywords to search for bookmarked tickets:");
                console.log("length:", favorArray.length)
                for (let i = 0; i < Object.entries(favorArray).length; i++) {
                  console.log("checking", favorArray[i])

                  function getRightSubstring(input, knownString) {
                    const index = input.indexOf(knownString);
                    // If the known string is not found, return the original input or handle it as needed
                    if (index === -1) {
                      return input;
                    }
                    // Return the substring from the end of the known string to the end of the input
                    return input.substring(index + knownString.length);
                  }

                  if (getRightSubstring(favorArray[i][1], "Note: ").indexOf(tm) != -1) {
                    chrome.storage.local.get(['ticketURL'], function (result) {
                      //console.log("checking returned:")
                      if (result.ticketURL != undefined) {

                        chrome.storage.local.set({ 'searchTicket': favorArray[i][0] }, function () {
                          console.log("ticket Id saved");

                          var value = "Open " + result.ticketURL + " in new tab"
                          chrome.runtime.sendMessage({ greeting: value }, function (response) {
                            console.log(response.farewell);
                            // if (response.farewell != "urls will opened.") {
                            //   chrome.storage.local.remove('searchTicket', function () {
                            //     console.log('Value with has been removed.');
                            //   });
                            //   //alert(response.farewell)
                            // }
                          });
                        });
                      } else {
                        alert("Please set value for variable ticketURL in option page.");

                      }
                    })

                  }


                }



              } else if (value.startsWith('Bookmark with comments')) {

                //let alreadyBooked = false 
                for (var key in favorArray) {
                  if (favorArray.hasOwnProperty(key)) {
                    if (favorArray[key][0] === currentID){
                      delete favorArray[key]

                      tmpAlert("ticket removed from bookmark list")
                      //alreadyBooked = true;
                      showBookmarkTag('white');
                      break

                    }
                  }
                }
                //if ( !alreadyBooked) {
                  


                  let chatContext = document.getElementById("activity-stream-comments-textarea").value; 
                  
                  if(chatContext === ''){
                    let tm = prompt("Please try in the keywords for this ticket:", val('textarea[name="incident.short_description"]'));

                    favorArray[Object.entries(favorArray).length] = [currentID, "Keywords: " + tm];
                  } else {
                    favorArray[Object.entries(favorArray).length] = [currentID, chatContext];
                  }  

                  tmpAlert('ticket is bookmakred')
                  showBookmarkTag(urlMap.get('bookmarkTicketColor'));
                //}
               
                

                let shortcutArray = {};
                let c = 0;
                for (let k of shortcutMap.keys()) {

                  if (k === shortcutCommentMap.get(k)) {
                    shortcutArray[c++] = [k, shortcutMap.get(k)];
                  } else {
                    shortcutArray[c++] = [k + " " + shortcutCommentMap.get(k), shortcutMap.get(k)];
                  }

                }

                let sentenceArray = {};
                c = 0;
                for (let k of sentenceMap.keys()) {

                  sentenceArray[c++] = [sentenceMap.get(k), k];
                  //console.log("owrking on", k); 
                  //console.log(sentenceArray); 
                }


                let data = {};
                data[1] = urlArray
                data[2] = keywordArray;
                data[3] = controlArray;
                data[4] = shortcutArray
                data[5] = sentenceArray;
                data[6] = hideArray;
                data[7] = fillArray;
                data[8] = favorArray;
                let keywords = JSON.stringify(data);

                console.log("saving", currentConfig);

                if (currentConfig === "Config1") {

                  chrome.storage.local.set({ ['configa']: keywords }, function () {

                  });
                } else if (currentConfig === "Config2") {

                  chrome.storage.local.set({ ['configb']: keywords }, function () {

                  });
                } else if (currentConfig === "Config3") {

                  chrome.storage.local.set({ ['configc']: keywords }, function () {

                  });
                } else if (currentConfig === "Config4") {

                  chrome.storage.local.set({ ['configd']: keywords }, function () {

                  });
                }



              } else if (value.startsWith('Close tab')) {
                console.log("close current tab");

                chrome.storage.local.remove('autoRun', function () {
            console.log("autoRun removed");
          });

                //window.close()
                //open(location, '_self').close();
                 chrome.runtime.sendMessage({ greeting: "closeTab" }, function (response) {
                  console.log(response.farewell); 
                });

              } else if (value.startsWith('Remove bookmark')) { 
                showBookmarkTag('white');

                chrome.storage.local.remove(currentID, function() {
                  console.log("Key removed!");
                });
                tmpAlert("Removed bookmark for this ticket!"); 
              } else if (value.startsWith('Bookmark')) {
                let color = value.split(/:/)[1].trim();

                let currentColor = currentBookmarkColor;
                if (currentColor === color) {
                  return; 
                
                } else {
                  showBookmarkTag(color);
                  // chrome.storage.local.set({ currentTicketID: color}, function () {
                  //   console.log("currentTicketID is set to: " + color);
                  // });
                  console.log("save bookmark color for ticket", currentID);
                  chrome.storage.local.set({ [currentID + 'color']: color }, function() {
                    console.log("Saved!");

                  });



                  tmpAlert("Bookmark color is set to " + color);


                  setTimeout(() => {
                    console.log("set bookmark color for ticket", currentID);
                    //get the color for this ticket
                    chrome.storage.local.get([currentID + 'color'], function (result) {
                      if (chrome.runtime.lastError) {
                        console.error("Error reading data: " + chrome.runtime.lastError);
                      } else {
                        let color = result[currentID + 'color'];
                        console.log("Retrieved data:", color);
                      
                      }
                    });
                  }, 1000);

                } 

                // need refresh the main after close current tab
                chrome.storage.local.set({ 'upDownClicked': 'yes' }, function () {
                  console.log("upDownClicked is set");
                });
              } else if (value.startsWith('Click submitButton')) {

                chrome.storage.local.set({ [currentID + 'draft']: currentText }, function () {
                  console.log("draft saved!");
                });


                // new ticket
                // if (val('input[name="sys_display.incident.assigned_to"]') == '' && currentText != '') {
                //   clickEls('.activity-submit');
                //   currentText = '';
                //   return; 
                // }  


                console.log("checking to see if it is safe to send")
                console.log('text length: ', currentText.length, currentText, currentURL, lastTarget.id); 

                //return; 

                //make start with Hi and with myFirstName
                if (currentText.length != 0 && (!currentText.trimStart().startsWith(greeting.split(" ")[0]) || !currentText.trim().endsWith(myFirstName)) && currentURL.indexOf("service") != -1 && lastTarget.id === "activity-stream-comments-textarea") {
                  alert("Not starting with greeting, or signature not found in your message!")

                  showAll();

                  return;
                }

                // changeBackground('green')
                // delaySubmit = false; 
                console.log("Find click", value, 'iframe:', iFrameID, newFormat);
                //next ticket button  ".btn.btn-icon.icon-arrow-down"
                //  If url click xpath 
                if (newFormat) {
                  // if(value.split(/\s+/)[3].startsWith('#sysverb_update_and_stay')) {
                  //alert("Clicking") // $("#" + iFrameID).contents().find(value.split(/\s+/)[1]).click(); 
                  //} else {
                  console.log('click inFrame', urlMap.get('submit'))
                  //  document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(urlMap.get('submit') + "_bottom").click();
                  // }
                  // console.log('click inFrame', urlMap.get('submit'))
                  document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(urlMap.get('submit')).click();
                  setTimeout(() => {
                    console.log('setup iframe for new click')
                    processIFrame(null);
                  }, 4000);

                } else {

                 
                 

                  console.log("submit button clicked");
                  // update the time: 
                  chrome.storage.local.get(['todayTickets'], function (result) {
                    if (chrome.runtime.lastError) {
                      console.error("Error reading data: " + chrome.runtime.lastError);
                    } else {
                      let todayTickets1 = result.todayTickets;
                      console.log("Retrieved data:", todayTickets1);
                      if (typeof (todayTickets1) != 'undefined') {
                        
                        pageCloseTime = new Date().getTime();
                        console.log("pageCloseTime:", pageCloseTime, "currentID:", currentID);
                        if(pageCloseTime - pageOpenTime < 5000) {
                          console.log("pageOpenTime is less than 5 seconds, skip saving todayTickets")
                        }else{ 
                          todayTickets1[currentID] = pageCloseTime + 100000; // add 10 seconds to the close time


                          console.log("Saving data:", todayTickets1);

                          chrome.storage.local.set({ todayTickets: todayTickets1   }, function () {
                            if (chrome.runtime.lastError) {
                              console.error("Error saving data: " + chrome.runtime.lastError);
                            } else {
                              console.log("Data saved successfully");

                               console.log('clicking', urlMap.get('submit'));

                              // new ticket
                              // if (val('input[name="sys_display.incident.assigned_to"]') == '') {
                              //   clickEls('.activity-submit');
                              //   currentText = ''; 
                              // } else {
                                  qsa(urlMap.get('submit'))[0].click();
                              // }  end if

                            }
                          });
                        }  
                      }
                    }
                  });

                }
                // if (value.endsWith("and close tab")) {

                //   setTimeout(() => {
                //     chrome.runtime.sendMessage({ greeting: "closeActiveTab" }, response => {
                //       if (response && response.farewell) {
                //         const activeTabId = response.farewell;
                //         console.log('Received active tab ID:', activeTabId);
                //       }
                //     });

                //   }, 500);
                // }

              } else if (value.startsWith('Click')) { //} && currentURL.indexOf(value.split(/\s+/)[1]) != -1){

                // mark forward/reverse button is clicked
                if (value.startsWith("Click .icon-arrow")) {
                  chrome.storage.local.set({ 'upDownClicked': 'yes' }, function () {
                    console.log("upDownClicked is set");
                  });
                }

                changeBackground(urlMap.get('inActionColor'))
                console.log("Find click", value.split(/\s+/)[1], 'iframe:', iFrameID, newFormat);
                const clickExistingControl = function () {
                  const selector = value.split(/\s+/)[1];
                  if (newFormat) {
                    const macroponent = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010");
                    const frame = macroponent && macroponent.shadowRoot
                      ? macroponent.shadowRoot.querySelector('iframe')
                      : null;
                    const control = frame && frame.contentWindow && frame.contentWindow.document.body
                      ? frame.contentWindow.document.body.querySelector(selector)
                      : null;

                    if (control) {
                      control.click();
                      setTimeout(() => {
                        console.log('setup iframe for new click')
                        processIFrame(null);
                      }, 4000);
                    } else {
                      console.warn('Configured click target was not found:', selector);
                    }
                  } else {
                    console.log('clicking', value)
                    qsa(selector)[0].click();
                  }
                };

                if (value.startsWith('Click .icon-arrow-down')) {
                  goToStoredNextTicket().then((handled) => {
                    if (!handled) clickExistingControl();
                  }).catch((error) => {
                    console.error('Unable to use saved next-ticket navigation:', error);
                    clickExistingControl();
                  });
                } else {
                  clickExistingControl();
                }








              } else if (value.startsWith('CheckAndDelayClick submitButton')) {
                changeBackground(urlMap.get('inActionColor'))
                console.log("delay and submitting")
                if (sending) return;
                sending = true;
                //delaySubmit = true; 
                if (newFormat) {
                  console.log("inFrame")
                  document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(urlMap.get('submit')).click();
                } else {
                  qsa(urlMap.get('submit'))[0].click();
                }

                //console.log("delay and submitting clicked")

              } else if (value.startsWith('Open')) {

                changeBackground(urlMap.get('inActionColor'))
                chrome.runtime.sendMessage({ greeting: value }, function (response) {
                  console.log(response.farewell);
                });

                //If url1 then url2 in current/new tab
                // } else if(value.startsWith('If') && currentURL.indexOf(value.split(/\s+/)[1]) != -1){
                //   console.log("find it")
                //   console.log('sent message: ',  "Open " + value.split(/\s+/)[3] + " in " + value.split(/\s+/)[5] + " " + value.split(/\s+/)[6]);
                //   chrome.runtime.sendMessage({greeting: "Open " + value.split(/\s+/)[3] + " in " + value.split(/\s+/)[5] + " " + value.split(/\s+/)[6]}, function(response) {
                //           console.log('sent out');
                //   });
              } else if (value.startsWith("hide/show")) {
                console.log('hide/show')
                if (isHiding) {
                  showAll()
                } else {
                  hideAll()
                }
              } else if (value.startsWith("Show help")) {
                console.log('show help')
                // let msg="Help"
                // for(let kk of controlMap.keys()) {
                //    msg=msg + "\n" + controlMap.get(kk)
                // }

                let map1 = new Map([...helpMsg.entries()].sort());
                let msg = "<p><strong>HELP:</strong></p>"
                for (let [key, value] of map1) {
                  msg = msg + value
                }
                tmpAlert(msg, 10000, true)
              } else if (value.startsWith("myWork")) {
                chrome.runtime.sendMessage({ greeting: "gotoTaskList" }, function (response) {

                  console.log(response.farewell);

                });
              } else if (value.startsWith("newTicket")) {
                chrome.runtime.sendMessage({ greeting: "gotoNewTaskList" }, function (response) {
                  console.log(response.farewell);
                });

              } else if (value.startsWith('fill test')) {
                console.log('trying save primer')
                // chrome.storage.local.set({'primerResults' :  'test'}, function() {
                //   console.log("primers saved");

                // });
                chrome.runtime.sendMessage({ greeting: "saveCal filename" }, function (response) {
                  console.log(response.farewell);
                });

              } else if (value.startsWith('fill FromExcel')) {
                excelRowValue = value;
                //designPrimer(); 

                setZoomMeetings();


                // chrome.runtime.sendMessage({greeting: "saveCal test" }, function(response) {
                //   console.log(response.farewell);
                // }); 



                // fill Service:High-Performance-Compute Ticket-Type:Request Request-Type:Consulting App/Hardware:O2-Software Assigned-to:myFirstName\smyLastName
              } else if (value.startsWith('fill')) {
                changeBackground(urlMap.get('inActionColor'))
                //if (isHiding) showAll()
                let labelValuesPairs = value.split(/\n/);
                console.log('value pairs:', labelValuesPairs);
                let newTabOpened = false
                let labelIndex = 0;
                processButton(newTabOpened, labelIndex, labelValuesPairs)// Service:High-Performance-Compute Ticket-Type:Request Request-Type:Consulting App/Hardware:O2-Software Assigned-to:myFirstName\smyLastName

                //changeBackground('white')

              } else if (value.startsWith('Refresh')) {
                window.location.reload();

                // remove all highlights
              } else if (value.startsWith("Start new day")) {
                todayTickets = {};
                console.log("Saving data:", todayTickets);
                chrome.storage.local.set({ todayTickets }, function () {
                  if (chrome.runtime.lastError) {
                    console.error("Error saving data: " + chrome.runtime.lastError);
                  } else {
                    console.log("Data saved successfully");
                  }
                });
                tmpAlert("Today's tickets are cleared. You can start a new day now.");
                
              } else if(value.startsWith("Download tickets")) { 
                chrome.storage.local.set({ 'downloadTickets': 'yes' }, function () {
                  console.log("downloadTickets is set");
                  tmpAlert("Tickets will be downloaded shortly.", 4000);
                });

                let desc = "User:\nShort description:\n" + val('textarea[name="incident.short_description"]') + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n"
                
                chrome.storage.local.set({ 'rawTickets': '=== Conversation 0 ===\n' + desc + myPrompt}, function () {
                //chrome.storage.local.set(['rawTickets']:csvContent, function (res) {
                  if (chrome.runtime.lastError) {
                    console.error("Error saving data: " + chrome.runtime.lastError);

                  } else {  
                    console.log("rawTickets saved for download:");
                    setTimeout(() => {
                      // go to the next ticket
                      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'f' }));
                    }, 500);
                  }
                });
              
                
              } else if (value.startsWith("Save tickets to file")) {
                
                    console.log("Saving rawTickets to file:");

                    chrome.storage.local.get(['rawTickets'], function (result) {
                      if (chrome.runtime.lastError) {
                        console.error("Error reading data: " + chrome.runtime.lastError);
                        alert("Error reading ticket data.");
                      } else {
                        let rawTickets = result.rawTickets;
                        console.log("Retrieved data:", rawTickets);
                        
                        if (typeof(rawTickets) !== 'undefined' && rawTickets) {
                          // Create a Blob with text/plain type for text file
                          var blob = new Blob([rawTickets], { type: 'text/plain;charset=utf-8' });
                          var url = URL.createObjectURL(blob);
                          
                          var link = document.createElement("a");
                          link.setAttribute("href", url);
                          let fileName = "tickets_" + new Date().toISOString().slice(0,10) + ".txt";
                          link.setAttribute("download", fileName);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          
                          // Clean up the URL object
                          URL.revokeObjectURL(url);
                          
                          tmpAlert("Tickets saved to " + fileName, 3000);

                          chrome.storage.local.remove('rawTickets', function () {
                            console.log("rawTickets is removed");
                          })
                          chrome.storage.local.remove('ticketDownloadCount', function () {
                            console.log("ticketDownloadCount flag removed");
                          });
                        } else {
                          alert("No ticket data found to save.");
                        }
                      }
                    });
                chrome.storage.local.remove('downloadTickets', function () {
                   console.log("downloadTickets is removed");
                   tmpAlert("Tickets will be stop downloadeding.", 4000);
                });
              } else if (value.startsWith("Summarize tickets")) {
                
                    console.log("Summarizing rawTickets");

                    chrome.storage.local.get(['rawTickets'], function (result) {
                      if (chrome.runtime.lastError) {
                        console.error("Error reading data: " + chrome.runtime.lastError);
                        alert("Error reading ticket data.");
                      } else {
                        let rawTickets = result.rawTickets;
                        console.log("Retrieved data:", rawTickets);
                        
                        if (typeof(rawTickets) !== 'undefined' && rawTickets) {
                          // Create a Blob with text/plain type for text file
                          let myPrompt1 = 'You are a document engineer.\n\nInput:\nRaw conversation text that is noisy, repetitive, and unstructured.\n\nTask:\n1. Extract only factual, reusable knowledge.\n2. Remove chit-chat, greetings, and filler.\n3. Group information by topic.\n4. Split content into chunks of 200–500 tokens.\n5. Rewrite for clarity while preserving original meaning.\n6. Produce a clean JSON array where each item has:\n   - id\n   - title\n   - text\n   - tags\n   - source (conversation)\n7. Ensure the output is suitable for RAG retrieval.\n\nOutput:\n- Valid JSON only.\n- No explanations.\n\n' + rawTickets;
                          
                          console.log('myprompfinal', myPrompt1)
                          
                          // Open the chat session in a new tab and hand it the prompt.
                          sendToChatSession(myPrompt1);
                          chrome.storage.local.remove('rawTickets', function () {
                            console.log("rawTickets is removed");
                          })
                          chrome.storage.local.remove('ticketDownloadCount', function () {
                            console.log("ticketDownloadCount flag removed");
                          });
                        } else {
                          alert("No ticket data found to save.");
                        }
                      }
                    });
                chrome.storage.local.remove('downloadTickets', function () {
                   console.log("downloadTickets is removed");
                   tmpAlert("Tickets will be stop downloadeding.", 4000);
                });



              } else if (value.startsWith("Copy:")) { //} user ID")) {

                
                if (value.indexOf('userID') != -1) {

                    if(userID === "" || userID === undefined) {


                  var button = document.querySelector('[id="viewr.incident.caller_id"]');
                  if (!button.disabled) {
                    button.click();
                    setTimeout(() => {

                      texbox = document.getElementById("sys_readonly.sys_user.user_name");
                      
                      if(texbox == null) {
                        tmpAlert("Failed to get user ID. Please make sure the caller_id field is visible and try again.", 2000);
                        return;
                      }
                      console.log('texbox.value: ', texbox.value)
                      userID = texbox.value.split('@')[0].toLowerCase()
                      button.click();

                      let v = value.slice(5).replace('userID', userID).replace('ticketID', currentID).replace('jobID', jobID);
                      copyToClipboard(v);
                      tmpAlert("Copied: " + v)
                    
                      chrome.storage.local.set({ [curentID + '_userID']: userID }, function () {
                      });     
                      

                    }, 1000);
                  }
                } else {
                  let v = value.slice(5).replace('userID', userID).replace('ticketID', currentID).replace('jobID', jobID);
                      copyToClipboard(v);
                      tmpAlert("Copied: " + v)
                } 
                } else {
                  let v = value.slice(5).replace('ticketID', currentID).replace('jobID', jobID).replace('link', ticketLink).replace('shortDescription', val('textarea[name="incident.short_description"]'));
                  copyToClipboard(v);
                  tmpAlert("Copied: " + v)

                }


                // } else if(value.startsWith("Copy ticket ID")) {

                //     console.log('copy ticket id:'); 
                //       copyToClipboard( currentID )

                // } else if (value.startsWith("Extend job")) {
                //   // find job id in decript textarea

                //   copyToClipboard('extendJob.sh ' + jobID + " ")


              } else if (value.startsWith('Chat')) {
                //send question to chatgpt 
                console.log('Message sent:');
                window.postMessage('testMessage', '*');

                

              // The batch entry further down starts with this same text, so it
              // has to be excluded here or it never reaches its own branch:
              // 'Ask webllm to classify for 5 tickets' satisfies
              // startsWith('Ask webllm to classify'), and this test comes
              // first. That shadowing ran the whole batch through this
              // single-ticket path, 60-second alert and all, with nothing to
              // move to the next ticket.
              } else if (value.startsWith('Ask webllm to classify')
                         && !value.startsWith('Ask webllm to classify for')) {
                console.log("ask HMS AI server to classify conversation")
                 let desc = "User:\nShort description:\n" + val('textarea[name="incident.short_description"]') + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n"
                
                  ticketData = {
                    ticket_id: currentID,
                    conversation: desc
                  };
                  

                  //showLoadingSpinner();
                  tmpAlert("Asking AI to classify conversation in background...", 3000);
              
                 




                  chrome.runtime.sendMessage({ type: 'classify-conversation', conversation: ticketData }, function (response) {
                    if (response && response.ok) {
                      hideLoadingSpinner();
                      chrome.storage.local.set({ [currentID + 'classification']: response.classification }, function() {
                        console.log("Classification saved for ticket:", currentID);
                      });
                      // show classification result on the top edge of the page
                      // let classificationDiv = document.getElementById('classificationDiv');
                      // if (!classificationDiv) {
                      //   classificationDiv = document.createElement('div');
                      //   classificationDiv.id = 'classificationDiv';
                      //   classificationDiv.style.position = 'fixed';
                      //   classificationDiv.style.top = '0';
                      //   classificationDiv.style.left = '0';
                      //   classificationDiv.style.width = '100%';
                      //   classificationDiv.style.backgroundColor = 'yellow';
                      //   classificationDiv.style.color = 'black';
                      //   classificationDiv.style.textAlign = 'center';
                      //   classificationDiv.style.zIndex = '9999';
                      //   document.body.appendChild(classificationDiv);
                      // }
                      // classificationDiv.textContent = "Classification: " + (response.classification || "No classification returned.");
                      // setTimeout(() => {
                      //   if (classificationDiv) {
                      //     classificationDiv.remove();
                      //   }
                      // }, 6000);

                      // parse the response to map
                      // let results = response.classification.split(',').map(item => item.split(':').map(str => str.trim()));
                      // let classificationMap = new Map(results);
                      // console.log('Classification Map:', classificationMap);


                       const labels = Array.from(document.querySelectorAll('label'));
                        let meta = ['Service', 'Ticket Type', 'Request Type', 'App/Hardware', 'Assignment group' ]; 
                        let metaValues = {}; 
                        for (let i = 0; i < meta.length; i++) {
                          let label = labels.find(el => el.textContent.trim() === meta[i]);
                          if (label) {
                            let inputId = label.getAttribute('for');
                            let element = document.getElementById(inputId);
                            if (element) {
                              let value = element.value;
                              metaValues[meta[i]] = value; // append the classification result to the existing value
                              console.log(meta[i] + ':', value);
                            } else {
                              console.log('Element not found for inputId:', inputId);
                            }
                          } else {
                            console.log('Label not found for:', meta[i]);
                          }
                        }
                        //show the results
                        const referenceTicketText = Array.isArray(response.referenceTickets) && response.referenceTickets.length > 0
                          ? response.referenceTickets.map((reference, index) => {
                              const metadata = reference.metadata || {};
                              const ticketId = metadata.ticket_id || `Chunk ${reference.id || 'N/A'}`;
                              const score = Number.isFinite(Number(reference.score))
                                ? Number(reference.score).toFixed(4)
                                : 'N/A';
                              const marker = reference.matched ? '>> ' : '   ';
                              return `${marker}${index + 1}. ${ticketId} | Score: ${score} | Service: ${metadata.service_type || 'N/A'} | Ticket Type: ${metadata.ticket_type || 'N/A'} | Request Type: ${metadata.request_type || 'N/A'} | App/Hardware: ${metadata.app_hardware || 'N/A'} | Assignment Group: ${metadata.assignment_group || 'N/A'}`;
                            }).join('\n')
                          : 'None';
                        // The classification is copied from these tickets rather than
                        // assembled field by field, so say which ones and how clearly
                        // they won. The list below can run off the bottom of the screen;
                        // this line sits above it, where it is always readable.
                        const matched = Array.isArray(response.matchedTickets) ? response.matchedTickets : [];
                        const sharePct = Number.isFinite(Number(response.confidence))
                          ? Math.round(Number(response.confidence) * 100) + '% of the vote'
                          : 'share unknown';
                        const runnerUpText = response.runnerUp && Array.isArray(response.runnerUp.tickets) && response.runnerUp.tickets.length
                          ? ' | runner-up: ' + response.runnerUp.tickets.join(', ')
                            + ' (' + Math.round(Number(response.runnerUp.confidence) * 100) + '%)'
                          : '';
                        const matchedText = matched.length
                          ? 'Copied from: ' + matched.join(', ') + ' | ' + sharePct + runnerUpText
                          : 'Copied from: no reference carried any of these fields';
                        // Whether the form already agrees with the prediction is the
                        // first thing anyone wants to know, so work it out and put it
                        // on the top line -- the rest of this alert can be long enough
                        // to scroll the verdict off the screen.
                        // Only the assignment group is compared. The full
                        // prediction is still printed below, so nothing is
                        // hidden -- the other four fields just do not count
                        // towards same-or-different. See assignmentGroupVerdict.
                        const verdictText = assignmentGroupVerdict(
                          metaValues, parseClassification(response.classification)
                        ).text;
                        // Worth stating, not hiding: the reference list is one
                        // ticket shorter than the index would suggest, and the
                        // reason is that this ticket does not get to vote on
                        // itself.
                        const excludedText = response.excluded
                          ? "Note: ticket " + response.excluded + " is already in the index and was excluded "
                            + "from its own classification.\n"
                          : "";
                        tmpAlert(verdictText + "\n"
                        + excludedText
                        + "Current value: " + currentID + " | " + JSON.stringify(metaValues) + "\n"
                        + "Classification result: " + response.classification + "\n"
                        + matchedText + "\n"
                        + "Reference tickets (>> = source of the result):\n" + referenceTicketText, 60000);
                        //tmpAlert("Classification result: " + response.classification, 60000);
                        // tmpAlert(metaValues.toString(), 6000);
                    } else {
                      hideLoadingSpinner();
                      tmpAlert(response && response.error ? response.error : "Classification failed.", 5000);
                    }
                  });

              // The same classification as above, run over a queue of tickets
              // without anyone driving it. Each pass classifies this ticket,
              // records the verdict, then hands over to the next one exactly
              // the way "Upload to server" does: "Delay k" queues the k hotkey
              // to fire once the next page has loaded, and 'f' is what moves
              // to that next ticket. The loop is therefore the page reload
              // rather than a timer, which is the only thing that survives
              // ServiceNow navigating out from under a running script -- so
              // bind this menu entry to the k hotkey for the run to continue.
              //
              // The count still comes out of the label rather than a literal
              // here, so the label and the run can never disagree. Changing
              // it to another number means widening this prefix to match --
              // 'Ask webllm to classify for' on its own accepts any count.
              /// shortcut is k
              } else if (value.startsWith('Ask webllm to classify for tickets')) {
                console.log("batch classify: starting or continuing a run")

                if(currentURL.indexOf("incident.do.html") != -1){
                  tmpAlert("This feature only works on the real incident page.", 5000);
                  return;
                }

                {
                  const labelCount = value.match(/(\d+)\s*tickets?/i);
                  const batchLimit = labelCount ? Math.max(1, parseInt(labelCount[1], 10)) : 5;
                  // A run is identified by being recent. Without this, a run
                  // abandoned halfway -- a closed tab, a ticket that would not
                  // load -- would leave its count behind and the next manual
                  // start would silently resume it and stop early.
                  const BATCH_KEY = 'classifyBatch';
                  const BATCH_STALE_MS = 30 * 60 * 1000;
                  // Matches the queued keypress's own expiry: after 20s the
                  // waiting k is discarded on load, so a hop that has not
                  // landed by then was never going to continue the run.
                  const HOP_WATCHDOG_MS = 20000;

                  chrome.storage.local.get([BATCH_KEY], function (stored) {
                    let batch = stored[BATCH_KEY];
                    const continuing = batch && (Date.now() - (batch.updatedAt || 0) < BATCH_STALE_MS);
                    if (!continuing) {
                      batch = { count: 0, limit: batchLimit, startedAt: Date.now(), log: [] };
                      console.log("batch classify: new run of", batchLimit);
                    }

                    const position = batch.count + 1;
                    // Nothing on this path lingers: a 50-ticket run is meant to
                    // be left alone, and an alert that outlives its ticket sits
                    // over the next one looking like that ticket's result.
                    tmpAlert("Classifying ticket " + position + " of " + batch.limit + " (" + currentID + ")…", 2000);

                    const metaValues = readTicketMetaValues();
                    const ticketData = { ticket_id: currentID, conversation: ticketConversationText() };

                    // The run can be ended by the limit, by there being no
                    // next ticket, or by the watchdog below; only the first
                    // one to get there should report.
                    let finished = false;

                    // One place to land whatever happened -- a verdict or a
                    // failure -- so every path advances the run and none of
                    // them can leave it stuck on one ticket.
                    function recordAndContinue(entry, alertText) {
                      batch.count = position;
                      batch.updatedAt = Date.now();
                      batch.log.push(entry);

                      // Ends the run wherever it stopped -- at the limit, or
                      // because there is no ticket left to move to. A short
                      // run still gets its summary: the alternative is
                      // pressing f into a dead end and losing every verdict
                      // the run collected when the queued keypress expires.
                      const summarise = (reason) => {
                        if (finished) return;
                        finished = true;
                        // The per-ticket alerts are gone by now, so the run is
                        // only worth anything if it ends with something to
                        // read. Kept in storage too: the log outlives an alert.
                        const matched = batch.log.filter(e => e.status === 'same');
                        const missed = batch.log.filter(e => e.status === 'different');
                        // Tickets that failed or carried no prediction are not
                        // evidence either way, so they stay out of the rate --
                        // counting them as misses would understate the model
                        // for reasons that have nothing to do with the model.
                        const problems = batch.log.filter(e => e.status !== 'same' && e.status !== 'different');
                        const compared = matched.length + missed.length;
                        const rate = compared
                          ? ' (' + Math.round((matched.length / compared) * 1000) / 10 + '%)'
                          : '';

                        // Says how many were asked for as well as how many were
                        // done, so a run that ended early cannot be mistaken
                        // for a full one, and names why it stopped.
                        const short = batch.log.length < batch.limit;
                        const summary = "Batch classification finished: " + batch.log.length
                          + (short ? " of " + batch.limit + " tickets (stopped early)" : " tickets") + "\n"
                          + "Stopped: " + reason + "\n\n"
                          + "Prediction matched the current assignment group on "
                          + matched.length + " of " + compared + " compared" + rate + "\n\n"
                          + "✅ matched: " + matched.length
                          + (matched.length
                              ? "\n" + matched.map(e => '  ' + e.ticket + ': ' + (e.current || '(empty)')).join('\n')
                              : '')
                          + "\n❌ did not match: " + missed.length
                          + (missed.length
                              ? "\n" + missed.map(e => '  ' + e.ticket + ': current ' + (e.current || '(empty)')
                                  + ' vs predicted ' + (e.predicted || '(empty)')).join('\n')
                              : '')
                          + (problems.length
                              ? "\n❓ not compared or failed: " + problems.length + "\n"
                                + problems.map(e => '  ' + e.ticket + ': ' + (e.note || e.status)).join('\n')
                              : '')
                          + "\n";
                        console.log(summary, batch.log);

                        // Saved with everything the alert said and the alert
                        // did not: when it ran, why it stopped, and the
                        // per-ticket verdicts. The AI panel's "Review
                        // classification runs" button reads these back.
                        const run = {
                          startedAt: new Date(batch.startedAt || Date.now()).toISOString(),
                          finishedAt: new Date().toISOString(),
                          reason: reason,
                          limit: batch.limit,
                          matched: matched.length,
                          missed: missed.length,
                          problems: problems.length,
                          compared: compared,
                          log: batch.log
                        };
                        // A history, not just the last one: the point of
                        // recording a run is comparing it with the one before.
                        // Twenty is far inside the storage quota and old
                        // enough to be worth dropping.
                        chrome.storage.local.get(['classifyBatchRuns'], function (stored) {
                          const runs = Array.isArray(stored.classifyBatchRuns) ? stored.classifyBatchRuns : [];
                          runs.unshift(run);
                          chrome.storage.local.set({
                            classifyBatchRuns: runs.slice(0, 20),
                            classifyBatchLastRun: run
                          }, function () {
                            console.log("batch classify: run saved (" + runs.length + " kept)");
                          });
                        });
                        chrome.storage.local.remove(BATCH_KEY, function () {
                          console.log("batch classify: run complete");
                        });
                        // Five minutes: this one is meant to be found, not
                        // caught. A run is left unattended, so the summary has
                        // to still be there when someone comes back to it --
                        // unlike the per-ticket alerts, which are deliberately
                        // brief because something else is along in seconds.
                        tmpAlert(summary, 300000);
                      };

                      if (batch.count >= batch.limit) {
                        summarise("reached the " + batch.limit + "-ticket limit");
                        return;
                      }

                      chrome.storage.local.set({ [BATCH_KEY]: batch }, function () {
                        // Asked before pressing f rather than after: once the
                        // hop fails there is no page load left to notice it,
                        // the queued k expires after 20s, and the run would
                        // end with no summary at all.
                        hasNextTicket().then((more) => {
                          if (!more) {
                            summarise("no ticket after " + currentID);
                            return;
                          }
                          // Two seconds: on a 50-ticket run nobody reads these
                          // one by one, and a verdict that outlives its ticket
                          // sits over the next one looking like its result.
                          // Every verdict is in the summary at the end anyway.
                          tmpAlert(alertText + "\n(" + batch.count + " of " + batch.limit + " — next ticket shortly)", 2000);
                          const startedOn = currentID;
                          setTimeout(() => {
                            // Queue k for after the reload, then press f to
                            // trigger it by moving to the next ticket.
                            processButton(false, -1, ["Delay k", 'f'])

                            // If f had anywhere to go, this page is gone --
                            // or, in the iframe shell where the top document
                            // survives, currentID has changed -- long before
                            // this fires. Still sitting on the same ticket
                            // means the hop went nowhere, and without this the
                            // run would just stop when the queued k expires,
                            // with nothing to show for the tickets it did.
                            // This is the backstop for every case
                            // hasNextTicket cannot see.
                            setTimeout(() => {
                              if (currentID !== startedOn) return;
                              console.log('batch classify: still on', currentID,
                                'after pressing f, so the run has nowhere left to go');
                              summarise("no ticket after " + startedOn
                                + " (pressing the next-ticket button changed nothing)");
                            }, HOP_WATCHDOG_MS);
                          }, randomDelay(2000, 10000));
                        }).catch((error) => {
                          console.log('batch classify: could not check for a next ticket:', error);
                          summarise("could not tell whether a next ticket exists (" + error.message + ")");
                        });
                      });
                    }

                    chrome.runtime.sendMessage({ type: 'classify-conversation', conversation: ticketData }, function (response) {
                      if (chrome.runtime.lastError) {
                        recordAndContinue(
                          { ticket: currentID, status: 'failed', note: chrome.runtime.lastError.message },
                          "Classification failed: " + chrome.runtime.lastError.message
                        );
                        return;
                      }
                      if (!response || !response.ok) {
                        const err = (response && response.error) || "Classification failed.";
                        recordAndContinue({ ticket: currentID, status: 'failed', note: err }, err);
                        return;
                      }

                      chrome.storage.local.set({ [currentID + 'classification']: response.classification }, function() {
                        console.log("Classification saved for ticket:", currentID);
                      });

                      const verdict = assignmentGroupVerdict(metaValues, parseClassification(response.classification));
                      recordAndContinue(
                        {
                          ticket: currentID,
                          status: !verdict.comparable ? 'nocompare' : (verdict.same ? 'same' : 'different'),
                          current: verdict.current,
                          predicted: verdict.prediction,
                          classification: response.classification,
                          // Everything the single-ticket alert puts on screen,
                          // so a run can be examined as closely afterwards as
                          // it could have been while it ran -- which is the
                          // only time anyone is actually watching. Without
                          // these, a disagreement months later is a bare
                          // "nano vs rc" with no way to ask why.
                          currentFields: metaValues,
                          matchedTickets: response.matchedTickets || [],
                          confidence: response.confidence,
                          runnerUp: response.runnerUp || null,
                          excluded: response.excluded || null,
                          // The top few only, without chunk_preview: the whole
                          // list of 15 with text attached, times 10 tickets,
                          // times 20 kept runs, is a lot of storage for rows
                          // nobody reads past the first handful.
                          references: (response.referenceTickets || []).slice(0, 5).map(r => ({
                            ticket: (r.metadata && r.metadata.ticket_id) || r.id,
                            score: r.score,
                            matched: !!r.matched,
                            meta: r.metadata || {}
                          }))
                        },
                        verdict.text
                      );
                    });
                  });
                }

               /// shortcut is w
              } else if (value.startsWith('Upload to server')) {
                console.log("Uploading to server...")
                if(currentURL.indexOf("incident.do.html") != -1){
                  tmpAlert("This feature only works on the real incident page.", 5000);
                  return;
                }
                
                const ticketDone = currentID + "uploaded"; 
                chrome.storage.local.get([ticketDone], function (result) {
                  if (chrome.runtime.lastError) {
                    console.error("Error reading data: " + chrome.runtime.lastError);
                  } else {
                    if (false ) { //result[ticketDone]) {
                      console.log("Ticket already uploaded:", currentID);
                      tmpAlert("It was already uploaded", 3000);
                      setTimeout(() => {
                        // go to the next ticket
                        // save the w first, then click f to go to next ticket
                         processButton(false, -1, ["Delay w", 'f'])
                      }, 500);

                     
                      return;
                    } else {
                
                
                      let desc = "User:\nShort description:\n" + val('textarea[name="incident.short_description"]') + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n"
                      
                        const labels = Array.from(document.querySelectorAll('label'));
                        let meta = ['Service', 'Ticket Type', 'Request Type', 'App/Hardware', 'Assignment group' ]; 
                        let metaValues = {}; 
                        for (let i = 0; i < meta.length; i++) {
                          let label = labels.find(el => el.textContent.trim() === meta[i]);
                          if (label) {
                            let inputId = label.getAttribute('for');
                            let element = document.getElementById(inputId);
                            if (element) {
                              let value = element.value;
                              metaValues[meta[i]] = value;
                              console.log(meta[i] + ':', value);
                            } else {
                              console.log('Element not found for inputId:', inputId);
                            }
                          } else {
                            console.log('Label not found for:', meta[i]);
                          }
                        }
                    
                        let missingFields = meta.filter(field => {
                          if (field === 'Request Type' && metaValues['Ticket Type'] !== 'Request') {
                            return false; // Skip Request Type check if Ticket Type is not Request
                          }
                          return !metaValues[field] || metaValues[field].trim() === '';
                        });
                        if (missingFields.length > 0) {
                          const fieldsMsg = missingFields.join(', ');
                          tmpAlert(`The following fields are empty: ${fieldsMsg}. Please fill them before uploading.`, 5000);
                          setTimeout(() => {
                            console.log(`Missing fields: ${fieldsMsg}. Skipping upload and moving to next ticket.`);
                            tmpAlert(`Missing fields: ${fieldsMsg}. Skipping upload and moving to next ticket.`, 5000);
                            // save the w first, then click f to go to next ticket 
                            processButton(false, -1, ["Delay w", 'f'])
                          }, 5000);
                          return;
                        }
                        
                        ticketData = {
                          ticket_id: currentID,
                          service_type: metaValues['Service'], //'hpc',// val('select[name="incident.u_service_type"]'),
                          ticket_type: metaValues['Ticket Type'], //'support',// val('select[name="incident.u_ticket_type"]'),
                          request_type: metaValues['Request Type'],
                          app_hardware: metaValues['App/Hardware'], //'software',// val('select[name="incident.u_app_hardware"]'),
                          assignment_group: metaValues['Assignment group'], //'rc',// val('select[name="incident.assignment_group"]'),                
                          conversation: desc + "\n" + myPrompt,
                          request_type: metaValues['Request Type']
                        };
                        

                     // showLoadingSpinner();
                        tmpAlert("Uploading ticket in background...", 3000);
                  
                    
                      chrome.runtime.sendMessage({ type: 'upload-conversation', conversation: ticketData }, function (response) {
                        if (response && response.ok) {
                            chrome.storage.local.set({ [ticketDone]: 'true' }, function() {});
                          //  hideLoadingSpinner();
                            tmpAlert("Server response: " + response.message, 3000);

                            // got the nest ticket, then click with a delay
                            console.log("Moving to next ticket after upload1")

                            setTimeout(() => {

                              // save the w first, then click f to go to next ticket
                              processButton(false, -1, ["Delay w", 'f'])
                            }, randomDelay(2000, 10000));
                            

                          } else {
                           
                            tmpAlert(response && response.error ? response.error : "Upload failed.", 5000);
                          
                            if (response && response.error && response.error.includes("already uploaded earlier")) {
                              chrome.storage.local.set({ [ticketDone]: 'true' }, function() {});
                            
                            console.log("Moving to next ticket after upload1")
                            setTimeout(() => {
                              processButton(false, -1, ["Delay w", 'f'])  
                            }, randomDelay(2000, 10000));
                            
                            } else {
                              console.log("Upload failed, not moving to next ticket.")
                            
                            console.log("Moving to next ticket after upload2")
                            setTimeout(() => {
                              // save the w first, then click f to go to next ticket
                              processButton(false, -1, ["Delay w", 'f'])
                            }, randomDelay(2000, 10000));
                            
                            }


                          
                          }
                          // hideLoadingSpinner();
                        });


                    }
                  }
                });
              } else if (value.startsWith('OOD commandline:home quota')) {
                 if(userID === "" || userID === undefined) {


                  var button = document.querySelector('[id="viewr.incident.caller_id"]');
                  if (!button.disabled) {
                    button.click();
                    setTimeout(() => {

                      texbox = document.getElementById("sys_readonly.sys_user.user_name");
                      
                      if(texbox == null) {
                        tmpAlert("Failed to get user ID. Please make sure the caller_id field is visible and try again.", 2000);
                        return;
                      }
                      console.log('texbox.value: ', texbox.value)
                      userID = texbox.value.split('@')[0].toLowerCase()
                      
                      button.click();
                    
                      chrome.storage.local.set({ [curentID + '_userID']: userID }, function () {
                      });     
                       chrome.storage.local.set({ askOODCommand: 'quota for ' + userID}, function() {
                        console.log("askOODCommand is set");
                      });
   
                    }, 1000);
                  }
                } else {
                  chrome.storage.local.set({ 'askOODCommand': 'quota for ' + userID}, function() {
                    console.log("askOODCommand is set");
                  });
                } 

              


              // Answered locally by web-llm, the same path the options panel's
              // "Search + answer" button drives: retrieval over the indexed
              // tickets, then generation, streamed back into this page.
              } else if (value.startsWith('Ask webllm to suggest')) {
                console.log("ask the local web-llm engine to suggest an answer")

                if(currentURL.indexOf("incident.do.html") != -1){
                  tmpAlert("This feature only works on the real incident page.", 5000);
                  return;
                }

                  // No chatgptURL check: nothing opens a chat tab on this
                  // path any more, so requiring one would refuse a question the
                  // local engine can answer offline.
                  let desc = "User:\nShort description:\n" + val('textarea[name="incident.short_description"]') + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n"

                  // Two separate things, because the engine uses them for two
                  // separate jobs. `prompt` is the text it embeds and retrieves
                  // on, so it stays the raw ticket. `task` is what it asks the
                  // model to do; without one the ticket lands in the template's
                  // "Question:" slot, and a 2B model handed a transcript where a
                  // question belongs summarises the retrieved tickets one by one
                  // instead of answering.
                  let task = "Write the reply I should send to this user, in plain text, as if I were "
                    + "writing to them directly. Use the passages to decide what to tell them. "
                    + "Do not describe or summarise the other tickets.";
                  if (myPrompt && myPrompt.trim()) task += " " + myPrompt.trim();

                  console.log('local question', desc, '| task:', task)

                  localAnswerStart();
                  // ticketId is not part of the question: it tells retrieval
                  // which ticket to leave out. This one has often been
                  // uploaded already, and it would otherwise come back as its
                  // own best reference and be suggested back to us.
                  chrome.runtime.sendMessage({ type: 'query-phi3-stream', prompt: desc, task: task, ticketId: currentID }, function (response) {
                    // Only a failure to *start* arrives here. The answer itself
                    // comes back through the phi3-stream-* messages, because
                    // generation outlives this callback by minutes on a cold
                    // model.
                    if (chrome.runtime.lastError) {
                      localAnswerDone({ error: chrome.runtime.lastError.message });
                    } else if (!response || !response.ok) {
                      localAnswerDone({ error: (response && response.error) || 'the local engine did not answer' });
                    }
                  });

              // Takes the answer "Ask webllm to suggest" produced and puts it in
              // the reply box. Separate from asking on purpose: the answer is
              // read in the alert first, and only the ones worth sending are
              // accepted.
              } else if (value.startsWith('Accept answer')) {
                console.log("accept the local model's answer")

                const answer = localAnswerForReply();
                if (!answer) {
                  tmpAlert("No answer to accept yet \u2014 run \u201cAsk webllm to suggest\u201d first.", 4000);
                  return;
                }

                // Same order the draft restore uses, plus the single-box layout
                // some instances render.
                let textarea = document.getElementById("activity-stream-comments-textarea");
                if (textarea === null) textarea = document.getElementById("activity-stream-textarea");
                if (textarea === null) textarea = document.getElementById("activity-stream-work_notes-textarea");
                if (textarea === null) {
                  tmpAlert("No reply box on this page.", 4000);
                  return;
                }

                // Appended when the box already holds something, because that
                // something is usually the greeting this extension just typed in
                // \u2014 replacing it would delete the "Hi <name>," every time.
                const existing = textarea.value || '';
                textarea.value = existing.trim() ? existing.replace(/\s*$/, '') + "\n" + answer : answer;

                // currentText is what the submit check reads for the greeting and
                // signature; a programmatic fill leaves it stale otherwise.
                currentText = textarea.value;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.focus();

                tmpAlert("Answer accepted into the reply box \u2014 read it before sending.", 4000);

              } else if (value.startsWith('Ask chatgpt to suggest')) {
                console.log("ask chatgpt")

                if(currentURL.indexOf("incident.do.html") != -1){
                  tmpAlert("This feature only works on the real incident page.", 5000);
                  return;
                }
                
                  console.log('chatgptURL:', chatgptURL);

                  if (chatgptURL == '') {
                    alert("Please set up the value for chatgptURL in option page.");
                    return;
                  }

                  let desc = "User:\nShort description:\n" + val('textarea[name="incident.short_description"]') + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n"
                  
                  let myPrompt1 = '';  
                  if (myPrompt == "") {
                    myPrompt1 = "Prompt: I (" + myFirstName + ") am a supporting staff. Here is my conversation with computer user.\nPlease suggest an answer for the user.  Please use the most recently attached ChatConext.date.json file as reference. Directly give the answer in plain text. Thanks.\n" + myFirstName + ": Welcome to visit us. What on your mind?\n\n" + desc + myPrompt 
                  } else {
                    myPrompt1 = "Prompt: I (" + myFirstName + ") am a supporting staff. Here is my conversation with computer user.\n\nPlease suggest an answer for the user. Directly give the answer in plain text. Please use the most recently attached ChatConext.date.json file as reference. Thanks.\n" +  desc + myPrompt; 
                  }
                  
                  console.log('myprompfinal', myPrompt1)
                  
                  // Open the chat session in a new tab and hand it the prompt.
                  sendToChatSession(myPrompt1);

              // The same hand-off, aimed at sandboxURL instead of chatgptURL,
              // so an internal sandbox and a public chat service can both be
              // configured and reached from their own hot key. Consent is per
              // host, so each destination is approved on its own.
              } else if (value.startsWith('Ask sandbox to suggest')) {
                console.log("ask sandbox")

                if(currentURL.indexOf("incident.do.html") != -1){
                  tmpAlert("This feature only works on the real incident page.", 5000);
                  return;
                }

                  console.log('sandboxURL:', sandboxURL);

                  if (sandboxURL == '') {
                    alert("Please set up the value for sandboxURL in option page.");
                    return;
                  }

                  let descS = "User:\nShort description:\n" + val('textarea[name="incident.short_description"]') + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n"

                  let myPromptS = '';
                  if (myPrompt == "") {
                    myPromptS = "Prompt: I (" + myFirstName + ") am a supporting staff. Here is my conversation with computer user.\nPlease suggest an answer for the user.  Please use the most recently attached ChatConext.date.json file as reference. Directly give the answer in plain text. Thanks.\n" + myFirstName + ": Welcome to visit us. What on your mind?\n\n" + descS + myPrompt
                  } else {
                    myPromptS = "Prompt: I (" + myFirstName + ") am a supporting staff. Here is my conversation with computer user.\n\nPlease suggest an answer for the user. Directly give the answer in plain text. Please use the most recently attached ChatConext.date.json file as reference. Thanks.\n" +  descS + myPrompt;
                  }

                  console.log('myprompfinal', myPromptS)

                  // Open the sandbox in a new tab and hand it the prompt.
                  sendToChatSession(myPromptS, sandboxURL);

              } else if (value.startsWith('Ask chatgpt to classify not in use')) {
                console.log("ask chatgpt")
                
                  console.log('chatgptURL:', chatgptURL);

                  if (chatgptURL == '') {
                    alert("Please set up the value for chatgptURL in option page.");
                    return;
                  }

                  let desc = "User:\nShort description:\n" + val('textarea[name="incident.short_description"]') + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n"
                  
                  // Build shortcut map for AI to reference
                 // let shortcutInfo = "\n\nAvailable shortcuts (key: action):\n";
                  // for (let [key, action] of controlMap.entries()) {
                  //   if (action && action.length > 0 && action.length < 100) {
                  //     shortcutInfo += `${key}: ${action}\n`;
                  //   }
                  // }
                  
                  let myPrompt1 = "Prompt: This is a request from computer user: \n\n" + desc +"\n\n" + value.split(":")[1] + "\n\nReturn your response in this exact format:\nClassification: [your classification]\n\nThanks."
                  // } else {
                  //   myPrompt1 = "Prompt: I (" + myFirstName + ") am a supporting staff. Here is my conversation with computer user:\n\n" +  desc + myPrompt + "\n\n" + value.split(':')[1] + "\n\nReturn your response in this exact format:\nClassification: [your classification]\n\nThanks."
                  // }
                  
                  console.log('myprompfinal', myPrompt1)
                  
                  // Open the chat session in a new tab and hand it the prompt.
                  sendToChatSession(myPrompt1);

              } else if (value.startsWith('Ask chatgpt to classifyold')) {
                console.log("ask chatgpt to classify")
                if (chatgptURL == '') {
                    alert("Please set up the value for chatgptURL in option page");

                  

                } else {
                   
                  let desc = "User:\nShort description:\n" + val('textarea[name="incident.short_description"]') + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n"
                  
                  let myPrompt1 = '';  
                  if (myPrompt == "") {
                    myPrompt1 = "Prompt: I (" + myFirstName + ") am a supporting staff. Here is my conversation with computer user:\n\n" + myFirstName + ": Welcome to visit us. What on your mind?\n\n" + desc + myPrompt + "\n\nPlease classify this converstion to one of the following toppics 1 HPC Consulting, 2 HPC Troubleshooting, 3 Bioinformatcs Consulting, 4 Bioinformatics Troubleshooting. Thanks."

                  } else {
                    myPrompt1 = "Prompt: I (" + myFirstName + ") am a supporting staff. Here is my conversation with computer user:\n\n" +  desc + myPrompt + "\n\nPlease suggest an answer for the user. Directly give the answer. Thanks."

                  }
                  
                  console.log('myprompfinal', myPrompt1)

                    sendToChatSession(myPrompt1);
                  //}
                }
              } else if (value.startsWith("Copy github PR commands")) {  
                 const pathParts = window.location.pathname.split('/');
                  if (pathParts[3] !== 'pull') return;

                  const owner = pathParts[1];
                  const repo = pathParts[2];
                  const prNumber = pathParts[4];

                  // You can use GitHub DOM to get the branch name
                  const branchEl = document.querySelector('.head-ref');
                  if (!branchEl) return;

                  const branchName = branchEl.textContent.trim(); //.split(':')[1];

                  const commands = `
                git clone https://github.com/${owner}/${repo}.git
                cd ${repo}
                git fetch origin pull/${prNumber}/head:${branchName}
                git checkout ${branchName}
                `;

                  navigator.clipboard.writeText(commands);
                  alert('Git commands copied to clipboard!');

              } else if (value.startsWith('Classify ticket1')) {
                
                function classifyQuestion(question) {
                    const categories = {
  "Advanced Network Services": [
    "Static VPN",
    "Domain Name Services",
    "DNS",
    "static IP",
    "DHCP",
    "cname",
    "arecord"
  ],
  "Advising": [
    "Weave",
    "SiM Project Database",
    "SMO Project Database"
  ],
  "AI Consultations": [
    "AI",
    "Artificial Intelligence",
    "ChatGPT",
    "GPT",
    "Commons",
    "Azure",
    "AI",
    "MGHPCC",
    "GPU",
    "Cluster"
  ],
  "Anatomy Tools": [
    "Anatomy.tv",
    "Primal Pictures"
  ],
  "Application and Web Security": [
    "Imperva",
    "waf",
    "bots",
    "ddos",
    "web security",
    "zscaler",
    "L4 traffic"
  ],
  "Authentication": [
    "2FA",
    "Duo",
    "Login",
    "Shibboleth",
    "SSO",
    "multi-factor authentication",
    "DUO Push"
  ],
  "Audio/Video Technology": [
    "Zoom",
    "microphone",
    "speakers",
    "webcam",
    "recording",
    "stream",
    "echo",
    "video conferencing",
    "teams"
  ],
  "Authentication and Authorization": [
    "Federation",
    "Login",
    "SAML",
    "CAS",
    "OpenID",
    "OAuth"
  ],
  "Backup and Storage": [
    "Data Backup",
    "File Storage",
    "OneDrive",
    "Google Drive",
    "Dropbox"
  ],
  "Business Applications": [
    "Salesforce",
    "SAP",
    "Oracle",
    "Concur"
  ],
  "Campus Networks": [
    "WiFi",
    "eduroam",
    "Ethernet",
    "LAN",
    "WAN",
    "Router",
    "Switch"
  ],
  "Cloud Computing": [
    "AWS",
    "Azure",
    "Google Cloud",
    "Compute",
    "Storage",
    "Cloud Hosting"
  ],
  "Collaboration and Communication": [
    "Slack",
    "Teams",
    "Email",
    "Chat",
    "File Sharing",
    "Calendar"
  ],
  "Compliance and Security": [
    "HIPAA",
    "FERPA",
    "Security Training",
    "Incident Response"
  ],
  "Desktop and Mobile Support": [
    "Laptop",
    "Desktop",
    "Tablet",
    "Mobile",
    "iOS",
    "Android",
    "Computer Repair"
  ],
  "Directory and Identity Services": [
    "LDAP",
    "Active Directory",
    "Identity Management",
    "NetID"
  ],
  "Email and Messaging": [
    "Outlook",
    "Exchange",
    "Gmail",
    "Spam",
    "Phishing"
  ],
  "Event Technology": [
    "Projector",
    "AV Setup",
    "Event Support"
  ],
  "Facilities": [
    "Heating",
    "Cooling",
    "Lighting",
    "Access Control"
  ],
  "High Performance Computing": [
    "Cluster",
    "Parallel Computing",
    "GPU",
    "Scheduler"
  ],
  "Instructional Tools": [
    "Canvas",
    "Blackboard",
    "Gradescope",
    "Turnitin"
  ],
  "Library Services": [
    "Library Account",
    "Catalog",
    "eResources"
  ],
  "Networking": [
    "Internet",
    "WiFi",
    "Firewall",
    "VPN"
  ],
  "Printing": [
    "Printer",
    "Toner",
    "Paper",
    "Print Queue"
  ],
  "Purchasing and Procurement": [
    "Buy@edu",
    "Requisition",
    "PO",
    "Invoice"
  ],
  "Research Support": [
    "LabArchives",
    "Data Management",
    "Grant",
    "Proposal"
  ],
  "Software and Licensing": [
    "Matlab",
    "SPSS",
    "Adobe",
    "License",
    "Install"
  ],
  "Student Systems": [
    "Registration",
    "Transcripts",
    "Degree Audit",
    "Enrollment"
  ],
  "Surveys and Forms": [
    "Qualtrics",
    "Google Forms",
    "SurveyMonkey"
  ],
  "Teaching and Learning Spaces": [
    "Classroom Technology",
    "Projector",
    "Whiteboard",
    "Hybrid Learning"
  ],
  "Telephony": [
    "VoIP",
    "Phone",
    "Extension",
    "Call Forwarding"
  ],
  "Training and Documentation": [
    "Workshops",
    "Guides",
    "Knowledge Base"
  ],
  "Video Production": [
    "Video Editing",
    "Recording Studio",
    "Green Screen"
  ],
  "Web Hosting and Development": [
    "Drupal",
    "WordPress",
    "HTML",
    "CSS",
    "Domain"
  ]
};


                    // Convert question to lowercase for case-insensitive matching
                    const questionLower = question.toLowerCase();

                    let bestCategory = "Uncategorized";
                    let highestScore = 0;

                    // Count keyword frequency for each category
                    for (const [category, keywords] of Object.entries(categories)) {
                        let score = 0;
                        for (const keyword of keywords) {
                            const regex = new RegExp(`\\b${keyword}\\b`, "gi"); // Whole word match
                            const matches = questionLower.match(regex);
                            if (matches) {
                                score += matches.length; // Increase score based on keyword occurrences
                            }
                        }

                        // Update best category if this one has a higher score
                        if (score > highestScore) {
                            highestScore = score;
                            bestCategory = category;
                        }
                    }

                    return bestCategory;
                }


                const question = val('textarea[name="incident.short_description"]') + "\n" + val('textarea[name="incident.description"]')
                  
                // Get the best category
                const category = classifyQuestion(question);

                console.log(category); // Log the category for debugging
                // Display result
     
                
               } else if (value.startsWith('Classify ticket0')) {
                console.log("classify ticket")
                if (chatgptURL == '') {
                    alert("Please set up the value for chatgptURL in option page");

                } else {
                   
                  let desc = "User:\nShort description:\n" + val('textarea[name="incident.short_description"]') + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n"
                  
                 // find context here 
                  
                  
                  let myPrompt1 = "Please classify this question to the types in the attached file. Please ouput two rows, first row for type name, second for key words:\n" + desc; 


                    sendToChatSession(myPrompt1);
                }

              } else if (value.startsWith('Test rag')) { 

                let p = ` You are a helpful assistant. Use the following context to answer the question.

                Context:
                  RAA is Retrieval - Augmented Activity.

                Question:
                  What is RAA ?

                Answer :

                `


                

                    sendToChatSession(p);
                  

              } else if (value.startsWith('Search prompts')) {
                //chrome.storage.local.set({ 'askChatgpt': 'Please edit: ' + currentText }, function () {
                //   console.log("chat question saved", 'Please edit: ' + currentText);

                var value = "Open https://github.com/f/awesome-chatgpt-prompts in new tab"
                  chrome.runtime.sendMessage({ greeting: value }, function (response) {
                    console.log(response.farewell);
                    // if (response.farewell != "urls will opened.") {
                    //   chrome.storage.local.remove('searchTicket', function () {
                    //     console.log('Value with has been removed.');
                    //   });
                    //   //alert(response.farewell)
                    // }
                  });
                //});
                
              } else if (value.startsWith('Edit')) {

                // currentText = "Thanks for contacting us.\nPlease try to login again and let us know it it works.Yesterday we had planned outage.When was the last attempt to login? By the way, please let us know if you didn't receive the outage announcement emails. Then we will add your email to the mailing list.\nBest,\nmyName"; 
                if (currentText != '') {
                  // chrome.runtime.sendMessage({ greeting: "Please edit: " + currentText }, function (response) {
                  //   console.log(response.farewell);
                  // });

                  if (chatgptURL == '') {
                    // chatgptURL = prompt("Please enter the URL you want to open when chat is needed:", chatgptURL);

                    // chrome.storage.local.set({ 'chatgptURL': chatgptURL }, function () {
                    //   console.log("url saved");
                    // });

                    alert("Please set value for variable chatgptURL in option page.");
                  } else {

                    sendToChatSession('Please edit: ' + currentText);
                  }

                } else {
                  tmpAlert("No message to edit.", 5000);
                }
           

              } else if (value.startsWith('Summarize tickets0')) {
                console.log("Summarize ticket")
                if (myPrompt === "") {
                  tmpAlert("No conversaction is found"); 
                  //break
                } else {
                  let myPrompt1 = '';
                  if (chatgptURL == '') {
                    alert("Please set value for variable chatgptURL in option page.");

                  } else {
                    let desc = "User:\nShort description:\n" + val('textarea[name="incident.short_description"]') + "\nLong description:\n" + val('textarea[name="incident.description"]') + "\n"
                    myPrompt1 = "Prompt: Please summerize the following conversation to a prompt context, extract the keywords in the questions and attach to the end of the paragraph. Please remove people's names: \n\n" +desc + myPrompt + "\n\nThanks."

                    console.log('myprompfinal', myPrompt1)

                    // chrome.runtime.sendMessage({ greeting: myPrompt }, function (response) {
                    //   console.log(response.farewell);

                    // });

                    // if (chatgptURL == '') {
                    //   chatgptURL = prompt("Please enter the URL you want to open when chat is needed:", chatgptURL);

                    //   chrome.storage.local.set({ 'chatgptURL': chatgptURL }, function () {
                    //     console.log("url saved");


                      sendToChatSession(myPrompt1);
                    //}
                  }
                }

              } else if (value.startsWith('Find ticket ID in outlook.office.com')) {
                chrome.storage.local.set({ 'searchEmail': currentID }, function () {
                  console.log("ticket Id saved");
                  chrome.runtime.sendMessage({ greeting: "searchEmailt" }, function (response) {
                    console.log(response.farewell);
                    if (response.farewell != "ticket will open soon.") {
                      chrome.storage.local.remove('searchEmail', function () {
                        console.log('Value with has been removed.');
                      });

                      alert(response.farewell)
                    }

                  });
                });
              } else if (value.startsWith('Ask webllm model')) {
                //send question to chatgpt 
                //if (modelLoaded) {
                //  console.log("message", myPrompt);

                //  let msg = "<p><strong>Unload model:</strong></p>"
                //  tmpAlert(msg, 5000)
                //  modelLoaded = false;
                //} else {
                // let msg = "<p><strong>Load model:</strong></p>"
                // tmpAlert(msg, 5000)
                // modelLoaded = true;

                // chrome.runtime.onMessage.addListener((message) => {
                //   console.log('sent from background', message.farewell);

                //   // var div = document.createElement("div");
                //   // div.innerHTML = '<div style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0); display: inline-block; white-space: pre-wrap;">' + "Suggested answer:" + '<span style="color: rgb(256, 94, 92);">' + message.farewell" + '<span id="textPredictionTabHint" style="width: 49px; height: 19px; border-radius: 2px; border-style: solid; border-width: 1px; border-color: rgb(96, 94, 92); white-space: nowrap; font-size: 0.7em; padding-left: 3px; padding-right: 3px; padding-top: 1px; margin-left: 4px; position: relative; top: -2px;">' + "tab" + '</span></span></div>';

                //   // div.className = "addedhere";

                //   $("activity-stream-comments-textarea").value="message.farewell"; //.append(div);


                // });
                //}


                chrome.runtime.sendMessage({ reload: 'hi' });
              } else {
                //if (modelLoaded) {

                if (value.startsWith("Prompt")) {
                  if (mostRecentMessage != "") {
                    console.log("message", mostRecentMessage);
                    let msg = "<p><strong>Sent chat message:</strong></p>" + mostRecentMessage;

                    tmpAlert(msg, 5000, true)
                    chrome.runtime.sendMessage({ chatInput: mostRecentMessage });

                    // chrome.runtime.sendMessage({ chatInput: mostRecentMessage }, function (response) {
                    //   console.log(response.farewell); 

                    //   var div = document.createElement("div");
                    //   div.innerHTML = '<div style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0); display: inline-block; white-space: pre-wrap;">' + "Suggested answer:" + '<span style="color: rgb(256, 94, 92);">' + response.farewell + '<span id="textPredictionTabHint" style="width: 49px; height: 19px; border-radius: 2px; border-style: solid; border-width: 1px; border-color: rgb(96, 94, 92); white-space: nowrap; font-size: 0.7em; padding-left: 3px; padding-right: 3px; padding-top: 1px; margin-left: 4px; position: relative; top: -2px;">' + "tab" + '</span></span></div>';

                    //   div.className = "addedhere";

                    //   $("activity-stream-comments-textarea").parentElement.append(div);

                    //   //myPrompt += "\nUser: " + mostRecentMessage; 

                    // }); 
                    myPrompt += "\nUser: " + mostRecentMessage;


                  } else {
                    console.log("message", "no last message");
                    let msg = "<p><strong>No last message</strong></p>";

                    tmpAlert(msg, 5000, true)
                    chrome.runtime.sendMessage({ chatInput: 'How do you like your own answer?' });
                    myPrompt += '\nUser: How do you like your own answer?';
                  }
                } else if (1 == 2) { // not sure how this works
                  let msg = "<p><strong>Sent chat message:</strong></p>" + value;

                  tmpAlert(msg, 5000, true)
                  chrome.runtime.sendMessage({ chatInput: value });


                  // chrome.runtime.sendMessage({ chatInput: value }, function (response) {
                  //   console.log(response.farewell);

                  //   var div = document.createElement("div");
                  //   div.innerHTML = '<div style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(0, 0, 0); display: inline-block; white-space: pre-wrap;">' + "Suggested answer:" + '<span style="color: rgb(256, 94, 92);">' + response.farewell + '<span id="textPredictionTabHint" style="width: 49px; height: 19px; border-radius: 2px; border-style: solid; border-width: 1px; border-color: rgb(96, 94, 92); white-space: nowrap; font-size: 0.7em; padding-left: 3px; padding-right: 3px; padding-top: 1px; margin-left: 4px; position: relative; top: -2px;">' + "tab" + '</span></span></div>';

                  //   div.className = "addedhere";

                  //   $("activity-stream-comments-textarea").parentElement.append(div);

                  //   //myPrompt += "\nUser: " + mostRecentMessage; 

                  // });
                  //myPrompt += "\nUser: " + mostRecentMessage; 




                  myPrompt += '\n' + value;
                }

                //} else {
                //  let msg = "<p><strong>Please Load model first.</strong></p>"
                //  tmpAlert(msg, 5000)  
                //}    
              }

            //  break;
            //}
         // }
        
      }, waitingTime); 
      
        // }
        //cmdString =''
      //}  
      // if (findKey) {
      //   lastKey = "";
      //   findKey = false;
      // } else if (currentKey == "c") { // todo: to make is general, should go through double-letter keys and if anyone start
      //lastKey = currentKey;         // with current key, save as last key
      // } else {
      //   lastKey = "";
      // }

      //changeBackground('green')
    } else {

      if (e.target.nodeName === "INPUT") return;
      console.log("Working on input box ######################################")

      // don't save draft if the next key press is less than 2 seconds later
      if ((new Date().getTime()) - lastKeyTime < 3000) {
        clearTimeout(saveDrafTimeout);
      }

      console.log(targetID1)
      // console.log(inputXPaths)
  
      insertLength = 0;
      console.log("input box: last: '" + lastText + "'  now: '" + currentText + "' current ", "'" + e.key.replace(/\s/g, '-') + "'");


      console.log('before0 html:', e.srcElement.innerHTML)
      removeHints();
      if (editableDiv) {
        console.log('before html:', e.srcElement.innerHTML)
        currentText = '';
        let ts = e.srcElement.childNodes

        if (currentURL.indexOf('outlook') != -1 || currentURL.indexOf('options.html') != -1) {
          for (let i = 0; i < ts.length; i++) {
            if (ts[i].innerHTML == undefined) continue
            console.log("working1 on ", i)
            console.log(ts[i].textContent, 'html', ts[i].innerHTML)

            currentText += ts[i].innerHTML.replace(/<br>/g, "\n").replace(/\&amp;/g, "&").replace(/\&nbsp;/g, "");
            if (!currentText.endsWith("\n")) currentText += "\n";
          }
        } else if (currentURL.indexOf('mail.yahoo.com') != -1 || currentURL.indexOf('chatgpt.com') != -1 || currentURL.indexOf('claude.ai') != -1) {
          for (let i = 0; i < ts.length; i++) {
            console.log("working2 on ", i, ts[i].innerText, 'html', ts[i].innerHTML)
            currentText += ts[i].innerText;
            if (!currentText.endsWith("\n")) currentText += "\n";
          }

          console.log("currentTExt:." + currentText + ".")
          if (e.key === 'Enter' && (currentURL.indexOf('chatgpt.com') != -1 || currentURL.indexOf('claude.ai') != -1)) currentText = lastText; // when enter key is pressed, chatgpt textbox become empty.

        } else if (currentURL.indexOf('mail.google.com') != -1) {
          for (let i = 0; i < ts.length; i++) {
            console.log("working3 on ", i, ts[i].textContent, 'html', ts[i].innerHTML)
            if (typeof ts[i].innerHTML === 'undefined') {
              currentText += ts[i].textContent;
            } else {
              currentText += ts[i].innerHTML.replace(/<br>/g, "\n"); //.replace(/&amp;/g, "&").replace(/&nbsp;/g, ""); 
            }
            if (!currentText.endsWith("\n")) currentText += "\n";
          }
        } else {

          for (let i = 0; i < ts.length; i++) {
            console.log("working4 on ", i, ts[i].textContent, 'html', ts[i].innerHTML)
            currentText += ts[i].textContent;
            if (!currentText.endsWith("\n")) currentText += "\n";
          }
        }
        // currentText = currentText.replace(/^\s*\n/gm, ""); 
      } else {
        currentText = e.target.value;
      }

      if (currentText == null || currentText.length == 0) {
        lastText = ""
        return;
      }

      console.log("input box: last: '" + lastText + "'  now: '" + currentText + "' current ", "'" + e.key.replace(/\s/g, '-') + "'");
      // for (let i = 0; i < (Math.max(lastText.length), currentText.length); i++) {

      //   if (lastText.substring(i, i + 1) != currentText.substring(i, i + 1)) {
      //     insertStart = i;
      //     console.log('insert start at:', insertStart)
      //     break
      //   }
      // }
      insertStart = caretPosition - 1; 
      console.log('insert start at:', insertStart, 'caretPosition:', caretPosition, 'currentText length:', currentText.length)

      let ps = currentText.substring(0, insertStart + 1).trim().split("\n");
      console.log('last working on ps', currentText.substring(0, insertStart + 1))
      console.log('last ps is', ps)
      console.log('next to last', "'" + currentText.substring(insertStart + 1, insertStart + 2) + "'")

      //let nextToLast = currentText.substring(insertStart + 1, insertStart + 2)
      //if (nextToLast && nextToLast != " " && nextToLast != "\n") console.log('should ignore')

      let lastParagraph = ps[ps.length - 1]
      console.log("last paragraph0", lastParagraph)
      //if(lastParagraph.length == 0 && ps.length > 1) lastParagraph = ps[ps.length - 2]
      //console.log("last paragraph1", lastParagraph)
      //if(lastParagraph.length == 0 && ps.length > 2) lastParagraph = ps[ps.length - 3]
      //console.log("last paragraph2", lastParagraph)
      let ss = lastParagraph.split(/\. |\? |\! /);
      lastSentence = ss[ss.length - 1];
      let ws = lastSentence.split(/\s+/);
      lastWord = ws[ws.length - 1]

      //if (lastWord.length == 0 && ws.length > 1) lastWord = ws[ws.length - 2]

      console.log("current:", e.key, "last paragraph3:", lastParagraph, "lastSentence:", lastSentence, '#words', ws.length, 'lastWord', "'" + lastWord + "'")
      // when click enter, sometimes there are two "\n"s and sometimes, there is only one '\n'                   
      if (e.key === 'Enter' && lastKey != "Enter" ) {

        console.log("enter key is pressed #########################################");
        //if (sentenceMap.size > 20) {
        //  tmpAlert("Current version only allow less than 20 sentences.")
          //return;
        //} else {
          if (ps.length > 1) {
            let sentenses = ps[ps.length - 1]//.split(". ") // there is only one \n
            console.log(sentenses);
            // if (ps.length > 2 && ps[ps.length - 1] == "" && ps[ps.length - 2] == "") { // there are two \n
            //   console.log("double new line");
            //   sentenses = ps[ps.length - 2] //.split(". ") 
            // }

            console.log("saving sentenses", sentenses)
            saveSentences(sentenses)
          }
        //}        
      }

      lastChar = e.key;

    
      if (lastText.length == 0 && firstName.length > 1 && !currentText.startsWith(greeting.split(" ")[0]) && (e.target.id === "activity-stream-comments-textarea" || e.target.id === 'activity-stream-textarea')) {
        console.log("Trying to add first name")
        if (currentText == " ") currentText = ""

        if (! greeting.endsWith(",")) {
          greeting = greeting + ",";
        }
        //if (firstNameWarning.length > 0) {
          // alert(firstNameWarning)
          currentText = greeting + "\n" + currentText;

          lastText = greeting + "\n" + currentText;

        //} else {
        //  currentText = greeting + ",\n" + currentText;
        //  lastText = greeting + ",\n" + currentText;
        //}

        console.log('lastText:', lastText)
        insertLength = currentText.length;
        updateInsertLength(insertLength)
        e.target.dispatchEvent(new Event("change"));

      } else { // zzz
        console.log("trying to replace shortcut to expand #######################################")
        console.log("last word is:", lastWord) 
        // first char is not captital letter 
        if (lastWord[0] != lastWord[0].toUpperCase() && lastWord.length < 10 && lastWord.length > 0) {  //zzzz

        // not sure why we need this
         // if (!shortcutMap.has(lastWord)) lastTextWithoutInsert = ''; 

          console.log('check if we need expand shortcut')
          console.log("last word is:", lastWord)
          console.log("last word length is:", lastWord.length) 
          // wait for 0.3 second for the control command to finish typing xxx
          if ((new Date().getTime()) - lastKeyTime < 500) {
            console.log("cancel first time out")
            clearTimeout(cmdProcessTimeout);
          } 
          console.log("set cmdProcessTimeout")
          let waitingTime=1000;
          if(!hasKeyWithPrefix(shortcutMap, lastWord) && shortcutMap.has(lastWord)) 
            waitingTime = 0

          console.log("find unique key without waiting for the second char")
          console.log('value is:', shortcutMap.get(lastWord))
          
          let tvalue = shortcutMap.get(lastWord)
        
          // make a local copy so the timeout will have its own copy
          cmdProcessTimeout = setTimeout(() => {
            
            console.log("cmdProcessTimeout is running")

            if(tvalue){
            
              if (tvalue.startsWith("Search prompts")) {

                var value = "Open https://github.com/f/awesome-chatgpt-prompts in new tab"
                chrome.runtime.sendMessage({ greeting: tvalue }, function (response) {
                  console.log(response.farewell);
                  if (response.farewell != "urls will opened.") {
                    chrome.storage.local.remove('searchTicket', function () {
                      console.log('Value with has been removed.');
                    });
                    //alert(response.farewell)
                  }
                });
                //tvalue = tvalue.replace('myFirstName', myFirstName)
                //console.log('pre', currentText.substring(0, insertStart - lastWord.length + 1), 'insert', tvalue + "-", 'post', currentText.substring(insertStart + 1, currentText.length))
                currentText = ''; //currentText.substring(0, insertStart - lastWord.length + 1) + currentText.substring(insertStart + 1, currentText.length)
                insertLength = 10; // lastWord.length ;
                insertStart = 10;
                //insertLength = tvalue.length + 1;
                //insertStart -= lastWord.length - 1

              } else {


                tvalue = tvalue.replace('myFirstName', myFirstName)
                console.log('pre', currentText.substring(0, insertStart - lastWord.length + 1), 'insert', tvalue + "-", 'post', currentText.substring(insertStart + 1, currentText.length))
                //currentText = currentText.substring(0, insertStart - lastWord.length + 1) + tvalue + " " + currentText.substring(insertStart + 1, currentText.length)
                lastTextWithoutInsert = currentText.substring(0, insertStart - lastWord.length + 1) + currentText.substring(insertStart + 1, currentText.length);
                
              // function replaceWholeWord(str, find, replaceWith) {
                  // Escape special regex chars in 'find'
                  let escapedFind = lastWord.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
                  let regex = new RegExp(`\\b${escapedFind}\\b`, 'g');
                // return str.replace(regex, replaceWith);
                //}
                currentText = currentText.replace(regex, tvalue + ' ')
                
                //currentText = replaceWholeWord(currentText, lastWord, tvalue + " ");
                insertLength = tvalue.length + 1;
                updateInsertLength(insertLength)

                insertStart -= lastWord.length - 1;
              }
              processInsert(e); 
              // console.log("found expand, use hint text and clean up hintText")
              // hintIndex = 0;
              // hintText.clear();
              // removeHints();
            }
          }, waitingTime); // wait for 0.3 second for the control command to finish typing xxx
        } else {
          console.log('Keyword is too short, long, or not find')
        }

      }

      processInsert(e);

      saveDrafTimeout = setTimeout(() => {

        chrome.storage.local.set({ [ currentID + 'draft']: currentText }, function () {
          console.log("draft saved!", currentID + draftMarker + ":" + currentText);
          tmpAlert("Draft is saved!");
        });


        chrome.storage.local.get([currentID + 'color'], function (result) {
          if (chrome.runtime.lastError) {
            console.error("Error reading data: " + chrome.runtime.lastError);
          } else {
            let color = result[currentID + 'color'];
            console.log("Retrieved data:", color);
         
            if (! color) {
              color = 'green';
              showBookmarkTag(color);
              // chrome.storage.local.set({ currentTicketID: color}, function () {
              //   console.log("currentTicketID is set to: " + color);
              // });
              console.log("save bookmark color for ticket", currentID);
              chrome.storage.local.set({ [currentID + 'color']: color }, function() {
                console.log("Saved!");

              });
              
              // refresh the parent page
              chrome.storage.local.set({ 'upDownClicked': 'yes' }, function () {
                console.log("upDownClicked is set");
              });
            
            }


          }
        });
      }, 3000);




      

    }
    console.log('set last key time');
    lastKeyTime = new Date().getTime();
    lastKey=e.key;
    

  }, true) // why we have true here? If not firefox gmail does not work
  // https://stackoverflow.com/questions/9424550/how-can-i-detect-keyboard-events-in-gmail

} // end of setupKeyUpEventListerner



document.onmouseover = function (e) {
  // console.log("mouse on");
  //console.log(e.target.id);
  if (lastTarget != null && lastTarget.nodeName === "TEXTAREA") {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
    // console.log("got mouse position");
  }
  // const el = e.target;
  // if (el.id) {
  //   tmpAlert(`Element ID: ${el.id}`);
  // }



}

document.onmouseout = function (e) {
   //console.log("mouse leave");
  //console.log(e.target.id);
  //console.log('last id', lastTarget.id)
  //if (lastTarget!=null && lastTarget.nodeName === "TEXTAREA" && e.target.id != lastTarget.getAttribute('id')) {
  //if (lastTarget != null && e.target.id != '' && e.target.id != lastTarget.id && e.target.id.indexOf("addhere") === -1) {

      let targetElement = qsa('textarea[name="incident.short_description"]');
  
          if (targetElement == null || targetElement.length === 0) {
            targetElement = qsa('input[name="incident.short_description"]');
          }
          if (targetElement == null || targetElement.length === 0) {
            targetElement = qsa('textarea[name="u_incident_task.short_description"]');
          }
          if (targetElement == null || targetElement.length === 0) {
            targetElement = qsa('textarea[name="sc_task.short_description"]');
          }

          if (targetElement == null || targetElement.length === 0) {
            targetElement = qsa('#form_main');
          }

          if (targetElement == null || targetElement.length === 0) {
           // console.log("no target element found")

            return;
          }
          const rect = targetElement[0].getBoundingClientRect();

  if (lastTarget != null && rect.top -50 < mousePosition.y && e.target.id != lastTarget.id && e.target.id.indexOf("addhere") === -1) {
    

    removeHints();
    if (hintIndex > 0) {
      hintIndex = 0;
      hintText.clear();
    }

    const deltaX = e.clientX - mousePosition.x;
    const deltaY = e.clientY - mousePosition.y;
    distanceTraveled = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    //console.log("tranveled: ")
    //console.log("tranveled: ", deltaX, deltaY) 
    //console.log(distanceTraveled)
    if (distanceTraveled > 20) { 

       updateEditControlMode(false);
      //console.log("mouse moved more than 20 pixels, reset background color")
      
      if (currentURL.indexOf("chatgpt.com") != -1) {
        lastTarget.blur(); //.focus(); 
        changeBackground('#FFFFCC');

      } else if (currentURL.indexOf("incident.do") != -1) {

        console.log("working on servicenow")

        // if(currentURL.indexOf('dev') != -1) 
        //   $('textarea[name="incident.description"]').select();
        // else 
        // $('textarea[name="incident.short_description"]').select(); 
        lastTarget.blur();
        var selectElement = document.getElementById('incident.state');
        
        var selectedOption = selectElement.options[selectElement.selectedIndex].text;

        if (selectedOption === 'New' || selectedOption === '-- None --' || selectedOption === 'Unassigned') {
          changeBackground(urlMap.get('newTicketColor'))
        } else if (selectedOption === 'Assigned') { 
          changeBackground(urlMap.get('assignedTicketColor'));
        } else if ( selectedOption === 'On Hold') {
          changeBackground(urlMap.get('holdTicketColor'))
        } else if (selectedOption === 'Resolved' || selectedOption === 'Closed') {
            changeBackground(urlMap.get('closedTicketColor'))
        } else {
          changeBackground(urlMap.get('newTicketColor')); 
        }
      }
    }
  }
}

function copyToClipboard(text) {
  // Create a dummy input element
  const input = document.createElement('input');
  input.style.position = 'absolute';
  input.style.left = '-9999px'; // Move the element off-screen
  document.body.appendChild(input);

  // Assign the text to the input value
  input.value = text;

  // Select the text inside the input
  input.select();

  // Execute the copy command
  document.execCommand('copy');

  // Remove the input element from the DOM
  document.body.removeChild(input);
}

function setZoomMeetings() {
  //ask for Excel file
  console.log("from excel")

  let input = document.createElement('input');
  input.type = 'file';
  input.onchange = function () {

    var file = input.files[0]

    if (!file) return;
    chrome.storage.local.set({ 'calResults': "Cal for " + file.name + "\n" }, function () {
      console.log("meeting schedule file name saved");

    });

    var reader = new FileReader();

    //For Browsers other than IE.f
    if (reader.readAsBinaryString) {
      console.log("other")
      reader.onload = function (e) {

        let data = e.target.result;
        var workbook = XLSX.read(data, {
          type: 'binary'
        });
        var Sheet = workbook.SheetNames[0];
        //console.log('C2', Sheet.C2)

        var excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[Sheet], { raw: false });
        let index = -1;
        //for (var i = 0; i < excelRows.length; i++) {
        //    console.log('got', excelRows[i])
        processCalendarRow(index, excelRows, file.name);
        //}
      };
      reader.readAsBinaryString(file);
    } else {
      console.log("ie")
      //For IE Browser.
      reader.onload = function (e) {
        var data = "";
        var bytes = new Uint8Array(e.target.result);
        for (var i = 0; i < bytes.byteLength; i++) {
          data += String.fromCharCode(bytes[i]);
        }
        var workbook = XLSX.read(data, {
          type: 'binary'
        });
        var Sheet = workbook.SheetNames[0];
        var excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[Sheet]);
        for (var i = 0; i < excelRows.length; i++) {
          console.log('got1')
          //1processTableRo(excelRows[i]);           
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }
  input.click();
  //input.parentNode.removeChild(input);
}

function designPrimer() {

  var openInNewTab = document.getElementById("nw1");
  openInNewTab.checked = true;

  //ask for Excel file
  console.log("from excel")

  var input = document.createElement('input');
  input.type = 'file';
  input.onchange = function () {

    var file = input.files[0]

    if (!file) return;
    chrome.storage.local.set({ 'primerResults': "Primers for " + file.name + "\n" }, function () {
      console.log("primer file name saved");

    });

    var reader = new FileReader();

    //For Browsers other than IE.
    if (reader.readAsBinaryString) {
      console.log("otehr")
      reader.onload = function (e) {

        let data = e.target.result;
        var workbook = XLSX.read(data, {
          type: 'binary'
        });
        var Sheet = workbook.SheetNames[0];
        var excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[Sheet]);
        let index = -1; let newTabOpened = false;
        //for (var i = 0; i < excelRows.length; i++) {
        //    console.log('got', excelRows[i])
        processPrimerRow(newTabOpened, index, excelRows, excelRowValue.split(/\s+/)[2], file.name);
        //}
      };
      reader.readAsBinaryString(file);
    } else {
      console.log("ie")
      //For IE Browser.
      reader.onload = function (e) {
        var data = "";
        var bytes = new Uint8Array(e.target.result);
        for (var i = 0; i < bytes.byteLength; i++) {
          data += String.fromCharCode(bytes[i]);
        }
        var workbook = XLSX.read(data, {
          type: 'binary'
        });
        var Sheet = workbook.SheetNames[0];
        var excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[Sheet]);
        for (var i = 0; i < excelRows.length; i++) {
          console.log('got1')
          //1processTableRo(excelRows[i]);           
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }
  input.click();
}

function saveSentences(para) {
  console.log('original', sentenceMap)

  console.log('para', para)

  let sens = para.replace(/(<([^>]+)>)/gi, "").split(/(\. |\? |\! )/);
  for (let i = 0; i < sens.length; i++) {
    
    
    let item = sens[i]
    console.log(i, item)
    if (i + 1 < sens.length && (sens[i + 1] === ". " || sens[i + 1] === "? " || sens[i + 1] === "! ")) {
      item = item + sens[i + 1]
    }
    if (item.length > 10) {
      if (sentenceMap.has(item)) {
        sentenceMap.set(item, sentenceMap.get(item) + 1)

        console.log("already exist")
      } else {
        sentenceMap.set(item, 1);
        //sentenceArray[sentenceArray.length]=[1, sens[i]]
        console.log("got new sentence")
      }
    }

    // let arr = item.split((/\s+/))
    // for(let j=0; j<arr.length; j++){
    //   if(arr[j].length > 4) {
    //     if(wordMap.has(arr[j])){
    //       wordMap.set(arr[j], wordMap.get(arr[j])+1)
    //     } else {
    //       wordMap.set(arr[j], 1);
    //       //sentenceArray[sentenceArray.length]=[1, sens[i]]
    //     }
    //   }  
    // }


  }



  console.log('original1', sentenceMap)


  // console.log("convert to array")
  // console.log(Array.from(sentenceMap, ([value, name]) => ({ name, value })))
  // console.log(fillArray)
  // const arr = {};
  // let index = 0; 
  // for (let k of sentenceMap.keys()) {  
  //    arr[index++] = [sentenceMap.get(k), k]
  // }

  // console.log("saving array", arr)
  // let key='mySentences'
  // let mySentences = JSON.stringify(arr);
  // chrome.storage.local.set({[key]:mySentences}, function () {
  //   console.log('saved mySentences');
  // });

  let shortcutArray = {};
  let c = 0;
  for (let k of shortcutMap.keys()) {
    shortcutArray[c++] = [k + " " + shortcutCommentMap.get(k), shortcutMap.get(k)];
  }

  let sentenceArray = {};
  c = 0;
  for (let k of sentenceMap.keys()) {

    sentenceArray[c++] = [sentenceMap.get(k), k];
    //console.log("owrking on", k); 
    //console.log(sentenceArray); 
  }

  let data = {};
  data[1] = urlArray
  data[2] = keywordArray;
  data[3] = controlArray;
  data[4] = shortcutArray
  data[5] = sentenceArray; //Array.from(sentenceMap, ([value, name]) => ({ value, name })); //sentenceArray;
  data[6] = hideArray;
  data[7] = fillArray;
  data[8] = favorArray;
  let keywords = JSON.stringify(data);
  if (currentConfig === "Config1") {

    chrome.storage.local.set({ ['configa']: keywords }, function () {

    });
  } else if (currentConfig === "Config2") {

    chrome.storage.local.set({ ['configb']: keywords }, function () {

    });
  } else if (currentConfig === "Config3") {

    chrome.storage.local.set({ ['configc']: keywords }, function () {

    });
  } else if (currentConfig === "Config4") {

    chrome.storage.local.set({ ['configd']: keywords }, function () {

    });
  }

}

function removeHints() {

  // if (mySaveButton != null) {
  //   mySaveButton.parentNode.removeChild(mySaveButton);
  //   myResolveButton.parentNode.removeChild(myResolveButton);
  //   mySaveButton = null;  
  //   myResolveButton = null;
  // }

  let doc = document
  if (newFormat) {
    doc = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body
  }
  let elements = doc.getElementsByClassName('addedhere');
  while (elements.length > 0) {
    //console.log('removing hint: ')
    elements[0].parentNode.removeChild(elements[0]);
  }

  remvoveHintWindow(); 
  hintMsg=""

  // var textarea = document.getElementById("activity-stream-comments-textarea");

  // // Create the Save button
  // mySaveButton = document.createElement("button");
  // mySaveButton.textContent = "Save";
  // mySaveButton.type = "button";
  // mySaveButton.id = "custom-save-button";

  // // Create the Resolve button
  // myResolveButton = document.createElement("button");
  // myResolveButton.textContent = "Resolve";
  // myResolveButton.type = "button";
  // myResolveButton.id = "custom-resolve-button";

  // // Insert both buttons below the textarea, side by side
  // if (textarea && textarea.parentNode) {
  //     // Insert the Save button below the textarea
  //     textarea.parentNode.insertBefore(mySaveButton, textarea.nextSibling);
  //     // Insert the Resolve button after the Save button
  //     mySaveButton.parentNode.insertBefore(myResolveButton, mySaveButton.nextSibling);
  // }

  // // Add actions to the buttons
  // mySaveButton.addEventListener("click", function() {
  //    // alert("Save: " + textarea.value);
  //     qsa(urlMap.get('submit'))[0].click();
  // });

  // myResolveButton.addEventListener("click", function() {
  //     //alert("Resolve action!");
  //     document.dispatchEvent(new KeyboardEvent('keyup', { 'key': 'x' }));
  // });

}

function getCaretPosition(item) {
  let caretP = 0;

  console.log("getCaretPosition for ", item, "selectionStart:", item.selectionStart, "selectionEnd:", item.selectionEnd)

  if (item && (item.isContentEditable || item.getAttribute && item.getAttribute('contenteditable') === 'true')) {
    var sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      var range = sel.getRangeAt(0);
      var preRange = range.cloneRange();
      preRange.selectNodeContents(item);
      preRange.setEnd(range.endContainer, range.endOffset);
      caretP = preRange.toString().length;
    }
    return caretP;
  }


  // Firefox, Chrome, IE9~ Support
  if (item.selectionStart || item.selectionStart == '0') {
    console.log('firefox, chrome')
    console.log("getCaretPosition for ", item, "selectionStart:", item.selectionStart, "selectionEnd:", item.selectionEnd)
    caretP = item.selectionStart;
  }
  // ~IE9 Support
  else if (document.selection) {
    console.log('~ie9 support  ')

    item.focus();
    var sel = document.selection.createRange();
    sel.moveStart('character', -item.value.length);
    caretP = sel.text.length;
  }
  
  return caretP;
}

function setCaret(node, line, position) {
  node.focus();
  //var caret = 10; // insert caret after the 10th character say
  var range = document.createRange();
  range.setStart(node.childNodes[line], position);
  range.setEnd(node.childNodes[line], position);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

}

function setCaretPositionFirefox(node, line, position) {
  node.focus();
  //var caret = 10; // insert caret after the 10th character say
  var range = document.createRange();
  range.setStart(node.childNodes[line], position);
  range.setEnd(node.childNodes[line], position);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

}

function setupKeyDownEventListerner(hasFrame) {
  console.log("trying to set up keydown")


  document.addEventListener('keydown', function (e) {
    console.log("keydown event", e)
    if (e.keyCode == ctrlKey) ctrlDown = true;

    // shis does not work for outlook
    //document.dispatchEvent(new KeyboardEvent('keypress', {'key': 'a'}));
    if (ctrlDown) return

    var code = (e.keyCode || e.which);

    // tab key is pressed
    if (code == 9 && hintIndex > 0 && lastTarget != null) { //}  && currentURL.indexOf('live.com') == -1) {

      //if(1 == 2 ){
      let targetID = lastTarget.getAttribute('id')
      console.log("keydown event id: ", "'" + targetID + "'")

      // not activity-stream-comments-textarea activity-stream-work_notes-textarea
      // if(targetID != null && (targetID.startsWith(inputXPaths[0]) || targetID.startsWith(inputXPaths[1]))) { 



      // ############## NOTES: 
      // ############## Tab need to be detected in key down, so that it will stoped further action 
      if (e.preventDefault) {
        e.preventDefault();
        e.stopImmediatePropagation();
      } else {
        e.returnValue = false;
      }

      if (e.target.nodeName === "INPUT" || e.target.nodeName === "TEXTAREA") {
        editableDiv = false
      } else if (e.target.nodeName === "DIV") {
        editableDiv = true;
      }


      return;  // todo: need remove this and disable tab input the hintText

      removeHints();

       // this for outlook, gmail, chatgpt
      if (editableDiv) { 
        console.log('insert start for tab key: ', insertStart, 'current Text', currentText)
        let ps = currentText.substring(0, insertStart + 1).split("\n");
        let lastParagraph = ps[ps.length - 1]
        let ss = lastParagraph.split(/\. |\? |\! /);
        let lastSentence = ss[ss.length - 1];
        let ws = lastSentence.split(/\s+/);
        let lastWord = ws[ws.length - 1]


        let h = lastWord + hintText.get(1)
        console.log("directly use map for ", h)
        if (shortcutMap.has(h)) { //yyy
          h = shortcutMap.get(h)
          h = h.replace('myFirstName', myFirstName)
          insertLength = h.length + 1
          updateInsertLength(insertLength)
          currentText = currentText.substring(0, insertStart - lastWord.length + 1) + h + " " + currentText.substring(insertStart + 1, currentText.length);
          insertStart = insertStart - lastWord.length;

        } else {
          currentText = currentText.substring(0, insertStart + 1) + hintText.get(1) + " " + currentText.substring(insertStart + 1, currentText.length);
          insertLength = hintText.get(1).length + 1
          updateInsertLength(insertLength)
        }
        console.log("fultext: '" + currentText + "'")

        // let h = lastWord + hintText.get(1)
        // console.log("directly use map for ", h)
        // if(shortcutMap.has(h)){
        //    h = shortcutMap.get(h)
        // } 

        //console.log("fultext: '" + currentText + "'")

        // document.execCommand("insertHTML", false, hintText.get(1) + " " );
        console.log('before html:', e.srcElement.innerHTML)


        if (currentURL.indexOf('mail.google.com') != -1 || currentURL.indexOf('chatgpt.com') != -1) {
          const textHolder = document.createElement('div');
          textHolder.style.whiteSpace = 'pre';
          textHolder.innerText = currentText;
          e.srcElement.replaceChildren(textHolder);

        } else {

          e.srcElement.getElementsByTagName('div')[0].innerText = currentText;
        }
       // e.srcElement.getElementsByTagName('div')[0].innerText = currentText;

        //lastInsertLength =  hintText.get(1).length + 1; 
        lastTextWithoutInsert = lastText;

        lastText = currentText

        console.log('after html:', e.srcElement.innerHTML)

        let ts = e.srcElement.children[1]
        while (ts != null) {
          console.log("working on1 ", ts.innerText, 'html', ts.innerHTML)
          e.srcElement.removeChild(ts)
          ts = e.srcElement.children[1]
        }

        // for(let i=0; i<ts.length; i++){
        //   console.log("working on1 ", i,ts[i].textContent, 'html', ts[i].innerHTML)
        //  // currentText +=  ts[i].textContent
        //  // if(i < ts.length -1) currentText += "\n"
        //   if(i > 0) e.srcElement.removeChild(ts[i])
        // }

        // let ts = e.srcElement.childNodes 
        // for(let i=0; i<ts.length; i++){
        //   console.log("working on1 ", i,ts[i].textContent, 'html', ts[i].innerHTML)
        //  // currentText +=  ts[i].textContent
        //  // if(i < ts.length -1) currentText += "\n"
        //   if(i > 0) e.srcElement.removeChild(ts[i])
        // }

        console.log('after1 html:', e.srcElement.innerHTML)

        // sencond parameter is paragh X 2, the third is the position in the paragraph
        let lines = currentText.split('\n');
        let total = 0, para = 0, posi = 0;
        for (let i = 0; i < lines.length; i++) {
          //console.log('working on', "'" + lines[i] + "' total " , total, ' should less than', insertStart + insertLength)
          total += lines[i].length + 1
          if (total > insertStart + insertLength) {
            //console.log("got it") 
            posi = lines[i].length - (total - (insertStart + insertLength))
            break;
          } else {
            if (lines[i].length > 0) {
              //console.log('line is not empty') 
              para += 2;
            } else {
              para++;
            }
          }
        }
        console.log('para', para, 'posi', posi + 2)

        setCaret(e.srcElement.getElementsByTagName('div')[0], para, posi + 2); //todo: posi need add 1 becuase instart start was calculated before the tab key pressed 
      } else {
        lastInsertStart = getCaretPosition(e.target);
        var preText = e.target.value.substring(0, lastInsertStart);
        var postText = e.target.value.substring(lastInsertStart, e.target.value.length);

        let commonPrefix = hintText.get(1);
        if (hintIndex > 2)
          commonPrefix = longegetCommonPrefix([hintText.get(1), hintText.get(2), hintText.get(3)])

        console.log("commont", commonPrefix)
        e.target.value = preText + hintText.get(1) + " " + postText; // input tab key
        lastInsertLength = hintText.get(1).length + 1;
        // e.target.value = preText + commonPrefix + " " + postText; // input tab key
        // lastInsertLength =  commonPrefix.length + 1; 

        lastTextWithoutInsert = lastText;

        // lastTarget = e.target
        //if(lastTarget != null) console.log("got lastTarget")
        lastText = e.target.value;

        document.getElementById(iFrameID).contentWindow.document.getElementById(targetID).dispatchEvent(new Event('change'))

      }
    }
  }, true)
  lastText = ''
  currentText = ''
}

function longegetCommonPrefix(words) {
  // check border cases size 1 array and empty first word)
  if (!words[0] || words.length == 1) return words[0] || "";
  let i = 0;
  // while all words have the same character at position i, increment i
  while (words[0][i] && words.every(w => w[i] === words[0][i]))
    i++;

  // prefix is the substring from the beginning to the last successfully checked i
  return words[0].substr(0, i);
}

/**
 * Where the hideable elements live in the new ServiceNow UI: the document inside
 * the shadow-DOM iframe. Null when the page is not that format (yet), which is
 * an ordinary state during loading, not an error.
 */
function hideRoot() {
  const host = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010");
  const iframe = host?.shadowRoot?.querySelector('iframe');
  return iframe?.contentDocument ?? null;
}

function showAll() {

  //shortDescriptionEditable();

  console.log("showing")
  isHiding = false;
  if (newFormat) {
    const root = hideRoot();
    for (let k of hideMap.keys()) {
      //console.log(k)
      // Still the first match only, as this branch has always been -- unlike the
      // classic one below, which hid every match. '' rather than 'block' so a
      // hidden table row or flex child goes back to its stylesheet display.
      const el = root && qs(k, root);
      if (el) el.style.display = '';
    }
  } else {
    for (let k of hideMap.keys()) {
      // console.log(k)
      showEls(k);
    }
    let cs = qsa('.h-card.h-card_md.h-card_comments');

    // ls = document.getElementById('gsft_main').contentWindow.document.body.querySelectorAll('a.linked.formlink')
    if (cs != null && cs.length > 0) {
      //console.log('find comments');
      for (var i = 0; i < cs.length; i++) {
        // console.log("working on ", i); 
        cs[i].style.display = '';
      }
    }
  }

  // scroll to the top of the page
  window.scrollTo(0, 0);
}

function hideAll() {
  if (urlMap.get('disableHiding') && urlMap.get('disableHiding').endsWith('1')){  
    console.log("!!!!!!!!disableHiding is 1, skip hiding")
    return; 
  }  

  shortDescriptionReadOnly(); 
  console.log("short description readonly")
  isHiding = true;
  //console.log("hiding")

  if (newFormat) {
    console.log("new format hiding")
    const root = hideRoot();
    for (let k of hideMap.keys()) {
      console.log(k, 'with frame')
      const el = root && qs(k, root);
      if (el) el.style.display = 'none';
    }
  } else {
    for (let k of hideMap.keys()) {
      //console.log('hiding:', k)
      hideEls(k);
    }

    let cs = qsa('.h-card.h-card_md.h-card_comments');

    if (cs != null && cs.length > 0) {
      console.log('find comments');
      for (var i = 0; i < cs.length; i++) {
        //console.log("working on ", i);
        let cType = cs[i].childNodes[1]?.innerText ?? '';
        //console.log("working on ", cType);
        if (cType.indexOf("Additional comments") === -1 && cType.indexOf('Work notes') === -1 && cType.indexOf('ServiceNow email') === -1 && cType.indexOf('Attachment') === -1) {
          cs[i].style.display = 'none';
        }
      }
    }
  }
}

function setupClickEventListerner(isIFrame) {




  console.log("trying to set up click event listerner")
  //if(currentURL.indexOf(urlMap.get('urls03')) == -1) 
  //  return
  console.log("click listerner is up")

  if (urlMap.get('submit').length > 0) {
    var doc = document;

    if (isIFrame) {
      console.log("adding click for iframe")
      doc = document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body
    } else {
      console.log("adding click for body")
    }

    if (isIFrame) { //$("#" + iFrameID).contents().find(urlMap.get('submit').replace('#', '')).click(); 
      //let submitButtonEl = 
      console.log("hi#" + iFrameID)
      console.log(urlMap.get('submit'))
      //somehow this only pauses the submit action, but does not resume it after processing it.
      // so we trigger submit again in submitButtonClicked().
      // .contents() was the iframe's document; an empty list if it is not there
      // (or cross-origin), which is what jQuery's empty set amounted to.
      const iframeDoc = document.getElementById("gsft_main")?.contentDocument;
      const iframeSubmitButton = iframeDoc ? qsa(urlMap.get('submit'), iframeDoc) : [];
      iframeSubmitButton.forEach((submitBtn) => {
        submitBtn.addEventListener('click', function (event) {

          // #sysverb_update_and_stay
          // if(confirm('prevent onclick event?')) {
          //      event.stopImmediatePropagation();   
          // }
          //if(delaySubmit) {
          console.log("trying to stop the submittion")
          //delaySubmit = false; 

          //delaySubmit = false; 

          event.stopPropagation();
          event.preventDefault();
          event.stopImmediatePropagation();
          submitButtonClicked()
          // setTimeout(() => {

          //    console.log("trying to click after 5 seconds")
          //    $("#" + iFrameID).contents().find(urlMap.get('submit')).click()
          // }, 5000);
          //}  

        });
        submitBtn.removeAttribute('onclick');
      });

    } else {

      //var onclickFunc = new Function(qs(urlMap.get('submit'))?.getAttribute('onclick'));
      qsa(urlMap.get('submit')).forEach((submitBtn) => {
        submitBtn.addEventListener('click', function (event) {
          // if(confirm('prevent onclick event?')) {
          //     event.stopImmediatePropagation();   
          //   }
          //if(delaySubmit) {
          console.log("trying to stop the submittion")
          delaySubmit = false;

          //delaySubmit = false; 
          event.stopImmediatePropagation();
          submitButtonClicked()
          // setTimeout(() => {
          //   console.log("trying to click after 5 seconds")
          //   qsa(urlMap.get('submit'))[0].click()
          // }, 5000);
          //}  

        });
        submitBtn.removeAttribute('onclick');
      });

    }



    doc.addEventListener('click', (e) => {
      //lastTarget = e.target; 

      //if(! editableDiv) delaySubmit = true; 
      //console.log(e.target.innerHTML)

      let elid = e.target.id
      console.log("click event. id", elid, 'isIFrame', isIFrame)

      if (elid == "unDoSendingButton") {
        for (let j = 0; j < 10; j++) {
          clearTimeout(timeOuts[j])
        }

        //$("#" + iFrameID).contents().find('.addedhere').remove();
        removeHints()
        //unDoSending= true; 
        sending = false
        // lastTarget = null; 
        // lastText = ""; 
      } else if (elid == "sendNowButton") {
        for (let j = 0; j < 10; j++) {
          clearTimeout(timeOuts[j])
        }
        removeHints()

        //delaySubmit = false; 
        if (newFormat) {
          document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(urlMap.get('submit') + "_bottom").click();
          //document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector('.addedhere').remove();

        } else {
          qsa(urlMap.get('submit') + "_bottom")[0].click();
          //qsa(".btn.btn-default.activity-submit")[0].click()

          // This does not work because _bottom button click reload the page
          // setTimeout(() => {
          //   open(location, '_self').close();
          //   //window.close()
          // }, 2000);

          //$('.addedhere').remove();
        }

        lastTarget = null;
        lastText = "";
        sending = false
      }
    })
  }
}

function submitButtonClicked() {

  console.log("Find delay click", urlMap.get('submit'));
  if (lastText != null && lastText.length > 0 && lastTarget != null) {
    console.log("clicking with delay")

    //todo: should change to setInterval here
    // setInterval(() => {

    // }, interval);

    for (let i = 9; i > -1; i--) {

      timeOuts[9 - i] = setTimeout(() => {
        console.log("running timeout", 9 - i)
        if (i != 0) {
          //$("#" + iFrameID).contents().find('.addedhere').remove();
          removeHints();
          //if(! unDoSending) {
          var div = document.createElement("div");
          const status = document.createElement('div');
          status.className = 'addedhere';
          status.style.cssText = 'font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color:red; display: inline-block; white-space: pre-wrap;';
          status.appendChild(document.createTextNode('   Sending...         ' + i + '     '));

          const undoButton = document.createElement('button');
          undoButton.style.cssText = 'color:red; border-color:red';
          undoButton.id = 'unDoSendingButton';
          undoButton.textContent = 'Undo';

          const sendNowButton = document.createElement('button');
          sendNowButton.style.cssText = 'color:red; border-color:red';
          sendNowButton.id = 'sendNowButton';
          sendNowButton.textContent = 'Send Now';

          status.appendChild(undoButton);
          status.appendChild(sendNowButton);
          div.appendChild(status);
          lastTarget.parentElement.append(div)

        } else {
          //if(i == 0) { 
          //if(! unDoSending) {
          lastTarget = null;
          lastText = "";
          console.log("clicking")
          //$("#" + iFrameID).contents().find('.addedhere').remove();
          removeHints()

          //delaySubmit = false; 
          if (newFormat) {
            // if(ctrlDown){
            document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(urlMap.get('submit') + "_bottom")[0].click();
            // } else {
            //  alert("Need ctr key")
            //} 
          } else {
            // if(ctrlDown) {

            qsa(urlMap.get('submit') + '_bottom')[0].click();
            //qsa(".btn.btn-default.activity-submit")[0].click()
            //  setTimeout(() => {
            //window.close()
            //     open(location, '_self').close();
            //   }, 2000);
            //} else {
            //  alert("Need ctr key")
            // }
          }
          //} 
          //unDoSending = false; 
          sending = false
        }
      }, 100 * (9 - i));
    }

    lastText = ''
  } else {
    console.log("clicking without delay")
    //delaySubmit = false; 
    if (newFormat) {
      //if(ctrlDown){
      document.querySelector("macroponent-f51912f4c700201072b211d4d8c26010").shadowRoot.querySelector('iframe').contentWindow.document.body.querySelector(urlMap.get('submit') + "_bottom")[0].click();
      //} else {
      //  alert("Need ctr key")
      //} 
    } else {
      //if(ctrlDown) {
      console.log("clicking without delay1")
      qsa(urlMap.get('submit') + '_bottom')[0].click();
      // } else {
      //  alert("Need ctr key")
      // }
    }
    sending = false
  }

  lastText = ''
  currentText = ''
}

// ---- ticket state indicator -------------------------------------------------
// This used to tint the description, short description and work-notes fields.
// That fought dark mode: the tint is an inline background, so either the theme
// overrode it and the state was lost, or the tint survived and one field stayed
// bright in an otherwise dark page. Neither is good, and both made the page look
// patchy.
//
// The colour still carries the meaning, it just lives in one small box pinned to
// one small panel in the top-left corner instead of being painted across the form. The page keeps a
// single uniform background in either theme.

const STATUS_PANEL_ID = "betterweb-status";

// Set by showBookmarkTag. Held here rather than read back off a field's
// background, which is what the bookmark code used to do -- that compared a
// colour name against the "rgb(...)" the browser returns, so it never matched.
let currentBookmarkColor = "";
let currentStateColor = "";

/** Config keys carry the meaning; invert them to get a label for a colour. */
function ticketStateLabel(color) {
  const c = String(color == null ? "" : color).trim().toLowerCase();
  if (!c) return "";
  // Checked before the white shortcut below on purpose: closedTicketColor ships
  // as "white", so testing for white first would mean Closed never showed.
  const byKey = [
    ["newTicketColor", "New"],
    ["assignedTicketColor", "Assigned"],
    ["holdTicketColor", "On hold"],
    ["closedTicketColor", "Closed"],
    ["inActionColor", "Working"],
  ];
  for (const [key, label] of byKey) {
    const configured = String(urlMap.get(key) || "").trim().toLowerCase();
    if (configured && configured === c) return label;
  }
  // Plain white that matches no configured state means "no state", not a state.
  if (c === "white" || c === "#fff" || c === "#ffffff") return "";
  return "Other";
}

/** Black or white text, whichever the colour can actually be read against. */
function readableTextOn(color) {
  try {
    const probe = document.createElement("span");
    probe.style.color = color;
    document.body.appendChild(probe);
    const rgb = getComputedStyle(probe).color.match(/\d+/g);
    probe.remove();
    if (!rgb) return "#111";
    const [r, g, b] = rgb.map(Number);
    // Rec. 601 luma is plenty for picking one of two text colours.
    return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? "#111" : "#fff";
  } catch (e) {
    return "#111";
  }
}

// No state colour yet: still bright, so the panel reads the same way.
const STATUS_DEFAULT_BG = "#fffbe6";

function statusPanel() {
  let panel = document.getElementById(STATUS_PANEL_ID);
  if (panel) return panel;
  if (!document.body) return null;
  panel = document.createElement("div");
  panel.id = STATUS_PANEL_ID;
  // Keeps the dark theme from re-colouring it; see dark.css.
  panel.setAttribute("data-bw-ui", "");
  panel.style.cssText = [
    "position:fixed",
    "left:8px",
    "top:8px",
    "z-index:2147483646",
    "min-width:120px",
    "max-width:200px",
    "padding:10px 12px",
    "border-radius:8px",
    "box-shadow:0 4px 16px rgba(0,0,0,.35)",
    "font-family:-apple-system,system-ui,Calibri,Arial,sans-serif",
    "text-align:center",
    // Never swallow a click meant for the page underneath.
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(panel);
  return panel;
}

function statusLine(text, css) {
  const line = document.createElement("div");
  // No background of its own: the whole panel is one colour, and the dark theme
  // blanks any nested background anyway.
  line.style.cssText = css;
  line.textContent = text;
  return line;
}

/**
 * One box, top left, one background: ticket state, bookmark, and whether keys
 * go to the page or to this extension.
 *
 * Every row used to carry its own background, which made the panel a stack of
 * colour bands -- and the dark theme then forced #111 text onto all of them, so
 * the black mode band went black-on-black. One bright background with one
 * contrasting text colour avoids both problems.
 */
function renderStatusPanel() {
  const panel = statusPanel();
  if (!panel) return;

  const label = ticketStateLabel(currentStateColor);
  const background = label ? currentStateColor : STATUS_DEFAULT_BG;
  const text = readableTextOn(background);

  // Same reasoning as tmpAlert: inline !important is the only level a themed
  // page cannot override.
  panel.style.setProperty("background-color", background, "important");
  panel.style.setProperty("color", text, "important");
  // Read by the dark theme, so the panel keeps this colour there too.
  panel.style.setProperty("--bw-status-bg", background);
  panel.textContent = "";

  if (label) {
    panel.appendChild(statusLine(label, "font-size:20px;font-weight:700;line-height:1.25"));
  }

  if (currentBookmarkColor) {
    const row = statusLine("", "font-size:13px;font-weight:600;margin-top:4px");
    // A dot rather than a coloured band: the bookmark colour still carries
    // meaning (red / green / khaki) without breaking the single background.
    const dot = document.createElement("span");
    dot.style.cssText =
      "display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;" +
      "vertical-align:middle;border:1px solid rgba(0,0,0,.35);background-color:" + currentBookmarkColor;
    row.append(dot, document.createTextNode("Bookmarked"));
    panel.appendChild(row);
  }

  // Always shown: it answers "why did my keystroke do nothing?", which is the
  // question the mode badge existed for in the first place. Edit mode is the
  // unusual one, so it is the one that gets emphasis.
  panel.appendChild(
    statusLine(editingMode ? "Edit mode" : "Control mode",
      "font-size:12px;margin-top:4px;font-weight:" + (editingMode ? "700" : "600") +
      ";opacity:" + (editingMode ? "1" : ".75")),
  );
}

/** Ticket state. Called with a configured colour, or 'white' to clear. */
function showTicketState(color) {
  const label = ticketStateLabel(color);
  currentStateColor = label ? color : "";
  renderStatusPanel();
}

/** Bookmark colour, or a falsy value / 'white' to clear it. */
function showBookmarkTag(color) {
  const c = String(color == null ? "" : color).trim();
  currentBookmarkColor = !c || c.toLowerCase() === "white" ? "" : c;
  renderStatusPanel();
}

// Kept as the name ~20 call sites already use; it no longer touches any field.
function changeBackground(color) {
  showTicketState(color);
}

//document.addEventListener("load",function() { changeBackground('red') });

// var div = document.createElement("div");
// // div.innerHTML='<div class="addedhere" style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color:red; display: inline-block; white-space: pre-wrap;">' + "   Sending...         " + 33 + '     <button style=\"color:red; border-color:red\" id=\"unDoSendingButton1\">Undo</button><button style=\"color:red; border-color:red\" id=\"sendNowButton1\">Send Now</button></span></div>';
// // //$("body").append(div)

// div = document.createElement("div");
// div.innerHTML='<div> <a href=\"https://google.com\">1. Question about Biorender  </a><a href=\"https://yahoo.com\">2. Question about Biorender  </a></div>';


// //div.innerHTML='<div class=\"row form-group\"><div class=\"col-sm-5 control-label\">Printer friendly version</div><div class=\"col-sm-7\"><a href=\"javascript:void(0)\" id=\"print-icon\" aria-label=\"Open printer friendly version of page\" ng-click=\"printList('25000')\" class=\"icon-print settings-menu-icon\"></a></div></div>';

// $("body").append(div)
// chrome.storage.local.get(['links'], function(result) {
//   console.log("checking returned:")
//   if(result.links != undefined ) { 
//     alert(result.links)
//     div = document.createElement("div");
// div.innerHTML='<div class="addedhere" style="font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color:red; display: inline-block; white-space: pre-wrap;">' + "   Sending...         " + 33 + '     <a class="linked formlink" aria-label="Question about Biorender…Open record: INC0563318" href="incident.do?sys_id=13e88…DERBYDESCsys_updated_on" target="_blank"><button style=\"color:red; border-color:red\" id=\"sendNowButton1\">Send Now</button></span></div>';
// //$("body").append(div)

//   } 
// })

}
