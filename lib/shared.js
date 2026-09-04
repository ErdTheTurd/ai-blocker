/** Shared defaults (non-module) for content scripts */
(function (global) {
  const DEFAULT_SETTINGS = {
    enabled: true,
    appearance: {
      theme: "signal",
      placeholderMode: "label",
      customMessage: "Blocked by Nullgen",
      accent: "#00d4b4",
      surface: "#161a20",
      text: "#e8eef2",
      font: "space",
      borderRadius: 8,
      showBadge: true,
      customCss: ""
    },
    categories: {
      platforms: true,
      channels: true,
      videos: true,
      selectors: true,
      keywords: true,
      aiText: true,
      images: true,
      embeds: true
    },
    platforms: [],
    channels: { youtube: [], twitter: [], twitch: [], custom: [] },
    videos: {
      enabled: true,
      youtube: true,
      otherSites: true,
      blockWatchPage: true,
      blockFeedCards: true,
      blockShorts: true,
      titlePatterns: []
    },
    selectors: [],
    keywords: [],
    aiText: {
      enabled: true,
      sensitivity: "balanced",
      minLength: 280,
      blockCommonPhrases: true,
      blockStructuralPatterns: true,
      customPhrases: []
    },
    images: {
      enabled: true,
      blockAiAltText: true,
      blockKnownAiCdn: true,
      cdnPatterns: []
    },
    allowlist: [],
    stats: {
      blockedElements: 0,
      blockedNavigations: 0,
      blockedText: 0,
      lastReset: null
    }
  };

  const THEME_PRESETS = {
    signal: {
      accent: "#00d4b4",
      surface: "#161a20",
      text: "#e8eef2",
      muted: "#8b98a5",
      danger: "#ff6b6b",
      bg: "#0d1014"
    },
    paper: {
      accent: "#0b6e4f",
      surface: "#f3efe6",
      text: "#1a1f24",
      muted: "#5c6670",
      danger: "#c23b22",
      bg: "#faf7f0"
    },
    terminal: {
      accent: "#7CFF9E",
      surface: "#0a0f0c",
      text: "#c8f5d4",
      muted: "#5a8f6c",
      danger: "#ff8080",
      bg: "#050805"
    }
  };

  const FONT_STACKS = {
    space: "'Space Grotesk', 'Avenir Next', 'Segoe UI', sans-serif",
    plex: "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
    jetbrains: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
    system: "system-ui, -apple-system, 'Segoe UI', sans-serif"
  };

  function deepMerge(base, patch) {
    if (!patch || typeof patch !== "object") return JSON.parse(JSON.stringify(base));
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    for (const key of Object.keys(patch)) {
      const value = patch[key];
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

  global.NullgenShared = {
    DEFAULT_SETTINGS,
    THEME_PRESETS,
    FONT_STACKS,
    deepMerge
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
