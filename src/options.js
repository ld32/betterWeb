document.getElementById("popup").innerHTML = `
<a name="top"></a>
<h1>Better web dev <span id="myVersion" class="label" style="font-size:15px; color:#8ebf42;"></span></h1>





<div class="tab">
  <button class="tablinks" id="Config1">Config1</button>
  <button class="tablinks" id="Config2">Config2</button>
  <button class="tablinks" id="Config3">Config3</button>
  <button class="tablinks" id="Config4">Config4</button>
  <button class="tablinks" id="fullPage" style="font-size:10px; color:red;">Full Page</button>
  
</div>
<fieldset>
  <button id="backup">Backup</button>
  <button id="restore">Restore</button>
  
  <button id="save">Save</button>
  <input type="file" style="display:none;" id="file-selector">
  <button id="deleteAll">Clear All</button>

  <input type="file" style="display:none;" id="file-selector">    <button id="github">Import from Github</button>

  <button id="export">Export AI Context</button>

   <button id="share">Export to Share</button>
  <a href="https://github.com/ld32/betterWeb/tree/main" id='howToSetup' target="_blank" rel="noopener noreferrer" class="btn btn-warning teaser">How to use?</a>
  <a href="https://chromewebstore.google.com/detail/my-prompts/ohmlhcmmjbponikechknmhedgojoaamp" target="_blank" rel="noopener noreferrer" class="btn btn-warning teaser">Please Rate Us</a>
 
</fieldset>
<div id="status1" style="color: #8d2803 font-size:18px;"></div>
<ul id="listContainer"></ul>
<fieldset>
  <a href="#variable" style="margin-right: 20px;">Variables</a>
  <a href="#shortcut" style="margin-right: 20px;">Auto expand</a>
  <a href="#complete" style="margin-right: 20px;">Auto complete</a>
  <a href="#hide" style="margin-right: 20px;">Auto hide</a>
  <a href="#click" style="margin-right: 20px;">Auto click</a>
  <a href="#fill" style="margin-right: 20px;">Auto fill</a>
  <a href="#control" style="margin-right: 20px;">Hot key</a>
  <a href="#bookmark" style="margin-right: 0;">Bookmarks with comments</a>
</fieldset>


<a name="variable"></a>
<label for="explicit-label-name" style="font-size:20px;">Variables:</label>
<fieldset>
  <button id="addRow06">Add</button>
  <button id="save06">Save</button>
  <button id="helpShortcut">?</button>
  <a href="#top">Back to top</a>
  <div id="status06" style="color: #06038D"></div>
</fieldset>
<table id="table06" border="1" cellpadding="1" cellspacing="1" width="100%">
  <tbody id="tableBody" class="row_drag"></tbody>
</table>


<a name="shortcut"></a>
<label for="explicit-label-name" style="font-size:20px;">Auto expand text using shortcuts:</label>
<fieldset>
  <button id="addRow02">Add</button>
  <button id="save02">Save</button>
  <button id="helpShortcut">?</button>
  <a href="#top">Back to top</a>
  <div id="status02" style="color: #06038D"></div>
</fieldset>
<table id="table02" border="1" cellpadding="1" cellspacing="1" width="100%">
  <tbody id="tableBody" class="row_drag"></tbody>
</table>


<a name="complete"></a>
<label for="explicit-label-name" style="font-size:20px;">Auto complete sentences:</label>
<fieldset>
  <button id="addRow03">Add</button>
  <button id="save03">Save</button>
  <button id="helpSentence">?</button>
  <a href="#top">Back to top</a>
  <div id="status03" style="color: #06038D"></div>
</fieldset>
<table id="table03" border="1" cellpadding="1" cellspacing="1" width="100%">
  <tbody id="tableBody" class="row_drag"></tbody>
</table>


<a name="hide"></a>
<label for="explicit-label-name" style="font-size:20px;">Auto hide web elements:</label>
<fieldset>
  <button id="addRow04">Add</button>
  <button id="save04">Save</button>
  <a href="#top">Back to top</a>
</fieldset>
<div id="status04" style="color: #06038D"></div>
<table id="table04" border="1" cellpadding="1" cellspacing="1" width="100%">
  <tbody id="tableBody" class="row_drag"></tbody>
</table>

<a name="click"></a>
<label for="explicit-label-name" style="font-size:20px;">Auto click buttons or links:</label>
<fieldset>
  <button id="addRow00">Add</button>
  <button id="save00">Save</button>
  <a href="#top">Back to top</a>
</fieldset>
<div id="status00" style="color: #06038D"></div>
<table id="table00" border="1" cellpadding="1" cellspacing="1" width="100%">
  <tbody id="tableBody" class="row_drag"></tbody>
</table>


<a name="fill"></a>
<label for="explicit-label-name" style="font-size:20px;">Auto fill forms:</label>
<fieldset>
  <button id="addRow05">Add</button>
  <button id="save05">Save</button>
  <a href="#top">Back to top</a>
</fieldset>
<div id="status05" style="color: #06038D"></div>
<table id="table05" border="1" cellpadding="1" cellspacing="1" width="100%">
  <tbody id="tableBody" class="row_drag"></tbody>
</table>


<a name="control"></a>
<label for="explicit-label-name" style="font-size:20px;">Keyboard hot key to navigate web pages and click buttons:</label>
<fieldset>
  <button id="addRow01">Add</button>
  <button id="save01">Save</button>
  <a href="#top">Back to top</a>
</fieldset>
<div id="status01" style="color: #06038D"></div>
<table id="table01" border="1" cellpadding="1" cellspacing="1" width="100%">
  <tbody id="tableBody" class="row_drag"></tbody>
</table>

<a name="bookmark"></a>
<label for="explicit-label-name" style="font-size:20px;">Bookmark with Comments:</label>
<fieldset>
  <button id="addRow07">Add</button>
  <button id="save07">Save</button>
  <a href="#top">Back to top</a>
</fieldset>
<div id="status01" style="color: #06038D"></div>
<table id="table07" border="1" cellpadding="1" cellspacing="1" width="100%">
  <tbody id="tableBody" class="row_drag"></tbody>
</table>

`;

var urlArray = {}, keywordArray = {}, controlArray = {}, shortcutArray = {}, sentenceArray = {}, hideArray = {}, fillArray = {}, favorArray = {}, myFirstName = "myFirstName", configMap = new Map();

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function loadConfig(evt, config) {
  configMap.set("current", config), deleteAll();
  var tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) tablinks[i].style.backgroundColor = "";
  document.getElementById(configMap.get("current")).style.backgroundColor = "yellow", 
  "Config1" === configMap.get("current") ? chrome.storage.local.get({
    configa: "configa"
  }, function(dat) {
    "configa" !== dat.configa && processData(JSON.parse(dat.configa));
  }) : "Config2" === configMap.get("current") ? chrome.storage.local.get({
    configb: "configb"
  }, function(dat) {
    "configb" !== dat.configb && processData(JSON.parse(dat.configb));
  }) : "Config3" === configMap.get("current") ? chrome.storage.local.get({
    configc: "configc"
  }, function(dat) {
    "configc" !== dat.configc && processData(JSON.parse(dat.configc));
  }) : "Config4" === configMap.get("current") && chrome.storage.local.get({
    configd: "configd"
  }, function(dat) {
    "configd" !== dat.configd && processData(JSON.parse(dat.configd));
  });
}

function processData(ob) {
  urlArray = {}, keywordArray = {}, controlArray = {}, shortcutArray = {}, sentenceArray = {}, 
  hideArray = {}, fillArray = {}, favorArray = {};
  let obj = ob[1];
  if (null == obj) addRow06("", ""); else {
    var keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) urlArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ], 
    addRow06(obj[keys[i]][0], obj[keys[i]][1]);
  }
  var k, data = {};
  let index = 0;
  for (k of configMap.keys()) data[index] = [ k, configMap.get(k) ], index++;
  var myConfigs = JSON.stringify(data);
  if (chrome.storage.local.set({
    myConfigs: myConfigs
  }, function() {}), null == (obj = ob[2])) addRow00("", ""); else {
    keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) keywordArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ], 
    addRow00(obj[keys[i]][0], obj[keys[i]][1]);
  }
  if (null == (obj = ob[3])) addRow01("", ""); else {
    keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) controlArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ], 
    addRow01(obj[keys[i]][0], obj[keys[i]][1]);
  }
  if (null == (obj = ob[4])) addRow02("", ""); else {
    var map = new Map(), keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      let value = obj[keys[i]][1];
      var lines = value.split(/\r\n|\r|\n/), lastline = lines[lines.length - 2];
      1 < lines.length && -1 == lastline.indexOf("}") && !value.endsWith("myFirstName") && (value += "\nmyFirstName"), 
      shortcutArray[i] = [ obj[keys[i]][0], value ], map.set(value, obj[keys[i]][0]);
    }
    var mapSort3 = new Map([ ...map.entries() ].sort((a, b) => b[1].localeCompare(a[1])));
    for (let k of mapSort3.keys()) addRow02(mapSort3.get(k), k);
  }
  if (null == (obj = ob[5])) addRow03("", ""); else {
    map = new Map(), keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) sentenceArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ], 
    map.set(obj[keys[i]][1], obj[keys[i]][0]);
    const mapSort3 = new Map([ ...map.entries() ].sort((a, b) => b[1] !== a[1] ? b[1] - a[1] : a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0));
    for (let k of mapSort3.keys()) addRow03(mapSort3.get(k), k);
  }
  if (null == (obj = ob[6])) addRow04("", ""); else {
    keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) hideArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ], 
    addRow04(obj[keys[i]][0], obj[keys[i]][1]);
  }
  if (null == (obj = ob[7])) addRow05("", ""); else {
    keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) fillArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ], 
    addRow05(obj[keys[i]][0], obj[keys[i]][1]);
  }
  if (null == (obj = ob[8])) addRow07("", ""); else {
    keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) favorArray[i] = [ obj[keys[i]][0], obj[keys[i]][1] ], 
    addRow07(obj[keys[i]][0], obj[keys[i]][1]);
  }
}

function addRow06(key, value) {
  var row = document.createElement("tr"), height = 0, a = value.split("\n");
  for (let i = 0; i < a.length; i++) height += Math.ceil(a[i].length / 80);
  row.className = "input";
  key = escapeHtml(key), value = escapeHtml(value), row.innerHTML = `
    <td class="table-btn"><button class="button-delete" id="deleteRow06">Delete</button></td>
    <td><a href="#top">Top</a></td>
    <td class="textarea-shortcut"><textarea id="f2" type="text" rows="${height}" placeholder="Variable" class="shortcut form-control">${key}</textarea></td>
    <td class="textarea"><textarea rows="${height}" placeholder="Something" class="autotext" onkeyup="textAreaAdjust(this)">${value}</textarea></td>
  `, key = document.getElementById("table06").tBodies[0];
  key.insertBefore(row, key.firstChild), document.getElementById("deleteRow06").addEventListener("click", function(evt) {
    deleteRow06(this), evt.preventDefault();
  });
}

function deleteRow06(el) {
  for (;el.parentNode && "tr" != el.tagName.toLowerCase(); ) el = el.parentNode;
  el.parentNode.removeChild(el);
}

function addRow00(key, value) {
  var row = document.createElement("tr"), height = 0, a = value.split("\n");
  for (let i = 0; i < a.length; i++) height += Math.ceil(a[i].length / 80);
  row.className = "input";
  key = escapeHtml(key), value = escapeHtml(value), row.innerHTML = `
    <td class="table-btn"><button class="button-delete" id="deleteRow00">Delete</button></td>
    <td><a href="#top">Top</a></td>
    <td class="textarea-shortcut"><textarea id="f2" type="text" rows="${height}" placeholder="Shortcut" class="shortcut form-control">${key}</textarea></td>
    <td class="textarea"><textarea rows="${height}" placeholder="Something" class="autotext" onkeyup="textAreaAdjust(this)">${value}</textarea></td>
  `, key = document.getElementById("table00").tBodies[0];
  key.insertBefore(row, key.firstChild), document.getElementById("deleteRow00").addEventListener("click", function(evt) {
    deleteRow00(this), evt.preventDefault();
  });
}

function deleteRow00(el) {
  for (;el.parentNode && "tr" != el.tagName.toLowerCase(); ) el = el.parentNode;
  el.parentNode.removeChild(el);
}

function addRow01(shortcut, autotext) {
  var row = document.createElement("tr"), height = 0, a = autotext.split("\n");
  for (let i = 0; i < a.length; i++) height += Math.ceil(a[i].length / 80);
  row.className = "input";
  shortcut = escapeHtml(shortcut), autotext = escapeHtml(autotext), row.innerHTML = `
    <td class="table-btn"><button class="button-delete" id="deleteRow01">Delete</button></td>
    <td><a href="#top">Top</a></td>
    <td class="textarea-shortcut"><textarea id="f1" type="text" rows="${height}" placeholder="Shortcut" class="shortcut form-control">${shortcut}</textarea></td>
    <td class="textarea"><textarea rows="${height}" placeholder="Something" class="autotext" onkeyup="textAreaAdjust(this)">${autotext}</textarea></td>
  `, shortcut = document.getElementById("table01").tBodies[0];
  shortcut.insertBefore(row, shortcut.firstChild), document.getElementById("deleteRow01").addEventListener("click", function(evt) {
    deleteRow01(this), evt.preventDefault();
  }), document.getElementById("f1").addEventListener("blur", function(evt) {
    var data = new Map(), n1 = document.getElementById("table01").rows.length;
    for (let i = 0; i < n1; i++) {
      var key = document.getElementById("table01").rows[i].cells[0].children[0].value.trim();
      0 != key.length && (data.has(key) ? (this.focus(), tempAlert("Dulplicate value: " + key, 5e3)) : data.set(key, ""));
    }
  });
}

function deleteRow01(el) {
  for (;el.parentNode && "tr" != el.tagName.toLowerCase(); ) el = el.parentNode;
  el.parentNode.removeChild(el);
}

function addRow02(shortcut, autotext) {
  var row = document.createElement("tr"), height = 0, a = autotext.split("\n");
  for (let i = 0; i < a.length; i++) height += Math.ceil(a[i].length / 80);
  row.className = "input";
  shortcut = escapeHtml(shortcut), autotext = escapeHtml(autotext), row.innerHTML = `
      <td class="table-btn" > <button class="button-delete" id="deleteRow02">Delete</button></td>
    <td><a href="#top">Top</a></td>
    <td class="textarea-shortcut"><textarea id="f2" type="text" rows="${height}" placeholder="Shortcut" class="shortcut form-control">${shortcut}</textarea></td>
    <td class="textarea"><textarea rows="${height}" placeholder="Something" class="autotext" onkeyup="textAreaAdjust(this)">${autotext}</textarea></td>
      `, shortcut = document.getElementById("table02").tBodies[0];
  shortcut.insertBefore(row, shortcut.firstChild), document.getElementById("deleteRow02").addEventListener("click", function(evt) {
    deleteRow02(this), evt.preventDefault();
  }), document.getElementById("f2").addEventListener("blur", function(evt) {
    var data = new Map(), n1 = document.getElementById("table02").rows.length;
    for (let i = 0; i < n1; i++) {
      var key = document.getElementById("table02").rows[i].cells[0].children[0].value.trim().split(/\s+/)[0];
      0 != key.length && (data.has(key) ? (tempAlert("Dulplicate value: " + key, 5e3), 
      this.focus()) : data.set(key, ""));
    }
  });
}

function deleteRow02(el) {
  for (;el.parentNode && "tr" != el.tagName.toLowerCase(); ) el = el.parentNode;
  el.parentNode.removeChild(el);
}

function addRow03(shortcut, autotext) {
  var row = document.createElement("tr"), height = 0, a = autotext.split("\n");
  for (let i = 0; i < a.length; i++) height += Math.ceil(a[i].length / 80);
  row.className = "input";
  shortcut = escapeHtml(shortcut), autotext = escapeHtml(autotext), row.innerHTML = `
        <td class="table-btn" > <button class="button-delete" id="deleteRow03">Delete</button></td>
    <td><a href="#top">Top</a></td>
    <td class="textarea-shortcut"><textarea id="f2" type="text" rows="${height}" placeholder="Shortcut" class="shortcut form-control">${shortcut}</textarea></td>
    <td class="textarea"><textarea rows="${height}" placeholder="Something" class="autotext" onkeyup="textAreaAdjust(this)">${autotext}</textarea></td>
      `, shortcut = document.getElementById("table03").tBodies[0];
  shortcut.insertBefore(row, shortcut.firstChild), document.getElementById("deleteRow03").addEventListener("click", function(evt) {
    deleteRow03(this), evt.preventDefault();
  });
}

function deleteRow03(el) {
  for (;el.parentNode && "tr" != el.tagName.toLowerCase(); ) el = el.parentNode;
  el.parentNode.removeChild(el);
}

function addRow04(shortcut, autotext) {
  var row = document.createElement("tr"), height = 0, a = autotext.split("\n");
  for (let i = 0; i < a.length; i++) height += Math.ceil(a[i].length / 80);
  row.className = "input";
  shortcut = escapeHtml(shortcut), autotext = escapeHtml(autotext), row.innerHTML = `
        <td class="table-btn" > <button class="button-delete" id="deleteRow04">Delete</button></td>
    <td><a href="#top">Top</a></td>
    <td class="textarea-shortcut"><textarea id="f2" type="text" rows="${height}" placeholder="Shortcut" class="shortcut form-control">${shortcut}</textarea></td>
    <td class="textarea"><textarea rows="${height}" placeholder="Something" class="autotext" onkeyup="textAreaAdjust(this)">${autotext}</textarea></td>
      `, shortcut = document.getElementById("table04").tBodies[0];
  shortcut.insertBefore(row, shortcut.firstChild), document.getElementById("deleteRow04").addEventListener("click", function(evt) {
    deleteRow04(this), evt.preventDefault();
  });
}

function deleteRow04(el) {
  for (;el.parentNode && "tr" != el.tagName.toLowerCase(); ) el = el.parentNode;
  el.parentNode.removeChild(el);
}

function addRow05(shortcut, autotext) {
  var row = document.createElement("tr"), height = 0, a = autotext.split("\n");
  for (let i = 0; i < a.length; i++) height += Math.ceil(a[i].length / 80);
  row.className = "input";
  shortcut = escapeHtml(shortcut), autotext = escapeHtml(autotext), row.innerHTML = `
        <td class="table-btn" > <button class="button-delete" id="deleteRow05">Delete</button></td>
    <td><a href="#top">Top</a></td>
    <td class="textarea-shortcut"><textarea id="f2" type="text" rows="${height}" placeholder="Shortcut" class="shortcut form-control">${shortcut}</textarea></td>
    <td class="textarea"><textarea rows="${height}" placeholder="Something" class="autotext" onkeyup="textAreaAdjust(this)">${autotext}</textarea></td>
      `, shortcut = document.getElementById("table05").tBodies[0];
  shortcut.insertBefore(row, shortcut.firstChild), document.getElementById("deleteRow05").addEventListener("click", function(evt) {
    deleteRow05(this), evt.preventDefault();
  });
}

function deleteRow05(el) {
  for (;el.parentNode && "tr" != el.tagName.toLowerCase(); ) el = el.parentNode;
  el.parentNode.removeChild(el);
}

function addRow07(shortcut, autotext) {
  var row = document.createElement("tr"), height = 0, a = autotext.split("\n");
  for (let i = 0; i < a.length; i++) height += Math.ceil(a[i].length / 80);
  row.className = "input";
  shortcut = escapeHtml(shortcut), autotext = escapeHtml(autotext), row.innerHTML = `
        <td class="table-btn" > <button class="button-delete" id="deleteRow07">Delete</button></td>
    <td><a href="#top">Top</a></td>
    <td class="textarea-shortcut"><textarea id="f2" type="text" rows="${height}" placeholder="Shortcut" class="shortcut form-control">${shortcut}</textarea></td>
    <td class="textarea"><textarea rows="${height}" placeholder="Something" class="autotext" onkeyup="textAreaAdjust(this)">${autotext}</textarea></td>
      `, shortcut = document.getElementById("table07").tBodies[0];
  shortcut.insertBefore(row, shortcut.firstChild), document.getElementById("deleteRow07").addEventListener("click", function(evt) {
    deleteRow07(this), evt.preventDefault();
  });
}

function deleteRow07(el) {
  for (;el.parentNode && "tr" != el.tagName.toLowerCase(); ) el = el.parentNode;
  el.parentNode.removeChild(el);
}

document.addEventListener("visibilitychange", function() {
  "visible" === document.visibilityState && chrome.storage.local.get({
    configLoadTime: null
  }, function(dat) {
    if (null != dat.configLoadTime) {
      let configloadTime = dat.configLoadTime;
      chrome.storage.local.get({
        configSaveTime: null
      }, function(dat) {
        dat = dat.configSaveTime;
        null != dat && null != configloadTime && dat > configloadTime && location.reload();
      });
    }
  });
}), document.addEventListener("DOMContentLoaded", function(evt) {
  if (window.chrome) {
    var version = chrome.runtime.getManifest().version;
    document.getElementById("myVersion").innerText = version;
  } else {
    let version = chrome.runtime.getManifest().version;
    document.getElementById("myVersion").innerText = version;
  }
  chrome.storage.local.set({
    configLoadTime: getDate()
  }, function() {}), chrome.storage.local.get({
    myConfigs: "myConfigs"
  }, function(ob) {
    if ("myConfigs" != ob.myConfigs) {
      var obj = JSON.parse(ob.myConfigs), keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) null != obj[keys[i]][0] && configMap.set(obj[keys[i]][0], obj[keys[i]][1]), 
      null != obj[keys[i]][0] && obj[keys[i]][0].startsWith("Config") && 3 < obj[keys[i]][1].length && (document.getElementById(obj[keys[i]][0]).innerText = obj[keys[i]][1]);
    }
    configMap.has("current") && configMap.get("current") ? document.getElementById(configMap.get("current")).click() : ($("#Config1").click(), 
    setTimeout(() => {
      alert("Please click the button 'Import from Github' to set up your config.");
    }, 1e3));
  });
}), document.getElementById("fullPage").addEventListener("click", function(evt) {
  chrome.runtime.openOptionsPage(() => {
    chrome.runtime.lastError;
  });
}), 800 < window.innerWidth ? document.getElementById("fullPage").style.display = "none" : document.getElementById("fullPage").click(), 
document.getElementById("Config1").addEventListener("click", function(evt) {
  loadConfig(evt, "Config1");
}), document.getElementById("Config2").addEventListener("click", function(evt) {
  loadConfig(evt, "Config2");
}), document.getElementById("Config3").addEventListener("click", function(evt) {
  loadConfig(evt, "Config3");
}), document.getElementById("Config4").addEventListener("click", function(evt) {
  loadConfig(evt, "Config4");
}), document.getElementById("save").addEventListener("click", function(evt) {
  tempAlert("Config saved", 5e3), saveAll(!0);
}), document.getElementById("save06").addEventListener("click", function(evt) {
  saveAll(!0), tempAlert("Config saved", 5e3);
}), document.getElementById("save00").addEventListener("click", function(evt) {
  saveAll(!0), tempAlert("Config saved", 5e3);
}), document.getElementById("addRow06").addEventListener("click", function(evt) {
  addRow06("", "");
}), document.getElementById("addRow00").addEventListener("click", function(evt) {
  addRow00("", "");
}), document.getElementById("save01").addEventListener("click", function(evt) {
  saveAll(!0);
}), document.getElementById("addRow01").addEventListener("click", function(evt) {
  addRow01("", "");
}), document.getElementById("save02").addEventListener("click", function(evt) {
  tempAlert("Config saved", 5e3), saveAll(!0);
}), document.getElementById("addRow02").addEventListener("click", function(evt) {
  addRow02("", "");
}), document.getElementById("save03").addEventListener("click", function(evt) {
  tempAlert("Config saved", 5e3), saveAll(!0);
}), document.getElementById("addRow03").addEventListener("click", function(evt) {
  addRow03("", "");
}), document.getElementById("save04").addEventListener("click", function(evt) {
  saveAll(!0);
}), document.getElementById("addRow04").addEventListener("click", function(evt) {
  addRow04("", "");
}), document.getElementById("save05").addEventListener("click", function(evt) {
  saveAll(!0);
}), document.getElementById("save07").addEventListener("click", function(evt) {
  saveAll(!0);
}), document.getElementById("addRow05").addEventListener("click", function(evt) {
  addRow05("", "");
}), document.getElementById("addRow07").addEventListener("click", function(evt) {
  addRow07("", "");
}), document.getElementById("backup").addEventListener("click", function(evt) {
  var obj = {
    urls: urlArray,
    keywords: keywordArray,
    controls: controlArray,
    shortcuts: shortcutArray,
    sentences: sentenceArray,
    hides: hideArray,
    fills: fillArray,
    bookmark: favorArray
  }, today = getDate(), obj = JSON.stringify(obj).replace(/#/g, "&NPOUND").replace(/:{/g, ":\n {").replace(/],/g, "],\n  ").replace(/},/g, "},\n\n"), obj = new Blob([ obj ], {
    type: "text/plain"
  });
  chrome.downloads.download({
    url: URL.createObjectURL(obj),
    filename: "Config." + configMap.get(configMap.get("current")).replace(/\s+/g, "-") + "." + today + ".json".replace(/\s+/g, ""),
    conflictAction: "uniquify",
    saveAs: !0
  }, function(downloadId) {
    chrome.storage.local.set({
      lastDownloadDate: Date.now()
    }, function() {
      chrome.runtime.lastError;
    });
  });
}), document.getElementById("export").addEventListener("click", function(evt) {
  var obj = {
    urls: urlArray,
    keywords: keywordArray,
    shortcuts: shortcutArray,
    sentences: sentenceArray,
    bookmark: favorArray
  }, today = getDate(), obj = JSON.stringify(obj), obj = new Blob([ obj ], {
    type: "text/plain"
  });
  chrome.downloads.download({
    url: URL.createObjectURL(obj),
    filename: "ChatContext." + today + ".json".replace(/\s+/g, ""),
    conflictAction: "uniquify",
    saveAs: !0
  }, function(downloadId) {
    chrome.runtime.lastError;
  });
}), document.getElementById("share").addEventListener("click", function(evt) {
  var obj = {
    urls: urlArray,
    keywords: keywordArray,
    controls: controlArray,
    shortcuts: {
      0: [ "lyahoo", "https://yahoo.com" ],
      1: [ "lgoogle", "http://google.com" ]
    },
    sentences: {
      0: [ 2, "Good morning. (note: 2 means this sentence is used twice.)" ],
      1: [ 5, "Happy July 4th." ]
    }
  }, today = getDate(), obj = JSON.stringify(obj), obj = new Blob([ obj ], {
    type: "text/plain"
  });
  chrome.downloads.download({
    url: URL.createObjectURL(obj),
    filename: "ShareWithTeamMate." + today + ".json".replace(/\s+/g, ""),
    conflictAction: "uniquify",
    saveAs: !0
  }, function(downloadId) {});
}), document.getElementById("restore").addEventListener("click", function(evt) {
  document.getElementById("file-selector").click();
});

const fileSelector = document.getElementById("file-selector");

fileSelector.addEventListener("change", event => {
  var newData, event = event.target.files, reader = new FileReader();
  reader.onload = function(event) {
    event = event.target.result;
    if (0 !== (newData = event.replace(/&NPOUND/g, "#")).length) {
      deleteAll();
      var obj = JSON.parse(newData);
      if (null != obj) {
        var keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) switch (keys[i]) {
         case "urls":
          var data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow06(data[ks[i]][0], data[ks[i]][1]);
          break;

         case "keywords":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow00(data[ks[i]][0], data[ks[i]][1]);
          break;

         case "controls":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow01(data[ks[i]][0], data[ks[i]][1]);
          break;

         case "shortcuts":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow02(data[ks[i]][0], data[ks[i]][1]);
          break;

         case "sentences":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow03(data[ks[i]][0], data[ks[i]][1]);
          break;

         case "hides":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow04(data[ks[i]][0], data[ks[i]][1]);
          break;

         case "fills":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow05(data[ks[i]][0], data[ks[i]][1]);
          break;

         case "bookmark":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow07(data[ks[i]][0], data[ks[i]][1]);
        }
        saveAll();
      }
    }
  }, reader.readAsText(event[0]);
});

var githubApi = {
  header: {
    Accept: "application/vnd.github.v3+json",
    Authorization: ""
  },
  baseUrl: "https://api.github.com",
  username: "ld32",
  nameRepo: "betterWeb",
  sha: "",
  path: "",
  newFile: !1
};

function getfile(url, path) {
  apiRequest("GET", url, null, function(r) {
    r = JSON.parse(r);
    if ("base64" == r.encoding) return githubApi.sha = r.sha, githubApi.path = path, 
    githubApi.newFile = !1, r;
  });
}

function newFile() {
  githubApi.newFile = !0, githubApi.path = prompt("File path : ");
}

function getGitbubFileList() {
  var url = githubApi.baseUrl + "/repos/" + githubApi.username + "/" + githubApi.nameRepo + "/branches/main";
  apiRequest("GET", url, null, function(r) {
    apiRequest("GET", JSON.parse(r).commit.commit.tree.url + "?recursive=1", null, function(r) {
      var i, li, jsonRsp = JSON.parse(r), cnt = document.getElementById("listContainer");
      for (i in cnt.innerHTML = "", jsonRsp.tree) jsonRsp.tree[i].path.endsWith(".json") && ((li = document.createElement("li")).style.color = "red", 
      li.style.cursor = "pointer", li.style.textDecoration = "underline", li.style.fontSize = "14px", 
      li.url = jsonRsp.tree[i].url, li.path = jsonRsp.tree[i].path, li.textContent = li.path, 
      li.onclick = function() {
        downloadAndParseGithub(this.url, this.path);
      }, cnt.appendChild(li));
      document.getElementById("status1").textContent = "Please click any of the following profile to import:";
    });
  });
}

function deleteAll() {
  $("#table00").find("tr").remove(), $("#table01").find("tr").remove(), $("#table02").find("tr").remove(), 
  $("#table03").find("tr").remove(), $("#table04").find("tr").remove(), $("#table05").find("tr").remove(), 
  $("#table06").find("tr").remove(), $("#table07").find("tr").remove();
}

function getDate() {
  var dateObj = new Date();
  return dateObj.getFullYear() + ` -${("0" + (dateObj.getMonth() + 1)).slice(-2)} -${("0" + dateObj.getDate()).slice(-2)} -${("0" + dateObj.getHours()).slice(-2)} -${("0" + dateObj.getMinutes()).slice(-2)} -${("0" + dateObj.getSeconds()).slice(-2)} `;
}

function saveAll(closeIt) {
  null == configMap.get("current") && configMap.set("current", "Config1");
  var currentTime = getDate();
  chrome.storage.local.set({
    configSaveTime: currentTime
  }, function() {}), chrome.storage.local.set({
    configLoadTime: currentTime
  }, function() {});
  let findURL = !(urlArray = {});
  var k, n1 = document.getElementById("table06").rows.length;
  for (let i = 0; i < n1; i++) {
    var key = document.getElementById("table06").rows[n1 - i - 1].cells[2].children[0].value, value = document.getElementById("table06").rows[n1 - i - 1].cells[3].children[0].value;
    urlArray[i] = [ key, value ], "URLs" === key && (findURL = !0, configMap.set(configMap.get("current"), value), 
    document.getElementById(configMap.get("current")).innerText = value);
  }
  for (let i = 0; i < n1; i++) {
    let key = document.getElementById("table06").rows[n1 - i - 1].cells[2].children[0].value, value = document.getElementById("table06").rows[n1 - i - 1].cells[3].children[0].value;
    chrome.storage.local.set({
      [key]: value
    }, function() {});
  }
  findURL || (document.getElementById(configMap.get("current")).innerText = configMap.get("current"), 
  configMap.set(configMap.get("current"), ""));
  let da = {}, index = 0;
  for (k of configMap.keys()) da[index] = [ k, configMap.get(k) ], index++;
  var key = "myConfigs", currentTime = JSON.stringify(da), n1 = (chrome.storage.local.set({
    [key]: currentTime
  }, function() {}), keywordArray = {}, document.getElementById("table00").rows.length);
  for (let i = 0; i < n1; i++) {
    key = document.getElementById("table00").rows[n1 - i - 1].cells[2].children[0].value, 
    value = document.getElementById("table00").rows[n1 - i - 1].cells[3].children[0].value;
    key && (keywordArray[i] = [ key, value ]);
  }
  controlArray = {}, n1 = document.getElementById("table01").rows.length;
  for (let i = 0; i < n1; i++) {
    key = document.getElementById("table01").rows[n1 - i - 1].cells[2].children[0].value.trim(), 
    value = document.getElementById("table01").rows[n1 - i - 1].cells[3].children[0].value.trim();
    key && (controlArray[i] = [ key, value ]);
  }
  shortcutArray = {};
  var uniqMap = new Map(), shortCutCount = (index = 0, document.getElementById("table02").rows.length);
  for (let i = 0; i < shortCutCount; i++) {
    key = document.getElementById("table02").rows[shortCutCount - i - 1].cells[2].children[0].value.trim(), 
    value = document.getElementById("table02").rows[shortCutCount - i - 1].cells[3].children[0].value.trim();
    if (key) {
      let k = key.split(/\s+/)[0];
      uniqMap.has(k) && uniqMap.get(k) != key + value && (uniqMap.has(k + "a") ? (key = key.replace(k, k + "b"), 
      k += "b") : (key = key.replace(k, k + "a"), k += "a")), uniqMap.set(k, key + value), 
      shortcutArray[index++] = [ key, value ];
    }
  }
  var uniqMap1 = new Map(), sentenceCount = (sentenceArray = {}, index = 0, document.getElementById("table03").rows.length);
  for (let i = 0; i < sentenceCount; i++) {
    key = document.getElementById("table03").rows[sentenceCount - i - 1].cells[2].children[0].value.trim(), 
    value = document.getElementById("table03").rows[sentenceCount - i - 1].cells[3].children[0].value.trim();
    !key || uniqMap1.has(value) || (sentenceArray[index++] = [ key, value ], uniqMap1.set(value, ""));
  }
  hideArray = {}, n1 = document.getElementById("table04").rows.length;
  for (let i = 0; i < n1; i++) {
    key = document.getElementById("table04").rows[n1 - i - 1].cells[2].children[0].value.trim(), 
    value = document.getElementById("table04").rows[n1 - i - 1].cells[3].children[0].value.trim();
    hideArray[i] = [ key, value ];
  }
  fillArray = {}, n1 = document.getElementById("table05").rows.length;
  for (let i = 0; i < n1; i++) {
    key = document.getElementById("table05").rows[n1 - i - 1].cells[2].children[0].value.trim(), 
    value = document.getElementById("table05").rows[n1 - i - 1].cells[3].children[0].value.trim();
    fillArray[i] = [ key, value ];
  }
  favorArray = {}, n1 = document.getElementById("table07").rows.length;
  for (let i = 0; i < n1; i++) {
    key = document.getElementById("table07").rows[n1 - i - 1].cells[2].children[0].value.trim(), 
    value = document.getElementById("table07").rows[n1 - i - 1].cells[3].children[0].value.trim();
    favorArray[i] = [ key, value ];
  }
  function configSaveCallback() {
    setStatus(closeIt);
  }
  currentTime = {}, currentTime[1] = urlArray, currentTime[2] = keywordArray, currentTime[3] = controlArray, 
  currentTime[4] = shortcutArray, currentTime[5] = sentenceArray, currentTime[6] = hideArray, 
  currentTime[7] = fillArray, currentTime[8] = favorArray, currentTime = JSON.stringify(currentTime);
  "Config1" === configMap.get("current") ? chrome.storage.local.set({
    configa: currentTime
  }, configSaveCallback) : "Config2" === configMap.get("current") ? chrome.storage.local.set({
    configb: currentTime
  }, configSaveCallback) : "Config3" === configMap.get("current") ? chrome.storage.local.set({
    configc: currentTime
  }, configSaveCallback) : "Config4" === configMap.get("current") && chrome.storage.local.set({
    configd: currentTime
  }, configSaveCallback), document.body.scrollTop = 0, document.documentElement.scrollTop = 0;
}

function setStatus(closeIt) {
  var status1 = document.getElementById("status01");
  let status2 = document.getElementById("status02"), status3 = document.getElementById("status03");
  var status4 = document.getElementById("status04"), status5 = document.getElementById("status05");
  setTimeout(function() {
    status1.textContent = "", status2.textContent = "", status3.textContent = "", 
    status4.textContent = "", status5.textContent = "";
  }, 3e3);
}

function apiRequest(method, url, jsonData, callback) {
  var key, xhr = new XMLHttpRequest();
  for (key in xhr.onreadystatechange = function() {
    4 != xhr.readyState || 200 != xhr.status && 201 != xhr.status || callback(xhr.responseText);
  }, xhr.open(method, url, !0), githubApi.header) xhr.setRequestHeader(key, githubApi.header[key]);
  xhr.send(jsonData);
}

function tempAlert(msg, duration) {
  var existingAlert = document.getElementById("tempAlertDiv"), el = (existingAlert && existingAlert.parentNode.removeChild(existingAlert), 
  document.createElement("div"));
  el.setAttribute("id", "tempAlertDiv"), el.setAttribute("style", "position:absolute;top:2%;left:2%;background-color:black;padding:10px;color:white;border-radius:5px;"), 
  el.textContent = msg, setTimeout(function() {
    el.parentNode && el.parentNode.removeChild(el);
  }, duration), document.body.appendChild(el);
}

function cout(str) {}

function downloadAndParseGithub(url, fileName) {
  githubApi.path = fileName, githubApi.newFile = !1, apiRequest("GET", url, null, function(r) {
    cout(r);
    r = JSON.parse(r.replace(/&NPOUND/g, "#"));
    if (cout(r), "base64" != r.encoding) cout("unknown encoding " + r.encoding); else {
      var obj = JSON.parse(decodeURIComponent(escape(window.atob(r.content))));
      if (cout(atob(r.content)), null != obj) {
        deleteAll();
        var keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) switch (keys[i]) {
         case "urls":
          var data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow06(data[ks[i]][0], data[ks[i]][1].replace(/&NPOUND/g, "#"));
          break;

         case "keywords":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow00(data[ks[i]][0], data[ks[i]][1].replace(/&NPOUND/g, "#"));
          break;

         case "controls":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow01(data[ks[i]][0].replace(/&NPOUND/g, "#"), data[ks[i]][1]);
          break;

         case "shortcuts":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow02(data[ks[i]][0].replace(/&NPOUND/g, "#"), data[ks[i]][1]);
          break;

         case "sentences":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow03(data[ks[i]][0], data[ks[i]][1]);
          break;

         case "hides":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow04(data[ks[i]][0], data[ks[i]][1].replace(/&NPOUND/g, "#"));
          break;

         case "fills":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow05(data[ks[i]][0], data[ks[i]][1].replace(/&NPOUND/g, "#"));
          break;

         case "bookmark":
          data = obj[keys[i]], ks = Object.keys(data);
          for (let i = 0; i < ks.length; i++) addRow07(data[ks[i]][0].replace(/&NPOUND/g, "#"), data[ks[i]][1].replace(/&NPOUND/g, "#"));
        }
        saveAll();
      }
    }
  });
  document.getElementById("listContainer").innerHTML = "", document.getElementById("status1");
  status1.textContent = "Configuration is impoted!", setTimeout(() => {
    status1.textContent = "";
  }, 3e3);
}

document.getElementById("github").addEventListener("click", function(evt) {
  getGitbubFileList();
}), document.getElementById("deleteAll").addEventListener("click", function(evt) {
  deleteAll();
});