# Nullgen

Chrome extension that blocks AI the way an ad blocker blocks ads — platforms, channels, widgets, keywords, AI images, and likely AI-written text. Everything is customizable: what gets blocked and how blocked content looks.

## Install (unpacked)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder (the one containing `manifest.json`)

## What it blocks

| Category | Behavior |
|---|---|
| **Platforms** | Hard-blocks AI sites (ChatGPT, Claude, Gemini, Midjourney, …) via `declarativeNetRequest` |
| **Channels** | Hides YouTube / X / Twitch creators you list |
| **Selectors** | Cosmetic CSS filters for AI badges, sidebars, embeds |
| **Keywords** | Regex match → block nearest article / comment / paragraph |
| **AI text** | Heuristics for common LLM phrases & structural tells |
| **Images** | AI CDN hosts + “AI-generated” alt text |
| **Embeds** | Iframes pointing at AI products |

## Customize

- **Popup** — master toggle, per-category switches, quick “allow this site”
- **Options** (`Customize`) — appearance themes, placeholder style, full rule editors, import/export JSON

### Appearance

- Themes: Signal (teal/charcoal), Paper, Terminal, or custom colors
- Placeholder modes: labeled cover, custom message, blur, or remove
- Fonts, corner radius, on-page toast, injected custom CSS

## Project layout

```
manifest.json
background/service-worker.js   # network block rules
content/content.js             # in-page filtering
content/blocker.css
popup/                         # quick controls
options/                       # full settings UI
lib/defaults.js                # default block lists
assets/blocked.html            # interstitial for blocked sites
icons/
```

## Notes

- AI-text detection is heuristic — tune sensitivity and min length in Options to reduce false positives.
- Channel lists ship empty (plus one disabled example); add the creators you care about.
- Settings live in `chrome.storage.local` so large custom lists are not capped by sync quotas.
- “Show anyway” on a placeholder reveals that one element for the current page session.
