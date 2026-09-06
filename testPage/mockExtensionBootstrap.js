(function () {
  if (window.__betterWebMockBootstrapLoaded) return;
  window.__betterWebMockBootstrapLoaded = true;

  var STORAGE_KEY = 'betterWeb_mock_chrome_storage';
  var USER_CONFIG_KEY = 'betterWeb_user_config_json';
  var SELECTED_USER_KEY = 'betterWeb_mock_selected_user';
  var messageListeners = [];

  function isMockOptionsPage() {
    return /\/testPage\/options\.html(?:$|\?)/.test(window.location.pathname + window.location.search);
  }

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_error) {
      return {};
    }
  }

  function writeStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function decodeHashes(value) {
    if (typeof value === 'string') {
      return value.replace(/&NPOUND/g, '#');
    }
    if (Array.isArray(value)) {
      return value.map(decodeHashes);
    }
    if (value && typeof value === 'object') {
      var result = {};
      Object.keys(value).forEach(function (key) {
        result[key] = decodeHashes(value[key]);
      });
      return result;
    }
    return value;
  }

  function upsertPair(section, name, value) {
    var keys = Object.keys(section || {});
    for (var index = 0; index < keys.length; index += 1) {
      var key = keys[index];
      if (section[key] && section[key][0] === name) {
        section[key][1] = value;
        return;
      }
    }
    section[String(keys.length)] = [name, value];
  }

  function hasPair(section, name) {
    var keys = Object.keys(section || {});
    for (var index = 0; index < keys.length; index += 1) {
      var key = keys[index];
      if (section[key] && section[key][0] === name) {
        return true;
      }
    }
    return false;
  }

  function upsertPairIfMissing(section, name, value) {
    if (!hasPair(section, name)) {
      upsertPair(section, name, value);
    }
  }

  function ensureContains(source, additions) {
    var parts = String(source || '').split(/\s+/).filter(Boolean);
    additions.forEach(function (item) {
      if (parts.indexOf(item) === -1) {
        parts.push(item);
      }
    });
    return parts.join(' ');
  }

  function buildFallbackConfigData() {
    return {
      urls: {
        0: ['URLs', 'mock-local'],
        1: ['submit', '#btn_save'],
        2: ['myFirstName', 'David'],
        3: ['myID', 'david'],
        4: ['ticketURL', 'incidentList.html?view=my'],
        5: ['newTicketColor', 'LightPink'],
        6: ['holdTicketColor', 'LightSkyBlue'],
        7: ['assignedTicketColor', 'lightgreen'],
        8: ['closedTicketColor', 'white'],
        9: ['inActionColor', 'lightyellow'],
        10: ['openaiApiKey', 'empty'],
        11: ['searchTerms', 'INC ITSK TASK'],
        12: ['greeting', 'Hi, userFirstName,'],
        13: ['listPagePaths', 'incidentList.html'],
        14: ['detailPagePaths', 'incident.do.html'],
        15: ['leftLinePositionListPage', '0.8 https://ld32.github.io/betterWeb/testPage/incidentList.html?view=new'],
        16: ['rightLinePositionListPage', '0.9 https://ld32.github.io/betterWeb/testPage/incidentList.html?view=my'],
        19: ['bookmarkTicketColor', 'khaki'],
        20: ['chatSessionURL', 'https://chatgpt.com/c/WEB:e5527534-977b-4155-ac18-6a3bfc957f42']
      },
      keywords: {},
      controls: {
        0: ['a Hide/show', 'hide/show'],
        1: ['f Forward', 'Click .icon-arrow-down'],
        2: ['d Previous', 'Click .icon-arrow-up'],
        3: ['h Show Help', 'Show help'],
        5: ['ac Ask chatgpt (need extension to work)', 'Ask chatgpt to suggest'],
        7: ['br Bookmark red', 'Bookmark:red'],
        8: ['bg Bookmark green', 'Bookmark:green'],
        9: ['bx Remove bookmark', 'Remove bookmark'],
        12: ['c Close tab', 'Close tab'], 
        13: ['i Copy incident ID and link', 'Copy:ticketID link'],
      },
      shortcuts: {
        0: ['bm Best myFirstName', 'Best,\nmyFirstName'], 
        1: ['tm Thanks myFirstName', 'Thanks,\nmyFirstName'],
        2: ['pl please let us know', 'Please let us know.'],
        3: ['tr Thanks reporting', 'Thanks for reporting the issue.']
      },
      sentences: {
        0: ['8', 'Please let us know.'],
        1: ['6', 'Thanks for contacting us.']
      },
      hides: {
        0: ['testpage', '#form_main']
      },
      fills: {
  "0":["x Resolve ticket","State:Resolved \nResolution code:Request Fulfilled\nResolution notes:Done\nResolution type:Resolved with Remote Tools\nClick submitButton\nDelay f"],
  "1":["w Set to Bio Request and David","Service:Bioinformatics\nTicket Type:Request\nRequest Type:Consulting\nApp/Hardware:Bioinformatics Consultation\nAssignment group:SN RC Consulting\nAssigned to:myFirstName\nClick submitButton"],
  "2":["r Set to HPC Request and David","Service:High Performance Computing\nTicket Type:Request\nRequest Type:Consulting\nApp/Hardware:O2 Platform\nAssignment group:SN RC Consulting\nAssigned to:myFirstName\nClick submitButton"],
  "6":["s Put it Onhold and save","State:On Hold\nOn hold reason:End User\nOn hold expiration date:3weeks\nClick submitButton"],
  "7":["j Just want to follow up","Additional comments:Just want to follow up on this issue. Do you have more quesiton or we can close this ticket?\nBest,\nmyFirstName\nClick submitButton"],
  "9":["o Send outage notice","Additional comments (Customer visible):tout\nService:High Performance Computing\nTicket Type:Request\nRequest Type:Consulting\nApp/Hardware:O2 Software\nAssignment group:SN RC Consulting\nAssigned to:myFirstName\nClick submitButton"]
},
      bookmark: {
        0: ['', ''],
        1: ['', '']
      }
    };
  }

  function readUserConfig() {
    try {
      var store = readStore();
      var raw = store[USER_CONFIG_KEY];
      if (!raw) return null;
      if (typeof raw === 'string') return JSON.parse(raw);
      return raw;
    } catch (_error) {
      return null;
    }
  }

  function writeUserConfig(config) {
    var store = readStore();
    store[USER_CONFIG_KEY] = JSON.stringify(config || {}, null, 2);
    writeStore(store);
  }

  function removeUserConfig() {
    var store = readStore();
    delete store[USER_CONFIG_KEY];
    writeStore(store);
  }

  function readSelectedMockUser() {
    try {
      var raw = localStorage.getItem(SELECTED_USER_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.firstName || !parsed.id) return null;
      return parsed;
    } catch (_error) {
      return null;
    }
  }

  function buildConfigPayload(rawConfig) {
    var source = decodeHashes(rawConfig || buildFallbackConfigData());
    var urls = clone(source.urls || {});
    var selectedUser = readSelectedMockUser();

    upsertPairIfMissing(urls, 'submit', '#btn_update');
    upsertPairIfMissing(urls, 'ticketURL', 'incidentList.html?view=my');
    upsertPairIfMissing(urls, 'myFirstName', 'David');
    upsertPairIfMissing(urls, 'myID', 'david');
    upsertPairIfMissing(urls, 'greeting', 'Hi, userFirstName,');
    upsertPairIfMissing(urls, 'inActionColor', 'lightyellow');
    upsertPairIfMissing(urls, 'bookmarkTicketColor', 'khaki');
    upsertPairIfMissing(urls, 'searchTerms', ensureContains((source.urls && Object.values(source.urls).find(function (pair) { return pair[0] === 'searchTerms'; }) || [null, ''])[1], ['INC', 'ITSK', 'TASK']));
    upsertPairIfMissing(urls, 'listPagePaths', ensureContains((source.urls && Object.values(source.urls).find(function (pair) { return pair[0] === 'listPagePaths'; }) || [null, ''])[1], ['incidentList.html']));
    upsertPairIfMissing(urls, 'detailPagePaths', ensureContains((source.urls && Object.values(source.urls).find(function (pair) { return pair[0] === 'detailPagePaths'; }) || [null, ''])[1], ['incident.do.html']));
    upsertPairIfMissing(urls, 'leftLinePositionListPage', '0.8 https://ld32.github.io/betterWeb/testPage/incidentList.html?view=new');
    upsertPairIfMissing(urls, 'rightLinePositionListPage', '0.9 https://ld32.github.io/betterWeb/testPage/incidentList.html?view=my');
    upsertPairIfMissing(urls, 'classificationColors', 'red blue yellow purple pink');
    upsertPairIfMissing(urls, 'classificationPrompt', 'Please classify this conversation to one of the following topics: HPC Consulting(r c); Bioinformatcs Consulting(w); Spam(cl c); Data transfer');
    upsertPairIfMissing(urls, 'chatSessionURL', 'https://chatgpt.com/');
    if (selectedUser) {
      upsertPair(urls, 'myFirstName', selectedUser.firstName);
      upsertPair(urls, 'myID', selectedUser.id);
    }

    var payload = {
      1: urls,
      2: clone(source.keywords || {}),
      3: clone(source.controls || {}),
      4: clone(source.shortcuts || {}),
      5: clone(source.sentences || {}),
      6: clone(source.hides || {}),
      7: clone(source.fills || {}),
      8: clone(source.bookmark || {})
    };

    return payload;
  }

  function ensureChromeShim() {
    window.chrome = window.chrome || {};

    if (!window.chrome.storage) {
      window.chrome.storage = {};
    }

    window.chrome.storage.local = {
      get: function (keys, callback) {
        var store = readStore();
        var result = {};
        if (typeof keys === 'string') {
          result[keys] = Object.prototype.hasOwnProperty.call(store, keys) ? store[keys] : undefined;
        } else if (Array.isArray(keys)) {
          keys.forEach(function (key) {
            result[key] = Object.prototype.hasOwnProperty.call(store, key) ? store[key] : undefined;
          });
        } else if (keys && typeof keys === 'object') {
          Object.keys(keys).forEach(function (key) {
            result[key] = Object.prototype.hasOwnProperty.call(store, key) ? store[key] : keys[key];
          });
        } else {
          result = Object.assign({}, store);
        }
        if (callback) callback(result);
      },
      set: function (items, callback) {
        var store = readStore();
        Object.assign(store, items || {});
        writeStore(store);
        if (callback) callback();
      },
      remove: function (keys, callback) {
        var store = readStore();
        var keyList = Array.isArray(keys) ? keys : [keys];
        keyList.forEach(function (key) {
          delete store[key];
        });
        writeStore(store);
        if (callback) callback();
      }
    };

    if (!window.chrome.runtime) {
      window.chrome.runtime = {};
    }

    window.chrome.runtime.lastError = null;
    window.chrome.runtime.getManifest = function () {
      return { version: 'mock-local' };
    };
    window.chrome.runtime.openOptionsPage = function (callback) {
      window.open('options.html', '_blank');
      if (callback) callback();
    };
    // Extension-relative paths resolve against src/, so offscreen.js finds
    // lib/wasm/*.wasm and data/tickets.json, and content.js finds audios/.
    // Absolute, because offscreen.js compares model_lib against this exact value.
    window.chrome.runtime.getURL = function (path) {
      return new URL('../src/' + String(path).replace(/^\/+/, ''), window.location.href).href;
    };
    window.chrome.runtime.onMessage = {
      addListener: function (listener) {
        messageListeners.push(listener);
      }
    };
    window.chrome.runtime.sendMessage = function (message, callback) {
      var farewell = 'mock runtime';

      // rag-panel.js awaits this call, so it has to hand back a promise rather
      // than a callback. Answered before the broadcast below: these are point-
      // to-point requests, not the page-wide notifications that path is for.
      var rag = ragHandle(message);
      if (rag) {
        return rag
          .then(function (result) {
            if (callback) callback(result);
            return result;
          })
          .catch(function (error) {
            ragPost({ type: 'error', error: error.message });
            var failed = { ok: false, error: error.message };
            if (callback) callback(failed);
            return failed;
          });
      }

      if (message && typeof message.greeting === 'string') {
        var greeting = message.greeting.trim();
        farewell = greeting;

        if (greeting.indexOf('Open ') === 0) {
          var target = greeting.indexOf(' in new tab') !== -1 ? '_blank' : '_self';
          var url = greeting
            .replace(/^Open\s+/, '')
            .replace(/\s+in new tab$/, '')
            .replace(/\s+in current tab$/, '');
          if (url) {
            if (target === '_blank') {
              window.open(url, '_blank');
            } else {
              window.location.href = url;
            }
          }
        } else if (greeting.indexOf('closeTab') === 0) {
          window.close();
        }
      }

      messageListeners.forEach(function (listener) {
        try {
          listener(message, { tab: null }, function () {});
        } catch (_error) {}
      });

      if (callback) {
        callback({ farewell: farewell });
      }
      return Promise.resolve({ farewell: farewell });
    };
  }

  // ---- engine selection ----------------------------------------------------
  // Two ways to answer the panel's messages.
  //
  //   default        the real src/offscreen.js -- arctic-embed and
  //                  gemma-2b-it on WebGPU, the same code the extension runs.
  //   ?engine=mock   a keyword-scored stub. No model downloads, deterministic,
  //                  and useful for working on the panel's UI.
  //
  // The real engine works here because offscreen.js only ever needed an ordinary
  // page: WebGPU, IndexedDB and fetch are all present, and the two chrome.* APIs
  // it touches are shimmed below.
  //
  // What defaulting to real costs a visitor: web-llm.js is ~6.5 MB and loads with
  // the page. The model weights are far larger -- ~539 MB for the embedder, ~1.5
  // GB for the chat model -- but those download only when Build or Ask is
  // actually clicked, not on arrival. The browser caches them, though this page
  // is a different origin from the installed extension and does not share its
  // cache. ?engine=mock avoids all of it.
  //
  // "?engine=real" still parses, so old links keep working.
  var REAL_ENGINE = !/[?&]engine=(mock|stub)\b/.test(window.location.search);

  // Resolved before any message is dispatched, so offscreen.js has registered
  // its listener by the time rag-panel.js asks it anything.
  var offscreenReady = null;

  function loadRealEngine() {
    if (offscreenReady) return offscreenReady;
    offscreenReady = import('../src/offscreen.js').catch(function (error) {
      var message =
        'could not load the real engine from ../src/offscreen.js (' + error.message +
        '). It needs src/lib/web-llm.js and src/lib/wasm/*.wasm, which are ' +
        'gitignored — see webGPU/README.md for the curl commands. Add ?engine=mock ' +
        'to the URL to use the keyword stub instead.';
      ragPost({ type: 'error', error: message });
      throw new Error(message);
    });
    return offscreenReady;
  }

  /**
   * Hand a message to whichever listener claims it, using the callback contract
   * offscreen.js expects: it calls respond() and returns true.
   */
  function realDispatch(message) {
    return loadRealEngine().then(function () {
      return new Promise(function (resolve) {
        var settled = false;
        var respond = function (r) { if (!settled) { settled = true; resolve(r); } };
        var claimed = false;
        messageListeners.forEach(function (listener) {
          try {
            if (listener(message, { tab: null }, respond) === true) claimed = true;
          } catch (error) {
            respond({ ok: false, error: String(error) });
          }
        });
        if (!claimed && !settled) resolve({});
      });
    });
  }

  // ---- Local AI (WebGPU) panel ---------------------------------------------
  // rag-panel.js talks to background.js and to an offscreen document, and a
  // plain page has neither. This answers those messages from a keyword-scored
  // index built out of the same data/tickets.json the extension ships, so every
  // path in the panel -- build progress, the hit list, field voting, the
  // streamed answer, the score floor -- can be driven without downloading a
  // 539 MB embedder and a 1.5 GB chat model.
  //
  // The scores are keyword overlap, NOT cosine over real embeddings, and the
  // passages are split on turn markers rather than by chunkConversation(). The
  // panel cannot tell the difference, which is the point; do not read a mock
  // score as a prediction of what the real index will rank.
  var RAG_KEY = 'betterWeb_mock_rag_state';
  var RAG_BUNDLE = '../src/data/tickets.json';
  var ragBundle = null;      // { tickets: [...] } once fetched
  var ragIndex = null;       // [{ ticket_id, chunk_index, text, meta }]
  var ragBuilding = false;

  function ragRead() {
    try {
      return JSON.parse(localStorage.getItem(RAG_KEY) || '{"meta":null,"added":[]}');
    } catch (_error) {
      return { meta: null, added: [] };
    }
  }

  function ragWrite(state) {
    localStorage.setItem(RAG_KEY, JSON.stringify(state));
  }

  function ragPost(message) {
    var envelope = Object.assign({ target: 'popup' }, message);
    messageListeners.forEach(function (listener) {
      try { listener(envelope, { tab: null }, function () {}); } catch (_error) {}
    });
  }

  function ragStatus(text, progress) {
    ragPost({ type: 'status', text: text, progress: progress });
  }

  function ragLoadBundle() {
    if (ragBundle) return Promise.resolve(ragBundle);
    return fetch(RAG_BUNDLE)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (body) {
        ragBundle = { tickets: (body && body.tickets) || [] };
        return ragBundle;
      })
      .catch(function (error) {
        // file:// blocks fetch, so this is the common failure and the message
        // has to name the fix rather than the symptom.
        throw new Error(
          'could not read ' + RAG_BUNDLE + ' (' + error.message + '). Serve testPage/ ' +
          'over http -- "python3 -m http.server" from the repo root -- rather than ' +
          'opening the file directly; file:// blocks fetch.'
        );
      });
  }

  // Split on the User:/Agent: turn markers. An approximation of
  // chunkConversation(), deliberately not a copy of it: there is one real
  // chunker and duplicating it here would be a third copy to keep in step.
  function ragPassages(text) {
    return String(text || '')
      .split(/\n(?=(?:User|Agent):)/)
      .map(function (part) {
        return part
          .split('\n')
          .filter(function (line) {
            return !/^\s*(from|sent|to|cc|subject|date)\s*:/i.test(line) &&
                   !/^\s*[-_=*~]{3,}\s*$/.test(line) &&
                   !/^\s*(o|c|f|t|p|tel|phone|fax|mobile)\s*:\s*[+(\d]/i.test(line) &&
                   !/^\s*this e-?mail/i.test(line);
          })
          .join('\n')
          .trim();
      })
      .filter(function (part) { return part.length > 0; });
  }

  /** Truncate on a word boundary -- "…and I am not sure what th" reads as a bug. */
  function clip(text, max) {
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    var cut = t.slice(0, max);
    var space = cut.lastIndexOf(' ');
    return (space > max * 0.6 ? cut.slice(0, space) : cut) + '…';
  }

  var RAG_STOP = ' the a an and or of to for in on at is are was were be been it this that i you we my our your with not no can cannot do does did how what when '.split(' ');

  function ragTokens(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter(function (w) { return w.length > 2 && RAG_STOP.indexOf(w) === -1; });
  }

  // Document frequency over the built index, so a rare term like "password"
  // outweighs a term every ticket carries. Without it a plain term-count cosine
  // separates a covered query from an uncovered one by about 0.1, which is not
  // enough for the score floor below to mean anything.
  var ragDf = null;

  function ragBuildDf() {
    ragDf = {};
    (ragIndex || []).forEach(function (doc) {
      var seen = {};
      ragTokens(doc.text).forEach(function (w) {
        if (seen[w]) return;
        seen[w] = 1;
        ragDf[w] = (ragDf[w] || 0) + 1;
      });
    });
  }

  function ragIdf(word) {
    var n = (ragIndex || []).length || 1;
    return Math.log((n + 1) / (((ragDf && ragDf[word]) || 0) + 1)) + 1;
  }

  /**
   * tf-idf cosine, returned raw.
   *
   * This used to be scaled onto the band arctic-embed was assumed to occupy, so
   * that an absolute 0.5 floor meant something. The real engine turned out to
   * score a near-verbatim match around 0.38, the absolute floor is gone, and the
   * rank-relative cutoff below works on any range -- so there is nothing left for
   * the scaling to serve.
   */
  function ragScore(queryTokens, docTokens) {
    var q = {}, d = {}, i;
    for (i = 0; i < queryTokens.length; i += 1) q[queryTokens[i]] = (q[queryTokens[i]] || 0) + 1;
    for (i = 0; i < docTokens.length; i += 1) d[docTokens[i]] = (d[docTokens[i]] || 0) + 1;
    var dot = 0, qn = 0, dn = 0;
    Object.keys(q).forEach(function (w) {
      var wq = q[w] * ragIdf(w);
      qn += wq * wq;
      if (d[w]) dot += wq * (d[w] * ragIdf(w));
    });
    Object.keys(d).forEach(function (w) { var wd = d[w] * ragIdf(w); dn += wd * wd; });
    if (!qn || !dn) return 0;
    return +(dot / Math.sqrt(qn * dn)).toFixed(3);
  }

  function ragBuild(force) {
    var state = ragRead();
    if (state.meta && ragIndex && !force) return Promise.resolve({ meta: state.meta, skipped: true });

    ragBuilding = true;
    return ragLoadBundle()
      .then(function (bundle) {
        var sources = bundle.tickets
          .map(function (t) { return { record: t, uploaded: false }; })
          .concat(ragRead().added.map(function (t) { return { record: t, uploaded: true }; }));

        if (!sources.length) throw new Error('no tickets to build from');

        ragIndex = [];
        var started = Date.now();
        sources.forEach(function (entry, n) {
          ragStatus(
            (entry.uploaded ? 're-embedding uploaded' : 'embedding') + ' ticket ' +
              entry.record.ticket_id + ' (' + (n + 1) + '/' + sources.length + ')…',
            (n + 1) / sources.length
          );
          ragPassages(entry.record.text).forEach(function (text, chunk_index) {
            ragIndex.push({
              ticket_id: entry.record.ticket_id,
              chunk_index: chunk_index,
              text: text,
              meta: Object.assign({}, entry.record.meta, {
                ticket_id: entry.record.ticket_id,
                chunk_index: chunk_index
              })
            });
          });
        });

        ragBuildDf();

        var meta = {
          model: 'mock-keyword-index (no embedder in the test page)',
          dim: 0,
          count: ragIndex.length,
          added: ragRead().added.length,
          bundled: bundle.tickets.length,
          builtAt: new Date().toISOString(),
          sourceFile: RAG_BUNDLE,
          source: 'bundle',
          seconds: +((Date.now() - started) / 1000).toFixed(1)
        };
        var next = ragRead();
        next.meta = meta;
        ragWrite(next);
        ragStatus('indexed ' + meta.count + ' passages from ' + sources.length + ' tickets (mock)');
        ragPost({ type: 'index-updated' });
        return { meta: meta };
      })
      .finally(function () { ragBuilding = false; });
  }

  /** Rebuild the in-memory index if a previous page load left only its meta. */
  function ragEnsureIndex() {
    if (ragIndex) return Promise.resolve();
    // No meta means no index -- either never built, or just cleared. Rebuilding
    // here would undo a delete the moment anything asked for the list.
    if (!ragRead().meta) return Promise.resolve();
    return ragBuild(true).then(function () {});
  }

  function ragRetrieve(query, pool) {
    var qt = ragTokens(query);
    return (ragIndex || [])
      .map(function (doc) { return Object.assign({}, doc, { score: ragScore(qt, ragTokens(doc.text)) }); })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, pool);
  }

  // Mirrors ask() in offscreen.js: cap two passages per ticket, drop anything
  // under the floor, attach the ticket opener. Kept in step deliberately -- the
  // test page is where those paths get exercised without a GPU.
  function ragCapPerTicket(hits, k, perTicket) {
    var taken = {}, out = [];
    for (var i = 0; i < hits.length && out.length < k; i += 1) {
      var id = String(hits[i].ticket_id);
      if ((taken[id] || 0) >= perTicket) continue;
      taken[id] = (taken[id] || 0) + 1;
      out.push(hits[i]);
    }
    return out;
  }

  // Same rule as ask() in offscreen.js: keep what is comparable to the best hit,
  // and refuse only when nothing clears the bare guard.
  var RAG_RELATIVE_FLOOR = 0.75;
  var RAG_ABSOLUTE_FLOOR = 0.15;

  function ragOpener(ticketId) {
    var first = (ragIndex || []).filter(function (d) {
      return String(d.ticket_id) === String(ticketId) && d.chunk_index === 0;
    })[0];
    return first ? first.text : null;
  }

  var RAG_FIELDS = ['service_type', 'ticket_type', 'request_type', 'app_hardware', 'assignment_group'];

  function ragVote(hits, field) {
    var weights = {};
    hits.forEach(function (h) {
      var v = h.meta && h.meta[field];
      if (!v || h.score <= 0) return;
      weights[v] = (weights[v] || 0) + h.score;
    });
    var ranked = Object.keys(weights).sort(function (a, b) { return weights[b] - weights[a]; });
    if (!ranked.length) return { value: null, confidence: 0, votes: 0 };
    var total = ranked.reduce(function (n, k) { return n + weights[k]; }, 0);
    return {
      value: ranked[0],
      confidence: +(weights[ranked[0]] / total).toFixed(4),
      votes: hits.filter(function (h) { return h.meta && h.meta[field] === ranked[0]; }).length
    };
  }

  function ragAsk(query) {
    var t0 = Date.now();
    var pool = ragRetrieve(query, 40);
    var best = pool.length ? pool[0].score : 0;
    var cutoff = Math.max(RAG_ABSOLUTE_FLOOR, best * RAG_RELATIVE_FLOOR);
    var hits = ragCapPerTicket(
      pool.filter(function (h) { return h.score >= cutoff; }), 6, 2
    );

    if (!hits.length) {
      ragPost({ type: 'hits', hits: pool.slice(0, 6), embedMs: 0, searchMs: Date.now() - t0 });
      ragPost({
        type: 'delta',
        delta:
          'Nothing in the index matches this question at all.\n\n' +
          'Every passage scored below the absolute guard. (Mock engine: keyword ' +
          'overlap, not embeddings — the real index scores differently.)'
      });
      ragPost({ type: 'done', firstTokenMs: 0, totalMs: Date.now() - t0, stats: null });
      return;
    }

    ragPost({ type: 'hits', hits: hits, embedMs: 0, searchMs: Date.now() - t0 });

    // Stream something a token at a time so the panel's delta accumulation and
    // scroll-to-bottom are exercised. It deliberately does not try to sound like
    // an answer: the useful thing a stub can show is what the real model would
    // have been given, plus how to go and get a real answer.
    var tickets = Object.keys(hits.reduce(function (a, h) { a[h.ticket_id] = 1; return a; }, {}));
    var top = hits[0];
    var opener = ragOpener(top.ticket_id);

    var answer =
      'NO ANSWER WAS GENERATED — this page is running the keyword stub, not a ' +
      'language model, because the URL carries ?engine=mock. Drop that parameter ' +
      'to load the real arctic-embed and gemma-2b-it and get a written answer. ' +
      '(First run downloads about 2 GB.)\n\n' +
      'Retrieval did run, and it is the part worth checking here. It kept ' +
      hits.length + ' passage' + (hits.length === 1 ? '' : 's') + ' from ' +
      tickets.length + ' ticket' + (tickets.length === 1 ? '' : 's') + ' (' +
      tickets.join(', ') + '), scoring ' + top.score.toFixed(3) + ' down to ' +
      hits[hits.length - 1].score.toFixed(3) + '. Anything below ' +
      Math.round(RAG_RELATIVE_FLOOR * 100) + '% of the best hit was dropped.\n\n' +
      'Best passage [1], from ticket ' + top.ticket_id + ' — this is the text the ' +
      'real model would answer from:\n\n' + clip(top.text, 700) +
      (opener && top.chunk_index !== 0
        ? '\n\nIts ticket opens: ' + clip(opener, 200)
        : '');

    var words = answer.split(' ');
    var i = 0;
    var firstTokenMs = null;
    var timer = setInterval(function () {
      if (i >= words.length) {
        clearInterval(timer);
        ragPost({ type: 'done', firstTokenMs: firstTokenMs, totalMs: Date.now() - t0, stats: null });
        return;
      }
      if (firstTokenMs === null) firstTokenMs = Date.now() - t0;
      ragPost({ type: 'delta', delta: (i ? ' ' : '') + words[i] });
      i += 1;
    }, 12);
  }

  /** Answer one rag-panel message. Returns a promise, or null if not ours. */
  function ragHandle(message) {
    if (!message || (message.target !== 'offscreen' && message.target !== 'background')) return null;
    var type = message.type;

    // Answered here in both modes: offscreen.js has no handler for them, they
    // belong to background.js. A service worker genuinely has no WebGPU, so
    // reporting it missing is accurate rather than a stub.
    if (type === 'ensure-offscreen') return REAL_ENGINE ? loadRealEngine().then(function () { return {}; }) : Promise.resolve({});
    if (type === 'probe-sw-webgpu') return Promise.resolve({ hasNavigatorGpu: false });

    // Everything else is offscreen.js's own protocol, so in real mode hand it
    // straight over rather than imitating it.
    if (REAL_ENGINE && message.target === 'offscreen') return realDispatch(message);

    // Says plainly that no model is running. In real mode this never fires --
    // the dispatch above hands 'engine-status' to offscreen.js, which answers
    // with the actual models and their load state.
    if (type === 'engine-status') {
      return Promise.resolve({
        ok: true,
        engine: 'keyword stub',
        real: false,
        hint: 'selected by ?engine=mock — drop it from the URL for real models',
        hasNavigatorGpu: 'gpu' in navigator,
        vendor: null,
        architecture: null,
        models: [
          { role: 'embedding', id: 'none — tf-idf keyword scoring', state: 'not loaded', vram: null },
          { role: 'chat', id: 'none — the answer is assembled by the stub', state: 'not loaded', vram: null }
        ]
      });
    }

    if (type === 'webgpu-probe') {
      return Promise.resolve({
        hasNavigatorGpu: 'gpu' in navigator,
        vendor: 'mock', architecture: 'test page'
      });
    }

    if (type === 'index-status') {
      return ragEnsureIndex().then(function () {
        var state = ragRead();
        return {
          meta: state.meta,
          count: ragIndex ? ragIndex.length : 0,
          added: state.added.length,
          building: ragBuilding
        };
      });
    }

    if (type === 'build-index') return ragBuild(Boolean(message.force));

    if (type === 'list-tickets') {
      // Same shape and same rule as offscreen.js: list what is INDEXED, so that
      // clearing the index visibly empties this list.
      return ragEnsureIndex().then(function () {
        var indexed = {};
        (ragIndex || []).forEach(function (d) {
          var id = String(d.ticket_id);
          var e = indexed[id] || (indexed[id] = { ticket_id: id, chunks: 0, chars: 0, preview: '' });
          e.chunks += 1;
          e.chars += (d.text || '').length;
          if (d.chunk_index === 0) e.preview = (d.text || '').slice(0, 160);
        });

        var uploaded = ragRead().added.map(function (t) {
          var id = String(t.ticket_id);
          return {
            ticket_id: t.ticket_id, source: 'upload', addedAt: t.addedAt,
            chars: (t.text || '').length, preview: (t.text || '').slice(0, 160),
            chunks: indexed[id] ? indexed[id].chunks : 0,
            indexed: Boolean(indexed[id]), meta: t.meta || {}
          };
        });
        var ids = {};
        uploaded.forEach(function (t) { ids[String(t.ticket_id)] = 1; });

        var bundled = Object.keys(indexed)
          .filter(function (id) { return !ids[id]; })
          .map(function (id) {
            return {
              ticket_id: id, source: 'bundle', addedAt: null,
              chars: indexed[id].chars, chunks: indexed[id].chunks,
              indexed: true, preview: indexed[id].preview, meta: {}
            };
          });

        var all = uploaded.concat(bundled);
        return {
          ok: true,
          total: all.length,
          uploaded: uploaded.length,
          bundled: bundled.length,
          indexedTickets: Object.keys(indexed).length,
          tickets: all.slice(0, Math.max(0, Number(message.limit) || 0))
        };
      }).catch(function (error) { return { ok: false, error: error.message }; });
    }

    if (type === 'add-ticket') {
      var state = ragRead();
      var id = String((message.meta && message.meta.ticket_id) || '').trim();
      if (!id) return Promise.resolve({ ok: false, error: 'a ticket id is required' });
      if (!String(message.text || '').trim()) {
        return Promise.resolve({ ok: false, error: 'nothing to add — paste the ticket text first' });
      }
      if (state.added.some(function (t) { return t.ticket_id === id; })) {
        return Promise.resolve({ ok: false, error: 'ticket ' + id + ' was already uploaded earlier' });
      }
      state.added.push({
        ticket_id: id, text: message.text, meta: message.meta || {},
        addedAt: new Date().toISOString()
      });
      ragWrite(state);
      return ragBuild(true).then(function () {
        return { ok: true, ticket_id: id, chunks: ragPassages(message.text).length };
      });
    }

    if (type === 'delete-tickets') {
      var current = ragRead();
      var removed = current.added.length;
      ragWrite({ meta: null, added: [] });
      ragIndex = null;
      ragPost({ type: 'index-updated' });
      return Promise.resolve({ ok: true, removed: removed });
    }

    if (type === 'classify') {
      return ragEnsureIndex().then(function () {
        if (!ragIndex || !ragIndex.length) {
          return { ok: false, error: 'nothing indexed yet — press Build index first' };
        }
        var t0 = Date.now();
        // Classification ranks only first passages, the way offscreen.js does.
        var qt = ragTokens(message.query);
        var hits = ragIndex
          .filter(function (d) { return d.chunk_index === 0; })
          .map(function (d) { return Object.assign({}, d, { score: ragScore(qt, ragTokens(d.text)) }); })
          .sort(function (a, b) { return b.score - a.score; })
          .slice(0, 15);
        var fields = {};
        RAG_FIELDS.forEach(function (f) { fields[f] = ragVote(hits, f); });
        return { ok: true, fields: fields, hits: hits, embedMs: 0, searchMs: Date.now() - t0 };
      });
    }

    if (type === 'ask') {
      return ragEnsureIndex().then(function () {
        if (!ragIndex || !ragIndex.length) {
          ragPost({ type: 'error', error: 'nothing indexed yet — press Build index first' });
          return {};
        }
        ragAsk(message.query);
        return {};
      });
    }

    return null;
  }

  function seedStorage(rawConfig) {
    var payload = buildConfigPayload(rawConfig);
    var myConfigs = {
      0: ['current', 'Config1'],
      1: ['Config1', 'incidentList.html incident.do.html file:// localhost 127.0.0.1']
    };

    var store = readStore();
    store.myConfigs = JSON.stringify(myConfigs);
    store.configa = JSON.stringify(payload);
    store.lastDownloadDate = Date.now();
    writeStore(store);
  }

  function loadScript(src, marker) {
    return new Promise(function (resolve, reject) {
      if (marker && document.querySelector('script[data-betterweb="' + marker + '"]')) {
        resolve();
        return;
      }

      var script = document.createElement('script');
      script.src = src;
      if (marker) script.setAttribute('data-betterweb', marker);
      script.onload = function () { resolve(); };
      script.onerror = function (error) { reject(error); };
      document.body.appendChild(script);
    });
  }

  function createConfigEditorUI() {
    // Navigation sidebar provides options-page access in mock pages.
    return;
  }

  function resolveConfig() {
    var savedConfig = readUserConfig();
    if (savedConfig) {
      return Promise.resolve(savedConfig);
    }

    var fallback = buildFallbackConfigData();
    writeUserConfig(fallback);
    return Promise.resolve(fallback);
  }

  function resolveConfigSync() {
    var savedConfig = readUserConfig();
    if (savedConfig) {
      return savedConfig;
    }

    var fallback = buildFallbackConfigData();
    writeUserConfig(fallback);
    return fallback;
  }

  function bootstrap() {
    ensureChromeShim();

    var initialConfig = resolveConfigSync();
    seedStorage(initialConfig);

    return resolveConfig()
      .then(function () {
        return Promise.resolve();
      })
      .then(function () {
        if (isMockOptionsPage()) {
          return Promise.resolve();
        }
        if (window.jQuery) {
          return Promise.resolve();
        }
        return loadScript('../src/jquery-3.7.1.slim.min.js', 'jquery');
      })
      .then(function () {
        if (isMockOptionsPage()) {
          return Promise.resolve();
        }
        return loadScript('../src/content.js', 'content');
      })
      .catch(function (error) {
        console.error('Failed to bootstrap mock extension environment:', error);
      });
  }

  // The shim goes in while this script evaluates, not on DOMContentLoaded.
  // rag-panel.js is a module, so it runs after parsing but *before* that event,
  // and its top-level chrome.runtime.onMessage.addListener would throw on a
  // chrome that does not exist yet. bootstrap() still waits, because it needs
  // the DOM.
  ensureChromeShim();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();