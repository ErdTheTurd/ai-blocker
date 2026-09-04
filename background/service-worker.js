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

    const blockedUrl = chrome.runtime.getURL(
      `assets/blocked.html?host=${encodeURIComponent(platform.host)}&label=${encodeURIComponent(platform.label || platform.host)}`
    );

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
  // Ensure defaults are persisted on first run
  if (!(await chrome.storage.local.get("initialized")).initialized) {
    await saveSettings(settings);
    await chrome.storage.local.set({ initialized: true, stats: DEFAULT_SETTINGS.stats });
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
