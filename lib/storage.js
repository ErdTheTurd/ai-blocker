import { DEFAULT_SETTINGS, THEME_PRESETS, FONT_STACKS } from "./defaults.js";

export { DEFAULT_SETTINGS, THEME_PRESETS, FONT_STACKS };

function deepMerge(base, patch) {
  if (!patch || typeof patch !== "object") return structuredClone(base);
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      out[key] = deepMerge(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export { deepMerge };

export async function getSettings() {
  // Prefer local — full rule lists can exceed sync item quotas
  const local = await chrome.storage.local.get("settings");
  if (local.settings) return deepMerge(DEFAULT_SETTINGS, local.settings);
  const sync = await chrome.storage.sync.get("settings");
  if (sync.settings) return deepMerge(DEFAULT_SETTINGS, sync.settings);
  return structuredClone(DEFAULT_SETTINGS);
}

export async function saveSettings(settings) {
  const { stats, ...syncable } = settings;
  await chrome.storage.local.set({
    settings: syncable,
    stats: stats || (await getStats())
  });
  // Best-effort sync of a slim mirror for multi-device (master flags only)
  try {
    await chrome.storage.sync.set({
      settingsMirror: {
        enabled: !!syncable.enabled,
        appearance: syncable.appearance,
        categories: syncable.categories
      }
    });
  } catch {
    /* ignore quota */
  }
  return settings;
}

export async function getStats() {
  const { stats } = await chrome.storage.local.get("stats");
  return stats || { ...DEFAULT_SETTINGS.stats };
}

export async function bumpStat(key, by = 1) {
  const stats = await getStats();
  stats[key] = (stats[key] || 0) + by;
  await chrome.storage.local.set({ stats });
  return stats;
}

export async function resetStats() {
  const stats = {
    blockedElements: 0,
    blockedNavigations: 0,
    blockedText: 0,
    lastReset: new Date().toISOString()
  };
  await chrome.storage.local.set({ stats });
  return stats;
}

export function onSettingsChanged(callback) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.settings) {
      callback(deepMerge(DEFAULT_SETTINGS, changes.settings.newValue || {}));
    }
  });
}
