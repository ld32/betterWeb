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
        17: ['classificationColors', 'red blue yellow purple pink'],
        18: ['classificationPrompt', 'Please classify this conversation to one of the following topics: HPC Consulting(r c); Bioinformatcs Consulting(w); Spam(cl c); Data transfer'],
        19: ['bookmarkTicketColor', 'khaki'],
        20: ['chatSessionURL', 'https://chatgpt.com/']
      },
      keywords: {},
      controls: {
        0: ['a Hide/show', 'hide/show'],
        1: ['f Forward', 'Click .icon-arrow-down'],
        2: ['d Previous', 'Click .icon-arrow-up'],
        3: ['h Show Help', 'Show help'],
        5: ['as Ask sandbox (need extension to work)', 'Ask sandbox to suggest'],
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
    window.chrome.runtime.getURL = function (path) {
      return path;
    };
    window.chrome.runtime.onMessage = {
      addListener: function (listener) {
        messageListeners.push(listener);
      }
    };
    window.chrome.runtime.sendMessage = function (message, callback) {
      var farewell = 'mock runtime';

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
    };
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();