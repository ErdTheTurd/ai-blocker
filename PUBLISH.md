# Publish Nullgen worldwide (Chrome Web Store)

Nullgen can only reach “everyone around the world” after it is published on the
**Chrome Web Store** (and optionally other stores later). GitHub alone is for
source code; most people install extensions from the store.

## Where is `manifest.json`?

It lives at the **root of this repository** on the extension branch / after you
merge the PR:

```
ai-blocker/
  manifest.json   ← required for Chrome
  background/
  content/
  popup/
  options/
  ...
```

If you only open the `main` branch before merging, you will **not** see it yet —
`main` still only has the old placeholder. Open the PR branch or merge first:

- PR: https://github.com/ErdTheTurd/ai-blocker/pull/1
- Direct file: https://github.com/ErdTheTurd/ai-blocker/blob/cursor/nullgen-ai-blocker-extension-14e5/manifest.json

Ready-to-upload package (manifest already at ZIP root):

```bash
bash scripts/build-zip.sh
# → dist/nullgen-chrome.zip
```

Or download `dist/nullgen-chrome.zip` from this repo after merge.

---

## 1. Create a Chrome Web Store developer account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay the one-time registration fee (Google’s fee; currently USD $5)
3. Complete publisher identity verification if prompted

Only the account owner can publish. This step cannot be done by the coding agent.

## 2. Upload the ZIP

1. Dashboard → **New item**
2. Upload `dist/nullgen-chrome.zip`
3. Confirm the package validates (`manifest.json` must be at the ZIP root — our build script guarantees that)

## 3. Store listing (copy/paste)

**Name:** Nullgen  

**Short description:**  
Block AI platforms, channels, widgets, and AI-written content — customizable like an ad blocker.

**Detailed description:**
```
Nullgen filters AI noise from the web the way an ad blocker filters ads.

• Block AI platforms (ChatGPT, Claude, Gemini, Midjourney, and more)
• Hide creators/channels you list on YouTube, X, and Twitch
• Cosmetic filters for AI badges, sidebars, and embeds
• Keyword and AI-text heuristics for generated copy
• AI image CDN / alt-text matching
• Fully customizable appearance and rule lists
• Allowlist any site in one click
• Import / export your configuration

All filtering runs in your browser. Nullgen does not sell your data.
```

**Category:** Productivity (or Privacy & Security)  

**Language:** English (add more languages later via `_locales` if desired)

## 4. Images to upload

From this repo:

| Asset | Path | Size |
|---|---|---|
| Screenshots | `store/screenshots/*.png` | 1280×800 |
| Small promo | `store/promo/small_tile_440x280.png` | 440×280 |
| Marquee (optional) | `store/promo/marquee_1400x560.png` | 1400×560 |
| Store icon | `icons/icon128.png` | 128×128 |

## 5. Privacy

1. Host `privacy.html` (GitHub Pages, your site, or raw GitHub URL after merge)
2. Paste that URL into the dashboard **Privacy policy** field
3. On the Privacy tab, declare:
   - Single purpose: filter AI-related content the user chooses to block
   - Data: settings/stats stored locally; no remote Nullgen collection
   - Justify `storage`, `declarativeNetRequest`, `tabs`, and host access

Suggested privacy policy URL after enabling GitHub Pages on this repo:

`https://erdtheturd.github.io/ai-blocker/privacy.html`

(or your custom domain)

## 6. Distribution → worldwide

On the **Distribution** tab:

1. Visibility: **Public**
2. Regions: **All regions** (or select every country you want)
3. Leave paid pricing off unless you intentionally charge

That is what makes the listing available to users around the world.

## 7. Submit for review

Click **Submit for review**. Google’s review can take from hours to several days.
When approved and visibility is Public + All regions, anyone with Chrome can
install Nullgen from the Web Store search/listing.

---

## After publish

Share the store URL (looks like `https://chromewebstore.google.com/detail/...`).
For updates: bump `"version"` in `manifest.json`, run `scripts/build-zip.sh`,
upload a new package in the dashboard.

## Firefox / Edge / Safari (optional later)

- **Edge:** can often load the same Chromium package via Microsoft Partner Center  
- **Firefox:** needs an MV3 Firefox review + `browser_specific_settings`  
- **Safari:** requires Apple Developer packaging  

Start with Chrome Web Store for the widest desktop reach.
