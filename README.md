# Nullgen

Browser extension that filters AI the way an ad blocker filters ads — YouTube AI videos, channels, widgets, keywords, AI images, and AI-written text. Customize what gets blocked and how it looks.

## Install (Microsoft Edge)

Nullgen is published on **Microsoft Edge Add-ons**:

**https://microsoftedge.microsoft.com/addons/detail/nullgen-ai-blocker/omekfbkiookjfkmddmnjjlfogdmlekji**

1. Open that link in **Microsoft Edge**
2. Click **Get** / **Install**
3. Confirm

That is the public install for everyone.

## Install for yourself only (unpacked)

Use this for local testing in Edge or Chrome:

1. Download / clone this repo (`main`)
2. Edge → `edge://extensions` (or Chrome → `chrome://extensions`)
3. Enable **Developer mode**
4. **Load unpacked** → select the folder that contains `manifest.json`

Or build the zip:

```bash
bash scripts/build-zip.sh   # creates dist/nullgen-chrome.zip
```

Unzip it, then Load unpacked on the extracted folder.

## Publish / update on Microsoft

See **[PUBLISH.md](./PUBLISH.md)** for Partner Center steps (just you vs public, and how to ship updates).

## What it filters

| Category | Behavior |
|---|---|
| **Videos** | YouTube home/search/related/Shorts/watch + other video sites |
| **Channels** | Hides YouTube / X / Twitch creators you list |
| **Selectors** | Cosmetic CSS filters for AI UI chrome |
| **Keywords** | Regex match → block nearest article / comment |
| **AI text** | Heuristics for common LLM phrases & structure |
| **Images** | AI CDN hosts + “AI-generated” alt text |
| **Embeds** | Iframes pointing at AI products |
| **Platforms** | Optional hard-block of AI websites (off by default so you can still use Claude/ChatGPT) |

## Customize

- **Popup** — master toggle, per-category switches, “allow this site”
- **Options** — appearance, full rule editors, import/export JSON

## Project layout

```
manifest.json                 ← extension entry (repo root)
background/service-worker.js
content/
popup/
options/
lib/
assets/
icons/
dist/nullgen-chrome.zip       ← Edge / Chromium store package
store/                        ← store screenshots & promo art
privacy.html                  ← privacy policy page
PUBLISH.md                    ← Edge publish / update guide
scripts/build-zip.sh
```

## Notes

- AI-text detection is heuristic — tune sensitivity in Options.
- Channel lists ship mostly empty; add the creators you care about.
- Settings live in `chrome.storage.local` (works in Edge).
- “Show anyway” reveals one blocked element for the current page session.
- AI tool sites (Claude, ChatGPT, etc.) are not hard-blocked by default.
