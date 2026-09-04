# Nullgen

Chrome extension that blocks AI the way an ad blocker blocks ads — platforms, channels, widgets, keywords, AI images, and likely AI-written text. Everything is customizable: what gets blocked and how blocked content looks.

## Find `manifest.json`

It is in the **root of this repo**:

```
manifest.json
```

Direct link on the extension branch:

https://github.com/ErdTheTurd/ai-blocker/blob/cursor/nullgen-ai-blocker-extension-14e5/manifest.json

> If you are looking at the default `main` branch before merging the PR, you will not see the extension files yet. Open the PR branch above or merge [PR #1](https://github.com/ErdTheTurd/ai-blocker/pull/1).

## Install for yourself (unpacked)

1. Download / clone this repo (PR branch or merged `main`)
2. Chrome → `chrome://extensions` → enable **Developer mode**
3. **Load unpacked** → select the folder that contains `manifest.json`

Or use the prebuilt zip (extract it, then Load unpacked on the extracted folder):

```bash
bash scripts/build-zip.sh   # creates dist/nullgen-chrome.zip
```

## Make it available worldwide

Publishing to the **Chrome Web Store** (Public + All regions) is how everyone with Chrome can install it.

**Just you:** Load unpacked (no store) — see PUBLISH.md section A  
**Everyone:** Store → Public + All regions — see PUBLISH.md section B

→ **[PUBLISH.md](./PUBLISH.md)**

Includes developer account setup, ZIP upload, listing copy, screenshots, privacy policy (`privacy.html`), and private/unlisted/public options.


## What it blocks

| Category | Behavior |
|---|---|
| **Platforms** | Hard-blocks AI sites via `declarativeNetRequest` |
| **Videos** | YouTube home/search/related/Shorts/watch + other video sites |
| **Channels** | Hides YouTube / X / Twitch creators you list |
| **Selectors** | Cosmetic CSS filters for AI UI chrome |
| **Keywords** | Regex match → block nearest article / comment |
| **AI text** | Heuristics for common LLM phrases & structure |
| **Images** | AI CDN hosts + “AI-generated” alt text |
| **Embeds** | Iframes pointing at AI products |

## Customize

- **Popup** — master toggle, per-category switches, “allow this site”
- **Options** — appearance, full rule editors, import/export JSON

## Project layout

```
manifest.json                 ← Chrome entry point (repo root)
background/service-worker.js
content/
popup/
options/
lib/
assets/
icons/
dist/nullgen-chrome.zip       ← store / share package
store/                        ← Web Store screenshots & promo art
privacy.html                  ← privacy policy page
PUBLISH.md                    ← worldwide publishing guide
scripts/build-zip.sh
```

## Notes

- AI-text detection is heuristic — tune sensitivity in Options.
- Channel lists ship mostly empty; add the creators you care about.
- Settings live in `chrome.storage.local`.
- “Show anyway” reveals one blocked element for the current page session.
