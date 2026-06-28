let model_loaded = !1, context = "", chatQuestion, chatResults, originalTabID, firstClassificationTabID = -100;

var window;

void 0 === window && (window = {});

let lastTabId = 0;

const ALLOWED_CONTENT_HOSTS = [ "chatgpt.com", "sandbox.ai.huit.harvard.edu", "teams.microsoft.com", "github.com", "claude.ai" ];

function isAllowedSenderUrl(rawUrl) {
  if (!rawUrl || "string" != typeof rawUrl) return !1;
  try {
    var host, parsed = new URL(rawUrl);
    return "chrome-extension:" === parsed.protocol ? parsed.host === chrome.runtime.id : "https:" === parsed.protocol && (host = parsed.hostname.toLowerCase(), 
    ALLOWED_CONTENT_HOSTS.includes(host) || host.endsWith(".service-now.com") || host.endsWith(".claude.ai") || host.endsWith(".github.io"));
  } catch (e) {
    return !1;
  }
}

function isTrustedMessageSender(sender) {
  return !(!sender || sender.id !== chrome.runtime.id) && (sender.url ? isAllowedSenderUrl(sender.url) : !(!sender.tab || !sender.tab.url) && isAllowedSenderUrl(sender.tab.url));
}

function contextMenuAction(info, tab) {
  chrome.tabs.sendMessage(tab.id, {
    greeting: "SaveToProfile:" + info.selectionText
  }, function(response) {});
}

function scheduleAlarm() {
  chrome.alarms.create("audioAlarm", {
    delayInMinutes: 1
  });
}

chrome.runtime.onInstalled.addListener(function(details) {
  "install" == details.reason && chrome.tabs.create({
    url: "options.html"
  }), chrome.storage.local.set({
    lastDownloadDate: Date.now()
  }, function() {
    chrome.runtime.lastError;
  });
}), chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request && "string" == typeof request.greeting) {
    if (!isTrustedMessageSender(sender)) return sendResponse({
      farewell: "unauthorized sender"
    }), !1;
    if (sender.tab && void 0 !== sender.tab.id && (originalTabID = sender.tab.id), 
    "hello" === request.greeting) sendResponse({
      farewell: "goodbye"
    }); else {
      if ("Upload ticket" === request.greeting) return fetch("http://localhost:5000/upload_and_summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversation: request.conversation
        })
      }).then(res => res.json()).then(data => {
        sendResponse({
          status: "success",
          message: data.message || "ticket uploaded."
        });
      }).catch(err => {
        sendResponse({
          status: "error",
          message: err.message
        });
      }), !0;
      if ("setupSaveSelectionMemu" == request.greeting) chrome.contextMenus.create({
        id: "tst",
        title: "Save into Auto expand",
        contexts: [ "selection" ]
      }, onCreated), chrome.contextMenus.onClicked.addListener(contextMenuAction), 
      sendResponse({
        farewell: "menu set up finished."
      }); else {
        if (request.greeting.startsWith("askChatgptBackground")) {
          sender.tab && void 0 !== sender.tab.id && (originalTabID = sender.tab.id);
          const currentURL = sender.tab && sender.tab.url || sender.url || "";
          let useBackgroundAPI, aiProvider = "ollama", ollamaUrl = "http://localhost:11434", ollamaModel = "llama3.2:3b", openaiApiKey = "", myID, leftURL, rightURL, chatSessionURL;
          const extOrigin = "chrome-extension://" + chrome.runtime.id;
          return chrome.storage.local.get(null, async function(items) {
            var filteredKeys = Object.keys(items).filter(key => key.endsWith("myID"));
            filteredKeys.forEach(key => {
              var domain = key.slice(0, -"myID".length);
              2 < domain.length && -1 != currentURL.indexOf(domain) && (myID = items[key], 
              leftURL = items[domain + "leftURL"], rightURL = items[domain + "rightURL"], 
              useBackgroundAPI = items[domain + "useBackgroundAPI"] || !1, aiProvider = items[domain + "apiProvider"] || "ollama", 
              ollamaUrl = items[domain + "ollamaUrl"] || "", ollamaModel = items[domain + "ollamaModel"] || "", 
              openaiApiKey = items[domain + "openaiApiKey"] || "", chatSessionURL = items[domain + "chatSessionURL"]);
            });
            try {
              let answer = "";
              if ("ollama" === aiProvider) {
                var baseUrls = Array.from(new Set([ ollamaUrl.replace(/\/$/, ""), ollamaUrl.replace("localhost", "127.0.0.1").replace(/\/$/, "") ]));
                let lastError = null;
                for (const base of baseUrls) try {
                  try {
                    await fetch(base + "/", {
                      method: "HEAD"
                    });
                  } catch (e) {}
                  var response = await fetch(base + "/api/generate", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      model: ollamaModel,
                      keep_alive: "30m",
                      prompt: request.question,
                      stream: !1,
                      options: {
                        num_predict: 512,
                        num_ctx: 2048
                      }
                    })
                  }), text = await response.text();
                  let data;
                  try {
                    data = JSON.parse(text);
                  } catch (e) {
                    throw new Error(`Non-JSON response from Ollama (${response.status}): ` + text.slice(0, 200));
                  }
                  if (!response.ok) throw new Error(data.error || `Ollama HTTP ${response.status}: ` + text.slice(0, 200));
                  answer = data.response, lastError = null;
                  break;
                } catch (e) {
                  lastError = e;
                }
                if (lastError) throw new Error(`Failed to reach Ollama at ${baseUrls.join(" or ")}. ${lastError.message}. Ensure Ollama is running and that OLLAMA_ORIGINS includes ${extOrigin} (or *).`);
              } else if ("openai" === aiProvider) {
                if (!openaiApiKey) throw new Error("Please set your OpenAI API key in the options page.");
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + openaiApiKey
                  },
                  body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [ {
                      role: "user",
                      content: request.question
                    } ],
                    temperature: .7,
                    max_tokens: 2e3
                  })
                });
                var data = await response.json();
                if (data.error) throw new Error(data.error.message);
                answer = data.choices[0].message.content;
              }
              chrome.tabs.sendMessage(originalTabID, {
                greeting: "answerFromChatgptBackground",
                chatAnswer: "answerFromChatgpt " + answer
              }), sendResponse({
                farewell: "Answer received"
              });
            } catch (error) {
              chrome.tabs.sendMessage(originalTabID, {
                greeting: "answerFromChatgptBackground",
                chatAnswer: "Error: " + error.message
              }), sendResponse({
                farewell: "Error: " + error.message
              });
            }
          }), !0;
        }
        if (request.greeting.startsWith("answerFromChatgpt")) sendResponse({
          farewell: "Answer received"
        }), chrome.tabs.update(originalTabID, {
          active: !0
        }), chrome.tabs.sendMessage(originalTabID, {
          greeting: "answerFromChatgptBackground",
          chatAnswer: request.greeting
        }); else {
          if (request.greeting.startsWith("downloadTickets")) return fetch("https://harvardmed.service-now.com/incident.do?sys_id=c54b381f1b73e2500499ebd5604bcb87", {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          }).then(res => res.text()).then(html => {
            sendResponse({
              status: "success",
              message: html || "ticket list downloaded."
            });
          }).catch(err => {
            sendResponse({
              status: "error",
              message: err
            });
          }), !0;
          if (request.greeting.startsWith("Open")) {
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
            }) : request.greeting.endsWith("new tab") ? (baseUrl = arr[1], chrome.tabs.query({
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
          }); else if (request.greeting.startsWith("closeTab")) chrome.tabs.query({}).then(tabs => {
            chrome.tabs.query({
              active: !0,
              currentWindow: !0
            }).then(activeTabs => {
              activeTabs[0].id, tabs.findIndex(tab => tab.id === originalTabID);
              let serviceNowTab = null;
              activeTabs = tabs.filter(tab => tab.url && tab.url.includes("service-now.com"));
              1 < activeTabs.length ? serviceNowTab = activeTabs[activeTabs.length - 1] : 1 == activeTabs.length && (serviceNowTab = activeTabs[0]), 
              chrome.tabs.remove(originalTabID), chrome.storage.local.get([ "upDownClicked" ], function(result) {
                void 0 !== result.upDownClicked && "yes" === result.upDownClicked && (chrome.tabs.reload(serviceNowTab.id), 
                chrome.storage.local.remove("upDownClicked", function() {}));
              }), chrome.tabs.update(serviceNowTab.id, {
                active: !0
              });
            });
          }), sendResponse({
            farewell: "closed"
          }); else if ("setupSaveSelectionMenu" == request.greeting) chrome.contextMenus.create({
            id: "tst",
            title: "Save into profile",
            contexts: [ "selection" ]
          }, function() {
            chrome.runtime.lastError;
          }), chrome.contextMenus.onClicked.addListener(contextMenuAction), sendResponse({
            farewell: "menu set up finished."
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
        }
      }
    }
    return !0;
  }
});