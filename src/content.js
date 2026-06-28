var currentURL, iFrameID = "", newFormat = !1, iframeURL = "", urlMap = new Map(), keywordMap = (urlMap.set("bookmarkTicketColor", "yellow"), 
urlMap.set("bookmarkTicketColor1", "red"), urlMap.set("newTicketColor", "pink"), 
urlMap.set("holdTicketColor", "blue"), urlMap.set("assignedTicketColor", "yellow"), 
urlMap.set("closedTicketColor", "white"), new Map()), shortcutMap = new Map(), shortcutCommentMap = new Map(), sentenceMap = new Map(), hideMap = new Map(), controlMap = new Map(), urlArray = {}, keywordArray = {}, controlArray = {}, shortcutArray = {}, sentenceArray = {}, hideArray = {}, fillArray = {}, favorArray = {}, fillButtonMap = new Map(), xpathMap = new Map(), controlButtonMap = new Map(), excelRowValue = "", lastText = "", lastTarget = null, chatTarget = null, sending = !1, timeOuts = {}, currentText = "", firstName = "", myFirstName = "myFirstName", myID = "", myIDColumn = 0, classColumn = 0, classificationPrompt = "", classificationColor = [], greeting = "", listPagePaths = [], detailPagePaths = [], leftLinePositionListPage = 0, rightLinePositionListPage = 0, leftLinePositionDetailPage = 0, rightLinePositionDetailPage = 0, leftLineActionDetailPage = "", rightLineActionDetailPage = "", firstLineX = 0, firstLineX1 = 0, firstNameWarning = "", hintIndex = 0, hintText = new Map(), lastInsertStart = 0, lastInsertLength = 0, lastTextWithoutInsert = "", isHiding = !1, insertLength = 0, insertStart = 0, ctrlDown = !1, cmdString = "", ctrlKey = 17, totalInsertLengthToday = 0, totalInsertLengthThisMonth = 0, todayTickets = {};

let currentConfig = "", configMap = new Map(), editableDiv = !1, outsideKeyPress = !1, lastKeyTime = 0, alarm = new Map(), interv, cUrl = "", helpMsg = new Map(), savedDate = "", gotNewData = "no", isSelfClick = !1, currentID = "empty", ticketLink = "", autoRun = "", lastChar = "", lastKey = "", updateTimeout, myPrompt = "", jobID = "", chatContext = "", leftURL = "", rightURL = "", chatSessionURL = "", saveDrafTimeout = null, ticketURL = "", useBackgroundAPI = null, aiProvider = null, ollamaUrl = null, ollamaModel = null, openaiApiKey = null, lastWord = "";

var draftMarker = "", draft = "";

let mostRecentMessage = "";

var hintMsg = "";

let tmpHintOn = !1, lastSentence = "", lastTabTime = 0, mousePosition = {
  x: 0,
  y: 0
}, distanceTraveled = 0;

var delayTimeout, backgroundChangeable = !1, shortDescrtionYValue = 0, pageOpenTime = 0, pageCloseTime = 0, caretPosition = 0, searchTerms = [], allTicketIDs = [], domain = "";

function isTrustedServiceNowOrigin(origin) {
  try {
    var parsed = new URL(origin);
    return "https:" === parsed.protocol && ("service-now.com" === parsed.hostname || parsed.hostname.endsWith(".service-now.com"));
  } catch (e) {
    return !1;
  }
}

function appendSafeExternalLink(targetContainer, candidateUrl) {
  try {
    var wrapper, anchor, parsed = new URL(candidateUrl);
    "http:" !== parsed.protocol && "https:" !== parsed.protocol || parsed.hostname.endsWith("complianceline") || (wrapper = document.createElement("div"), 
    (anchor = document.createElement("a")).href = parsed.href, anchor.target = "_blank", 
    anchor.rel = "noopener noreferrer", anchor.textContent = parsed.href, wrapper.appendChild(anchor), 
    targetContainer.append(wrapper));
  } catch (e) {}
}

function escapeHtmlContent(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function createHintBubble(baseText, suffixText, badgeText, options = {}) {
  var wrap = document.createElement("div"), panel = document.createElement("div"), baseText = (panel.style.cssText = "font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: white; display: inline-block; white-space: pre-wrap; background-color: black; padding: 10px;", 
  options.withBorder && (panel.style.border = "1px solid #606060"), panel.appendChild(document.createTextNode(baseText)), 
  document.createElement("span")), options = (baseText.style.color = "#FF4C4C", 
  options.highlightId && (baseText.id = options.highlightId), baseText.appendChild(document.createTextNode(suffixText)), 
  document.createElement("span"));
  return options.id = "textPredictionTabHint", options.style.cssText = "width: 49px; height: 19px; border-radius: 2px; border-style: solid; border-width: 1px; border-color: #606060; white-space: nowrap; font-size: 0.7em; color: #32CD32; padding-left: 3px; padding-right: 3px; padding-top: 1px; margin-left: 4px; position: relative; top: -2px;", 
  options.textContent = badgeText, baseText.appendChild(options), panel.appendChild(baseText), 
  wrap.appendChild(panel), wrap;
}

function updateInsertLength(length) {
  const addedLength = Number(length) || 0;
  if (!(addedLength <= 0)) {
    length = new Date();
    const today = length.toISOString().slice(0, 10), currentMonth = length.getFullYear() + "-" + String(length.getMonth() + 1).padStart(2, "0");
    var diffToMonday = (length.getDay() + 6) % 7, monday = new Date(length);
    monday.setDate(length.getDate() - diffToMonday);
    const currentWeekStart = monday.toISOString().slice(0, 10);
    chrome.storage.local.get({
      insertLengthToday: 0,
      totalInsertLengthThisMonth: 0,
      insertLengthThisWeek: 0,
      lastUpdateDate: null,
      lastMonthTracked: null,
      weekStartDate: null
    }, result => {
      let {
        insertLengthToday = 0,
        totalInsertLengthThisMonth = 0,
        insertLengthThisWeek = 0,
        lastUpdateDate = null,
        lastMonthTracked = null,
        weekStartDate = null
      } = result;
      lastUpdateDate !== today && (insertLengthToday = 0), lastMonthTracked !== currentMonth && (totalInsertLengthThisMonth = 0), 
      weekStartDate !== currentWeekStart && (insertLengthThisWeek = 0), insertLengthToday += addedLength, 
      totalInsertLengthThisMonth += addedLength, insertLengthThisWeek += addedLength, 
      chrome.storage.local.set({
        insertLengthToday: insertLengthToday,
        totalInsertLengthThisMonth: totalInsertLengthThisMonth,
        insertLengthThisWeek: insertLengthThisWeek,
        lastUpdateDate: today,
        lastMonthTracked: currentMonth,
        weekStartDate: currentWeekStart
      }, () => {
        chrome.runtime.lastError || tmpAlert(`Inserted ${addedLength} chars. Today: ${insertLengthToday}, Week: ${insertLengthThisWeek}, Month: ` + totalInsertLengthThisMonth, 5e3);
      });
    });
  }
}

function updateInsertLength0(length) {
  const addedLength = Number(length) || 0, today = new Date().toISOString().slice(0, 10);
  chrome.storage.local.get({
    insertLengthToday: 0,
    totalInsertLengthThisMonth: 0,
    lastUpdateDate: null
  }, result => {
    let {
      insertLengthToday,
      totalInsertLengthThisMonth,
      lastUpdateDate
    } = result;
    lastUpdateDate !== today && (insertLengthToday = 0), insertLengthToday += addedLength, 
    totalInsertLengthThisMonth += addedLength, chrome.storage.local.set({
      insertLengthToday: insertLengthToday,
      totalInsertLengthThisMonth: totalInsertLengthThisMonth,
      lastUpdateDate: today
    }, () => {
      chrome.runtime.lastError || tmpAlert(`Inserted ${addedLength} chars. Today: ${insertLengthToday}, This month: ` + totalInsertLengthThisMonth, 5e3);
    });
  });
}

function loadCon() {
  currentID = document.title.split(" ")[0], ticketLink = "Link: " + currentURL.split("&")[0], 
  chrome.storage.local.get({
    myConfigs: "myConfigs"
  }, function(ob) {
    if ("myConfigs" !== ob.myConfigs) {
      var obj = JSON.parse(ob.myConfigs), keys = Object.keys(obj);
      let findURL = !1;
      for (let i = 0; i < keys.length; i++) if (configMap.set(obj[keys[i]][0], obj[keys[i]][1]), 
      obj[keys[i]][0].startsWith("Config") && 3 < obj[keys[i]][1].length) {
        var urls = obj[keys[i]][1].split(/\s+/);
        for (let j = 0; j < urls.length; j++) -1 != currentURL.indexOf(urls[j]) && (cUrl = urls[j], 
        currentConfig = obj[keys[i]][0], findURL = !0);
      }
      findURL && loadConfig();
    }
  });
}

function loadConfig() {
  "Config1" === currentConfig ? chrome.storage.local.get({
    configa: "configa"
  }, function(dat) {
    "configa" !== dat.configa && processData(JSON.parse(dat.configa));
  }) : "Config2" === currentConfig ? chrome.storage.local.get({
    configb: "configb"
  }, function(dat) {
    "configb" !== dat.configb && processData(JSON.parse(dat.configb));
  }) : "Config3" === currentConfig ? chrome.storage.local.get({
    configc: "configc"
  }, function(dat) {
    "configc" !== dat.configc && processData(JSON.parse(dat.configc));
  }) : "Config4" === currentConfig && chrome.storage.local.get({
    configd: "configd"
  }, function(dat) {
    "configd" !== dat.configd && processData(JSON.parse(dat.configd));
  });
}

function processData(ob) {
  let obj = ob[1];
  var keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) urlMap.set(obj[keys[i]][0], obj[keys[i]][1]), 
  urlArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ];
  ticketURL = urlMap.get("ticketURL") || "";
  function splitWords(value) {
    return "" === (value || "").trim() ? [] : value.trim().split(/\s+/);
  }
  function splitSpace(value) {
    return "" === (value || "").trim() ? [] : value.trim().split(" ");
  }
  searchTerms = splitWords(urlMap.get("searchTerms")), chatSessionURL = urlMap.get("chatSessionURL"), 
  myID = urlMap.get("myID"), myFirstName = urlMap.get("myFirstName"), classificationColors = splitSpace(urlMap.get("classificationColors")), 
  classColumn = 0, classificationPrompt = urlMap.get("classificationPrompt");
  var leftLineParts = splitSpace(urlMap.get("leftLinePositionListPage")), rightLineParts = splitSpace(urlMap.get("rightLinePositionListPage"));
  if (leftLinePositionListPage = parseFloat(leftLineParts[0] || "0"), rightLinePositionListPage = parseFloat(rightLineParts[0] || "0"), 
  leftURL = leftLineParts[1] || "", rightURL = rightLineParts[1] || "", greeting = urlMap.get("greeting"), 
  listPagePaths = splitWords(urlMap.get("listPagePaths")), (detailPagePaths = splitWords(urlMap.get("detailPagePaths"))).some(path => currentURL.includes(path))) {
    useBackgroundAPI = !1, aiProvider = urlMap.get("apiProvider") || "ollama", ollamaUrl = urlMap.get("ollamaUrl") || "", 
    ollamaModel = urlMap.get("ollamaModel") || "", openaiApiKey = urlMap.get("openaiApiKey") || "", 
    "myFirstName" === (myFirstName = void 0 !== myFirstName && 0 != myFirstName.length ? myFirstName : "myFirstName") && -1 != currentURL.indexOf("service-now") && alert("Please set up your name in option page."), 
    obj = ob[2];
    keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) keywordArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ], 
    keywordMap.set(obj[keys[i]][0], obj[keys[i]][1]);
    keys = (new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        var k;
        mutation.target && mutation.target.innerText && (k = mutation.target.innerText, 
        keywordMap.has(k)) && (mutation.target.style.pointerEvents = "auto", "function" == typeof mutation.target.click) && setTimeout(() => mutation.target.click(), 500);
      });
    }).observe(document.body, {
      attributes: !0,
      subtree: !0,
      childList: !0,
      characterData: !0
    }), obj = ob[3], Object.keys(obj));
    for (let i = 0; i < keys.length; i++) if (-1 == obj[keys[i]][0].indexOf("#")) {
      let k = obj[keys[i]][0].replace(/ .*/, "");
      if (k.length < 3) {
        if (/[^a-zA-Z0-9]/.test(k)) continue;
        helpMsg.set(k, "<p><strong>" + k + ": </strong>" + obj[keys[i]][0].split(" ").slice(1).join(" ") + "</p>"), 
        controlArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ], controlMap.set(k, obj[keys[i]][1]), 
        controlButtonMap.set(obj[keys[i]][0], k);
      }
      "Save selection to profile" === obj[keys[i]][1] && chrome.runtime.sendMessage({
        greeting: "setupSaveSelectionMenu"
      }, function(response) {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
          if (request.greeting.startsWith("SaveToProfile:")) {
            chrome.storage.local.set({
              configSaveTime: getDate()
            }, function() {});
            var tex = request.greeting.replace("SaveToProfile:", "").replace(myFirstName, "myFirstName"), sendResponse = (sendResponse({
              farewell: "goodbye" + request.greeting
            }), prompt('Please enter the shortcut for "' + tex + '". Leave blank if you want to save as a sentence without shortcut.'));
            if (null != sendResponse && 0 < sendResponse.length) {
              function getFirstWord(tenure) {
                return tenure.trim().split(/\s+/)[0] || "";
              }
              shortcutMap.set(getFirstWord(sendResponse), tex), shortcutCommentMap.set(getFirstWord(sendResponse), function(tenure) {
                return (tenure = tenure.trim().split(/\s+/)).shift(), tenure.join(" ");
              }(sendResponse));
              var k, shortcutArray = {};
              let c = 0;
              for (k of shortcutMap.keys()) k === shortcutCommentMap.get(k) ? shortcutArray[c++] = [ k, shortcutMap.get(k) ] : shortcutArray[c++] = [ k + " " + shortcutCommentMap.get(k), shortcutMap.get(k) ];
              var sentenceArray = {};
              c = 0;
              for (let k of sentenceMap.keys()) sentenceArray[c++] = [ sentenceMap.get(k), k ];
              request = {}, sendResponse = (request[1] = urlArray, request[2] = keywordArray, 
              request[3] = controlArray, request[4] = shortcutArray, request[5] = sentenceArray, 
              request[6] = hideArray, request[7] = fillArray, request[8] = favorArray, 
              JSON.stringify(request));
              "Config1" === currentConfig ? chrome.storage.local.set({
                configa: sendResponse
              }, function() {}) : "Config2" === currentConfig ? chrome.storage.local.set({
                configb: sendResponse
              }, function() {}) : "Config3" === currentConfig ? chrome.storage.local.set({
                configc: sendResponse
              }, function() {}) : "Config4" === currentConfig && chrome.storage.local.set({
                configd: sendResponse
              }, function() {});
            } else saveSentences(tex);
          }
        });
      });
    }
    obj = ob[4];
    var keys = Object.keys(obj), map = new Map();
    for (let i = 0; i < keys.length; i++) {
      var k = obj[keys[i]][0].replace(/ .*/, "");
      shortcutMap.set(k, obj[keys[i]][1]), map.set(k, obj[keys[i]][0].substring(obj[keys[i]][0].indexOf(" ") + 1));
    }
    shortcutCommentMap = new Map([ ...map.entries() ].sort((a, b) => a[1].localeCompare(b[1]))), 
    obj = ob[5];
    keys = Object.keys(obj), map = new Map();
    for (let i = 0; i < keys.length; i++) map.set(obj[keys[i]][1], parseInt(obj[keys[i]][0]));
    sentenceMap = new Map([ ...map.entries() ].sort((a, b) => b[1] - a[1])), obj = ob[6];
    keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) hideArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ], 
    hideMap.set(obj[keys[i]][1], obj[keys[i]][0]);
    obj = ob[7];
    keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) if (-1 == obj[keys[i]][0].indexOf("#")) {
      fillArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ];
      let k = obj[keys[i]][0].replace(/ .*/, "");
      if (k.length < 4) helpMsg.set(k, "<p><strong>" + k + ": </strong>" + obj[keys[i]][0].replace(/^[a-z] /, "") + "</p>"), 
      controlMap.set(k, "fill\n" + obj[keys[i]][1].replace("myFirstName", myFirstName)), 
      fillButtonMap.set(obj[keys[i]][0], k); else if ("Label:Xpath" === k) {
        var labelXpaths = obj[keys[i]][1].split(/\n/);
        for (let j = 0; j < labelXpaths.length; j++) xpathMap.set(labelXpaths[j].replace(/:.*/, "").trim(), labelXpaths[j].replace(/.+?:/, "").trim());
      } else "autoRun" == k && (autoRun = obj[keys[i]][1]);
      obj[keys[i]][1].startsWith("FromExcel") && (excelRowValue = "fill\n" + obj[keys[i]][1], 
      chrome.runtime.sendMessage({
        greeting: "setupSaveFromExcelMemu"
      }, function(response) {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
          "FromExcel" === request.greeting && designPrimer();
        });
      }));
    }
    obj = ob[8];
    keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) favorArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ];
    if (currentURL.startsWith("https://www.ncbi.nlm.nih.gov/tools/primer-blast/primertool.cgi")) {
      let totalRows = 0;
      return ($("#userGuidedForm table tbody tr").each(function() {
        totalRows++;
      }), 0 < totalRows) ? void chrome.storage.local.get([ "primerResults" ], function(result) {
        let re = result.primerResults, candi = currentURL;
        setTimeout(() => {
          chrome.storage.local.set({
            primerResults: re + candi + "\n"
          }, function() {}), $('input[type="submit"]').click();
        }, 500);
      }) : void chrome.storage.local.get([ "primerResults" ], function(result) {
        result = result.primerResults;
        let index = 0, rtext = currentURL + "\n";
        $(".prPairInfo table tbody").filter(function() {
          index++;
          var el1 = $(this).find("tr:nth-child(2)");
          rtext += index + "\tforward", el1.find("td").each(function() {
            rtext += "\t" + $(this).text();
          }), rtext += "\treverse", (el1 = $(this).find("tr:nth-child(3)")).find("td").each(function() {
            rtext += "\t" + $(this).text();
          }), rtext += "\n";
        }), 0 != index && chrome.storage.local.set({
          primerResults: result + rtext
        }, function() {
          chrome.storage.local.set({
            newTabOpened: "no"
          }, function() {
            window.close();
          });
        });
      });
    }
    "" != cUrl && (chrome.storage.local.get("savedNewData", function(result) {
      gotNewData = result.savedNewData;
    }), "Config1" === currentConfig ? chrome.storage.local.get("savedDate1", function(result) {
      savedDate = result.savedDate1, saveConfig();
    }) : "Config2" === currentConfig ? chrome.storage.local.get("savedDate2", function(result) {
      savedDate = result.savedDate2, saveConfig();
    }) : "Config3" === currentConfig ? chrome.storage.local.get("savedDate3", function(result) {
      savedDate = result.savedDate3, saveConfig();
    }) : "Config4" === currentConfig && chrome.storage.local.get("savedDate4", function(result) {
      savedDate = result.savedDate4, saveConfig();
    }));
    let alarmAudio = null;
    -1 != currentURL.indexOf("office.com/calendar") ? (new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.target, mutation.target && "ms-List-surface" === mutation.target.className) {
          for (var elements = document.getElementsByClassName("setNowButton"); 0 < elements.length; ) elements[0].parentNode.removeChild(elements[0]);
          clearInterval(interv), $(".ms-List-cell").each(function() {
            var text = $(this)[0].innerHTML;
            if (-1 === text.indexOf("All day")) {
              text = text.match(/(\d{1,2}:\d{2} [APM]{2}) to (\d{1,2}:\d{2} [APM]{2}), ([A-Za-z]+), ([A-Za-z]+ \d{1,2}, \d{4})/);
              if (text) {
                var div, startTime = text[1], text = (text[2], text[3], text[4]);
                let time = function(startTime, fullDate) {
                  var fullDate = new Date(fullDate), [ startTime, modifier ] = startTime.split(" ");
                  let [ hours, minutes ] = startTime.split(":").map(Number);
                  return "PM" === modifier && 12 !== hours ? hours += 12 : "AM" === modifier && 12 === hours && (hours = 0), 
                  fullDate.setHours(hours, minutes, 0, 0), fullDate.toLocaleString();
                }(startTime, text);
                new Date(time).getTime() > new Date().getTime() && (div = document.createElement("div"), 
                alarm.has(new Date(time).getTime()) ? interv = setInterval(() => {
                  for (var diff = new Date(time).getTime() - new Date().getTime(), hh = (diff < 0 && clearInterval(interv), 
                  Math.floor(diff / 1e3 / 60 / 60)), mm = (diff -= 1e3 * hh * 60 * 60, 
                  Math.floor(diff / 1e3 / 60)), diff = (diff -= 1e3 * mm * 60, Math.floor(diff / 1e3)), elements = document.getElementById(time); null != elements && 0 < elements.length; ) elements[0].parentNode.removeChild(elements[0]);
                  var alarmButton = document.createElement("button");
                  alarmButton.className = "setNowButton", alarmButton.style.cssText = "color:red; border-color:red", 
                  alarmButton.id = time, alarmButton.textContent = "Alarm off in " + hh + "h " + mm + "m " + diff + "s ", 
                  div.replaceChildren(alarmButton);
                }, 1e3) : ((startTime = document.createElement("button")).className = "setNowButton", 
                startTime.style.cssText = "color:red; border-color:red", startTime.id = time, 
                startTime.textContent = "Set Alarm", div.replaceChildren(startTime)), 
                this.append(div));
              }
            }
          });
        }
      });
    }).observe(document.body, {
      attributes: !0,
      subtree: !0,
      childList: !0,
      characterData: !0
    }), document.addEventListener("click", e => {
      if ("setNowButton" == e.target.className) {
        let then = new Date(e.target.id).getTime();
        var interv, diff = then - new Date().getTime();
        alarm.has(then) ? alert("Alarm already set up!") : confirm("Set up the alarm?") && (alarm.set(then, !0), 
        chrome.runtime.sendMessage({
          greeting: "setAlarm " + (diff - 12e4) / 1e3 / 60
        }, function(response) {}), setTimeout(() => {
          confirm("Stop the alarm?") && (alarmAudio && (alarmAudio.pause(), alarmAudio.currentTime = 0), 
          alarm.delete(then));
        }, diff - 12e4), interv = setInterval(() => {
          var dif = new Date(e.target.id).getTime() - new Date().getTime(), hh = (dif < 0 && clearInterval(interv), 
          Math.floor(dif / 1e3 / 60 / 60)), mm = (dif -= 1e3 * hh * 60 * 60, Math.floor(dif / 1e3 / 60)), dif = (dif -= 1e3 * mm * 60, 
          Math.floor(dif / 1e3));
          e.target.textContent = "Alarm off in " + hh + "h " + mm + "m " + dif + "s ";
        }, 1e3));
      }
    })) : (-1 != currentURL.indexOf("outlook.office.com") ? window.onfocus = function() {
      chrome.storage.local.get([ "searchEmail" ], function(result) {
        null != result.searchEmail && (document.querySelector("#topSearchInput").value = result.searchEmail, 
        document.querySelector("#topSearchInput").dispatchEvent(new KeyboardEvent("keydown", {
          key: "Enter"
        })), result = new Event("input", {
          bubbles: !0,
          cancelable: !0
        }), document.querySelector("#topSearchInput").dispatchEvent(result), document.querySelector('[data-testid="send-button"]'), 
        $(".form-inline.navpage-global-search.ng-non-bindable").submit(), chrome.storage.local.remove("searchEmail", function() {}));
      });
    } : -1 != currentURL.indexOf("chatgpt.come") || -1 != currentURL.indexOf("sandbox.ai1") ? (document.addEventListener("click", e => {
      "TEXTAREA" == e.target.nodeName && changeBackground("white");
    }), leftLineParts = new MutationObserver(mutationsList => {
      var elements = document.querySelectorAll(".min-h-\\[20px\\].flex.flex-col.items-start.gap-3.whitespace-pre-wrap.break-words.overflow-x-auto");
      elements[elements.length - 1];
      for (const mutation of mutationsList) mutation.target, mutation.target;
    }), rightLineParts = document.querySelector(".react-scroll-to-bottom--css-bvdkg-1n7m0yu"), 
    leftLineParts.observe(rightLineParts, {
      attributes: !0,
      characterData: !0,
      subtree: !0
    }), window.addEventListener("message", event => {
      isTrustedServiceNowOrigin(event.origin) && (texbox.textContent = event.data);
    })) : -1 != currentURL.indexOf("incident.do") && (window.addEventListener("message1", event => {
      isTrustedServiceNowOrigin(event.origin) && (texbox.textContent = event.data);
    }), document.addEventListener("click", e => {
      var bgColor = window.getComputedStyle(e.target).backgroundColor;
      if ("rgba(0, 0, 0, 0)" === bgColor && ("DIV" === e.target.nodeName || "TD" === e.target.nodeName || -1 != currentURL.indexOf("testPage"))) {
        let targetElement = $('textarea[name="incident.short_description"]');
        null != (targetElement = null != (targetElement = null != (targetElement = null != (targetElement = null != targetElement && 0 !== targetElement.length ? targetElement : $('input[name="incident.short_description"]')) && 0 !== targetElement.length ? targetElement : $('textarea[name="u_incident_task.short_description"]')) && 0 !== targetElement.length ? targetElement : $('textarea[name="sc_task.short_description"]')) && 0 !== targetElement.length ? targetElement : $("#form_main")) && void 0 !== targetElement && (bgColor = targetElement[0].getBoundingClientRect(), 
        e.clientX < bgColor.left - 20 || e.clientX > bgColor.right) && (delayTimeout ? (tmpAlert("clearing delay timeout"), 
        clearTimeout(delayTimeout), delayTimeout = null) : chrome.storage.local.get("delayKeyPressAfterReload", function(result) {
          result.hasOwnProperty("delayKeyPressAfterReload") ? chrome.storage.local.remove("delayKeyPressAfterReload", function() {}) : chrome.runtime.sendMessage({
            greeting: "closeTab"
          }, response => {
            response && response.farewell && response.farewell;
          });
        }));
      }
      -1 != e.target.id.indexOf("addhere") ? (bgColor = parseInt(e.target.id.replace(/^addhere/, "")), 
      hintText.has(bgColor) && (currentText = currentText.substring(0, insertStart + 1) + hintText.get(bgColor), 
      insertLength = hintText.get(bgColor).length + 1, lastTarget.value = currentText, 
      updateInsertLength(insertLength)), removeHints(), 0 < hintIndex && (hintIndex = 0, 
      hintText.clear())) : lastTarget = e.target, isSelfClick || ("TEXTAREA" === e.target.nodeName && "incident.description" != e.target.id ? (selectedText = e.target.value.substring(e.target.selectionStart, e.target.selectionEnd), 
      changeBackground("white")) : -1 != currentURL.indexOf("incident_do") && "" == $('input[name="sys_display.incident.assigned_to"]').val() || -1 != currentURL.indexOf("incident_task") && "" === $('input[name="sys_display.u_incident_task.assigned_to"]').val() || -1 != currentURL.indexOf("sc_task") && "" === $('input[name="sys_display.sc_task.assigned_to"]').val() ? (changeBackground(urlMap.get("newTicketColor")), 
      $(".sn-controls.row").show()) : "3" === $('select[name="incident.state"]').val() || "4" == $('select[name="u_incident_task.state"]').val() || "-5" == $('select[name="sc_task.state"]').val() ? changeBackground(urlMap.get("holdTicketColor")) : changeBackground("#FFFFCC"));
    }), chrome.storage.local.get([ currentID + "draft" ], function(result) {
      null != result[currentID + "draft"] && (draft = result[currentID + "draft"]), 
      getFirstName(), greeting = greeting.replace("userFirstName", firstName), makeDescriptionReadOnly();
    })), setupKeyDownEventListerner(!1), setupKeyUpEventListerner(!1));
  }
}

function waitForLinks() {
  try {
    null != $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.getElementsByTagName("table") && setTimeout(() => {
      var ls = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelectorAll("a.linked.formlink");
      if (null != ls && 0 < ls.length) {
        for (var i = 0; i < ls.length; i++) ls[i].target = "_blank";
        setupKeyDownEventListerner(!1), setupKeyUpEventListerner(!1);
      }
    }, 2e3);
  } catch (e) {
    setTimeout(() => {
      waitForLinks();
    }, 1e3);
  }
}

function saveConfig() {
  if ((gotNewData = "no") !== gotNewData) {
    chrome.storage.local.set({
      savedNewData: "no"
    }, function() {});
    var currentDate = new Date().toDateString() + cUrl;
    if (currentDate !== savedDate) {
      "Config1" === currentConfig ? chrome.storage.local.set({
        savedDate1: currentDate
      }, function() {}) : "Config2" === currentConfig ? chrome.storage.local.set({
        savedDate2: currentDate
      }, function() {}) : "Config3" === currentConfig ? chrome.storage.local.set({
        savedDate3: currentDate
      }, function() {}) : "Config4" === currentConfig && chrome.storage.local.set({
        savedDate4: currentDate
      }, function() {});
      var k, shortcutArray = {};
      let c = 0;
      for (k of shortcutMap.keys()) k === shortcutCommentMap.get(k) ? shortcutArray[c++] = [ k, shortcutMap.get(k) ] : shortcutArray[c++] = [ k + " " + shortcutCommentMap.get(k), shortcutMap.get(k) ];
      var sentenceArray = {};
      c = 0;
      for (let k of sentenceMap.keys()) sentenceArray[c++] = [ sentenceMap.get(k), k ];
      var obj = {
        urls: urlArray,
        keywords: keywordArray,
        controls: controlArray,
        shortcuts: shortcutArray,
        sentences: sentenceArray,
        hides: hideArray,
        fills: fillArray,
        bookmark: favorArray
      }, currentDate = "Config." + currentDate.replace(/\s+/g, "-") + ".json", obj = JSON.stringify(obj).replace(/#/g, "&NPOUND").replace(/:{/g, ":\n {").replace(/],/g, "],\n  ").replace(/},/g, "},\n\n").replace(new RegExp(myFirstName, "g"), "myFirstName"), obj = new Blob([ obj ], {
        type: "text/plain"
      }), obj = (obj.webkitRelativePath = "myfolder/file.txt", URL.createObjectURL(obj)), downloadLink = document.createElement("a");
      downloadLink.href = obj, downloadLink.download = currentDate, document.body.appendChild(downloadLink), 
      downloadLink.click(), document.body.removeChild(downloadLink);
    }
  }
}

function getFirstName() {
  firstName = firstNameWarning = "";
  let sureAboutFirstName = !1;
  var cs = $(".h-card.h-card_md.h-card_comments");
  let draftNeedDelete = !1;
  var draft1 = draft.replace(/\s+/g, "");
  if (null != cs && 0 < cs.length) for (var i = 0; i < cs.length; i++) {
    var comt, cType = cs[i].childNodes[1].innerText;
    "" === draftMarker && (draftMarker = cType), -1 == cType.indexOf("Additional comments") && -1 == cType.indexOf("Work notes") || (cType = cs[i].childNodes[0].innerText, 
    comt = cs[i].childNodes[3].innerText, draftNeedDelete || draft1 !== comt.replace(/\s+/g, "") || (draftNeedDelete = !0), 
    myPrompt = -1 != cType.indexOf(myFirstName) ? ((void 0 === firstName || firstName.length < 3) && comt.startsWith(greeting.split(" ")[0]) && (cType = comt.split(/,\n/)[0].split(/ /), 
    firstName = cType[1].replace(/,/g, "").replace(/:/g, "").replace(/\n/g, "").trim(), 
    sureAboutFirstName = !0), myFirstName + "(me):\n" + comt + "\n" + myPrompt) : ("" == mostRecentMessage && "" == myPrompt && (mostRecentMessage = comt), 
    "User:\n" + comt + "\n" + myPrompt));
  }
  if (!draftNeedDelete) {
    let textarea = document.getElementById("activity-stream-comments-textarea");
    null != (textarea = null === textarea ? document.getElementById("activity-stream-work_notes-textarea") : textarea) && (textarea.value = draft), 
    currentText = draft;
  }
  chrome.storage.local.get([ "downloadTickets", "rawTickets", "ticketDownloadCount" ], function(result) {
    if (result.downloadTickets) {
      let rawTickets = result.rawTickets || "", ticketDownloadCount = result.ticketDownloadCount || 1;
      tmpAlert("Downloading ticket " + (ticketDownloadCount + 1), 3e3), void 0 !== rawTickets && (result = "User:\nShort description:\n" + $('textarea[name="incident.short_description"]').val() + "\nLong description:\n" + $('textarea[name="incident.description"]').val() + "\n", 
      rawTickets = rawTickets + "=== Conversation " + ticketDownloadCount + " ===\n" + result + myPrompt, 
      ticketDownloadCount++, chrome.storage.local.set({
        rawTickets: rawTickets,
        ticketDownloadCount: ticketDownloadCount
      }, function() {
        chrome.runtime.lastError || (ticketDownloadCount < 5 ? setTimeout(() => {
          document.dispatchEvent(new KeyboardEvent("keyup", {
            key: "f"
          }));
        }, 500) : (tmpAlert("Downloaded 10 tickets. Download complete.", 5e3), chrome.storage.local.remove("downloadTickets", function() {})));
      }));
    }
  }), "" == mostRecentMessage && (mostRecentMessage = $('textarea[name="incident.description"]').val()), 
  chrome.runtime.onMessage.addListener(message => {
    -1 != currentURL.indexOf("service-now") && message.greeting.startsWith("answerFromChatgptBackground") && (hideLoadingSpinner(), 
    void 0 !== message.chatAnswer) && "" !== message.chatAnswer.trim() && chrome.storage.local.get([ "classifyTicketListkkk" ], function(result) {
      if (result.classifyTicketList) {
        var div = document.createElement("div"), answer = document.createElement("div"), hint = (answer.style.cssText = "font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 10pt; color: rgb(0, 0, 0); display: inline-block; white-space: pre-wrap;", 
        answer.textContent = message.chatAnswer, document.createElement("span"));
        hint.id = "textPredictionTabHint", hint.style.cssText = "width: 49px; height: 19px; border-radius: 2px; border-style: solid; border-width: 1px; border-color: rgb(96, 94, 92); white-space: nowrap; font-size: 0.7em; padding-left: 3px; padding-right: 3px; padding-top: 1px; margin-left: 4px; position: relative; top: -2px;", 
        hint.textContent = "tab", answer.appendChild(hint), div.appendChild(answer);
        document.getElementById("activity-stream-comments-textarea").parentElement.append(div);
        hint = currentID + "classificationResult";
        chrome.storage.local.set({
          [hint]: message.chatAnswer
        }, function() {});
        const newArry = result.classifyTicketList.slice(1) || [];
        0 < newArry.length ? (chrome.storage.local.set({
          classifyTicketList: newArry
        }, function() {}), setTimeout(() => {
          var url = domain + "/incident.do?sys_id=" + newArry[0].split(":")[1];
          chrome.runtime.sendMessage({
            greeting: "Open " + url
          }, function(response) {});
        }, 1e3)) : (chrome.storage.local.remove("classifyTicketList", function() {}), 
        chrome.storage.local.set({
          upDownClicked: "yes"
        }, function() {}), chrome.runtime.sendMessage({
          greeting: "closeTab"
        }, response => {
          response && response.farewell && response.farewell;
        }));
      }
    });
  });
  let el;
  if ((void 0 === firstName || firstName.length < 2) && (newFormat ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector("#bf1d96e3c0a801640190725e63f8ac80 > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > input:nth-child(3)").value : el = $("#bf1d96e3c0a801640190725e63f8ac80 > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > input:nth-child(3)"), 
  null != (el = null === el ? $("#4fc4979ec0a8016401e142a5a0c599ce > div: nth - child(1) > div: nth - child(1) > div: nth - child(2)") : el) && null != el[0] && null != el[0].value && 5 < el[0].value.length && (firstName = el[0].value.split(/\s+/)[0], 
  sureAboutFirstName = !0), void 0 === firstName || firstName.length < 2) && (t = $("#sc_task\\2e request\\2e requested_for_label").val()) && (firstName = t.split(/\s+/)[0], 
  sureAboutFirstName = !0), void 0 === firstName || firstName.length < 2) null != (el = $("#bf1d96e3c0a801640190725e63f8ac80 > div:nth-child(2) > div:nth-child(1) > div:nth-child(6) > div:nth-child(2) > input:nth-child(2)")) && null != el[0] && 5 < el[0].value.length && (firstName = el[0].value.split(/\s+/)[0], 
  sureAboutFirstName = !0);
  if (void 0 === firstName || firstName.length < 2) {
    let el = $("#4fc4979ec0a8016401e142a5a0c599ce > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(4)");
    0 != el.length && 2 < (firstName = el.html().split("value=")[1].split('"')[1].split(" ")[0]).length && (sureAboutFirstName = !0);
  }
  if (void 0 === firstName || firstName.length < 2) {
    let tMail = null;
    if (newFormat ? tMail = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector("#bf1d96e3c0a801640190725e63f8ac80 > div:nth-child(2) > div:nth-child(1) > div:nth-child(7) > div:nth-child(2) > input").value : el = document.getElementById("incident.u_caller_email"), 
    null != el && null != el && 5 < el.value.length) {
      let firstName1 = "";
      -1 != (firstName = (firstName = el.value.split("@")[0]).charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()).indexOf(".") && (firstName1 = firstName.split(".")[0]), 
      -1 != firstName.indexOf("_") && (firstName1 = firstName.split("_")[0]), 0 < (firstName1 = -1 != firstName.indexOf("-") ? firstName.split("-")[0] : firstName1).length ? (sureAboutFirstName = !0, 
      firstName = firstName1) : firstNameWarning = "First name from email may not correct: " + firstName;
    }
    if (void 0 === firstName || firstName.length < 2) {
      var t = $("#sc_task\\2e u_preferred_email").val();
      if (t) {
        let firstName1 = "";
        -1 != (firstName = t.split("@")[0]).indexOf(".") && (firstName1 = firstName.split(".")[0]), 
        -1 != firstName.indexOf("_") && (firstName1 = firstName.split("_")[0]), 
        0 < (firstName1 = -1 != firstName.indexOf("-") ? firstName.split("-")[0] : firstName1).length ? (sureAboutFirstName = !0, 
        firstName = firstName1) : firstNameWarning = "First name from email may not correct: " + firstName;
      }
    }
  }
  if (void 0 === firstName || 2 < firstName.length && !sureAboutFirstName) {
    let des = null;
    null != (des = (newFormat ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector('textarea[name="incident.description"]') : $('textarea[name="incident.description"]')[0]).value) && 0 < des.length && -1 == des.indexOf(firstName) && (firstNameWarning = "First name from desc may not correct: " + firstName);
  }
  (void 0 === (firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)) || firstName.length < 2) && (t = document.getElementById("caller")?.value?.trim() || "", 
  firstName = t.split(/\s+/)[0] || "");
}

function makeDescriptionReadOnly() {
  var element = $('textarea[name="incident.description"]')[0];
  if (element = element || $('textarea[name="sc_task.description"]')[0]) {
    var arr = element.value.split(/\n\s+|\s+|<|>|\)|\(/);
    for (let i = 0; i < arr.length; i++) (arr[i].endsWith(",") || arr[i].endsWith(".")) && (arr[i] = arr[i].slice(0, -1)), 
    !arr[i].startsWith("https://") && !arr[i].startsWith("http://") || arr[i].endsWith("complianceline") ? /^\d{8}$/.test(arr[i]) && (jobID = jobID + " " + arr[i]) : appendSafeExternalLink($('textarea[name="incident.description"]').parent(), arr[i]);
  }
  var cms = $("#sn_form_inline_stream_entries > ul > li");
  for (let j = 0; j < cms.length; j++) {
    let arr = cms[j].textContent.split(/\n\s+|\s+|<|>|\)|\(/);
    for (let i = 0; i < arr.length; i++) (arr[i].endsWith(",") || arr[i].endsWith(".")) && (arr[i] = arr[i].slice(0, -1)), 
    !arr[i].startsWith("https://") && !arr[i].startsWith("http://") || arr[i].endsWith("complianceline") || appendSafeExternalLink(cms[j], arr[i]);
  }
  $('input[name="incident.description"]').select(), $('textarea[name="incident.short_description"]').select(), 
  $('textarea[name="u_incident_task.short_description"]').select(), $('textarea[name="sc_task.short_description"]').select();
  var key, element = document.getElementById("incident.state"), selectedOption = "";
  "New" === (selectedOption = (element = null === (element = null === element ? document.getElementById("sc_task.state") : element) ? document.getElementById("u_incident_task.state") : element) && element.options ? element.options[element.selectedIndex].text : selectedOption) || "-- None --" === selectedOption || "Unassigned" === selectedOption ? changeBackground(urlMap.get("newTicketColor")) : "Assigned" === selectedOption ? (changeBackground(urlMap.get("assignedTicketColor")), 
  hideMap.set(".sn-controls.row", "")) : "On Hold" === selectedOption ? (changeBackground(urlMap.get("holdTicketColor")), 
  hideMap.set(".sn-controls.row", "")) : "Resolved" === selectedOption || "Closed" === selectedOption ? (changeBackground(urlMap.get("closedTicketColor")), 
  hideMap.set(".sn-controls.row", "")) : changeBackground(urlMap.get("newTicketColor"));
  try {
    "" != $('input[name="incident.short_description"]').val() && $('input[name="incident.short_description"]').attr("readonly", "readonly"), 
    "" != $('textarea[name="incident.short_description"]').val() && $('textarea[name="incident.short_description"]').attr("readonly", "readonly"), 
    "" != $('textarea[name="incident.description"]').val() && $('textarea[name="incident.description"]').attr("readonly", "readonly"), 
    "" != $('textarea[name="u_incident_task.short_description"]').val() && $('textarea[name="u_incident_task.short_description"]').attr("readonly", "readonly"), 
    "" != $('textarea[name="sc_task.short_description"]').val() && $('textarea[name="sc_task.short_description"]').attr("readonly", "readonly");
  } catch (e) {}
  for (key in chrome.storage.local.get([ currentID + "color" ], function(result) {
    void 0 === result[currentID + "color"] || "green" === (result = result[currentID + "color"]) && -1 != $('input[name="sys_display.incident.assigned_to"]').val().indexOf(myFirstName) || ($('textarea[name="incident.short_description"]').css("background-color", result), 
    $('input[name="incident.short_description"]').css("background-color", result), 
    $('textarea[name="u_incident_task.short_description"]').css("background-color", result), 
    $('textarea[name="sc_task.short_description"]').css("background-color", result));
  }), favorArray) if (favorArray.hasOwnProperty(key) && favorArray[key][1] === currentID) {
    $('input[name="incident.short_description"]').css("background-color", urlMap.get("bookmarkTicketColor")), 
    $('textarea[name="incident.short_description"]').css("background-color", urlMap.get("bookmarkTicketColor")), 
    $('textarea[name="u_incident_task.short_description"]').css("background-color", urlMap.get("bookmarkTicketColor")), 
    $('textarea[name="sc_task.short_description"]').css("background-color", urlMap.get("bookmarkTicketColor"));
    break;
  }
  "" != autoRun ? (chrome.storage.local.get([ "lastTicketID" ], function(result) {
    null != result.lastTicketID && setTimeout(() => {
      var arr = autoRun.split(" ");
      currentID == result.lastTicketID ? arr[1].split("").forEach(char => {
        document.dispatchEvent(new KeyboardEvent("keyup", {
          key: char
        }));
      }) : arr[0].split("").forEach(char => {
        document.dispatchEvent(new KeyboardEvent("keyup", {
          key: char
        }));
      });
    }, 1e3);
  }), chrome.storage.local.set({
    lastTicketID: currentID
  }, function() {})) : 0 != hideMap.size && hideAll();
  let desc = "Short description: " + $('textarea[name="incident.short_description"]').val() + "\nLong description: " + $('textarea[name="incident.description"]').val() + "\n";
  chrome.storage.local.set({
    [currentID + "description"]: desc
  }, function() {}), chrome.storage.local.get([ "classifyTicketList" ], async function(result) {
    if (result.classifyTicketList && 0 < result.classifyTicketList.length) if ("" == chatSessionURL) alert("Please set up the value for chatSessionURL in option page, or enable 'Use Background API' in options."); else {
      var newArry = result.classifyTicketList;
      let allDone = !0;
      for (let i = 0; i < newArry.length; i++) if (newArry[i].split(":")[0] != currentID) if (void 0 === await getFromStorage(newArry[i].split(":")[0] + "description")) {
        allDone = !1;
        var sisid = newArry[i].split(":")[1], sisid = domain + "/incident.do?sys_id=" + sisid;
        chrome.runtime.sendMessage({
          greeting: "Open " + sisid
        }, function(response) {});
        break;
      }
      if (allDone) {
        let myPromptAll = "Prompt: There are some requests from computer users. Please classify each one:\n", tics = "";
        for (let j = 0; j < newArry.length; j++) {
          let des = await getFromStorage(newArry[j].split(":")[0] + "description");
          void 0 !== des && (myPromptAll = myPromptAll + "\n" + des, tics = tics + newArry[j].split(":")[0] + " Classification: [your classification]\n");
        }
        myPromptAll = myPromptAll + "\n" + tics + "\n" + classificationPrompt + "\nThanks.", 
        chrome.storage.local.set({
          askChatgpt: myPromptAll
        }, function() {
          var value = "Open " + chatSessionURL + " in new tab";
          chrome.runtime.sendMessage({
            greeting: value
          }, function(response) {});
        }), chrome.runtime.sendMessage({
          greeting: "closeTab, the last ticket tab"
        }, response => {
          response && response.farewell && response.farewell;
        });
      }
    }
  }), chrome.storage.local.get([ "autoRun" ], function(result) {
    if (null != result.autoRun) {
      let arr = result.autoRun.split(" "), time = new Date().getTime();
      time - parseInt(arr[0]) < 5e4 ? setTimeout(() => {
        chrome.storage.local.set({
          autoRun: time + " " + currentID + " " + arr[2]
        }, function() {}), arr[2].split("").forEach(char => {
          document.dispatchEvent(new KeyboardEvent("keyup", {
            key: char
          }));
        });
      }, 2e3) : chrome.storage.local.remove("autoRun", function() {});
    }
  });
  const key1 = currentID + "classificationResult";
  chrome.storage.local.get([ key1 ], function(result) {
    var div, answer;
    result[key1] && (div = document.createElement("div"), (answer = document.createElement("div")).style.cssText = "font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: rgb(256, 94, 92); display: inline-block; white-space: pre-wrap;", 
    answer.textContent = "Suggested answer:" + result[key1], div.appendChild(answer), 
    document.getElementById("activity-stream-comments-textarea").parentElement.append(div));
  });
}

function getFromStorage(key) {
  return new Promise(resolve => {
    chrome.storage.local.get([ key ], function(result) {
      resolve(result[key]);
    });
  });
}

function assignClassification(shortcut, ssid) {
  const dataWithTimestamp = {
    data: "Delay " + shortcut,
    timestamp: Date.now()
  };
  chrome.storage.local.get("delayKeyPressAfterReload", function(result) {
    result && result.delayKeyPressAfterReload || chrome.storage.local.set({
      delayKeyPressAfterReload: dataWithTimestamp
    }, function() {});
  }), setTimeout(() => {}, 1e3);
}

function deleteClassification(key, highlightField, hoverField) {
  chrome.storage.local.remove(key, function() {}), highlightField && (highlightField.style.color = "black", 
  key = highlightField.querySelector("a")) && (key.style.color = "black"), hoverField && (hoverField.style.backgroundColor = "", 
  hoverField.originalClickHandler && (hoverField.removeEventListener("click", hoverField.originalClickHandler), 
  hoverField.originalClickHandler = null), hoverField.originalMouseEnter) && (hoverField.removeEventListener("mouseenter", hoverField.originalMouseEnter), 
  hoverField.originalMouseEnter = null);
}

function showClassificationDecisionModal(classificationResult, description, onAgree, onDisagree, classificationKey) {
  var existing = document.getElementById("classificationDecisionOverlay");
  existing && existing.remove();
  const overlay = document.createElement("div");
  overlay.id = "classificationDecisionOverlay", overlay.style.position = "fixed", 
  overlay.style.top = "0", overlay.style.left = "0", overlay.style.width = "120vw", 
  overlay.style.height = "100vh", overlay.style.backgroundColor = "rgba(0, 0, 0, 0.45)", 
  overlay.style.zIndex = "2147483647", overlay.style.display = "flex", overlay.style.alignItems = "center", 
  overlay.style.justifyContent = "center";
  var existing = document.createElement("div"), title = (existing.style.width = "min(900px, 92vw)", 
  existing.style.maxHeight = "85vh", existing.style.overflow = "hidden", existing.style.backgroundColor = "#fff", 
  existing.style.borderRadius = "10px", existing.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.35)", 
  existing.style.padding = "14px", existing.style.fontFamily = "Arial, sans-serif", 
  document.createElement("div")), header = (title.style.fontSize = "18px", title.style.fontWeight = "700", 
  title.style.marginRight = "auto", title.style.marginLeft = "50px", document.createElement("div"));
  header.style.display = "flex", header.style.justifyContent = "space-between", 
  header.style.alignItems = "center";
  const headerActions = document.createElement("div");
  headerActions.style.display = "flex", headerActions.style.gap = "8px", headerActions.style.alignItems = "center";
  var body = document.createElement("div"), description = (body.style.whiteSpace = "pre-wrap", 
  body.style.overflowY = "auto", body.style.maxHeight = "55vh", body.style.border = "1px solid #ddd", 
  body.style.borderRadius = "8px", body.style.padding = "10px", body.style.lineHeight = "1.35", 
  body.textContent = "Classification Result:\n" + classificationResult + "\n\nTicket details:\n" + description, 
  document.createElement("div")), closeBtn = (description.style.display = "flex", 
  description.style.gap = "8px", description.style.justifyContent = "flex-end", 
  description.style.marginTop = "12px", document.createElement("button")), removeBtn = (closeBtn.textContent = "Close", 
  closeBtn.style.padding = "14px 10px", closeBtn.style.minWidth = "64px", closeBtn.style.minHeight = "46px", 
  closeBtn.style.fontSize = "15px", closeBtn.style.border = "1px solid #999", closeBtn.style.background = "#f6f6f6", 
  closeBtn.style.cursor = "pointer", document.createElement("button"));
  removeBtn.textContent = "Remove Classification", removeBtn.style.padding = "14px 10px", 
  removeBtn.style.minWidth = "64px", removeBtn.style.minHeight = "46px", removeBtn.style.fontSize = "15px", 
  removeBtn.style.border = "1px solid #999", removeBtn.style.background = "#f6f6f6", 
  removeBtn.style.cursor = "pointer";
  function closeModal() {
    overlay.remove();
  }
  closeBtn.addEventListener("click", function() {
    closeModal();
  }), removeBtn.addEventListener("click", function() {
    closeModal(), onDisagree && onDisagree();
  }), overlay.addEventListener("click", function(e) {
    e.target === overlay && closeModal();
  }), existing.addEventListener("mouseleave", function() {
    closeModal();
  }), description.appendChild(closeBtn), headerActions.appendChild(closeBtn), headerActions.appendChild(removeBtn);
  classificationPrompt.split("topics: ")[1].split("; ").forEach(topic => {
    var topicBtn = document.createElement("button");
    topicBtn.textContent = topic, topicBtn.style.padding = "14px 10px", topicBtn.style.minWidth = "64px", 
    topicBtn.style.minHeight = "46px", classificationResult === topic ? (topicBtn.style.border = "1px solid #2a7f62", 
    topicBtn.style.background = "#2f9e7a", topicBtn.style.color = "#fff") : (topicBtn.style.border = "1px solid #999", 
    topicBtn.style.background = "#f6f6f6"), topicBtn.addEventListener("click", function() {
      closeModal();
      var shortcut = topic.split("(")[1].split(")")[0];
      "function" == typeof onAgree && onAgree(shortcut);
    }), headerActions.appendChild(topicBtn);
  });
  const inputField = document.createElement("input");
  inputField.type = "text", inputField.placeholder = "Type your classification and press Enter...", 
  inputField.style.width = "100%", inputField.style.padding = "10px", inputField.style.marginTop = "10px", 
  inputField.style.boxSizing = "border-box", inputField.addEventListener("keydown", function(event) {
    "Enter" === event.key && (event.preventDefault(), event = inputField.value.trim()) && "function" == typeof onAgree && (closeModal(), 
    onAgree(event));
  }), headerActions.appendChild(inputField), header.appendChild(headerActions), 
  header.appendChild(title), existing.appendChild(header), existing.appendChild(body), 
  overlay.appendChild(existing), document.body.appendChild(overlay);
}

async function processIFrame(iframe) {
  let ls = null, lsTime = null;
  var rootDoc = function() {
    try {
      if (iframe && (iframe.contentDocument || iframe.contentWindow && iframe.contentWindow.document)) return iframe.contentDocument || iframe.contentWindow.document;
    } catch (e) {}
    return document;
  }();
  if (null != iframe || rootDoc === document) {
    var th = rootDoc && rootDoc.body ? rootDoc.body.querySelector('th[name="sys_updated_by"]') : null;
    myIDColumn = th ? th.cellIndex - 1 : 3, ls = rootDoc && rootDoc.body ? rootDoc.body.querySelectorAll("a.linked.formlink") : null, 
    lsTime = rootDoc && rootDoc.body ? rootDoc.body.querySelectorAll(".datex.date-timeago") : null, 
    null != ls && 0 < ls.length && (th = (th = new Date()).getFullYear() + `-${String(th.getMonth() + 1).padStart(2, "0")}-` + String(th.getDate()).padStart(2, "0"), 
    void 0 !== todayTickets && todayTickets.today == th || (todayTickets = {}));
    for (let i = 0; i < ls.length; i++) {
      var lastSpaceIndex = ls[i].getAttribute("aria-label").lastIndexOf(" ");
      let ticketID = ls[i].getAttribute("aria-label").substring(lastSpaceIndex + 1);
      var [ lastSpaceIndex, timePart ] = lsTime[i].getAttribute("title").split(" ");
      const [ month, day, year ] = lastSpaceIndex.split("-");
      var [ lastSpaceIndex, timePart, seconds ] = timePart.split(":"), lastSpaceIndex = new Date(year, month - 1, day, lastSpaceIndex, timePart, seconds).getTime();
      allTicketIDs.push(ticketID);
      let key = ticketID + "sysid", sysid = ls[i].getAttribute("href").split("sys_id=")[1].split("&")[0];
      chrome.storage.local.set({
        [key]: sysid
      }, function() {}), void 0 !== todayTickets && ticketID in todayTickets && lastSpaceIndex < todayTickets[ticketID] && (ls[i].style.color = "red", 
      ls[i].style.backgroundColor = "yellow"), ls[i].target = "_blank";
      timePart = ls[i].closest("tr"), seconds = timePart.querySelectorAll("td"), 
      lastSpaceIndex = (seconds[2].querySelector("a.linked.formlink").getAttribute("href"), 
      seconds[myIDColumn + 1]);
      if (-1 === $(lastSpaceIndex).text().toLowerCase().indexOf(myID.toLowerCase())) {
        lastSpaceIndex.style.color = "red";
        const link = lastSpaceIndex.querySelector("a");
        link && (link.style.color = "red");
      }
      const [ color, description, classificationResult ] = await Promise.all([ getFromStorage(ticketID + "color"), getFromStorage(ticketID + "description"), getFromStorage(ticketID + "classificationResult") ]);
      void 0 === color || "green" === color && -1 != $(timePart).text().indexOf(myFirstName) || (ls[i].style.backgroundColor = color);
      let findmatch = !1;
      const fouthField = seconds[classColumn + 1];
      if (void 0 !== classificationResult) {
        var topics = classificationPrompt.split("topics: ")[1].split("; ");
        for (let i = 0; i < topics.length; i++) {
          var topic = topics[i].split(": ")[0];
          const color = classificationColors[i];
          if (-1 != classificationResult.toLowerCase().indexOf(topic.toLowerCase())) {
            findmatch = !0, fouthField.style.color = color;
            const link = fouthField.querySelector("a");
            link && (link.style.color = color);
            break;
          }
        }
      }
      if (!findmatch) {
        fouthField.style.color = "black";
        const link = fouthField.querySelector("a");
        link && (link.style.color = "black"), chrome.storage.local.remove(ticketID + "classificationResult", function() {});
      }
      let cfield = seconds[classColumn];
      cfield.style.backgroundColor = "rgb(220, 220, 220, 0.5)", cfield.style.cursor = "pointer", 
      cfield.originalClickHandler || (cfield.originalClickHandler = function(ev) {
        ev.preventDefault(), ev.stopPropagation(), showClassificationDecisionModal(classificationResult, description, function(shortcutSafe) {
          assignClassification(shortcutSafe, sysid);
        }, function() {
          deleteClassification(ticketID + "classificationResult", fouthField, cfield);
        }, ticketID + "classificationResult");
      }, cfield.addEventListener("click", cfield.originalClickHandler));
    }
    const windowWidth = window.innerWidth, windowHeight = window.innerHeight;
    function createLine(xPosition) {
      var svgNS = "http://www.w3.org/2000/svg", svg = document.createElementNS(svgNS, "svg"), xPosition = (svg.setAttribute("width", "10"), 
      svg.setAttribute("height", windowHeight), svg.setAttribute("style", `position: absolute; left: ${xPosition}px; top: 0;`), 
      document.createElementNS(svgNS, "line"));
      xPosition.setAttribute("x1", "5"), xPosition.setAttribute("y1", "120"), xPosition.setAttribute("x2", "5"), 
      xPosition.setAttribute("y2", windowHeight), xPosition.setAttribute("stroke", "#FFFF00"), 
      xPosition.setAttribute("stroke-width", "2"), svg.appendChild(xPosition), document.body.appendChild(svg);
    }
    firstLineX = windowWidth * leftLinePositionListPage, firstLineX1 = windowWidth * rightLinePositionListPage, 
    createLine(firstLineX), createLine(firstLineX1);
    th = (rootDoc && rootDoc.body ? rootDoc : document).body;
    const iframeRect = iframe ? iframe.getBoundingClientRect() : {
      left: 0
    };
    void th.addEventListener("click", function(ev) {
      chrome.storage.local.remove("classifyTicketList", function() {});
      var backgroundColor = window.getComputedStyle(ev.target).backgroundColor;
      if ("A" === ev.target.nodeName && (ev.target.style.backgroundColor = "yellow", 
      ev.target.style.color = "red"), "rgba(0, 0, 0, 0)" === backgroundColor || "rgb(255, 255, 255)" === backgroundColor || "rgb(245, 245, 245)" === backgroundColor || "rgb(238, 238, 238)" === backgroundColor) {
        backgroundColor = iframeRect.left + ev.clientX;
        ev.clientY;
        if (backgroundColor > windowWidth * leftLinePositionListPage && backgroundColor < windowWidth * rightLinePositionListPage) isValidURL(leftURL) ? window.location.href = leftURL : alert("Please set value for variable leftURL in option page."); else if (backgroundColor > windowWidth * rightLinePositionListPage) isValidURL(rightURL) ? window.location.href = rightURL : alert("Please set value for variable rightURL in option page."); else if ("A" != ev.target.nodeName) {
          var backgroundColor = ev.target.closest("tr");
          if (backgroundColor) {
            let link = getLinkFromRow(backgroundColor);
            function getLinkFromRow(targetRow) {
              var linkText;
              return (targetRow = targetRow && targetRow.cells[2]) ? ((linkText = targetRow.querySelector("a.linked.formlink")) && (linkText.style.backgroundColor = "yellow", 
              linkText.style.color = "red"), targetRow.querySelector("a")) : null;
            }
            link || (backgroundColor = backgroundColor.previousElementSibling, link = getLinkFromRow(backgroundColor)), 
            link && chrome.runtime.sendMessage({
              greeting: "Open " + link.href + " in new tab"
            }, function(response) {});
          }
        }
      } else ev.target.className.startsWith("container-fluid") && (chrome.storage.local.remove("autoRun", function() {}), 
      chrome.runtime.sendMessage({
        greeting: "closeTab"
      }, response => {
        response && response.farewell && response.farewell;
      }));
    });
  } else {
    rootDoc = $("macroponent-f51912f4c700201072b211d4d8c26010")[0];
    if (null == rootDoc || null == rootDoc.shadowRoot || null == rootDoc.shadowRoot.querySelector("iframe") || null == rootDoc.shadowRoot.querySelector("iframe").contentWindow.document.body || null == rootDoc.shadowRoot.querySelector("iframe").contentWindow.document.body.querySelectorAll("a.linked.formlink") || 0 == rootDoc.shadowRoot.querySelector("iframe").contentWindow.document.body.querySelectorAll("a.linked.formlink").length) setTimeout(() => {
      processIFrame(iframe);
    }, 1e3); else {
      const windowWidth = window.innerWidth, windowHeight = window.innerHeight;
      function createLine(xPosition) {
        var svgNS = "http://www.w3.org/2000/svg", svg = document.createElementNS(svgNS, "svg"), xPosition = (svg.setAttribute("width", "10"), 
        svg.setAttribute("height", windowHeight), svg.setAttribute("style", `position: absolute; left: ${xPosition}px; top: 0;`), 
        document.createElementNS(svgNS, "line"));
        xPosition.setAttribute("x1", "5"), xPosition.setAttribute("y1", "120"), 
        xPosition.setAttribute("x2", "5"), xPosition.setAttribute("y2", windowHeight), 
        xPosition.setAttribute("stroke", "#FFFF00"), xPosition.setAttribute("stroke-width", "2"), 
        svg.appendChild(xPosition), document.body.appendChild(svg);
      }
      if (firstLineX = windowWidth * leftLinePositionListPage, firstLineX1 = windowWidth * rightLinePositionListPage, 
      createLine(firstLineX), createLine(firstLineX1), iFrameID = rootDoc.shadowRoot.querySelector("iframe").id, 
      iframeURL = rootDoc.shadowRoot.querySelector("iframe").src, ls = rootDoc.shadowRoot.querySelector("iframe").contentWindow.document.body.querySelectorAll("a.linked.formlink"), 
      lsTime = rootDoc.shadowRoot.querySelector("iframe").contentWindow.document.body.querySelectorAll(".datex.date-timeago"), 
      null != ls && 0 < ls.length) {
        const today = new Date(), year = today.getFullYear(), month = String(today.getMonth() + 1).padStart(2, "0"), day = String(today.getDate()).padStart(2, "0"), dateString = `${year}-${month}-` + day;
        void 0 !== todayTickets && todayTickets.today == dateString || (todayTickets = {}), 
        chrome.storage.local.get([ "bookmarkTickets" ], function(result) {
          if (!chrome.runtime.lastError) {
            bookmarkTickets = result.bookmarkTickets || "";
            for (var i = 0; i < ls.length; i++) {
              var lastSpaceIndex = ls[i].getAttribute("aria-label").lastIndexOf(" "), lastSpaceIndex = ls[i].getAttribute("aria-label").substring(lastSpaceIndex + 1), [ datePart, timePart ] = lsTime[i].getAttribute("title").split(" "), [ datePart, month, day ] = datePart.split("-"), [ timePart, minutes, seconds ] = timePart.split(":"), datePart = new Date(datePart, month - 1, day, timePart, minutes, seconds).getTime(), month = (void 0 !== todayTickets && lastSpaceIndex in todayTickets && datePart < todayTickets[lastSpaceIndex] && (ls[i].style.color = "red", 
              ls[i].style.backgroundColor = "yellow"), bookmarkTickets.includes(lastSpaceIndex) && (ls[i].style.color = "yellow", 
              ls[i].style.backgroundColor = "red"), ls[i].target = "_blank", ls[i].closest("tr")), day = month.querySelectorAll("td")[4];
              -1 === $(day).text().toLowerCase().indexOf(myID.toLowerCase()) && (day.style.color = "red", 
              timePart = day.querySelector("a")) && (timePart.style.color = "red");
            }
          }
        });
        th = (rootDoc.shadowRoot.querySelector("iframe").contentDocument || rootDoc.shadowRoot.querySelector("iframe").contentWindow.document).body;
        const iframeRect = rootDoc.shadowRoot.getElementById("gsft_main").getBoundingClientRect();
        th.addEventListener("click", function(ev) {
          var backgroundColor = window.getComputedStyle(ev.target).backgroundColor;
          if ("rgba(0, 0, 0, 0)" === backgroundColor || "rgba(255, 255, 255, 0.5)" === backgroundColor || "rgba(209, 210, 238, 0.5)" === backgroundColor || "rgb(209, 210, 238)" === backgroundColor) {
            backgroundColor = iframeRect.left + ev.clientX;
            ev.clientY;
            if (backgroundColor > windowWidth * leftLinePositionListPage && backgroundColor < windowWidth * rightLinePositionListPage) isValidURL(leftURL) ? chrome.runtime.sendMessage({
              greeting: "Open " + leftURL + " in current tab"
            }, function(response) {}) : alert("Please set value for variable leftURL in option page."); else if (backgroundColor > windowWidth + rightLinePositionListPage) isValidURL(rightURL) ? chrome.runtime.sendMessage({
              greeting: "Open " + rightURL + " in current tab"
            }, function(response) {}) : alert("Please set value for variable rightURL in option page."); else if ("A" != ev.target.nodeName) {
              var backgroundColor = ev.target.closest("tr");
              if (backgroundColor) {
                let link = getLinkFromRow(backgroundColor);
                function getLinkFromRow(targetRow) {
                  var linkText;
                  return (targetRow = targetRow && targetRow.cells[2]) ? ((linkText = targetRow.querySelector("a.linked.formlink")) && (linkText.style.backgroundColor = "yellow", 
                  linkText.style.color = "red"), targetRow.querySelector("a")) : null;
                }
                link || (backgroundColor = backgroundColor.previousElementSibling, 
                link = getLinkFromRow(backgroundColor)), link && window.open(link.href, "_blank");
              }
            }
          } else ev.target.className.startsWith("container-fluid") && (chrome.storage.local.remove("autoRun", function() {}), 
          chrome.runtime.sendMessage({
            greeting: "closeTab"
          }, response => {
            response && response.farewell && response.farewell;
          }));
        });
      }
    }
  }
}

function isValidURL(string) {
  try {
    return new URL(string), !0;
  } catch (_) {
    return !1;
  }
}

function processButton0(newTabOpened, labelIndex, labelValuesPairs) {
  if (newTabOpened) chrome.storage.local.get([ "newTabOpened" ], function(result) {
    null != result.newTabOpened && "no" == result.newTabOpened && (newTabOpened = !1);
  }); else {
    if (++labelIndex === labelValuesPairs.length) return;
    if (1 == labelValuesPairs[labelIndex].length) document.dispatchEvent(new KeyboardEvent("keyup", {
      key: labelValuesPairs[labelIndex]
    })); else if (labelValuesPairs[labelIndex].startsWith("Click submitButton")) {
      if (chrome.storage.local.set({
        [currentID + "draft"]: currentText
      }, function() {}), sureAboutFirstName && 0 != currentText.length && (!currentText.trimStart().startsWith(greeting.split(" ")[0]) || !currentText.trim().endsWith(myFirstName)) && -1 != currentURL.indexOf("service") && "activity-stream-comments-textarea" === lastTarget.id) return void alert("Not starting with greeting, or signature not found in your message!");
      $(urlMap.get("submit"))[0].click();
    } else if (labelValuesPairs[labelIndex].startsWith("Click")) $(labelValuesPairs[labelIndex].split(" ")[1]).click(); else if (labelValuesPairs[labelIndex].startsWith("Delay")) {
      var timestamp = Date.now(), timestamp = {
        data: labelValuesPairs[labelIndex],
        timestamp: timestamp
      };
      chrome.storage.local.set({
        delayKeyPressAfterReload: timestamp
      }, function() {});
    } else {
      let labelValuesPair = labelValuesPairs[labelIndex].split(":"), xpaths = xpathMap.get(labelValuesPair[0].trim()).split(":");
      if (xpaths[0].startsWith("button")) newTabOpened = !0, chrome.storage.local.set({
        assignTicket: xpaths[2] + ":" + labelValuesPair[1].trim()
      }, function() {}), chrome.storage.local.set({
        newTabOpened: "yes"
      }, function() {
        $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0]).click();
      }); else if (xpaths[0].startsWith("select")) {
        for (let t1 = 1; t1 < labelValuesPair.length; t1++) {
          var va = labelValuesPair[t1].trim();
          if (newFormat) {
            let o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(2)");
            (null != o1 && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(3)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(4)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(5)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(6)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(7)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(8)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(9)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(10)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(11)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(12)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(13)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(14)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(15)")) && o1.text === va || null != (o1 = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0] + " option:nth-child(16)")) && o1.text === va) && (o1.selected = "SELECTED");
          } else $(xpaths[0] + " option").filter(function(index) {
            return $(this).text(), $(this).text() === va;
          }).prop("selected", !0);
        }
        (newFormat ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0]) : $(xpaths[0])[0]).dispatchEvent(new Event("change"));
      } else if (xpaths[0].startsWith("textarea")) {
        va = labelValuesPair[1];
        newFormat ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0]).value = va : $(xpaths[0])[0].value = va;
      } else if (xpaths[0].startsWith("input")) {
        let originalValue = null;
        null != (originalValue = newFormat ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[0]).value : $(xpaths[0]).val()) && 0 < originalValue.length && "Assignment group" != labelValuesPair[0].trim() || "On hold expiration date" === labelValuesPair[0] ? (((va = labelValuesPair[1]).endsWith("week") || va.endsWith("weeks")) && (timestamp = new Date(), 
        va = function(date) {
          let day = date.getDate(), month = date.getMonth() + 1;
          return date = date.getFullYear(), month < 10 && (month = "0" + month), 
          day < 10 && (day = "0" + day), `${month}-${day}-` + date;
        }((timestamp = timestamp, weeks = va.replace(/weeks/, "").replace(/week/, ""), 
        (timestamp = new Date(timestamp)).setDate(timestamp.getDate() + 7 * weeks), 
        timestamp))), $(xpaths[0]).val(va), $(xpaths[0]).trigger("change"), $(xpaths[0]).trigger("focus")) : 3 == xpaths.length && xpaths[1].startsWith("button") && (newTabOpened = !0, 
        chrome.storage.local.set({
          assignTicket: xpaths[2] + ":" + labelValuesPair[1].trim()
        }, function() {}), chrome.storage.local.set({
          newTabOpened: "yes"
        }, function() {
          (newFormat ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(xpaths[1]) : $(xpaths[1])[0]).click();
        }));
      }
    }
  }
  var weeks;
  labelIndex + 1 < labelValuesPairs.length && 1 == labelValuesPairs[labelIndex + 1].length ? setTimeout(() => {
    processButton(newTabOpened, labelIndex, labelValuesPairs);
  }, 1e3) : setTimeout(() => {
    processButton(newTabOpened, labelIndex, labelValuesPairs);
  }, 500);
}

function processButton(newTabOpened, labelIndex, labelValuesPairs) {
  if (newTabOpened) chrome.storage.local.get([ "newTabOpened" ], function(result) {
    null != result.newTabOpened && "no" == result.newTabOpened && (newTabOpened = !1);
  }); else {
    if (++labelIndex === labelValuesPairs.length) return;
    if (1 == labelValuesPairs[labelIndex].length) document.dispatchEvent(new KeyboardEvent("keyup", {
      key: labelValuesPairs[labelIndex]
    })); else if (labelValuesPairs[labelIndex].startsWith("Click submitButton")) {
      if (chrome.storage.local.set({
        [currentID + "draft"]: currentText
      }, function() {}), !(0 == currentText.length || currentText.trimStart().startsWith(greeting.split(" ")[0]) && currentText.trim().endsWith(myFirstName) || -1 == currentURL.indexOf("service") || "activity-stream-comments-textarea" !== lastTarget.id)) return void alert("Not starting with greeting, or signature not found in your message!");
      $(urlMap.get("submit"))[0].click();
    } else if (labelValuesPairs[labelIndex].startsWith("Click")) $(labelValuesPairs[labelIndex].split(" ")[1]).click(); else if (labelValuesPairs[labelIndex].startsWith("Delay")) {
      var timestamp = Date.now(), timestamp = {
        data: labelValuesPairs[labelIndex],
        timestamp: timestamp
      };
      chrome.storage.local.set({
        delayKeyPressAfterReload: timestamp
      }, function() {});
    } else {
      let labelValuesPair = labelValuesPairs[labelIndex].split(":");
      var timestamp = Array.from(document.querySelectorAll("label")).find(el => el.textContent.trim() === labelValuesPair[0].trim()), element = null;
      let button = null;
      if (timestamp) {
        let inputId = timestamp.getAttribute("for");
        labelValuesPair[0].trim().startsWith("Additional comments") && (inputId = "activity-stream-comments-textarea"), 
        labelValuesPair[0].trim().startsWith("Work notes") && (inputId = "activity-stream-work_notes-textarea");
        element = document.getElementById(inputId), timestamp = "lookup." + inputId.replace("sys_display.", "");
        if (button = document.getElementById(timestamp)) newTabOpened = !0, chrome.storage.local.set({
          assignTicket: "_list:" + labelValuesPair[1].trim()
        }, function() {}), chrome.storage.local.set({
          newTabOpened: "yes"
        }, function() {
          button.click();
        }); else if (element) {
          let va = labelValuesPair[1].trim();
          "input" === element.tagName.toLowerCase() ? ((null != (timestamp = element.value) && 0 < timestamp.length && "Assignment group" != labelValuesPair[0].trim() || "On hold expiration date" === labelValuesPair[0]) && (va.endsWith("week") || va.endsWith("weeks")) && (timestamp = new Date(), 
          va = function(date) {
            let day = date.getDate(), month = date.getMonth() + 1;
            return date = date.getFullYear(), month < 10 && (month = "0" + month), 
            day < 10 && (day = "0" + day), `${month}-${day}-` + date;
          }((timestamp = timestamp, weeks = va.replace(/weeks/, "").replace(/week/, ""), 
          (timestamp = new Date(timestamp)).setDate(timestamp.getDate() + 7 * weeks), 
          timestamp))), element.value = va, element.dispatchEvent(new Event("change"))) : "select" === element.tagName.toLowerCase() ? (element.querySelectorAll("option").forEach(option => {
            option.textContent.trim() === labelValuesPair[1].trim() && (option.selected = !0);
          }), element.dispatchEvent(new Event("change"))) : "textarea" === element.tagName.toLowerCase() && (shortcutMap.has(va) && (va = greeting + ",\n" + shortcutMap.get(va).replace("myFirstName", myFirstName)), 
          element.value = va, element.dispatchEvent(new Event("input")));
        }
      }
    }
  }
  var weeks;
  labelIndex + 1 < labelValuesPairs.length && 1 == labelValuesPairs[labelIndex + 1].length ? setTimeout(() => {
    processButton(newTabOpened, labelIndex, labelValuesPairs);
  }, 800) : setTimeout(() => {
    processButton(newTabOpened, labelIndex, labelValuesPairs);
  }, 500);
}

function checkMonth(index, rs, fileName, r) {
  var currentDate = $(".monthAndYear-180")[0].firstChild.textContent, month = currentDate.split(/\s+/)[0];
  currentDate.split(/\s+/)[1];
  -1 != r.date.indexOf(month) ? setTimeout(() => {
    var day = r.date.split(", ")[1].split(/\s+/)[1].replace(/^0+/, "");
    let findFirstDay = !1;
    cells = $("tbody tr td");
    for (let i = 0; i < cells.length; i++) if ((findFirstDay = "1" === cells[i].textContent ? !0 : findFirstDay) && cells[i].textContent === day) {
      cells[i].click();
      break;
    }
    setTimeout(() => {
      $(".flexContainer-158")[4].click(), setTimeout(() => {
        $(".ms-TextField-field")[1].value = r.topic, $(".ms-Button.kIT8h.ms-Button--icon.ms-ComboBox-CaretDown-button")[0].click(), 
        setTimeout(() => {
          var ops = $(".ms-Button.ms-Button--action.ms-Button--command.ms-ComboBox-option");
          for (let i = 0; i < ops.length; i++) if (ops[i].firstChild.innerText === r.timeFrom) {
            ops[i].click();
            break;
          }
          $(".ms-Button.kIT8h.ms-Button--icon.ms-ComboBox-CaretDown-button")[1].click(), 
          setTimeout(() => {
            var ops = $(".ms-Button.ms-Button--action.ms-Button--command.ms-ComboBox-option");
            for (let i = 0; i < ops.length; i++) if (ops[i].firstChild.innerText === r.timeTo) {
              ops[i].click();
              break;
            }
            $("#innerRibbonContainer div:nth-child(4) button")[1].click(), setTimeout(() => {
              $(".ms-FocusZone li button")[0].click(), setTimeout(() => {
                var meetingID = $("tbody")[1].textContent.split("?pwd")[0].split("j/")[1];
                let zoomlink = "https://xy.zoom.us/j/" + meetingID, zoomEditLink = "Open https://zoom.us/meeting/" + meetingID;
                $(".ms-Button.ms-Button--action.ms-Button--command")[1].click(), 
                chrome.storage.local.get([ "calResults" ], function(result) {
                  let candi = result.calResults + r.subject + " " + r.date + " " + r.timeFrom + " " + r.timeTo + " " + r.who + " " + zoomlink + " " + zoomEditLink;
                  setTimeout(() => {
                    chrome.storage.local.set({
                      calResults: candi + "\n"
                    }, function() {});
                  }, 500);
                }), setTimeout(() => {
                  processCalendarRow(index, rs, fileName);
                }, 5e3);
              }, 5e3);
            }, 500);
          }, 1e3);
        }, 1e3);
      }, 4e3);
    }, 2e3);
  }, 500) : ($(".headerIconButton-182")[1].click(), setTimeout(() => {
    checkMonth(index, rs, fileName, r);
  }, 1e3));
}

function processCalendarRow(index, rs, fileName) {
  if (++index != rs.length) chrome.runtime.sendMessage({
    greeting: "saveCal " + fileName
  }, function(response) {}); else {
    let r = rs[index];
    $(".ms-Button.ms-Button--default.Ca7_4.root-209")[0].click(), setTimeout(() => {
      checkMonth(index, rs, fileName, r);
    }, 1e3);
  }
}

function processPrimerRow(newTabOpened, index, rs, hotkey, fileName) {
  if (newTabOpened) chrome.storage.local.get([ "newTabOpened" ], function(result) {
    null != result.newTabOpened && "no" == result.newTabOpened && (newTabOpened = !1);
  }); else {
    if (newTabOpened = !0, ++index == rs.length) return void chrome.runtime.sendMessage({
      greeting: "savePrimer " + fileName
    }, function(response) {});
    let r = rs[index];
    chrome.storage.local.get([ "primerResults" ], function(result) {
      let candi = result.primerResults + r.seq + " " + r.PRIMER5_START + " " + r.PRIMER5_END + " " + r.PRIMER3_START + " " + r.PRIMER3_END;
      setTimeout(() => {
        chrome.storage.local.set({
          primerResults: candi + "\n"
        }, function() {});
      }, 500);
    }), document.getElementById("seq").value = r.seq, document.getElementById("PRIMER5_START").value = r.PRIMER5_START, 
    document.getElementById("PRIMER5_END").value = r.PRIMER5_END, document.getElementById("PRIMER3_START").value = r.PRIMER3_START, 
    document.getElementById("PRIMER3_END").value = r.PRIMER3_END, chrome.storage.local.set({
      newTabOpened: "yes"
    }, function() {
      document.dispatchEvent(new KeyboardEvent("keyup", {
        key: hotkey
      }));
    });
  }
  setTimeout(() => {
    processPrimerRow(newTabOpened, index, rs, hotkey, fileName);
  }, 5e3);
}

function remvoveHintWindow() {
  var existingAlert = document.getElementById("tempAlertDiv1");
  existingAlert && existingAlert.parentNode.removeChild(existingAlert);
}

function hintWindow(msg) {
  var el = document.createElement("div");
  el.setAttribute("id", "tempAlertDiv1"), el.style.cssText = "position:fixed;top:15%;left:15%;background-color:black;padding:10px;color:white;border-radius:5px;font-size:12pt;z-index: 1000;", 
  el.textContent = msg, document.body.appendChild(el);
}

function tmpAlert(msg, duration = 1e3) {
  var existingAlert = document.getElementById("tempAlertDiv"), el = (existingAlert && existingAlert.parentNode.removeChild(existingAlert), 
  document.createElement("div")), existingAlert = (el.setAttribute("id", "tempAlertDiv"), 
  el.style.cssText = "position:fixed;top:10%;left:10%;background-color:black;padding:10px;color:white;border-radius:5px;font-size:12pt;z-index: 1000;", 
  document.createElement("div"));
  existingAlert.style.cssText = "font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color: white; display: inline-block; white-space: pre-wrap; background-color: black; padding: 10px;", 
  existingAlert.textContent = msg, el.appendChild(existingAlert), setTimeout(function() {
    el.parentNode && el.parentNode.removeChild(el);
  }, duration), document.body.appendChild(el);
}

function showLoadingSpinner(message = "Processing...") {
  hideLoadingSpinner();
  var spinner = document.createElement("div"), spinnerWrap = (spinner.setAttribute("id", "aiLoadingSpinner"), 
  spinner.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background-color:rgba(0,0,0,0.85);padding:30px;color:white;border-radius:10px;font-size:14pt;z-index:10000;text-align:center;min-width:250px;box-shadow:0 4px 20px rgba(0,0,0,0.5);", 
  document.createElement("div")), spinnerCircle = (spinnerWrap.style.cssText = "margin-bottom: 15px;", 
  document.createElement("div")), spinnerCircle = (spinnerCircle.className = "spinner", 
  spinnerCircle.style.cssText = "border: 4px solid #f3f3f3;border-top: 4px solid #4CAF50;border-radius: 50%;width: 50px;height: 50px;animation: spin 1s linear infinite;margin: 0 auto;", 
  spinnerWrap.appendChild(spinnerCircle), document.createElement("div"));
  return spinnerCircle.style.cssText = "font-family: Arial, sans-serif;", spinnerCircle.textContent = message, 
  spinner.appendChild(spinnerWrap), spinner.appendChild(spinnerCircle), document.getElementById("spinnerStyle") || ((message = document.createElement("style")).id = "spinnerStyle", 
  message.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `, document.head.appendChild(message)), document.body.appendChild(spinner), 
  spinner;
}

function hideLoadingSpinner() {
  var spinner = document.getElementById("aiLoadingSpinner");
  spinner && spinner.parentNode && spinner.parentNode.removeChild(spinner);
}

function hasKeyWithPrefix(map, prefix) {
  for (var key of map.keys()) if (key != prefix && key.startsWith(prefix)) return !0;
  return !1;
}

function addHints(e) {
  if ((hintIndex = 0) != lastWord.length && lastWord.length < 20) for (var k of shortcutMap.keys()) if (k.startsWith(lastWord)) {
    if (20 === ++hintIndex) break;
    hintText.set(hintIndex, k.substring(lastWord.length, k.length));
    var badgeText = (shortcutCommentMap.get(k) || "") + (1 === hintIndex ? " [" + hintIndex + " or double tab key]" : " [" + hintIndex + "]"), k = createHintBubble(lastWord, k.substring(lastWord.length, k.length), badgeText, {
      withBorder: 1 !== hintIndex
    });
    k.className = "addedhere", editableDiv ? hintWindow(hintMsg = hintMsg + k.textContent + "\n") : e.target.parentElement.append(k);
  }
  if (0 != lastSentence.length && lastSentence.length < 50) for (let k of sentenceMap.keys()) if (k.startsWith(lastSentence)) {
    if (20 === ++hintIndex) break;
    hintText.set(hintIndex, k.substring(lastSentence.length, k.length));
    const div = createHintBubble(lastSentence, k.substring(lastSentence.length, k.length), 1 === hintIndex ? String(hintIndex) + " or double tab key" : String(hintIndex), {
      highlightId: "addhere" + hintIndex
    });
    div.className = "addedhere", div.id = "addhere" + hintIndex, editableDiv ? hintWindow(hintMsg = hintMsg + div.textContent + "\n") : e.target.parentElement.append(div);
  }
}

function processInsert(e) {
  var keyC;
  if (0 != insertLength ? 0 < hintIndex && (hintIndex = 0, hintText.clear(), removeHints()) : (0 < (keyC = 48 < (keyC = currentText.substring(insertStart, insertStart + 1).charCodeAt(0)) && keyC < 58 ? keyC - 48 : 0) && keyC <= hintIndex && hintText.has(keyC) && (lastTextWithoutInsert = currentText.substring(0, insertStart) + currentText.substring(insertStart + 1, currentText.length), 
  h = lastWord.substring(0, lastWord.length - 1) + hintText.get(keyC), shortcutMap.has(h) ? (h = shortcutMap.get(h).replace("myFirstName", myFirstName), 
  insertLength = h.length + 1, currentText = currentText.substring(0, insertStart - lastWord.length + 1) + h + " " + currentText.substring(insertStart + 1, currentText.length), 
  insertStart = insertStart - lastWord.length + 1, updateInsertLength(insertLength)) : (currentText = currentText.substring(0, insertStart) + hintText.get(keyC) + " " + currentText.substring(insertStart + 1, currentText.length), 
  updateInsertLength(insertLength = hintText.get(keyC).length + 1))), 0 < hintIndex && (hintIndex = 0, 
  hintText.clear(), removeHints()), 0 == insertLength && (0 < currentText.length - lastText.length && currentText.length - lastText.length < 10 ? addHints(e) : 0 < hintIndex && (hintIndex = 0, 
  hintText.clear(), removeHints()))), editableDiv && 0 < insertLength) {
    -1 != currentURL.indexOf("mail.google.com") || -1 != currentURL.indexOf("chatgpt.com") || -1 != currentURL.indexOf("claude.ai") ? ((h = document.createElement("div")).style.whiteSpace = "pre", 
    h.innerText = currentText, e.srcElement.replaceChildren(h)) : e.srcElement.getElementsByTagName("div")[0].innerText = currentText;
    var h, lines = currentText.split("\n");
    let total = 0, para = 0, posi = 0;
    for (let i = 0; i < lines.length; i++) {
      if ((total += lines[i].length + 1) > insertStart + insertLength) {
        posi = lines[i].length - (total - (insertStart + insertLength));
        break;
      }
      0 < lines[i].length ? para += 2 : para++;
    }
    setCaret(e.srcElement.getElementsByTagName("div")[0], para, posi + 1);
    let ts = e.srcElement.children[1];
    for (;null != ts; ) e.srcElement.removeChild(ts), ts = e.srcElement.children[1];
  } else !editableDiv && 0 < insertLength && (e.target.value = currentText, keyC = new Event("input", {
    bubbles: !0,
    cancelable: !0
  }), e.target.dispatchEvent(keyC));
  if (lastTarget = e.target, lastInsertLength = 0 < insertLength ? insertLength : lastInsertLength, 
  lastInsertStart = 0 < insertLength ? insertStart : lastInsertStart, 10 < currentText.length - lastText.length && !editableDiv) {
    var arr = currentText.substring(insertStart, currentText.length).split(/\n\s+|\s+|<|>|\)|\(/);
    for (let i = 0; i < arr.length; i++) (arr[i].endsWith(",") || arr[i].endsWith(".")) && (arr[i] = arr[i].slice(0, -1)), 
    !arr[i].startsWith("https://") && !arr[i].startsWith("http://") || arr[i].endsWith("complianceline") || appendSafeExternalLink(e.target.parentElement, arr[i]);
  }
  lastText = currentText, chatTarget = lastTarget;
}

function setupKeyUpEventListerner(isIFrame) {
  var doc = document;
  (doc = isIFrame ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body : doc).addEventListener("keyup", function(e) {
    if (caretPosition = getCaretPosition(e.target), "ArrowLeft" != e.key && "ArrowRight" != e.key && "ArrowUp" != e.key && "ArrowDown" != e.key && "Shift" != e.key && "Alt" != e.key) if (e.keyCode == ctrlKey) ctrlDown = !1; else if ("Backspace" === e.key && caretPosition == lastInsertStart + lastInsertLength - 1) insertLength = 0, 
    insertStart = lastInsertStart, lastText = currentText = lastTextWithoutInsert, 
    e.target.value = currentText; else if ("Tab" === e.key && 1 === hintText.size) e.target.value = currentText + hintText.get(1) + " ", 
    updateInsertLength(insertLength = hintText.get(1).length + 1), removeHints(), 
    hintText.clear(), tmpHintOn = !1, clearTimeout(cmdProcessTimeout); else {
      if ("Tab" === e.key && 1 < hintText.size) return new Date().getTime() - lastTabTime < 500 ? (10 < hintText.get(1).length ? (e.target.value = currentText + hintText.get(1) + " ", 
      currentText = currentText + hintText.get(1) + " ", updateInsertLength(insertLength = hintText.get(1).length + 1)) : (e.target.value = currentText + hintText.get(1), 
      currentText += hintText.get(1), updateInsertLength(insertLength = hintText.get(1).length)), 
      removeHints(), hintText.clear(), tmpHintOn = !1, void clearTimeout(cmdProcessTimeout)) : (lastTabTime = new Date().getTime(), 
      void (cmdProcessTimeout = setTimeout(() => {
        if (tmpHintOn) tmpAlert("Please type according to the hint, or double tab to choose the first one."); else {
          function findPartialConsensus(inputMap) {
            var sentences = Array.from(inputMap.values());
            if (0 === sentences.length) return "";
            var inputMap = function(inputMap) {
              for (var value of inputMap.values()) if (!value.startsWith(" ")) return "";
              return " ";
            }(inputMap), tokenized = sentences.map(sentence => sentence.split(" ")), prefix = [];
            for (let i = 0; i < tokenized[0].length; i++) {
              var currentWords = tokenized.map(tokens => tokens[i] || null);
              if (1 < new Set(currentWords).size) break;
              prefix.push(currentWords[0]);
            }
            return 0 < prefix.length ? inputMap + prefix.join(" ") : " " === inputMap ? inputMap : (inputMap = sentences.map(sentence => sentence.split(" ")[0] + " " + sentence.split(" ")[1]).filter(word => word), 
            [ ...new Set(inputMap) ]);
          }
          let partial = "";
          if (1 === hintText.size ? (partial = hintText.get(1), removeHints()) : partial = findPartialConsensus(hintText), 
          partial.constructor === String && 0 < partial.length) " " === partial ? e.target.value = currentText + partial : e.target.value = currentText + partial + " "; else if (partial.constructor === Array) {
            tmpAlert("Please type " + partial, 4e3), tmpHintOn = !0, removeHints();
            for (let i = 0; i < partial.length; i++) {
              hintIndex = i + 1, hintText.set(hintIndex, partial[i]);
              var div = createHintBubble(lastSentence, partial[i], 0 === i ? "[" + hintIndex + " or double tab key ]" : "[" + i + "]", {
                highlightId: "addhere" + hintIndex
              });
              div.className = "addedhere", div.id = "addhere" + hintIndex, editableDiv ? hintWindow(hintMsg = hintMsg + div.textContent + "\n") : e.target.parentElement.append(div);
            }
          } else tmpAlert("The object is neither a string nor a list.");
        }
      }, 500)));
      tmpAlert(e.key);
      let targetID1 = null, readonly = null, className = null;
      if ("getAttribute" in e.target && (targetID1 = e.target.getAttribute("id"), 
      readonly = e.target.getAttribute("readonly"), className = e.target.getAttribute("class"), 
      "demoDiv" === targetID1 ? className = "editor active" : currentURL.indexOf("options.html"), 
      className = className && "." + className.replace(/\s+/g, ".")), outsideKeyPress = "INPUT" === e.target.nodeName || "TEXTAREA" === e.target.nodeName ? editableDiv = !1 : "DIV" !== e.target.nodeName || !(editableDiv = !0), 
      editableDiv && (targetID1 = className), ctrlDown || !outsideKeyPress && "readonly" != readonly) {
        if ("INPUT" === e.target.nodeName) return;
        if (new Date().getTime() - lastKeyTime < 3e3 && clearTimeout(saveDrafTimeout), 
        insertLength = 0, removeHints(), editableDiv) {
          currentText = "";
          var ts = e.srcElement.childNodes;
          if (-1 != currentURL.indexOf("outlook") || -1 != currentURL.indexOf("options.html")) for (let i = 0; i < ts.length; i++) null == ts[i].innerHTML || (currentText += ts[i].innerHTML.replace(/<br>/g, "\n").replace(/\&amp;/g, "&").replace(/\&nbsp;/g, "")).endsWith("\n") || (currentText += "\n"); else if (-1 != currentURL.indexOf("mail.yahoo.com") || -1 != currentURL.indexOf("chatgpt.com") || -1 != currentURL.indexOf("claude.ai") || -1 != currentURL.indexOf("sandbox.ai")) {
            for (let i = 0; i < ts.length; i++) (currentText += ts[i].innerText).endsWith("\n") || (currentText += "\n");
            ("Enter" !== e.key || -1 == currentURL.indexOf("chatgpt.com") && -1 == currentURL.indexOf("claude.ai")) && -1 == currentURL.indexOf("sandbox.ai") || (currentText = lastText);
          } else if (-1 != currentURL.indexOf("mail.google.com")) for (let i = 0; i < ts.length; i++) void 0 === ts[i].innerHTML ? currentText += ts[i].textContent : currentText += ts[i].innerHTML.replace(/<br>/g, "\n"), 
          currentText.endsWith("\n") || (currentText += "\n"); else for (let i = 0; i < ts.length; i++) (currentText += ts[i].textContent).endsWith("\n") || (currentText += "\n");
        } else currentText = e.target.value;
        if (null == currentText || 0 == currentText.length) return void (lastText = "");
        insertStart = caretPosition - 1;
        var ps = currentText.substring(0, insertStart + 1).trim().split("\n"), lastParagraph = ps[ps.length - 1], lastParagraph = lastParagraph.split(/\. |\? |\! /), lastParagraph = (lastSentence = lastParagraph[lastParagraph.length - 1]).split(/\s+/);
        if (lastWord = lastParagraph[lastParagraph.length - 1], "Enter" === e.key && "Enter" != lastKey && 1 < ps.length && saveSentences(ps[ps.length - 1]), 
        lastChar = e.key, 0 == lastText.length && 1 < firstName.length && !currentText.startsWith(greeting.split(" ")[0]) && ("activity-stream-comments-textarea" === e.target.id || "activity-stream-textarea" === e.target.id)) " " == currentText && (currentText = ""), 
        greeting.endsWith(",") || (greeting += ","), lastText = greeting + "\n" + (currentText = greeting + "\n" + currentText), 
        updateInsertLength(insertLength = currentText.length), e.target.dispatchEvent(new Event("change")); else if (lastWord[0] != lastWord[0].toUpperCase() && lastWord.length < 10 && 0 < lastWord.length) {
          shortcutMap.has(lastWord) || (lastTextWithoutInsert = ""), new Date().getTime() - lastKeyTime < 500 && clearTimeout(cmdProcessTimeout);
          let waitingTime = 1e3, tvalue = (!hasKeyWithPrefix(shortcutMap, lastWord) && shortcutMap.has(lastWord) && (waitingTime = 0), 
          shortcutMap.get(lastWord));
          cmdProcessTimeout = setTimeout(() => {
            var escapedFind;
            tvalue && (tvalue.startsWith("Search prompts") ? (chrome.runtime.sendMessage({
              greeting: tvalue
            }, function(response) {
              "urls will opened." != response.farewell && chrome.storage.local.remove("searchTicket", function() {});
            }), currentText = "", insertStart = insertLength = 10) : (tvalue = tvalue.replace("myFirstName", myFirstName), 
            lastTextWithoutInsert = currentText.substring(0, insertStart - lastWord.length + 1), 
            escapedFind = lastWord.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"), escapedFind = new RegExp(`\\b${escapedFind}\\b`, "g"), 
            currentText = currentText.replace(escapedFind, tvalue + " "), updateInsertLength(insertLength = tvalue.length + 1), 
            insertStart -= lastWord.length - 1), processInsert(e));
          }, waitingTime);
        }
        processInsert(e), saveDrafTimeout = setTimeout(() => {
          chrome.storage.local.set({
            [currentID + "draft"]: currentText
          }, function() {
            tmpAlert("Draft is saved!");
          }), chrome.storage.local.get([ currentID + "color" ], function(result) {
            chrome.runtime.lastError || result[currentID + "color"] || ($('textarea[name="incident.short_description"]').css("background-color", "green"), 
            $('input[name="incident.short_description"]').css("background-color", "green"), 
            $('textarea[name="u_incident_task.short_description"]').css("background-color", "green"), 
            $('textarea[name="sc_task.short_description"]').css("background-color", "green"), 
            chrome.storage.local.set({
              [currentID + "color"]: "green"
            }, function() {}), chrome.storage.local.set({
              upDownClicked: "yes"
            }, function() {}));
          });
        }, 3e3);
      } else {
        isSelfClick = !0, setTimeout(() => {
          isSelfClick = !1;
        }, 1e4);
        var tex = window.getSelection().toString().replace(myFirstName, "myFirstName"), lastParagraph = e.key;
        new Date().getTime() - lastKeyTime < 1e3 ? (cmdString += lastParagraph, 
        clearTimeout(cmdProcessTimeout)) : cmdString = lastParagraph;
        let waitingTime = 1e3;
        !hasKeyWithPrefix(controlMap, cmdString) && controlMap.has(cmdString) && (waitingTime = 0);
        controlMap.get(cmdString);
        cmdProcessTimeout = setTimeout(() => {
          if (value = controlMap.get(cmdString), cmdString = "", (value = null == value ? "" : value).startsWith("Save selection to profile") && 10 < tex.length) {
            var tenure = prompt('Please enter the shortcut for "' + tex + '". Leave blank if you want to save as a sentence without shortcut.');
            if (null != tenure && 0 < tenure.length) {
              chrome.storage.local.set({
                configSaveTime: getDate()
              }, function() {}), shortcutCommentMap.set(tenure.split(/\s+/)[0], tenure.substring(tenure.indexOf(" ") + 1)), 
              shortcutMap.set(tenure.split(/\s+/)[0], tex);
              var k, shortcutArray = {};
              let c = 0;
              for (k of shortcutMap.keys()) k === shortcutCommentMap.get(k) ? shortcutArray[c++] = [ k, shortcutMap.get(k) ] : shortcutArray[c++] = [ k + " " + shortcutCommentMap.get(k), shortcutMap.get(k) ];
              var sentenceArray = {};
              c = 0;
              for (let k of sentenceMap.keys()) sentenceArray[c++] = [ sentenceMap.get(k), k ];
              tenure = {}, tenure = (tenure[1] = urlArray, tenure[2] = keywordArray, 
              tenure[3] = controlArray, tenure[4] = shortcutArray, tenure[5] = sentenceArray, 
              tenure[6] = hideArray, tenure[7] = fillArray, tenure[8] = favorArray, 
              JSON.stringify(tenure));
              "Config1" === currentConfig ? chrome.storage.local.set({
                configa: tenure
              }, function() {}) : "Config2" === currentConfig ? chrome.storage.local.set({
                configb: tenure
              }, function() {}) : "Config3" === currentConfig ? chrome.storage.local.set({
                configc: tenure
              }, function() {}) : "Config4" === currentConfig && chrome.storage.local.set({
                configd: tenure
              }, function() {});
            } else saveSentences(tex);
          } else if (value.startsWith("Search bookmark")) {
            var tm = prompt("Please type in the keywords to search for bookmarked tickets:");
            for (let i = 0; i < Object.entries(favorArray).length; i++) -1 != (input = favorArray[i][1], 
            knownString = "Note: ", index = void 0, (-1 === (index = input.indexOf(knownString)) ? input : input.substring(index + knownString.length)).indexOf(tm)) && chrome.storage.local.get([ "ticketURL" ], function(result) {
              null != result.ticketURL ? chrome.storage.local.set({
                searchTicket: favorArray[i][0]
              }, function() {
                var value = "Open " + result.ticketURL + " in new tab";
                chrome.runtime.sendMessage({
                  greeting: value
                }, function(response) {});
              }) : alert("Please set value for variable ticketURL in option page.");
            });
          } else if (value.startsWith("Bookmark with comments")) {
            for (var key in favorArray) if (favorArray.hasOwnProperty(key) && favorArray[key][0] === currentID) {
              delete favorArray[key], tmpAlert("ticket removed from bookmark list"), 
              $('textarea[name="incident.short_description"]').css("background-color", "white"), 
              $('input[name="incident.short_description"]').css("background-color", "white"), 
              $('textarea[name="u_incident_task.short_description"]').css("background-color", "white"), 
              $('textarea[name="sc_task.short_description"]').css("background-color", "white");
              break;
            }
            tenure = document.getElementById("activity-stream-comments-textarea").value;
            if ("" === tenure) {
              let tm = prompt("Please try in the keywords for this ticket:", $('textarea[name="incident.short_description"]').val());
              favorArray[Object.entries(favorArray).length] = [ currentID, "Keywords: " + tm ];
            } else favorArray[Object.entries(favorArray).length] = [ currentID, tenure ];
            tmpAlert("ticket is bookmakred"), $('textarea[name="incident.short_description"]').css("background-color", urlMap.get("bookmarkTicketColor")), 
            $('input[name="incident.short_description"]').css("background-color", urlMap.get("bookmarkTicketColor")), 
            $('textarea[name="u_incident_task.short_description"]').css("background-color", urlMap.get("bookmarkTicketColor")), 
            $('textarea[name="sc_task.short_description"]').css("background-color", urlMap.get("bookmarkTicketColor"));
            let shortcutArray = {}, c = 0;
            for (let k of shortcutMap.keys()) k === shortcutCommentMap.get(k) ? shortcutArray[c++] = [ k, shortcutMap.get(k) ] : shortcutArray[c++] = [ k + " " + shortcutCommentMap.get(k), shortcutMap.get(k) ];
            let sentenceArray = {};
            c = 0;
            for (let k of sentenceMap.keys()) sentenceArray[c++] = [ sentenceMap.get(k), k ];
            let data = {}, keywords = (data[1] = urlArray, data[2] = keywordArray, 
            data[3] = controlArray, data[4] = shortcutArray, data[5] = sentenceArray, 
            data[6] = hideArray, data[7] = fillArray, data[8] = favorArray, JSON.stringify(data));
            "Config1" === currentConfig ? chrome.storage.local.set({
              configa: keywords
            }, function() {}) : "Config2" === currentConfig ? chrome.storage.local.set({
              configb: keywords
            }, function() {}) : "Config3" === currentConfig ? chrome.storage.local.set({
              configc: keywords
            }, function() {}) : "Config4" === currentConfig && chrome.storage.local.set({
              configd: keywords
            }, function() {});
          } else if (value.startsWith("Close tab")) chrome.storage.local.remove("autoRun", function() {}), 
          chrome.runtime.sendMessage({
            greeting: "closeTab"
          }, function(response) {}); else if (value.startsWith("Remove bookmark")) $('textarea[name="incident.short_description"]').css("background-color", "white"), 
          $('input[name="incident.short_description"]').css("background-color", "white"), 
          $('textarea[name="u_incident_task.short_description"]').css("background-color", "white"), 
          $('textarea[name="sc_task.short_description"]').css("background-color", "white"), 
          chrome.storage.local.remove(currentID, function() {}), tmpAlert("Removed bookmark for this ticket!"); else if (value.startsWith("Bookmark")) {
            tenure = value.split(/:/)[1].trim();
            $('textarea[name="incident.short_description"]').css("background-color") !== tenure && ($('textarea[name="incident.short_description"]').css("background-color", tenure), 
            $('input[name="incident.short_description"]').css("background-color", tenure), 
            $('textarea[name="u_incident_task.short_description"]').css("background-color", tenure), 
            $('textarea[name="sc_task.short_description"]').css("background-color", tenure), 
            chrome.storage.local.set({
              [currentID + "color"]: tenure
            }, function() {}), tmpAlert("Bookmark color is set to " + tenure), setTimeout(() => {
              chrome.storage.local.get([ currentID + "color" ], function(result) {
                chrome.runtime.lastError || result[currentID + "color"];
              });
            }, 1e3), chrome.storage.local.set({
              upDownClicked: "yes"
            }, function() {}));
          } else if (value.startsWith("Click submitButton")) chrome.storage.local.set({
            [currentID + "draft"]: currentText
          }, function() {}), 0 == currentText.length || currentText.trimStart().startsWith(greeting.split(" ")[0]) && currentText.trim().endsWith(myFirstName) || -1 == currentURL.indexOf("service") || "activity-stream-comments-textarea" !== lastTarget.id ? newFormat ? ($("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(urlMap.get("submit")).click(), 
          setTimeout(() => {
            processIFrame(null);
          }, 4e3)) : chrome.storage.local.get([ "todayTickets" ], function(result) {
            chrome.runtime.lastError || void 0 === (result = result.todayTickets) || (pageCloseTime = new Date().getTime()) - pageOpenTime < 5e3 || (result[currentID] = pageCloseTime + 1e5, 
            chrome.storage.local.set({
              todayTickets: result
            }, function() {
              chrome.runtime.lastError || $(urlMap.get("submit"))[0].click();
            }));
          }) : (alert("Not starting with greeting, or signature not found in your message!"), 
          showAll()); else if (value.startsWith("Click")) value.startsWith("Click .icon-arrow") && chrome.storage.local.set({
            upDownClicked: "yes"
          }, function() {}), changeBackground(urlMap.get("inActionColor")), newFormat ? ($("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(value.split(/\s+/)[1]).click(), 
          setTimeout(() => {
            processIFrame(null);
          }, 4e3)) : $(value.split(/\s+/)[1]).eq(0).click(); else if (value.startsWith("CheckAndDelayClick submitButton")) changeBackground(urlMap.get("inActionColor")), 
          sending || (sending = !0, (newFormat ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(urlMap.get("submit")) : $(urlMap.get("submit"))[0]).click()); else if (value.startsWith("Open")) changeBackground(urlMap.get("inActionColor")), 
          chrome.runtime.sendMessage({
            greeting: value
          }, function(response) {}); else if (value.startsWith("hide/show")) (isHiding ? showAll : hideAll)(); else if (value.startsWith("Show help")) {
            let msg = "<p><strong>HELP:</strong></p>";
            for (let [ key, value ] of new Map([ ...helpMsg.entries() ].sort())) msg += value;
            tmpAlert(msg, 1e4);
          } else if (value.startsWith("myWork")) chrome.runtime.sendMessage({
            greeting: "gotoTaskList"
          }, function(response) {}); else if (value.startsWith("newTicket")) chrome.runtime.sendMessage({
            greeting: "gotoNewTaskList"
          }, function(response) {}); else if (value.startsWith("fill test")) chrome.runtime.sendMessage({
            greeting: "saveCal filename"
          }, function(response) {}); else if (value.startsWith("fill FromExcel")) excelRowValue = value, 
          setZoomMeetings(); else if (value.startsWith("fill")) {
            changeBackground(urlMap.get("inActionColor"));
            tenure = value.split(/\n/);
            processButton(!1, 0, tenure);
          } else if (value.startsWith("Refresh")) window.location.reload(); else if (value.startsWith("Start new day")) todayTickets = {}, 
          chrome.storage.local.set({
            todayTickets: todayTickets
          }, function() {
            chrome.runtime.lastError;
          }), tmpAlert("Today's tickets are cleared. You can start a new day now."); else if (value.startsWith("Download tickets")) {
            chrome.storage.local.set({
              downloadTickets: "yes"
            }, function() {
              tmpAlert("Tickets will be downloaded shortly.", 4e3);
            });
            tenure = "User:\nShort description:\n" + $('textarea[name="incident.short_description"]').val() + "\nLong description:\n" + $('textarea[name="incident.description"]').val() + "\n";
            chrome.storage.local.set({
              rawTickets: "=== Conversation 0 ===\n" + tenure + myPrompt
            }, function() {
              chrome.runtime.lastError || setTimeout(() => {
                document.dispatchEvent(new KeyboardEvent("keyup", {
                  key: "f"
                }));
              }, 500);
            });
          } else if (value.startsWith("Save tickets to file")) chrome.storage.local.get([ "rawTickets" ], function(result) {
            var link, fileName;
            chrome.runtime.lastError ? alert("Error reading ticket data.") : void 0 !== (result = result.rawTickets) && result ? (result = new Blob([ result ], {
              type: "text/plain;charset=utf-8"
            }), result = URL.createObjectURL(result), (link = document.createElement("a")).setAttribute("href", result), 
            fileName = "tickets_" + new Date().toISOString().slice(0, 10) + ".txt", 
            link.setAttribute("download", fileName), document.body.appendChild(link), 
            link.click(), document.body.removeChild(link), URL.revokeObjectURL(result), 
            tmpAlert("Tickets saved to " + fileName, 3e3), chrome.storage.local.remove("rawTickets", function() {}), 
            chrome.storage.local.remove("ticketDownloadCount", function() {})) : alert("No ticket data found to save.");
          }), chrome.storage.local.remove("downloadTickets", function() {
            tmpAlert("Tickets will be stop downloadeding.", 4e3);
          }); else if (value.startsWith("Summarize tickets")) chrome.storage.local.get([ "rawTickets" ], function(result) {
            chrome.runtime.lastError ? alert("Error reading ticket data.") : void 0 !== (result = result.rawTickets) && result ? (result = "You are a document engineer.\n\nInput:\nRaw conversation text that is noisy, repetitive, and unstructured.\n\nTask:\n1. Extract only factual, reusable knowledge.\n2. Remove chit-chat, greetings, and filler.\n3. Group information by topic.\n4. Split content into chunks of 200–500 tokens.\n5. Rewrite for clarity while preserving original meaning.\n6. Produce a clean JSON array where each item has:\n   - id\n   - title\n   - text\n   - tags\n   - source (conversation)\n7. Ensure the output is suitable for RAG retrieval.\n\nOutput:\n- Valid JSON only.\n- No explanations.\n\n" + result, 
            useBackgroundAPI ? (showLoadingSpinner(), tmpAlert("Asking AI in background...", 3e3), 
            chrome.runtime.sendMessage({
              greeting: "askChatgptBackground",
              question: result
            }, function(response) {})) : chrome.storage.local.set({
              askChatgpt: result
            }, function() {
              var value = "Open " + chatSessionURL + " in new tab";
              chrome.runtime.sendMessage({
                greeting: value
              }, function(response) {});
            }), chrome.storage.local.remove("rawTickets", function() {}), chrome.storage.local.remove("ticketDownloadCount", function() {})) : alert("No ticket data found to save.");
          }), chrome.storage.local.remove("downloadTickets", function() {
            tmpAlert("Tickets will be stop downloadeding.", 4e3);
          }); else if (value.startsWith("Copy:")) {
            let userID;
            var button;
            -1 != value.indexOf("userID") ? (button = document.querySelector('[id="viewr.incident.caller_id"]')).disabled || (button.click(), 
            setTimeout(() => {
              var v;
              null == (texbox = document.getElementById("sys_readonly.sys_user.user_name")) ? tmpAlert("Failed to get user ID. Please make sure the caller_id field is visible and try again.", 2e3) : (userID = texbox.value.split("@")[0].toLowerCase(), 
              button.click(), copyToClipboard(v = value.slice(5).replace("userID", userID).replace("ticketID", currentID).replace("jobID", jobID)), 
              tmpAlert("Copied: " + v));
            }, 1e3)) : (copyToClipboard(tenure = value.slice(5).replace("ticketID", currentID).replace("jobID", jobID).replace("shortDescription", $('textarea[name="incident.short_description"]').val())), 
            tmpAlert("Copied: " + tenure));
          } else if (value.startsWith("Chat")) window.postMessage("testMessage", "*"); else if (value.startsWith("Ask sandbox to suggest")) if (useBackgroundAPI || "" != chatSessionURL) {
            let desc = "User:\nShort description:\n" + $('textarea[name="incident.short_description"]').val() + "\nLong description:\n" + $('textarea[name="incident.description"]').val() + "\n", myPrompt1 = "";
            myPrompt1 = "" == myPrompt ? "Prompt: I (" + myFirstName + ") am a supporting staff. Here is my conversation with computer user.\nPlease suggest an answer for the user.  Please use the most recently attached ChatConext file as reference. Directly give the answer in plain text. Thanks.\n" + myFirstName + ": Welcome to visit us. What on your mind?\n\n" + desc + myPrompt : "Prompt: I (" + myFirstName + ") am a supporting staff. Here is my conversation with computer user.\n\nPlease suggest an answer for the user. Directly give the answer in plain text. Please use the most recently attached ChatConext file as reference. Thanks.\n" + desc + myPrompt, 
            useBackgroundAPI ? (showLoadingSpinner(), tmpAlert("Asking AI in background...", 3e3), 
            chrome.runtime.sendMessage({
              greeting: "askChatgptBackground",
              question: myPrompt1
            }, function(response) {})) : chrome.storage.local.set({
              askChatgpt: myPrompt1
            }, function() {
              var value = "Open " + chatSessionURL + " in new tab";
              chrome.runtime.sendMessage({
                greeting: value
              }, function(response) {});
            });
          } else alert("Please set up the value for chatSessionURL in option page, or enable 'Use Background API' in options."); else if (value.startsWith("Ask sandbox to classify not in use")) if (useBackgroundAPI || "" != chatSessionURL) {
            let desc = "User:\nShort description:\n" + $('textarea[name="incident.short_description"]').val() + "\nLong description:\n" + $('textarea[name="incident.description"]').val() + "\n";
            tenure = "Prompt: This is a request from computer user: \n\n" + desc + "\n\n" + value.split(":")[1] + "\n\nReturn your response in this exact format:\nClassification: [your classification]\n\nThanks.";
            if (useBackgroundAPI) {
              showLoadingSpinner();
              try {
                chrome.storage.local.set({
                  pendingClassification: !0
                });
              } catch (e) {}
              tmpAlert("Asking AI in background...", 3e3), chrome.runtime.sendMessage({
                greeting: "askChatgptBackground",
                question: tenure
              }, function(response) {});
            } else chrome.storage.local.set({
              askChatgpt: tenure
            }, function() {
              var value = "Open " + chatSessionURL + " in new tab";
              chrome.runtime.sendMessage({
                greeting: value
              }, function(response) {});
            });
          } else alert("Please set up the value for chatSessionURL in option page, or enable 'Use Background API' in options."); else if (value.startsWith("Ask sandbox to classifyold")) if ("" == chatSessionURL) alert("Please set up the value for chatSessionURL in option page"); else {
            let desc = "User:\nShort description:\n" + $('textarea[name="incident.short_description"]').val() + "\nLong description:\n" + $('textarea[name="incident.description"]').val() + "\n", myPrompt1 = "";
            myPrompt1 = "" == myPrompt ? "Prompt: I (" + myFirstName + ") am a supporting staff. Here is my conversation with computer user:\n\n" + myFirstName + ": Welcome to visit us. What on your mind?\n\n" + desc + myPrompt + "\n\nPlease classify this converstion to one of the following toppics 1 HPC Consulting, 2 HPC Troubleshooting, 3 Bioinformatcs Consulting, 4 Bioinformatics Troubleshooting. Thanks." : "Prompt: I (" + myFirstName + ") am a supporting staff. Here is my conversation with computer user:\n\n" + desc + myPrompt + "\n\nPlease suggest an answer for the user. Directly give the answer. Thanks.", 
            chrome.storage.local.set({
              askChatgpt: myPrompt1
            }, function() {
              var value = "Open " + chatSessionURL + " in new tab";
              chrome.runtime.sendMessage({
                greeting: value
              }, function(response) {});
            });
          } else if (value.startsWith("Copy github PR commands")) {
            var repo, branchEl, tenure = window.location.pathname.split("/");
            "pull" === tenure[3] && (owner = tenure[1], repo = tenure[2], tenure = tenure[4], 
            branchEl = document.querySelector(".head-ref")) && (branchEl = branchEl.textContent.trim(), 
            navigator.clipboard.writeText(`
                git clone https://github.com/${owner}/${repo}.git
                cd ${repo}
                git fetch origin pull/${tenure}/head:${branchEl}
                git checkout ${branchEl}
                `), alert("Git commands copied to clipboard!"));
          } else if (value.startsWith("Classify ticket1")) (function(question) {
            var category, keywords, questionLower = question.toLowerCase();
            let bestCategory = "Uncategorized", highestScore = 0;
            for ([ category, keywords ] of Object.entries({
              "Advanced Network Services": [ "Static VPN", "Domain Name Services", "DNS", "static IP", "DHCP", "cname", "arecord" ],
              Advising: [ "Weave", "SiM Project Database", "SMO Project Database" ],
              "AI Consultations": [ "AI", "Artificial Intelligence", "ChatGPT", "GPT", "Commons", "Azure", "AI", "MGHPCC", "GPU", "Cluster" ],
              "Anatomy Tools": [ "Anatomy.tv", "Primal Pictures" ],
              "Application and Web Security": [ "Imperva", "waf", "bots", "ddos", "web security", "zscaler", "L4 traffic" ],
              Authentication: [ "2FA", "Duo", "Login", "Shibboleth", "SSO", "multi-factor authentication", "DUO Push" ],
              "Audio/Video Technology": [ "Zoom", "microphone", "speakers", "webcam", "recording", "stream", "echo", "video conferencing", "teams" ],
              "Authentication and Authorization": [ "Federation", "Login", "SAML", "CAS", "OpenID", "OAuth" ],
              "Backup and Storage": [ "Data Backup", "File Storage", "OneDrive", "Google Drive", "Dropbox" ],
              "Business Applications": [ "Salesforce", "SAP", "Oracle", "Concur" ],
              "Campus Networks": [ "WiFi", "eduroam", "Ethernet", "LAN", "WAN", "Router", "Switch" ],
              "Cloud Computing": [ "AWS", "Azure", "Google Cloud", "Compute", "Storage", "Cloud Hosting" ],
              "Collaboration and Communication": [ "Slack", "Teams", "Email", "Chat", "File Sharing", "Calendar" ],
              "Compliance and Security": [ "HIPAA", "FERPA", "Security Training", "Incident Response" ],
              "Desktop and Mobile Support": [ "Laptop", "Desktop", "Tablet", "Mobile", "iOS", "Android", "Computer Repair" ],
              "Directory and Identity Services": [ "LDAP", "Active Directory", "Identity Management", "NetID" ],
              "Email and Messaging": [ "Outlook", "Exchange", "Gmail", "Spam", "Phishing" ],
              "Event Technology": [ "Projector", "AV Setup", "Event Support" ],
              Facilities: [ "Heating", "Cooling", "Lighting", "Access Control" ],
              "High Performance Computing": [ "Cluster", "Parallel Computing", "GPU", "Scheduler" ],
              "Instructional Tools": [ "Canvas", "Blackboard", "Gradescope", "Turnitin" ],
              "Library Services": [ "Library Account", "Catalog", "eResources" ],
              Networking: [ "Internet", "WiFi", "Firewall", "VPN" ],
              Printing: [ "Printer", "Toner", "Paper", "Print Queue" ],
              "Purchasing and Procurement": [ "Buy@edu", "Requisition", "PO", "Invoice" ],
              "Research Support": [ "LabArchives", "Data Management", "Grant", "Proposal" ],
              "Software and Licensing": [ "Matlab", "SPSS", "Adobe", "License", "Install" ],
              "Student Systems": [ "Registration", "Transcripts", "Degree Audit", "Enrollment" ],
              "Surveys and Forms": [ "Qualtrics", "Google Forms", "SurveyMonkey" ],
              "Teaching and Learning Spaces": [ "Classroom Technology", "Projector", "Whiteboard", "Hybrid Learning" ],
              Telephony: [ "VoIP", "Phone", "Extension", "Call Forwarding" ],
              "Training and Documentation": [ "Workshops", "Guides", "Knowledge Base" ],
              "Video Production": [ "Video Editing", "Recording Studio", "Green Screen" ],
              "Web Hosting and Development": [ "Drupal", "WordPress", "HTML", "CSS", "Domain" ]
            })) {
              let score = 0;
              for (const keyword of keywords) {
                var regex = new RegExp(`\\b${keyword}\\b`, "gi"), regex = questionLower.match(regex);
                regex && (score += regex.length);
              }
              score > highestScore && (highestScore = score, bestCategory = category);
            }
            bestCategory;
          })($('textarea[name="incident.short_description"]').val() + "\n" + $('textarea[name="incident.description"]').val()); else if (value.startsWith("Classify ticket0")) if ("" == chatSessionURL) alert("Please set up the value for chatSessionURL in option page"); else {
            let desc = "User:\nShort description:\n" + $('textarea[name="incident.short_description"]').val() + "\nLong description:\n" + $('textarea[name="incident.description"]').val() + "\n", myPrompt1 = "Please classify this question to the types in the attached file. Please ouput two rows, first row for type name, second for key words:\n" + desc;
            chrome.storage.local.set({
              askChatgpt: myPrompt1
            }, function() {
              var value = "Open " + chatSessionURL + " in new tab";
              chrome.runtime.sendMessage({
                greeting: value
              }, function(response) {});
            });
          } else if (value.startsWith("Test rag")) {
            let p = ` You are a helpful assistant. Use the following context to answer the question.

                Context:
                  RAA is Retrieval - Augmented Activity.

                Question:
                  What is RAA ?

                Answer :

                `;
            chrome.storage.local.set({
              askChatgpt: p
            }, function() {
              var value = "Open " + chatSessionURL + " in new tab";
              chrome.runtime.sendMessage({
                greeting: value
              }, function(response) {});
            });
          } else if (value.startsWith("Search prompts")) {
            var value = "Open https://github.com/f/awesome-chatgpt-prompts in new tab";
            chrome.runtime.sendMessage({
              greeting: value
            }, function(response) {});
          } else if (value.startsWith("Edit")) "" != currentText ? "" == chatSessionURL ? alert("Please set value for variable chatSessionURL in option page.") : chrome.storage.local.set({
            askChatgpt: "Please edit: " + currentText
          }, function() {
            var value = "Open " + chatSessionURL + " in new tab";
            chrome.runtime.sendMessage({
              greeting: value
            }, function(response) {});
          }) : tmpAlert("No message to edit.", 5e3); else if (value.startsWith("Upload ticket")) {
            var owner;
            "" === myPrompt ? tmpAlert("No conversation is found") : (owner = "User:\nShort description:\n" + $('textarea[name="incident.short_description"]').val() + "\nLong description:\n" + $('textarea[name="incident.description"]').val() + "\n" + myPrompt, 
            chrome.runtime.sendMessage({
              greeting: "Upload ticket",
              conversation: owner
            }, function(response) {
              response && "success" === response.status ? tmpAlert("Ticket uploaded successfully.") : tmpAlert(response && response.message ? response.message : "Upload failed.");
            }));
          } else if (value.startsWith("Summarize tickets0")) if ("" === myPrompt) tmpAlert("No conversaction is found"); else {
            let myPrompt1;
            if ("" == chatSessionURL) alert("Please set value for variable chatSessionURL in option page."); else {
              let desc = "User:\nShort description:\n" + $('textarea[name="incident.short_description"]').val() + "\nLong description:\n" + $('textarea[name="incident.description"]').val() + "\n";
              myPrompt1 = "Prompt: Please summerize the following conversation to a prompt context, extract the keywords in the questions and attach to the end of the paragraph. Please remove people's names: \n\n" + desc + myPrompt + "\n\nThanks.", 
              chrome.storage.local.set({
                askChatgpt: myPrompt1
              }, function() {
                var value = "Open " + chatSessionURL + " in new tab";
                chrome.runtime.sendMessage({
                  greeting: value
                }, function(response) {});
              });
            }
          } else if (value.startsWith("Find ticket ID in outlook.office.com")) chrome.storage.local.set({
            searchEmail: currentID
          }, function() {
            chrome.runtime.sendMessage({
              greeting: "searchEmailt"
            }, function(response) {
              "ticket will open soon." != response.farewell && (chrome.storage.local.remove("searchEmail", function() {}), 
              alert(response.farewell));
            });
          }); else if (value.startsWith("Ask webllm model")) chrome.runtime.sendMessage({
            reload: "hi"
          }); else if (value.startsWith("Prompt")) if ("" != mostRecentMessage) tmpAlert("<p><strong>Sent chat message:</strong></p>" + mostRecentMessage, 5e3), 
          chrome.runtime.sendMessage({
            chatInput: mostRecentMessage
          }), myPrompt += "\nUser: " + mostRecentMessage; else tmpAlert("<p><strong>No last message</strong></p>", 5e3), 
          chrome.runtime.sendMessage({
            chatInput: "How do you like your own answer?"
          }), myPrompt += "\nUser: How do you like your own answer?"; else;
          var input, knownString, index;
        }, waitingTime);
      }
      lastKeyTime = new Date().getTime(), lastKey = e.key;
    }
  }, !0);
}

function copyToClipboard(text) {
  var input = document.createElement("input");
  input.style.position = "absolute", input.style.left = "-9999px", document.body.appendChild(input), 
  input.value = text, input.select(), document.execCommand("copy"), document.body.removeChild(input);
}

function setZoomMeetings() {
  let input = document.createElement("input");
  input.type = "file", input.onchange = function() {
    var reader, file = input.files[0];
    file && (chrome.storage.local.set({
      calResults: "Cal for " + file.name + "\n"
    }, function() {}), (reader = new FileReader()).readAsBinaryString ? (reader.onload = function(e) {
      var e = e.target.result, e = XLSX.read(e, {
        type: "binary"
      }), Sheet = e.SheetNames[0];
      processCalendarRow(-1, XLSX.utils.sheet_to_row_object_array(e.Sheets[Sheet], {
        raw: !1
      }), file.name);
    }, reader.readAsBinaryString(file)) : (reader.onload = function(e) {
      for (var data = "", bytes = new Uint8Array(e.target.result), i = 0; i < bytes.byteLength; i++) data += String.fromCharCode(bytes[i]);
      for (var e = XLSX.read(data, {
        type: "binary"
      }), Sheet = e.SheetNames[0], excelRows = XLSX.utils.sheet_to_row_object_array(e.Sheets[Sheet]), i = 0; i < excelRows.length; i++);
    }, reader.readAsArrayBuffer(file)));
  }, input.click();
}

function designPrimer() {
  document.getElementById("nw1").checked = !0;
  var input = document.createElement("input");
  input.type = "file", input.onchange = function() {
    var reader, file = input.files[0];
    file && (chrome.storage.local.set({
      primerResults: "Primers for " + file.name + "\n"
    }, function() {}), (reader = new FileReader()).readAsBinaryString ? (reader.onload = function(e) {
      var e = e.target.result, e = XLSX.read(e, {
        type: "binary"
      }), Sheet = e.SheetNames[0];
      processPrimerRow(!1, -1, XLSX.utils.sheet_to_row_object_array(e.Sheets[Sheet]), excelRowValue.split(/\s+/)[2], file.name);
    }, reader.readAsBinaryString(file)) : (reader.onload = function(e) {
      for (var data = "", bytes = new Uint8Array(e.target.result), i = 0; i < bytes.byteLength; i++) data += String.fromCharCode(bytes[i]);
      for (var e = XLSX.read(data, {
        type: "binary"
      }), Sheet = e.SheetNames[0], excelRows = XLSX.utils.sheet_to_row_object_array(e.Sheets[Sheet]), i = 0; i < excelRows.length; i++);
    }, reader.readAsArrayBuffer(file)));
  }, input.click();
}

function saveSentences(para) {
  var sens = para.replace(/(<([^>]+)>)/gi, "").split(/(\. |\? |\! )/);
  for (let i = 0; i < sens.length; i++) {
    let item = sens[i];
    i + 1 < sens.length && (". " === sens[i + 1] || "? " === sens[i + 1] || "! " === sens[i + 1]) && (item += sens[i + 1]), 
    10 < item.length && (sentenceMap.has(item) ? sentenceMap.set(item, sentenceMap.get(item) + 1) : sentenceMap.set(item, 1));
  }
  var k, shortcutArray = {};
  let c = 0;
  for (k of shortcutMap.keys()) shortcutArray[c++] = [ k + " " + shortcutCommentMap.get(k), shortcutMap.get(k) ];
  var sentenceArray = {};
  c = 0;
  for (let k of sentenceMap.keys()) sentenceArray[c++] = [ sentenceMap.get(k), k ];
  para = {}, para[1] = urlArray, para[2] = keywordArray, para[3] = controlArray, 
  para[4] = shortcutArray, para[5] = sentenceArray, para[6] = hideArray, para[7] = fillArray, 
  para[8] = favorArray, para = JSON.stringify(para);
  "Config1" === currentConfig ? chrome.storage.local.set({
    configa: para
  }, function() {}) : "Config2" === currentConfig ? chrome.storage.local.set({
    configb: para
  }, function() {}) : "Config3" === currentConfig ? chrome.storage.local.set({
    configc: para
  }, function() {}) : "Config4" === currentConfig && chrome.storage.local.set({
    configd: para
  }, function() {});
}

function removeHints() {
  let doc = document;
  for (var elements = (doc = newFormat ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body : doc).getElementsByClassName("addedhere"); 0 < elements.length; ) elements[0].parentNode.removeChild(elements[0]);
  remvoveHintWindow(), hintMsg = "";
}

function getCaretPosition(item) {
  let caretP = 0;
  var sel;
  return item.selectionStart || "0" == item.selectionStart ? caretP = item.selectionStart : document.selection && (item.focus(), 
  (sel = document.selection.createRange()).moveStart("character", -item.value.length), 
  caretP = sel.text.length), caretP;
}

function setCaret(node, line, position) {
  node.focus();
  var range = document.createRange(), node = (range.setStart(node.childNodes[line], position), 
  range.setEnd(node.childNodes[line], position), window.getSelection());
  node.removeAllRanges(), node.addRange(range);
}

function setCaretPositionFirefox(node, line, position) {
  node.focus();
  var range = document.createRange(), node = (range.setStart(node.childNodes[line], position), 
  range.setEnd(node.childNodes[line], position), window.getSelection());
  node.removeAllRanges(), node.addRange(range);
}

function setupKeyDownEventListerner(hasFrame) {
  document.addEventListener("keydown", function(e) {
    if (!(ctrlDown = e.keyCode == ctrlKey || ctrlDown) && (9 == (e.keyCode || e.which) && 0 < hintIndex && null != lastTarget)) return lastTarget.getAttribute("id"), 
    e.preventDefault ? (e.preventDefault(), e.stopImmediatePropagation()) : e.returnValue = !1, 
    void ("INPUT" === e.target.nodeName || "TEXTAREA" === e.target.nodeName ? editableDiv = !1 : "DIV" === e.target.nodeName && (editableDiv = !0));
  }, !0), currentText = lastText = "";
}

function longegetCommonPrefix(words) {
  if (!words[0] || 1 == words.length) return words[0] || "";
  let i = 0;
  for (;words[0][i] && words.every(w => w[i] === words[0][i]); ) i++;
  return words[0].substr(0, i);
}

function showAll() {
  if (isHiding = !1, newFormat) for (var k of hideMap.keys()) $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(k).style.display = "block"; else {
    for (let k of hideMap.keys()) $(k).show();
    var cs = $(".h-card.h-card_md.h-card_comments");
    if (null != cs && 0 < cs.length) for (var i = 0; i < cs.length; i++) $(cs[i]).show();
  }
}

function hideAll() {
  if (!urlMap.get("submit").endsWith("1")) if (isHiding = !0, newFormat) for (var k of hideMap.keys()) $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(k).style.display = "none"; else {
    for (let k of hideMap.keys()) $(k).hide();
    var cs = $(".h-card.h-card_md.h-card_comments");
    if (null != cs && 0 < cs.length) for (var i = 0; i < cs.length; i++) {
      var cType = cs[i].childNodes[1].innerText;
      -1 === cType.indexOf("Additional comments") && -1 === cType.indexOf("Work notes") && -1 === cType.indexOf("ServiceNow email") && -1 === cType.indexOf("Attachment") && $(cs[i]).hide();
    }
  }
}

function setupClickEventListerner(isIFrame) {
  var doc;
  0 < urlMap.get("submit").length && (doc = document, isIFrame && (doc = $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body), 
  (isIFrame ? $("#gsft_main").contents().find(urlMap.get("submit")).on("click", function(event) {
    event.stopPropagation(), event.preventDefault(), event.stopImmediatePropagation(), 
    submitButtonClicked();
  }) : $(urlMap.get("submit")).click(function(event) {
    delaySubmit = !1, event.stopImmediatePropagation(), submitButtonClicked();
  })).removeAttr("onclick"), doc.addEventListener("click", e => {
    e = e.target.id;
    if ("unDoSendingButton" == e) {
      for (let j = 0; j < 10; j++) clearTimeout(timeOuts[j]);
      removeHints(), sending = !1;
    } else if ("sendNowButton" == e) {
      for (let j = 0; j < 10; j++) clearTimeout(timeOuts[j]);
      removeHints(), (newFormat ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(urlMap.get("submit") + "_bottom") : $(urlMap.get("submit") + "_bottom")[0]).click(), 
      lastTarget = null, lastText = "", sending = !1;
    }
  }));
}

function submitButtonClicked() {
  if (null != lastText && 0 < lastText.length && null != lastTarget) {
    for (let i = 9; -1 < i; i--) timeOuts[9 - i] = setTimeout(() => {
      var div, status, undoButton, sendNowButton;
      0 != i ? (removeHints(), div = document.createElement("div"), (status = document.createElement("div")).className = "addedhere", 
      status.style.cssText = "font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 12pt; color:red; display: inline-block; white-space: pre-wrap;", 
      status.appendChild(document.createTextNode("   Sending...         " + i + "     ")), 
      (undoButton = document.createElement("button")).style.cssText = "color:red; border-color:red", 
      undoButton.id = "unDoSendingButton", undoButton.textContent = "Undo", (sendNowButton = document.createElement("button")).style.cssText = "color:red; border-color:red", 
      sendNowButton.id = "sendNowButton", sendNowButton.textContent = "Send Now", 
      status.appendChild(undoButton), status.appendChild(sendNowButton), div.appendChild(status), 
      lastTarget.parentElement.append(div)) : (lastTarget = null, lastText = "", 
      removeHints(), (newFormat ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(urlMap.get("submit") + "_bottom") : $(urlMap.get("submit") + "_bottom"))[0].click(), 
      sending = !1);
    }, 100 * (9 - i));
    lastText = "";
  } else (newFormat ? $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("iframe").contentWindow.document.body.querySelector(urlMap.get("submit") + "_bottom") : $(urlMap.get("submit") + "_bottom"))[0].click(), 
  sending = !1;
  currentText = lastText = "";
}

function changeBackground(color) {
  $('textarea[name="incident.description"]').css("background-color", color), $('textarea[name="u_incident_task.description"]').css("background-color", color), 
  $('textarea[name="sc_task.description"]').css("background-color", color), $('textarea[id="activity-stream-work_notes-textarea"]').css("background-color", color);
}

$(document).ready(function() {
  pageOpenTime = new Date().getTime(), currentURL = window.location.href, domain = (domain = "https://" + currentURL.match(/https:\/\/([^\/]+)/)[1]) || "file", 
  chrome.storage.local.get([ "lastDownloadDate" ], function(result) {
    var lastMs, nowMs;
    chrome.runtime.lastError || ((result = result.lastDownloadDate) ? (lastMs = "number" == typeof result ? result : Date.parse(result), 
    Number.isNaN(lastMs) || (nowMs = Date.now(), nowMs = Math.abs(nowMs - lastMs), 
    7 <= Math.ceil(nowMs / 864e5) && tmpAlert("It has been over a week since you last exported the config file. To make sure you have a backup of the config, please consider exporting and backing up in the configure page. Please open the option page and export the congig file.", 5e3))) : null == result && tmpAlert("Looks like you never backed up your config file. It is highly recommended to export and back up your config in the configure page, so you will not lose your settings and data when you switch to a new computer or need to reset the extension. Please open the option page and export the congig file.", 5e3));
  }), loadCon();
  {
    var callback = function() {
      if (-1 != currentURL.indexOf("sandbox") && chrome.storage.local.get([ "askChatgpt" ], function(result) {
        if (null != result.askChatgpt) {
          let lastOne = null;
          {
            var selector = "#prompt-textarea";
            const interval = setInterval(() => {
              const texbox = document.querySelector(selector);
              if (texbox) {
                var updateTimeout;
                clearInterval(interval), texbox.value = result.askChatgpt, setTimeout(() => {
                  var evt = new Event("input", {
                    bubbles: !0,
                    cancelable: !0
                  });
                  texbox.dispatchEvent(evt);
                  const MAX_RETRIES = 5;
                  let retries = 0;
                  !function tryClick() {
                    var button = document.querySelector('[data-testid="send-button"]');
                    button ? button.click() : retries < MAX_RETRIES && (retries++, 
                    setTimeout(tryClick, 200));
                  }();
                }, 200);
                const observer = new MutationObserver(mutationsList => {
                  var elements = document.querySelectorAll(".w-full.text-token-text-primary"), elements = (lastOne = elements[elements.length - 1], 
                  clearTimeout(updateTimeout), document.querySelector(".result-thinking"));
                  elements || (updateTimeout = setTimeout(() => {
                    observer.disconnect(), null != lastOne && chrome.storage.local.get([ "classifyTicketList" ], function(result) {
                      if (result.classifyTicketList && 0 < result.classifyTicketList.length) {
                        var tics = lastOne.innerText.split("\n");
                        for (let i = 1; i < tics.length; i++) if (-1 != tics[i].indexOf(" Classification: ")) {
                          let tic = tics[i].split(" Classification: ")[0].trim(), cla = tics[i].split(" Classification: ")[1].trim();
                          chrome.storage.local.set({
                            [tic + "classificationResult"]: cla
                          }, function() {
                            chrome.runtime && chrome.runtime.lastError;
                          });
                        }
                        chrome.storage.local.remove("classifyTicketList", function() {}), 
                        chrome.storage.local.set({
                          upDownClicked: "yes"
                        }, function() {}), chrome.runtime.sendMessage({
                          greeting: "closeTab, the chat tab"
                        }, response => {
                          response && response.farewell && response.farewell;
                        });
                      } else document.getElementById("thumbsUpButton") || ((result = document.createElement("button")).id = "thumbsUpButton", 
                      result.textContent = "👍", result.style.position = "fixed", 
                      result.style.right = "20px", result.style.top = "50%", result.style.transform = "translateY(-50%)", 
                      result.style.fontSize = "48px", result.style.width = "80px", 
                      result.style.height = "80px", result.style.borderRadius = "50%", 
                      result.style.border = "2px solid #ccc", result.style.backgroundColor = "#fff", 
                      result.style.cursor = "pointer", result.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)", 
                      result.style.zIndex = "10000", result.title = "Send positive feedback", 
                      result.onclick = function() {
                        chrome.runtime.sendMessage({
                          greeting: "answerFromChatgpt " + lastOne.innerText
                        }, function(response) {});
                      }, document.body.appendChild(result));
                    });
                  }, 4e3));
                });
                observer.observe(document.body, {
                  attributes: !0,
                  characterData: !0,
                  subtree: !0
                });
              }
            }, 500);
          }
          chrome.storage.local.remove("askChatgpt", function() {});
        }
      }), -1 != currentURL.indexOf("classic") && (newFormat = !0), -1 != currentURL.indexOf("service-now.com/sys_attachment.do") ? document.addEventListener("click", e => {
        window.close();
      }) : -1 != currentURL.indexOf("service-now.com/cmdb_ci") || -1 != currentURL.indexOf("service-now.com/sys_user_list.do") ? chrome.storage.local.get([ "assignTicket" ], function(result) {
        if (null != result.assignTicket) {
          var arry = result.assignTicket.split(":");
          if (-1 != currentURL.indexOf(arry[0])) {
            let rows = $("tbody tr td:nth-child(3)");
            for (let i = 0; i < rows.length; i++) if (-1 != rows[i].innerHTML.indexOf(arry[1])) {
              chrome.storage.local.set({
                newTabOpened: "no"
              }, function() {
                rows[i].firstChild.click();
              });
              break;
            }
          }
          chrome.storage.local.set({
            assignTicket: null
          }, function() {});
        }
      }) : -1 != currentURL.indexOf("service-now.com/sys_user_group_list.do") && chrome.storage.local.get([ "assignTicket" ], function(result) {
        if (null != result.assignTicket) {
          let arry = result.assignTicket.split(":");
          -1 != currentURL.indexOf(arry[0]) && setTimeout(() => {
            let rows = document.querySelectorAll("a");
            for (let i = 0; i < rows.length; i++) if (rows[i].innerText === arry[1]) {
              chrome.storage.local.set({
                newTabOpened: "no"
              }, function() {
                rows[i].click();
              });
              break;
            }
          }, 1e3), chrome.storage.local.set({
            assignTicket: null
          }, function() {});
        }
      }), listPagePaths.some(path => currentURL.includes(path))) {
        var today = new Date();
        const dateString = today.getFullYear() + `-${String(today.getMonth() + 1).padStart(2, "0")}-` + String(today.getDate()).padStart(2, "0");
        chrome.storage.local.get([ "todayTickets" ], function(result) {
          chrome.runtime.lastError || void 0 !== (todayTickets = result.todayTickets) && todayTickets.today != dateString && (todayTickets = {}, 
          chrome.storage.local.remove("todayTickets", function() {}));
        }), chrome.storage.local.get([ "searchTicket" ], function(result) {
          var iframe;
          null != result.searchTicket ? (newFormat ? setTimeout(() => {
            $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("div").firstElementChild.firstElementChild.children[0].shadowRoot.querySelectorAll("div")[5].querySelector("div").firstElementChild.shadowRoot.firstElementChild.querySelector("div").children[2].firstElementChild.firstElementChild.firstChild.firstChild.shadowRoot.firstChild.shadowRoot.firstChild.firstChild.firstChild.firstChild.click(), 
            $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("div").firstElementChild.firstElementChild.children[0].shadowRoot.querySelectorAll("div")[5].querySelector("div").firstElementChild.shadowRoot.firstElementChild.querySelector("div").children[2].firstElementChild.firstElementChild.firstChild.firstChild.shadowRoot.firstChild.shadowRoot.firstChild.firstChild.firstChild.querySelector("#sncwsgs-typeahead-input").select(), 
            setTimeout(() => {
              $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("div").firstElementChild.firstElementChild.children[0].shadowRoot.querySelectorAll("div")[5].querySelector("div").firstElementChild.shadowRoot.firstElementChild.querySelector("div").children[2].firstElementChild.firstElementChild.firstChild.firstChild.shadowRoot.firstChild.shadowRoot.firstChild.firstChild.firstChild.querySelector("#sncwsgs-typeahead-input").value = result.searchTicket, 
              setTimeout(() => {
                var enterEvent = new KeyboardEvent("keydown", {
                  bubbles: !0,
                  cancelable: !0,
                  key: "Enter",
                  code: "Enter",
                  keyCode: 13
                });
                $("macroponent-f51912f4c700201072b211d4d8c26010")[0].shadowRoot.querySelector("div").firstElementChild.firstElementChild.children[0].shadowRoot.querySelectorAll("div")[5].querySelector("div").firstElementChild.shadowRoot.firstElementChild.querySelector("div").children[2].firstElementChild.firstElementChild.firstChild.firstChild.shadowRoot.firstChild.shadowRoot.firstChild.firstChild.firstChild.querySelector("#sncwsgs-typeahead-input").dispatchEvent(enterEvent);
              }, 2e3);
            }, 2e3);
          }, 8e3) : ($(".input-group-addon-transparent.icon-search.sysparm-search-icon").click(), 
          $("#sysparm_search").val(result.searchTicket), $(".form-inline.navpage-global-search.ng-non-bindable").submit()), 
          chrome.storage.local.remove("searchTicket", function() {}), setTimeout(() => {
            var iframeURL, iframe = document.getElementById("gsft_main");
            null != iframe && -1 != (iframeURL = iframe.contentWindow.location.href).indexOf("incident.do") ? chrome.runtime.sendMessage({
              greeting: "Open " + iframeURL
            }, function(response) {}) : processIFrame(iframe);
          }, 3e3)) : null != (iframe = document.getElementById("gsft_main")) ? (iframe.onload = function() {
            var iframeURL = iframe.contentWindow.location.href;
            -1 != iframeURL.indexOf("incident.do") ? chrome.runtime.sendMessage({
              greeting: "Open " + iframeURL
            }, function(response) {}) : processIFrame(iframe);
          }, iframe.contentDocument && "complete" === iframe.contentDocument.readyState && iframe.onload()) : processIFrame(iframe);
        });
        let classifyButton = document.createElement("button");
        classifyButton.innerText = "Classify Tickets", classifyButton.style.position = "fixed", 
        classifyButton.style.top = "5px", classifyButton.style.left = "50%", classifyButton.style.transform = "translateX(-50%)", 
        classifyButton.style.padding = "10px 20px", classifyButton.style.backgroundColor = "#007bff", 
        classifyButton.style.color = "#fff", classifyButton.style.border = "none", 
        classifyButton.style.borderRadius = "5px", classifyButton.style.cursor = "pointer", 
        classifyButton.style.zIndex = "10000", classifyButton.onclick = function() {
          let classifyTicketList = [];
          !function processTicket(i) {
            var button, spinnerText, spinner;
            if (i >= allTicketIDs.length) 0 < classifyTicketList.length ? (button = classifyButton, 
            spinnerText = "Working...", button._originalText = button.textContent, 
            (spinner = document.createElement("span")).className = "spinner", spinner.style.cssText = "display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top:2px solid #007bff;border-radius:50%;animation:spin 1s linear infinite;vertical-align:middle;margin-right:8px;", 
            button.replaceChildren(spinner, document.createTextNode(spinnerText)), 
            button.disabled = !0, classifyTicketList = classifyTicketList.slice(0, 5), 
            chrome.storage.local.set({
              classifyTicketList: classifyTicketList
            }, function() {}), spinner = domain + "/incident.do?sys_id=" + classifyTicketList[0].split(":")[1], 
            chrome.runtime.sendMessage({
              greeting: "Open " + spinner
            }, function(response) {})) : tmpAlert("No tickets need to be classified on this page.", 5e3); else {
              const ticketID = allTicketIDs[i], key1 = ticketID + "classificationResult";
              chrome.storage.local.get([ key1 ], function(result) {
                if (result[key1]) processTicket(i + 1); else {
                  let tid = ticketID + "sysid";
                  chrome.storage.local.get([ tid ], function(result2) {
                    null != result2[tid] && (result2 = result2[tid], classifyTicketList.push(ticketID + ":" + result2)), 
                    processTicket(i + 1);
                  });
                }
              });
            }
          }(0);
        }, document.body.appendChild(classifyButton);
      } else 0 < searchTerms.length && document.addEventListener("dblclick", e => {
        var tem = window.getSelection().toString();
        copyToClipboard(tem), (tem.startsWith(searchTerms[0]) || tem.startsWith(searchTerms[1]) || tem.startsWith(searchTerms[2]) || tem.startsWith(searchTerms[3]) || tem.startsWith(searchTerms[4])) && ("" != ticketURL ? chrome.storage.local.set({
          searchTicket: tem
        }, function() {
          var value = "Open " + ticketURL + " in new tab";
          chrome.runtime.sendMessage({
            greeting: value
          }, function(response) {});
        }) : alert("Please set value for variable ticketURL in option page."));
      }), detailPagePaths.some(path => currentURL.includes(path)) && (null != $("macroponent-f51912f4c700201072b211d4d8c26010")[0] && alert("Please disable 'Always show top navigation' in 'Settings' > 'Display' or enable 'Turn off Next Experience' in 'Settings' > 'User experience' > 'Turn off Next Experience'"), 
      chrome.storage.local.get([ "delayKeyPressAfterReload" ], function(result) {
        if (!chrome.runtime.lastError) {
          result = result.delayKeyPressAfterReload;
          if (void 0 !== result) {
            var currentTimestamp = Date.now(), storedTimestamp = result.timestamp;
            if (2e4 < currentTimestamp - storedTimestamp) chrome.storage.local.remove("delayKeyPressAfterReload", function() {}); else {
              currentTimestamp = result.data;
              if (void 0 !== currentTimestamp) {
                let labelValuesPair = currentTimestamp.split(" ");
                if (delayTimeout = setTimeout(() => {
                  labelValuesPair[1].trim().split("").forEach(char => {
                    document.dispatchEvent(new KeyboardEvent("keyup", {
                      key: char
                    }));
                  });
                }, 2e3), 2 < labelValuesPair.length) {
                  storedTimestamp = Date.now();
                  const dataWithTimestamp = {
                    data: "Delay " + labelValuesPair.slice(2).join(" ").trim(),
                    timestamp: storedTimestamp
                  };
                  chrome.storage.local.set({
                    delayKeyPressAfterReload: dataWithTimestamp
                  }, function() {});
                } else chrome.storage.local.remove("delayKeyPressAfterReload", function() {});
              }
            }
          }
        }
      }), setTimeout(() => {
        const today = new Date();
        const dateString = today.getFullYear() + `-${String(today.getMonth() + 1).padStart(2, "0")}-` + String(today.getDate()).padStart(2, "0");
        let todayTickets1 = {};
        chrome.storage.local.get([ "todayTickets" ], function(result) {
          chrome.runtime.lastError || (void 0 !== (todayTickets1 = result.todayTickets) && todayTickets1.today === dateString || ((todayTickets1 = {}).today = dateString), 
          todayTickets1[currentID] = today.getTime(), chrome.storage.local.set({
            todayTickets: todayTickets1
          }, function() {
            chrome.runtime.lastError;
          }));
        });
      }, 100));
    };
    let waitCount = 0;
    const interval = setInterval(() => {
      "" != ticketURL && void 0 !== ticketURL ? (clearInterval(interval), callback()) : 20 <= ++waitCount && clearInterval(interval);
    }, 500);
  }
}), document.onmouseover = function(e) {
  null != lastTarget && "TEXTAREA" === lastTarget.nodeName && (mousePosition.x = e.clientX, 
  mousePosition.y = e.clientY);
}, document.onmouseout = function(e) {
  let targetElement = $('textarea[name="incident.short_description"]');
  var rect;
  null != (targetElement = null != (targetElement = null != (targetElement = null != (targetElement = null != targetElement && 0 !== targetElement.length ? targetElement : $('input[name="incident.short_description"]')) && 0 !== targetElement.length ? targetElement : $('textarea[name="u_incident_task.short_description"]')) && 0 !== targetElement.length ? targetElement : $('textarea[name="sc_task.short_description"]')) && 0 !== targetElement.length ? targetElement : $("#form_main")) && 0 !== targetElement.length && (rect = targetElement[0].getBoundingClientRect(), 
  null != lastTarget) && rect.top - 50 < mousePosition.y && e.target.id != lastTarget.id && -1 === e.target.id.indexOf("addhere") && (removeHints(), 
  0 < hintIndex && (hintIndex = 0, hintText.clear()), rect = e.clientX - mousePosition.x, 
  e = e.clientY - mousePosition.y, 20 < (distanceTraveled = Math.sqrt(rect * rect + e * e))) && (-1 != currentURL.indexOf("chatgpt.com") ? (lastTarget.blur(), 
  changeBackground("#FFFFCC")) : -1 != currentURL.indexOf("incident.do") && (lastTarget.blur(), 
  changeBackground("New" === (e = (rect = document.getElementById("incident.state")).options[rect.selectedIndex].text) || "-- None --" === e || "Unassigned" === e ? urlMap.get("newTicketColor") : "Assigned" === e ? urlMap.get("assignedTicketColor") : "On Hold" === e ? urlMap.get("holdTicketColor") : "Resolved" === e || "Closed" === e ? urlMap.get("closedTicketColor") : urlMap.get("newTicketColor"))));
};