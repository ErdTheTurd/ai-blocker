# How to install & publish Nullgen

Chrome extensions are not iPhone “App Store” apps. For Chrome, the store is the
**Chrome Web Store**. Below: **just you** vs **everyone**.

---

## A) Just for me (fastest — no review)

Use this while developing or if only you need Nullgen.

### Option A1 — Load unpacked (recommended for you alone)

1. Download this repo (or `dist/nullgen-chrome.zip` and unzip it)
2. Open Chrome → `chrome://extensions`
3. Turn on **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the folder that contains `manifest.json`

Only your browser gets it. Nobody else can find it in the store.

### Option A2 — Chrome Web Store “Unlisted” or “Private”

Still uses the store dashboard, but not publicly searchable:

1. Create a [Developer account](https://chrome.google.com/webstore/devconsole) (one-time ~$5)
2. **New item** → upload `dist/nullgen-chrome.zip`
3. Fill listing + privacy policy URL (`privacy.html`)
4. On **Distribution**:
   - **Unlisted** — anyone with the link can install; not in search
   - **Private** — only accounts/groups you list (Google Groups) can install
5. Submit for review (still required, but visibility stays limited)

Rebuild the zip anytime:

```bash
bash scripts/build-zip.sh
# → dist/nullgen-chrome.zip
```

---

## B) Everyone around the world (public)

1. Same developer account + upload `dist/nullgen-chrome.zip`
2. Complete Store listing (see `store/listing.txt`) and upload screenshots from `store/screenshots/`
3. Privacy tab → link to hosted `privacy.html`
4. **Distribution** tab:
   - Visibility: **Public**
   - Regions: **All regions**
5. **Submit for review**

When Google approves it, anyone with Chrome can install from:

`https://chromewebstore.google.com/…`

That is the only way it appears for “everyone” like a normal extension.

| Goal | What to choose |
|---|---|
| Only me, right now | Load unpacked |
| Only me / friends with a link | Store → **Unlisted** |
| Only my team/emails | Store → **Private** |
| Whole world | Store → **Public** + **All regions** |

---

## Store listing (copy/paste)

**Name:** Nullgen  

**Short description:**  
Block AI platforms, channels, YouTube AI videos, widgets, and AI-written content.

**Detailed description:** see `store/listing.txt`

**Category:** Productivity  

**Privacy policy:** host `privacy.html` (GitHub Pages or your site)

---

## YouTube / video filtering

In Options → **Videos**:

- Toggle YouTube feed cards, watch pages, Shorts
- Edit title/description regex patterns (Sora, Midjourney, “AI-generated”, …)
- Options → **Channels** → add `@handles` to hide whole creators

Popup → enable **Videos (YouTube+)**.

---

## Where is `manifest.json`?

Repo root on `main`:

https://github.com/ErdTheTurd/ai-blocker/blob/main/manifest.json

Also inside `dist/nullgen-chrome.zip` at the ZIP root (required for store upload).
