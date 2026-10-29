# How to install & publish Nullgen

Nullgen is a Chromium extension. It is live on **Microsoft Edge Add-ons**.

**Public listing (everyone):**  
https://microsoftedge.microsoft.com/addons/detail/nullgen-ai-blocker/omekfbkiookjfkmddmnjjlfogdmlekji

---

## A) Just for me (no store)

### Edge — Load unpacked

1. Download this repo (or `dist/nullgen-chrome.zip` and unzip it)
2. Open Edge → paste `edge://extensions` → Enter
3. Turn **Developer mode** ON
4. Click **Load unpacked**
5. Select the folder that contains `manifest.json`

Only your browser gets it.

### Chrome — Load unpacked (optional)

Same steps with `chrome://extensions`.

Rebuild the package anytime:

```bash
bash scripts/build-zip.sh
# → dist/nullgen-chrome.zip
```

---

## B) Everyone — Microsoft Edge Add-ons (live)

Public install link:

```text
https://microsoftedge.microsoft.com/addons/detail/nullgen-ai-blocker/omekfbkiookjfkmddmnjjlfogdmlekji
```

Share that URL. Anyone on Edge can click **Get** / **Install**.

### Visibility options in Partner Center

| Goal | Partner Center setting |
|---|---|
| Whole world (current) | **Public** listing |
| Only people with the link | **Hidden** / unlisted (if offered) |
| Limited testers | Use a private/test distribution if available in your dashboard |

---

## C) Ship an update to Microsoft

1. Bump `"version"` in `manifest.json` (must increase)
2. Run `bash scripts/build-zip.sh`
3. Open [Partner Center](https://partner.microsoft.com/dashboard) → **Edge** → your Nullgen listing
4. Upload the new `dist/nullgen-chrome.zip`
5. Refresh listing text from `store/listing.txt` if needed
6. Confirm privacy policy URL still points at your hosted `privacy.html` (or https://nullgen.ai/privacy)
7. Submit for certification / review

When Microsoft approves the update, the same public Edge link serves the new version.

---

## D) Chrome Web Store (optional second store)

Same ZIP works for Chrome:

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Upload `dist/nullgen-chrome.zip`
3. Distribution → **Public** + **All regions** for worldwide Chrome users

Not required if Edge is your primary store.

---

## Store listing (copy/paste)

See `store/listing.txt`.

**Name:** Nullgen AI Blocker  

**Short description:**  
Hide AI content in feeds and on YouTube — without blocking the AI tools you want to use.

**Category:** Productivity  

**Privacy policy:** host `privacy.html`, or use your live policy URL.

---

## YouTube / video filtering

Options → **Videos**:

- Toggle YouTube feed cards, watch pages, Shorts
- Edit title/description patterns
- Options → **Channels** → add `@handles` to hide creators

Popup → keep **Videos (YouTube+)** ON.  
Leave **Hard-block AI sites** OFF unless you want to ban visiting Claude/ChatGPT entirely.

---

## Where is `manifest.json`?

Repo root:

https://github.com/ErdTheTurd/ai-blocker/blob/main/manifest.json

Also at the root of `dist/nullgen-chrome.zip` (required for Edge/Chrome upload).
