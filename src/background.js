let model_loaded = !1, context = "", chatQuestion, chatResults, originalTabID, firstClassificationTabID = -100;

var window;

void 0 === window && (window = {});

let lastTabId = 0;

const ALLOWED_CONTENT_HOSTS = [ "chatgpt.com", "teams.microsoft.com", "github.com", "claude.ai" ];

let grantedHostCache = new Set();

function setGrantedHosts(origins) {
  grantedHostCache = new Set(staticMatches().concat(origins || []).filter(o => "<all_urls>" !== o).map(patternHost).filter(Boolean));
}

async function refreshGrantedHosts() {
  return setGrantedHosts((await chrome.permissions.getAll()).origins), grantedHostCache;
}

function isUserGrantedHost(host) {
  for (const granted of grantedHostCache) if (host === granted || host.endsWith("." + granted)) return !0;
  return !1;
}

function isAllowedSenderUrl(rawUrl) {
  if (!rawUrl || "string" != typeof rawUrl) return !1;
  try {
    var parsed = new URL(rawUrl);
    if ("chrome-extension:" === parsed.protocol) return parsed.host === chrome.runtime.id;
    if ("https:" === parsed.protocol) {
      var host = parsed.hostname.toLowerCase();
      if (ALLOWED_CONTENT_HOSTS.includes(host) || host.endsWith(".service-now.com") || host.endsWith(".claude.ai") || host.endsWith(".github.io")) return !0;
      if (isUserGrantedHost(host)) return !0;
      refreshGrantedHosts().catch(e => {});
    }
    return !1;
  } catch (e) {
    return !1;
  }
}

function isTrustedMessageSender(sender) {
  return !(!sender || sender.id !== chrome.runtime.id) && (sender.url ? isAllowedSenderUrl(sender.url) : !(!sender.tab || !sender.tab.url) && isAllowedSenderUrl(sender.tab.url));
}

refreshGrantedHosts().catch(e => {}), chrome.runtime.onInstalled.addListener(async function(details) {
  syncUserSiteScripts().catch(e => {}), "install" == details.reason && chrome.tabs.create({
    url: "options.html"
  }), chrome.storage.local.set({
    lastDownloadDate: Date.now()
  }, function() {
    chrome.runtime.lastError;
  });
});

const USER_SITES_SCRIPT_ID = "betterweb-user-sites", CONTENT_SCRIPT_FILES = [ "jquery-3.7.1.slim.min.js", "content.js" ], DARK_CSS_SCRIPT_ID = "betterweb-dark-css";

function darkModeIsOn(value) {
  value = String(null == value ? "" : value).trim().toLowerCase();
  return "yes" === value || "true" === value || "on" === value || "1" === value;
}

async function syncDarkModeCss() {
  var [ {
    darkMode
  }, granted ] = await Promise.all([ chrome.storage.local.get([ "darkMode" ]), chrome.permissions.getAll() ]), existing = await chrome.scripting.getRegisteredContentScripts({
    ids: [ DARK_CSS_SCRIPT_ID ]
  }).catch(() => []);
  return darkModeIsOn(darkMode) ? (darkMode = Array.from(new Set(staticMatches().concat((granted.origins || []).filter(o => "<all_urls>" !== o))))).length ? (granted = {
    id: DARK_CSS_SCRIPT_ID,
    matches: darkMode,
    css: [ "dark.css" ],
    runAt: "document_start",
    allFrames: !0,
    persistAcrossSessions: !0
  }, existing.length ? await chrome.scripting.updateContentScripts([ granted ]) : await chrome.scripting.registerContentScripts([ granted ]), 
  {
    on: !0,
    matches: darkMode
  }) : {
    on: !0,
    matches: []
  } : (existing.length && await chrome.scripting.unregisterContentScripts({
    ids: [ DARK_CSS_SCRIPT_ID ]
  }), {
    on: !1
  });
}

function staticMatches() {
  return (chrome.runtime.getManifest().content_scripts || []).reduce((all, s) => all.concat(s.matches || []), []);
}

function patternHost(pattern) {
  return (String(pattern).split("://")[1] || "").split("/")[0].replace(/^\*\./, "").toLowerCase();
}

function coveredByManifest(origin, staticHosts) {
  const host = patternHost(origin);
  return staticHosts.some(sh => host === sh || host.endsWith("." + sh));
}

async function syncUserSiteScripts() {
  var granted = await chrome.permissions.getAll();
  setGrantedHosts(granted.origins);
  const staticHosts = staticMatches().map(patternHost);
  var script, granted = (granted.origins || []).filter(o => "<all_urls>" !== o).filter(o => !coveredByManifest(o, staticHosts)), existing = await chrome.scripting.getRegisteredContentScripts({
    ids: [ USER_SITES_SCRIPT_ID ]
  }).catch(() => []);
  return granted.length ? (script = {
    id: USER_SITES_SCRIPT_ID,
    matches: granted,
    js: CONTENT_SCRIPT_FILES,
    runAt: "document_end",
    allFrames: !1,
    persistAcrossSessions: !0
  }, existing.length ? await chrome.scripting.updateContentScripts([ script ]) : await chrome.scripting.registerContentScripts([ script ]), 
  await syncDarkModeCss().catch(e => {}), {
    origins: granted
  }) : (existing.length && await chrome.scripting.unregisterContentScripts({
    ids: [ USER_SITES_SCRIPT_ID ]
  }), {
    origins: []
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  "local" === area && changes.darkMode && syncDarkModeCss().catch(e => {});
}), syncDarkModeCss().catch(e => {}), chrome.commands.onCommand.addListener(command => {
  "dev-reload" === command && chrome.runtime.getManifest().name.endsWith(" dev") && chrome.runtime.reload();
}), chrome.runtime.onStartup.addListener(() => syncUserSiteScripts().catch(e => {})), 
chrome.permissions.onAdded.addListener(() => syncUserSiteScripts().catch(e => {})), 
chrome.permissions.onRemoved.addListener(() => syncUserSiteScripts().catch(e => {}));

let creatingOffscreen = null, localAskTabId = null;

async function ensureOffscreen() {
  var contexts = await chrome.runtime.getContexts({
    contextTypes: [ "OFFSCREEN_DOCUMENT" ]
  });
  if (!contexts.length) {
    creatingOffscreen = creatingOffscreen || chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: [ "WORKERS" ],
      justification: "Runs the local models with WebGPU, unavailable in the service worker."
    });
    try {
      await creatingOffscreen;
    } finally {
      creatingOffscreen = null;
    }
  }
}

async function callOffscreen(message) {
  await ensureOffscreen();
  message = await chrome.runtime.sendMessage(Object.assign({
    target: "offscreen"
  }, message));
  if (!message) throw new Error("no response from the local engine");
  if (!1 === message.ok) throw new Error(message.error || "local engine failed");
  return message;
}

async function probeServiceWorkerWebGpu() {
  var has = "undefined" != typeof navigator && "gpu" in navigator;
  let adapter = null;
  return {
    hasNavigatorGpu: has,
    adapter: (adapter = has ? await navigator.gpu.requestAdapter().catch(() => null) : adapter) && adapter.info && adapter.info.vendor || null
  };
}

const LOCAL_CHAT_MODEL = "gemma-2b-it-q4f16_1-MLC", TICKET_META_FIELDS = [ "ticket_id", "service_type", "ticket_type", "request_type", "app_hardware", "assignment_group" ];

function formatLocalClassification(result) {
  const f = result.fields || {};
  var val = name => f[name] && f[name].value || "N/A";
  return {
    ok: !0,
    classification: `Service: ${val("service_type")} | Ticket Type: ` + val("ticket_type") + ` | Request Type: ${val("request_type")} | App/Hardware: ` + val("app_hardware") + " | Assignment Group: " + val("assignment_group"),
    referenceTickets: (result.hits || []).map(hit => ({
      id: hit.id,
      score: hit.score,
      metadata: hit.meta || {},
      chunk_preview: (hit.text || "").slice(0, 220)
    })),
    local: !0
  };
}

function scheduleAlarm() {
  chrome.alarms.create("audioAlarm", {
    delayInMinutes: 1
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (!request) return !1;
  if ("offscreen" === request.target) return !1;
  if ("popup" === request.target) return null !== localAskTabId && void 0 !== localAskTabId && ("delta" === request.type ? chrome.tabs.sendMessage(localAskTabId, {
    type: "phi3-stream-chunk",
    chunk: request.delta
  }) : "error" === request.type ? (chrome.tabs.sendMessage(localAskTabId, {
    type: "phi3-stream-chunk",
    chunk: "[ERROR] " + request.error
  }), localAskTabId = null) : "done" === request.type && (localAskTabId = null)), 
  !1;
  if ("ensure-offscreen" === request.type) return ensureOffscreen().then(() => sendResponse({
    ok: !0
  }), err => sendResponse({
    ok: !1,
    error: err.message
  })), !0;
  if ("sync-site-scripts" === request.type) return syncUserSiteScripts().then(result => sendResponse({
    ok: !0,
    origins: result.origins
  }), err => sendResponse({
    ok: !1,
    error: err.message
  })), !0;
  if ("probe-sw-webgpu" === request.type) return probeServiceWorkerWebGpu().then(sendResponse, err => sendResponse({
    ok: !1,
    error: err.message
  })), !0;
  if ("query-phi3-stream" === request.type) return localAskTabId = sender.tab && void 0 !== sender.tab.id ? sender.tab.id : null, 
  callOffscreen({
    type: "ask",
    query: request.prompt,
    modelId: LOCAL_CHAT_MODEL
  }).then(() => sendResponse({
    ok: !0
  })).catch(err => {
    localAskTabId = null, sender.tab && void 0 !== sender.tab.id && chrome.tabs.sendMessage(sender.tab.id, {
      type: "phi3-stream-chunk",
      chunk: "[ERROR] " + err.message
    }), sendResponse({
      ok: !1,
      error: err.message
    });
  }), !0;
  if ("upload-conversation" === request.type) {
    const uploadPayload = request.data || request.conversation || {}, meta = {};
    return TICKET_META_FIELDS.forEach(field => {
      uploadPayload[field] && (meta[field] = uploadPayload[field]);
    }), callOffscreen({
      type: "add-ticket",
      text: uploadPayload.conversation || "",
      meta: meta
    }).then(result => sendResponse({
      ok: !0,
      message: `ok, added ${result.chunks} chunks to the local index`,
      data: result
    })).catch(err => sendResponse({
      ok: !1,
      error: err.message
    })), !0;
  }
  if ("classify-conversation" === request.type) return callOffscreen({
    type: "classify",
    query: (request.data || request.conversation || {}).conversation || ""
  }).then(result => sendResponse(formatLocalClassification(result))).catch(err => sendResponse({
    ok: !1,
    error: err.message
  })), !0;
  if ("string" == typeof request.greeting) {
    if (!isTrustedMessageSender(sender)) return sendResponse({
      farewell: "unauthorized sender"
    }), !1;
    if (!sender.tab || -1 === sender.url.indexOf("service-now.com") && -1 === sender.url.indexOf("github.io") || void 0 === sender.tab.id || (originalTabID = sender.tab.id), 
    "hello" === request.greeting) sendResponse({
      farewell: "goodbye"
    }); else if (request.greeting.startsWith("answerFromChatgpt")) sendResponse({
      farewell: "Answer received"
    }), chrome.tabs.update(originalTabID, {
      active: !0
    }), chrome.tabs.sendMessage(originalTabID, {
      greeting: "answerFromChatgptBackground",
      chatAnswer: request.greeting
    }); else if (request.greeting.startsWith("Open")) {
      sendResponse({
        farewell: "url will open"
      });
      var baseUrl, arr = request.greeting.split(" ");
      5 < arr.length ? chrome.tabs.query({
        active: !0,
        currentWindow: !0
      }, function(tabs) {
        for (let i = arr.length - 4; 0 < i; i--) i == arr.length - 4 ? chrome.tabs.update(tabs[0].id, {
          url: arr[i]
        }) : chrome.tabs.create({
          url: arr[i],
          index: sender.tab.index
        });
      }) : -1 !== request.greeting.indexOf("new tab") ? (baseUrl = arr[1], chrome.tabs.query({
        url: baseUrl + "/*"
      }, tabs => {
        0 < tabs.length ? (chrome.tabs.update(tabs[0].id, {
          active: !0
        }), chrome.tabs.reload(tabs[0].id.id)) : chrome.tabs.create({
          url: arr[1],
          index: sender.tab.index
        });
      })) : chrome.storage.local.get([ "classifyTicketList" ], function(result) {
        void 0 !== result.classifyTicketList ? 0 < firstClassificationTabID ? chrome.tabs.get(firstClassificationTabID, function(tab) {
          chrome.runtime.lastError ? chrome.tabs.create({
            url: arr[1],
            active: !1
          }, function(tab) {
            firstClassificationTabID = tab.id, chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              tabId === tab.id && "complete" === info.status && chrome.tabs.onUpdated.removeListener(listener);
            });
          }) : chrome.tabs.update(firstClassificationTabID, {
            url: arr[1],
            active: !1
          }, function(tab) {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              tabId === firstClassificationTabID && "complete" === info.status && chrome.tabs.onUpdated.removeListener(listener);
            });
          });
        }) : -100 == firstClassificationTabID && chrome.tabs.create({
          url: arr[1],
          active: !1
        }, function(tab) {
          firstClassificationTabID = tab.id, chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            tabId === tab.id && "complete" === info.status && chrome.tabs.onUpdated.removeListener(listener);
          });
        }) : chrome.tabs.query({
          active: !0,
          currentWindow: !0
        }, function(tabs) {
          chrome.tabs.update(tabs[0].id, {
            url: arr[1]
          });
        });
      });
    } else if ("activateTheClassificationTab" === request.greeting) chrome.tabs.update(firstClassificationTabID, {
      active: !0
    }), sendResponse({
      farewell: "activated"
    }); else if ("closeClassificationTab" === request.greeting) -100 !== firstClassificationTabID && chrome.tabs.remove(firstClassificationTabID, function() {
      chrome.runtime.lastError || (firstClassificationTabID = -100);
    }), sendResponse({
      farewell: "classification tab closed"
    }); else if ("switchToLeftTab" === request.greeting) chrome.tabs.remove(sender.tab.id), 
    chrome.tabs.query({
      currentWindow: !0
    }, function(tabs) {
      tabs = tabs.filter(tab => tab.url && tab.url.includes("service-now.com")).sort((a, b) => a.index - b.index)[0];
      tabs && void 0 !== tabs.id && chrome.tabs.update(tabs.id, {
        active: !0
      }, function() {
        chrome.runtime.lastError;
      });
    }); else if (request.greeting.startsWith("closeTab")) chrome.tabs.query({}).then(tabs => {
      chrome.tabs.query({
        active: !0,
        currentWindow: !0
      }).then(activeTabs => {
        activeTabs[0].id, tabs.findIndex(tab => tab.id === originalTabID);
        let serviceNowTab = null;
        activeTabs = tabs.filter(tab => tab.url && (tab.url.includes("service-now.com") || tab.url.includes("github.io")));
        1 < activeTabs.length ? serviceNowTab = activeTabs[activeTabs.length - 1] : 1 == activeTabs.length && (serviceNowTab = activeTabs[0]), 
        chrome.tabs.remove(originalTabID), chrome.storage.local.get([ "upDownClicked" ], function(result) {
          void 0 !== result.upDownClicked && "yes" === result.upDownClicked && (chrome.tabs.reload(serviceNowTab.id), 
          chrome.storage.local.remove("upDownClicked", function() {}));
        }), 2 === activeTabs.length && chrome.tabs.update(serviceNowTab.id, {
          active: !0
        });
      });
    }), sendResponse({
      farewell: "closed"
    }); else if (request.greeting.startsWith("saveChat")) {
      let filename = request.greeting.split(/\s+/)[1] + ".result.txt";
      chrome.storage.local.get([ "chatResults" ], function(result) {
        void 0 !== result.chatResults ? (result = result.chatResults, filename, 
        result = new Blob([ result ], {
          type: "text/plain"
        }), result = URL.createObjectURL(result), chrome.downloads.download({
          url: result,
          filename: filename,
          saveAs: !0
        }), sendResponse({
          farewell: "chat result saved."
        })) : sendResponse({
          farewell: "No chat results found."
        });
      });
    } else "toggle" === request.greeting ? (chrome.tabs.query({
      active: !0,
      currentWindow: !0
    }).then(activeTabs => {
      const activeTabId = activeTabs[0].id;
      chrome.tabs.query({}, function(tabs) {
        var activeTabIndex = tabs.findIndex(tab => tab.id === activeTabId);
        0 != lastTabId && lastTabId === tabs[tabs.length - 1].id || (lastTabId = tabs[tabs.length - 1].id);
        let nextTab;
        nextTab = activeTabIndex === tabs.length - 1 ? tabs.find(tab => tab.id === lastTabId) : tabs[activeTabIndex + 1], 
        chrome.tabs.update(nextTab.id, {
          active: !0
        }), chrome.storage.local.get([ "upDownClicked" ], function(result) {
          void 0 !== result.upDownClicked && "yes" === result.upDownClicked && (chrome.tabs.reload(nextTab.id), 
          chrome.storage.local.remove("upDownClicked", function() {}));
        });
      });
    }), sendResponse({
      farewell: "toggled"
    })) : request.greeting.startsWith("setAlarm") ? (sendResponse({
      farewell: "alarm is set up."
    }), chrome.alarms.create("audioAlarm", {
      delayInMinutes: Math.floor(Number(request.greeting.split(" ")[1]))
    })) : sendResponse({
      farewell: "unknown request"
    });
    return !0;
  }
});