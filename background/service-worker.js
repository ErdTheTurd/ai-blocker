import { getSettings, bumpStat, onSettingsChanged, saveSettings, DEFAULT_SETTINGS } from "../lib/storage.js";

const RULE_ID_BASE = 1000;

function hostToUrlFilter(host) {
  // Support path-containing entries like bing.com/chat
  if (host.includes("/")) {
    const [h, ...rest] = host.split("/");
    const path = rest.join("/");
    return `||${h}/${path}^`;
  }
  return `||${host}^`;
}

export async function rebuildNetworkRules(settings) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);

  if (!settings.enabled || !settings.categories.platforms) {
    if (removeRuleIds.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
    }
    return 0;
  }

  const allow = new Set(
    (settings.allowlist || []).map((h) => h.replace(/^www\./, "").toLowerCase())
  );

  const rules = [];
  let id = RULE_ID_BASE;

  for (const platform of settings.platforms || []) {
    if (!platform.enabled || !platform.host) continue;
    const hostKey = platform.host.split("/")[0].replace(/^www\./, "").toLowerCase();
    if (allow.has(hostKey)) continue;

    const blockedUrl =
      chrome.runtime.getURL("assets/blocked.html") +
      `#host=${encodeURIComponent(platform.host)}&label=${encodeURIComponent(platform.label || platform.host)}`;

    rules.push({
      id: id++,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { url: blockedUrl }
      },
      condition: {
        urlFilter: hostToUrlFilter(platform.host),
        resourceTypes: ["main_frame", "sub_frame"]
      }
    });
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: rules
  });

  return rules.length;
}

async function init() {
  let settings = await getSettings();

  // v3: stop hard-blocking AI websites by default (use AI freely; filter content elsewhere)
  const SETTINGS_REV = 3;
  const stored = await chrome.storage.local.get(["initialized", "settingsRev"]);
  if (stored.settingsRev !== SETTINGS_REV) {
    settings.categories.platforms = false;
    for (const p of settings.platforms || []) p.enabled = false;
    settings.categories.videos = true;
    if (!settings.videos) settings.videos = structuredClone(DEFAULT_SETTINGS.videos);
    else {
      settings.videos.enabled = true;
      settings.videos.youtube = true;
      // merge any new default patterns by id
      const have = new Set((settings.videos.titlePatterns || []).map((p) => p.id));
      for (const p of DEFAULT_SETTINGS.videos.titlePatterns) {
        if (!have.has(p.id)) settings.videos.titlePatterns.push({ ...p });
      }
    }
    await saveSettings(settings);
    await chrome.storage.local.set({ settingsRev: SETTINGS_REV, initialized: true });
  } else if (!stored.initialized) {
    await saveSettings(settings);
    await chrome.storage.local.set({ initialized: true, stats: DEFAULT_SETTINGS.stats, settingsRev: SETTINGS_REV });
  }

  const count = await rebuildNetworkRules(settings);
  console.log(`[Nullgen] Active network rules: ${count}`);

  onSettingsChanged(async (next) => {
    await rebuildNetworkRules(next);
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
      if (message?.type === "GET_SETTINGS") {
        sendResponse({ settings: await getSettings() });
      } else if (message?.type === "BUMP_STAT") {
        sendResponse({ stats: await bumpStat(message.key, message.by || 1) });
      } else if (message?.type === "REBUILD_RULES") {
        const s = await getSettings();
        const n = await rebuildNetworkRules(s);
        sendResponse({ count: n });
      } else if (message?.type === "SET_ENABLED") {
        const s = await getSettings();
        s.enabled = !!message.enabled;
        await saveSettings(s);
        await rebuildNetworkRules(s);
        sendResponse({ settings: s });
      } else {
        sendResponse({ ok: false });
      }
    })();
    return true;
  });

}

init().catch((err) => console.error("[Nullgen] init failed", err));
