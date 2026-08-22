Better Web -- Chrome extension to make web work better for us.
===================

- - - -

### Table of Contents
1. [What is Better Web?](#1-what-is-better-web)
2. [Quick Demo](#2-quick-demo)
3. [How to install and configure Better Web?](#3-how-to-install-and-configure-better-web)
4. [How to use Better Web?](#4-how-to-use-better-web)
5. [How to set up local AI server](#5-how-to-set-up-local-ai-server)
6. [How to ask question?](#6-how-to-ask-question)

### 1. What is Better Web?

Better Web is a Chrome extension to automate office work, such as automatically fill and submit web forms.

### 2. Quick demo:
https://ld32.github.io/betterWeb/testPage/incidentList.html

### 3. How to install and configure Better Web?

Open Chrome and click this link:

https://chromewebstore.google.com/detail/better-web/ohmlhcmmjbponikechknmhedgojoaamp

In your browser enable the extension, open Preferences/Options page, click button 'Import from Github' to download the config files, then click Import button to choose the related configuration file for the website you need to access and import the configuration file. Click "Auto fill" and "Hot key" button to set up shortcut keys.

Prerequisites:
- Google Chrome 126+ tested on macOS
- Node.js 18+ for local RAG server
- macOS Apple Silicon recommended for local AI

### 4. How to use Better Web?

I type in more than 50 prompts and emails every day on average. Most of the prompts have similar content. To improve productivity, I developed this Chrome extension, and glad to share it with the large community.

This Chrome extension can automatically perform text expansion and complete with prompts below the cursor, which will save your time dramatically.

Current version supports ChatGPT, Claude, Gmail, Yahoo, Outlook, ServiceNow. It is fully tested using 126.0.6478.183 on Mac. Here are the major features:

For all the above mentioned web sites:
1. Highlight text, then type p or right-click, then 'save to profile' to create shortcut for prompt/text.
2. Directly define shortcut for your favorite prompt/text in options page.
3. Type shortcut to get your favorite prompt/text.
4. Automatically save sentences for future auto-complete usage.

For Outlook calendar:
When an event shows up, user can click a button and set an alarm. Before the event time starts, a new page will open and play loud music to remind user.

For ServiceNow sites:
1. Double click a ticket ID from MS Teams and Slack and find it in Service-Now
2. Shortcut to copy user ID, ticket ID, and others for pasting to other applications
3. Highlight visited tickets for the day, bookmark tickets for future visits
4. Shortcut to hide/show less informative web elements. This is good for iPhone's small screen
5. Add clickable links to tickets and answers
6. Auto-save draft after pause typing for 3 seconds
7. Shortcuts for common links and answers
8. Auto-complete sentences sent before
9. Shortcuts to fill out forms
10. ChatGPT to draft or edit answers using uploaded knowledge bases as reference

Please let me know if you have any comments and suggestions.

Thanks.

### 5. How to set up local AI server

Local AI server for Mac M1/M2/M3 using Ollama. The RAG server `RAGServer/server.js` defaults to:

* `LOCAL_CHAT_MODEL` = `phi3`
* `LOCAL_EMBED_MODEL` = `embeddinggemma:300m-qat-q4_0`

You can override via env vars `LOCAL_CHAT_MODEL` / `LOCAL_EMBED_MODEL`.

1. Get source code
   ```bash
   git clone https://github.com/ld32/betterWeb.git
   cd betterWeb/RAGServer
   npm install express cors body-parser sqlite3 node-fetch ws
   ```

2. Install Ollama
   ```bash
   brew install ollama
   ```
   Or download from https://ollama.com/download/mac
   

3. Start Ollama server
   ```bash
   ollama serve
   ```
   The server runs on http://localhost:11434 by default. You can run it in background with `brew services start ollama`.

4. Pull the models used by the server
   ```bash
   ollama pull phi3
   ollama pull embeddinggemma:300m-qat-q4_0
   ```
   `phi3` is the default chat model. On Apple Silicon you can also use `phi3:3.8b` for an explicit tag. The embedding model `embeddinggemma:300m-qat-q4_0` is tiny and runs fast on M1.
   Note: embeddinggemma:300m-qat-q4_0 requires Ollama 0.11.10 or newer.

5. Test Ollama locally
   ```bash
   ollama run phi3 "Hello"
   ollama list
   ```

6. Start the local RAG server
   ```bash
   cd betterWebPrivate/RAGServer
   node server.js
   ```
   Server runs at http://localhost:5000 . Open http://localhost:5000 for the test UI.

7. Configure Better Web / RAGServer
   * Ollama base URL: `http://localhost:11434`
   * Chat model: `phi3`  [env `LOCAL_CHAT_MODEL`]
   * Embedding model: `embeddinggemma:300m-qat-q4_0`  [env `LOCAL_EMBED_MODEL`]
   * Server mode: `localai`  [default]

   The extension will now use your local models for draft/edit and RAG features without sending data externally.

Tips for M1:
- Keep `ollama serve` running in background.
- Ollama automatically uses Metal for GPU acceleration on Apple Silicon.
- Smaller models like `phi3` and `embeddinggemma:300m-qat-q4_0` give good speed on M1/M2/M3.

Troubleshooting:
- If Ollama is not reachable, check `curl http://localhost:11434/api/tags`
- If model pull fails, retry with `ollama pull phi3:3.8b`
- Change PORT if 5000 is in use: `PORT=5001 node server.js`

### 6. How to ask question?

Please post your questions in: https://github.com/ld32/betterWeb/issues
