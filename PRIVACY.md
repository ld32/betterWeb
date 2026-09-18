# Privacy Policy — Better Web

**Effective date:** 31 August 2026
**Applies to:** the "Better Web" Chrome extension, version 1.8.4 and later

Better Web is a text-expansion and browsing-productivity extension. It is
developed by an individual, not a company, and there is **no Better Web server**.
Nothing you do in the extension is reported back to the developer.

This policy describes exactly what the extension reads, what it keeps, and the
three cases in which anything leaves your computer.

---

## Short version

- Your shortcuts, snippets, bookmarks and settings are stored **on your own
  computer** and never uploaded.
- The AI features — indexing your tickets, searching them, classifying them —
  run **entirely inside your browser** using WebGPU. Your ticket text is not
  sent anywhere to do this.
- The one feature that does transmit your text is the "ask the chat session"
  hot key. It **asks you to confirm, and shows you the exact text**, every time
  before anything is sent.
- There is no analytics, no telemetry, no advertising, and no tracking of any
  kind. No data is ever sold or shared.

---

## What the extension reads

Better Web runs only on the sites listed in its manifest — currently
`service-now.com`, `teams.microsoft.com`, `slack.com`, `chatgpt.com`,
`claude.ai`, `openai.com`, `github.com` and `github.io` — plus any additional
site **you** add yourself in the options page.

A site you add is not silently enabled. Chrome asks you to grant permission for
that specific site, and you can revoke it at any time from
`chrome://extensions`. The extension does not request access to all websites.

On those sites it reads page content in order to do its job: expanding your
shortcuts as you type, suggesting completions, hiding or clicking elements you
configured, and highlighting tickets you have visited.

## What is stored, and where

Everything below is stored **locally**, in your browser's own storage on your
own device. None of it is transmitted.

| What | Where | Why |
| --- | --- | --- |
| Shortcuts, snippets, variables, hot keys, bookmarks | `chrome.storage.local` | Your configuration |
| Ticket or conversation text you explicitly upload | IndexedDB | Builds the local search index |
| Numeric embeddings derived from that text | IndexedDB | Local similarity search |
| Downloaded AI model files | Browser cache | So they are not re-downloaded |

Uploading a ticket to the index is always an explicit action you take with a
hot key. The extension does not index pages in the background.

## When data leaves your computer

There are exactly three cases.

### 1. Sending text to your configured chat session — requires your confirmation

Several hot keys hand text to the chat service you configured in
`chatSessionURL` (ChatGPT by default, but it is whatever URL you set). Depending
on the key, that text may include a ticket's short and long description, a
conversation you are viewing, or text you selected.

**Every one of these shows a confirmation dialog first.** The dialog names the
destination site and displays the text that will be sent. Nothing is stored or
transmitted unless you accept. If you decline, the action is cancelled.

Once sent, your text is handled by that third party under **their** privacy
policy, not this one. If your organisation restricts what may be pasted into
external AI services, this feature is the one to be careful with — or simply
decline the dialog.

### 2. Downloading AI models — no personal data sent

The local AI features download model weights from `huggingface.co` (and its
`hf.co` file hosts) the first time you use them. These are ordinary file
downloads. **No content of yours is included** — the request names only the
model. Your ticket text is never sent to Hugging Face or anywhere else for
processing; all inference happens on your machine.

The program code that runs the model is packaged inside the extension itself and
is not downloaded at runtime.

### 3. Importing a shared configuration — read-only

If you choose to import a configuration from GitHub, the extension makes
read-only (`GET`) requests to `api.github.com` to fetch that file. It sends no
credentials and **cannot write to any repository**. Nothing of yours is
uploaded.

## What the extension never does

- It does not use analytics, telemetry, crash reporting, or advertising.
- It does not track your browsing history or the pages you visit.
- It does not send data to the developer. There is no developer server.
- It does not sell, rent, or share your data with anyone.
- It does not use your data to determine creditworthiness or for lending.
- It does not require an account, a login, or a payment method.

## Permissions, and why each is needed

| Permission | Why |
| --- | --- |
| `storage`, `unlimitedStorage` | Store your configuration and the local search index, which can exceed the default 5 MB quota |
| `tabs` | Open, switch to, and close the chat session tab, and pass messages between your ticket tab and it |
| `scripting` | Enable the extension on sites you add yourself |
| `downloads` | Save exported configuration or results to a file when you ask |
| `clipboardWrite` | Hot keys that copy a ticket ID or user ID for you |
| `offscreen` | Run the local AI model, which needs a page context with WebGPU access |
| Access to specific sites | Provide the features above, only on the listed sites and any you add |

## Keeping and deleting your data

Your data stays until you delete it. Because it never leaves your device, there
is nothing for the developer to delete on your behalf.

You can see what is stored and delete it, from the extension itself.

- **Review what is stored:** open the options page, expand **Local AI (WebGPU)**
  then **Stored tickets**, and press **List tickets**. It shows the ticket IDs,
  when each was uploaded, and the first line of each, so you can check exactly
  what this browser is holding.
- **Delete all uploaded tickets:** the **Delete all tickets from the index**
  button in that same section. It permanently removes the text of every ticket
  you uploaded *and* the search index built from it, after asking you to
  confirm. This cannot be undone.
- **Shortcuts, snippets and settings:** remove them in the options page.
- **Rebuild the index without deleting anything:** the **Rebuild** button
  re-embeds your uploaded tickets. It changes how the text is indexed, not what
  is stored.
- **Everything at once:** uninstall the extension. Chrome deletes all of its
  local storage with it.

The extension has no way to delete your data remotely, because it never holds a
copy of it.

## Children

Better Web is a workplace productivity tool and is not directed at children
under 13.

## Changes to this policy

If the extension's data handling changes, this page will be updated and its
effective date revised. Material changes will also be noted in the extension's
release notes.

## Contact

Questions about this policy, or about how the extension handles data:

- Open an issue at https://github.com/ld32/betterWeb/issues

The source code is public at https://github.com/ld32/betterWeb — every claim on
this page can be checked against it.
