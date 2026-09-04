import {
  getSettings,
  saveSettings,
  resetStats,
  DEFAULT_SETTINGS,
  deepMerge
} from "../lib/storage.js";

const DESCRIPTIONS = {
  appearance: "How blocked content looks across the web.",
  platforms: "Optional hard-block of AI websites (off by default — you can still use Claude/ChatGPT).",
  channels: "Creators and accounts to hide wherever they appear.",
  videos: "YouTube and other video feeds — titles, Shorts, watch pages.",
  selectors: "Cosmetic filters — CSS selectors for AI UI chrome.",
  keywords: "Regex rules that catch AI-labeled or AI-flavored copy.",
  aitext: "Heuristic detection for likely AI-written passages.",
  images: "AI art CDNs and telltale alt text.",
  allowlist: "Hosts that bypass every Nullgen rule.",
  data: "Backup, restore, or wipe your configuration."
};

const TITLES = {
  appearance: "Appearance",
  platforms: "Platforms",
  channels: "Channels",
  videos: "Videos",
  selectors: "Selectors",
  keywords: "Keywords",
  aitext: "AI text",
  images: "Images",
  allowlist: "Allowlist",
  data: "Import / Export"
};

let settings = null;
let channelTab = "youtube";
let saveTimer = null;

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

async function persist(next = settings) {
  settings = next;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await saveSettings(settings);
    await chrome.runtime.sendMessage({ type: "REBUILD_RULES" });
  }, 120);
}

function $(id) {
  return document.getElementById(id);
}

/* ——— Navigation ——— */
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    const id = btn.dataset.panel;
    $(`panel-${id}`).classList.add("active");
    $("panel-title").textContent = TITLES[id];
    $("panel-desc").textContent = DESCRIPTIONS[id];
  });
});

/* ——— Appearance ——— */
function renderAppearance() {
  const a = settings.appearance;
  document.querySelectorAll(".theme-card").forEach((c) => {
    c.classList.toggle("active", c.dataset.theme === a.theme);
  });
  $("placeholder-mode").value = a.placeholderMode;
  $("custom-message").value = a.customMessage || "";
  $("font-select").value = a.font;
  $("color-accent").value = a.accent || "#00d4b4";
  $("color-surface").value = a.surface || "#161a20";
  $("color-text").value = a.text || "#e8eef2";
  $("border-radius").value = a.borderRadius ?? 8;
  $("radius-val").textContent = `${a.borderRadius ?? 8}px`;
  $("show-badge").checked = !!a.showBadge;
  $("custom-css").value = a.customCss || "";
  $("custom-colors").style.opacity = a.theme === "custom" ? "1" : "0.45";
  updatePreview();
}

function updatePreview() {
  const a = settings.appearance;
  const root = document.documentElement;
  const presets = {
    signal: { accent: "#1ee0b6", surface: "#0c1016", text: "#e9eef5" },
    paper: { accent: "#0b6e4f", surface: "#f3efe6", text: "#1a1f24" },
    terminal: { accent: "#7CFF9E", surface: "#0a0f0c", text: "#c8f5d4" }
  };
  const p = a.theme === "custom" ? a : presets[a.theme] || presets.signal;
  root.style.setProperty("--accent", p.accent);
  root.style.setProperty("--surface", p.surface);
  root.style.setProperty("--text", p.text);
  root.style.setProperty("--radius", `${a.borderRadius ?? 8}px`);
  const msg =
    a.placeholderMode === "custom"
      ? a.customMessage || "Blocked by Nullgen"
      : a.placeholderMode === "blank"
        ? "(removed)"
        : a.placeholderMode === "blur"
          ? "Blurred AI content"
          : "AI content blocked";
  $("preview-msg").textContent = msg;
}

document.getElementById("theme-picks").addEventListener("click", (e) => {
  const card = e.target.closest(".theme-card");
  if (!card) return;
  settings.appearance.theme = card.dataset.theme;
  renderAppearance();
  persist();
});

[
  ["placeholder-mode", (v) => (settings.appearance.placeholderMode = v)],
  ["custom-message", (v) => (settings.appearance.customMessage = v)],
  ["font-select", (v) => (settings.appearance.font = v)],
  ["color-accent", (v) => (settings.appearance.accent = v)],
  ["color-surface", (v) => (settings.appearance.surface = v)],
  ["color-text", (v) => (settings.appearance.text = v)],
  ["custom-css", (v) => (settings.appearance.customCss = v)]
].forEach(([id, fn]) => {
  $(id).addEventListener("input", (e) => {
    fn(e.target.value);
    updatePreview();
    persist();
  });
});

$("border-radius").addEventListener("input", (e) => {
  settings.appearance.borderRadius = Number(e.target.value);
  $("radius-val").textContent = `${e.target.value}px`;
  updatePreview();
  persist();
});

$("show-badge").addEventListener("change", (e) => {
  settings.appearance.showBadge = e.target.checked;
  persist();
});

/* ——— Platforms ——— */
function renderPlatforms(filter = "") {
  const q = filter.toLowerCase();
  const list = $("platform-list");
  list.innerHTML = "";
  settings.platforms
    .filter(
      (p) =>
        !q ||
        p.label.toLowerCase().includes(q) ||
        p.host.toLowerCase().includes(q)
    )
    .forEach((p, idx) => {
      const realIdx = settings.platforms.indexOf(p);
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <label class="switch">
          <input type="checkbox" ${p.enabled ? "checked" : ""} data-idx="${realIdx}" />
          <span class="slider"></span>
        </label>
        <div class="meta">
          <strong>${escapeHtml(p.label)}</strong>
          <code>${escapeHtml(p.host)}</code>
        </div>
        <span></span>
        <button type="button" class="del" data-del="${realIdx}">Remove</button>
      `;
      list.appendChild(row);
    });

  list.querySelectorAll("input[type=checkbox]").forEach((input) => {
    input.addEventListener("change", () => {
      settings.platforms[Number(input.dataset.idx)].enabled = input.checked;
      persist();
    });
  });
  list.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings.platforms.splice(Number(btn.dataset.del), 1);
      renderPlatforms($("platform-filter").value);
      persist();
    });
  });
}

$("platform-filter").addEventListener("input", (e) => renderPlatforms(e.target.value));

$("add-platform").addEventListener("click", () => {
  const host = prompt("Host to block (e.g. chat.example.com):");
  if (!host) return;
  const label = prompt("Label:", host) || host;
  settings.platforms.push({
    id: uid("plat"),
    host: host.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    label,
    enabled: true
  });
  renderPlatforms($("platform-filter").value);
  persist();
});

/* ——— Channels ——— */
function renderChannels() {
  const list = $("channel-list");
  list.innerHTML = "";
  const items = settings.channels[channelTab] || [];
  items.forEach((ch, idx) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <label class="switch">
        <input type="checkbox" ${ch.enabled ? "checked" : ""} data-idx="${idx}" />
        <span class="slider"></span>
      </label>
      <div class="meta">
        <strong>${escapeHtml(ch.label || ch.match)}</strong>
        <code>${escapeHtml(ch.match)}</code>
      </div>
      <span></span>
      <button type="button" class="del" data-del="${idx}">Remove</button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll("input[type=checkbox]").forEach((input) => {
    input.addEventListener("change", () => {
      settings.channels[channelTab][Number(input.dataset.idx)].enabled = input.checked;
      persist();
    });
  });
  list.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings.channels[channelTab].splice(Number(btn.dataset.del), 1);
      renderChannels();
      persist();
    });
  });
}

document.querySelectorAll("#channel-tabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("#channel-tabs .tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    channelTab = tab.dataset.ch;
    $("channel-input").placeholder =
      channelTab === "custom" ? "URL regex" : channelTab === "youtube" ? "@handle or channel id" : "@username";
    renderChannels();
  });
});

$("add-channel").addEventListener("click", () => {
  const match = $("channel-input").value.trim();
  if (!match) return;
  const label = $("channel-label").value.trim() || match;
  if (!settings.channels[channelTab]) settings.channels[channelTab] = [];
  settings.channels[channelTab].push({
    id: uid("ch"),
    match,
    label,
    enabled: true
  });
  $("channel-input").value = "";
  $("channel-label").value = "";
  renderChannels();
  persist();
});

/* ——— Videos ——— */
function renderVideos() {
  const v = settings.videos || (settings.videos = { titlePatterns: [] });
  $("videos-enabled").checked = !!v.enabled;
  $("videos-youtube").checked = v.youtube !== false;
  $("videos-other").checked = v.otherSites !== false;
  $("videos-feed").checked = v.blockFeedCards !== false;
  $("videos-watch").checked = v.blockWatchPage !== false;
  $("videos-shorts").checked = v.blockShorts !== false;

  const list = $("video-pattern-list");
  list.innerHTML = "";
  (v.titlePatterns || []).forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <label class="switch">
        <input type="checkbox" ${item.enabled ? "checked" : ""} data-idx="${idx}" />
        <span class="slider"></span>
      </label>
      <div class="meta">
        <strong>${escapeHtml(item.label || item.pattern)}</strong>
        <code>${escapeHtml(item.pattern)}</code>
      </div>
      <span></span>
      <button type="button" class="del" data-del="${idx}">Remove</button>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll("input[type=checkbox]").forEach((input) => {
    input.addEventListener("change", () => {
      settings.videos.titlePatterns[Number(input.dataset.idx)].enabled = input.checked;
      persist();
    });
  });
  list.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings.videos.titlePatterns.splice(Number(btn.dataset.del), 1);
      renderVideos();
      persist();
    });
  });
}

[
  ["videos-enabled", (e) => {
    settings.videos.enabled = e.target.checked;
    settings.categories.videos = e.target.checked;
  }],
  ["videos-youtube", (e) => (settings.videos.youtube = e.target.checked)],
  ["videos-other", (e) => (settings.videos.otherSites = e.target.checked)],
  ["videos-feed", (e) => (settings.videos.blockFeedCards = e.target.checked)],
  ["videos-watch", (e) => (settings.videos.blockWatchPage = e.target.checked)],
  ["videos-shorts", (e) => (settings.videos.blockShorts = e.target.checked)]
].forEach(([id, fn]) => {
  $(id).addEventListener("change", (e) => {
    fn(e);
    persist();
  });
});

$("add-video-pattern").addEventListener("click", () => {
  const pattern = $("video-pattern-input").value.trim();
  if (!pattern) return;
  try {
    new RegExp(pattern);
  } catch {
    alert("Invalid regex");
    return;
  }
  if (!settings.videos.titlePatterns) settings.videos.titlePatterns = [];
  settings.videos.titlePatterns.push({
    id: uid("vt"),
    pattern,
    label: $("video-pattern-label").value.trim() || pattern,
    enabled: true
  });
  $("video-pattern-input").value = "";
  $("video-pattern-label").value = "";
  renderVideos();
  persist();
});

/* ——— Selectors / Keywords ——— */
function renderRuleList(kind) {
  const list = $(`${kind === "selectors" ? "selector" : "keyword"}-list`);
  const items = settings[kind];
  list.innerHTML = "";
  items.forEach((item, idx) => {
    const primary = kind === "selectors" ? item.selector : item.pattern;
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <label class="switch">
        <input type="checkbox" ${item.enabled ? "checked" : ""} data-idx="${idx}" />
        <span class="slider"></span>
      </label>
      <div class="meta">
        <strong>${escapeHtml(item.label || primary)}</strong>
        <code>${escapeHtml(primary)}</code>
      </div>
      <span></span>
      <button type="button" class="del" data-del="${idx}">Remove</button>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll("input[type=checkbox]").forEach((input) => {
    input.addEventListener("change", () => {
      settings[kind][Number(input.dataset.idx)].enabled = input.checked;
      persist();
    });
  });
  list.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings[kind].splice(Number(btn.dataset.del), 1);
      renderRuleList(kind);
      persist();
    });
  });
}

$("add-selector").addEventListener("click", () => {
  const selector = $("selector-input").value.trim();
  if (!selector) return;
  try {
    document.querySelector(selector);
  } catch {
    alert("Invalid CSS selector");
    return;
  }
  settings.selectors.push({
    id: uid("sel"),
    selector,
    label: $("selector-label").value.trim() || selector,
    enabled: true
  });
  $("selector-input").value = "";
  $("selector-label").value = "";
  renderRuleList("selectors");
  persist();
});

$("add-keyword").addEventListener("click", () => {
  const pattern = $("keyword-input").value.trim();
  if (!pattern) return;
  try {
    new RegExp(pattern);
  } catch {
    alert("Invalid regex");
    return;
  }
  settings.keywords.push({
    id: uid("kw"),
    pattern,
    label: $("keyword-label").value.trim() || pattern,
    enabled: true,
    matchCase: false
  });
  $("keyword-input").value = "";
  $("keyword-label").value = "";
  renderRuleList("keywords");
  persist();
});

/* ——— AI text / images / allowlist ——— */
function renderAiText() {
  const t = settings.aiText;
  $("aitext-enabled").checked = !!t.enabled;
  $("aitext-sensitivity").value = t.sensitivity;
  $("aitext-minlen").value = t.minLength;
  $("minlen-val").textContent = t.minLength;
  $("aitext-phrases").checked = !!t.blockCommonPhrases;
  $("aitext-structure").checked = !!t.blockStructuralPatterns;
  $("aitext-custom").value = (t.customPhrases || []).join("\n");
}

[
  ["aitext-enabled", (e) => (settings.aiText.enabled = e.target.checked)],
  ["aitext-sensitivity", (e) => (settings.aiText.sensitivity = e.target.value)],
  ["aitext-phrases", (e) => (settings.aiText.blockCommonPhrases = e.target.checked)],
  ["aitext-structure", (e) => (settings.aiText.blockStructuralPatterns = e.target.checked)]
].forEach(([id, fn]) => {
  $(id).addEventListener("change", (e) => {
    fn(e);
    settings.categories.aiText = settings.aiText.enabled;
    persist();
  });
});

$("aitext-minlen").addEventListener("input", (e) => {
  settings.aiText.minLength = Number(e.target.value);
  $("minlen-val").textContent = e.target.value;
  persist();
});

$("aitext-custom").addEventListener("input", (e) => {
  settings.aiText.customPhrases = e.target.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  persist();
});

function renderImages() {
  const i = settings.images;
  $("images-enabled").checked = !!i.enabled;
  $("images-alt").checked = !!i.blockAiAltText;
  $("images-cdn").checked = !!i.blockKnownAiCdn;
  $("images-cdns").value = (i.cdnPatterns || []).join("\n");
}

["images-enabled", "images-alt", "images-cdn"].forEach((id) => {
  $(id).addEventListener("change", () => {
    settings.images.enabled = $("images-enabled").checked;
    settings.images.blockAiAltText = $("images-alt").checked;
    settings.images.blockKnownAiCdn = $("images-cdn").checked;
    settings.categories.images = settings.images.enabled;
    persist();
  });
});

$("images-cdns").addEventListener("input", (e) => {
  settings.images.cdnPatterns = e.target.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  persist();
});

function renderAllowlist() {
  const list = $("allow-list");
  list.innerHTML = "";
  settings.allowlist.forEach((host, idx) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span></span>
      <div class="meta"><strong>${escapeHtml(host)}</strong></div>
      <span></span>
      <button type="button" class="del" data-del="${idx}">Remove</button>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings.allowlist.splice(Number(btn.dataset.del), 1);
      renderAllowlist();
      persist();
    });
  });
}

$("add-allow").addEventListener("click", () => {
  const host = $("allow-input").value.trim().replace(/^www\./, "");
  if (!host) return;
  if (!settings.allowlist.includes(host)) settings.allowlist.push(host);
  $("allow-input").value = "";
  renderAllowlist();
  persist();
});

/* ——— Import / export ——— */
$("export-settings").addEventListener("click", () => {
  const json = JSON.stringify(settings, null, 2);
  $("export-preview").textContent = json;
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nullgen-settings.json";
  a.click();
  URL.revokeObjectURL(url);
});

$("import-settings").addEventListener("click", () => $("import-file").click());

$("import-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    settings = deepMerge(DEFAULT_SETTINGS, parsed);
    await persist(settings);
    renderAll();
    $("export-preview").textContent = "Import successful.";
  } catch (err) {
    alert("Could not import: " + err.message);
  }
});

$("reset-settings").addEventListener("click", async () => {
  if (!confirm("Reset all Nullgen settings to defaults?")) return;
  settings = structuredClone(DEFAULT_SETTINGS);
  await persist(settings);
  renderAll();
});

$("reset-stats").addEventListener("click", async () => {
  await resetStats();
  $("export-preview").textContent = "Stats cleared.";
});

$("master-enabled").addEventListener("change", (e) => {
  settings.enabled = e.target.checked;
  persist();
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAll() {
  $("master-enabled").checked = !!settings.enabled;
  renderAppearance();
  renderPlatforms();
  renderChannels();
  renderVideos();
  renderRuleList("selectors");
  renderRuleList("keywords");
  renderAiText();
  renderImages();
  renderAllowlist();
}

async function boot() {
  settings = await getSettings();
  renderAll();
}

boot();
