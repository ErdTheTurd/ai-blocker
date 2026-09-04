/** Default settings & block lists for Nullgen */

export const DEFAULT_SETTINGS = {
  enabled: true,
  appearance: {
    theme: "signal", // signal | paper | terminal | custom
    placeholderMode: "label", // blank | label | blur | custom
    customMessage: "Blocked by Nullgen",
    accent: "#1ee0b6",
    surface: "#0c1016",
    text: "#e9eef5",
    font: "space", // space | plex | jetbrains | system
    borderRadius: 12,
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
  platforms: [
    { id: "chatgpt", host: "chat.openai.com", label: "ChatGPT", enabled: true },
    { id: "chatgpt-www", host: "chatgpt.com", label: "ChatGPT (www)", enabled: true },
    { id: "openai", host: "openai.com", label: "OpenAI", enabled: true },
    { id: "claude", host: "claude.ai", label: "Claude", enabled: true },
    { id: "anthropic", host: "anthropic.com", label: "Anthropic", enabled: true },
    { id: "gemini", host: "gemini.google.com", label: "Google Gemini", enabled: true },
    { id: "bard", host: "bard.google.com", label: "Google Bard", enabled: true },
    { id: "copilot", host: "copilot.microsoft.com", label: "Microsoft Copilot", enabled: true },
    { id: "bing-chat", host: "bing.com/chat", label: "Bing Chat", enabled: true },
    { id: "perplexity", host: "perplexity.ai", label: "Perplexity", enabled: true },
    { id: "character", host: "character.ai", label: "Character.AI", enabled: true },
    { id: "poe", host: "poe.com", label: "Poe", enabled: true },
    { id: "midjourney", host: "midjourney.com", label: "Midjourney", enabled: true },
    { id: "leonardo", host: "leonardo.ai", label: "Leonardo", enabled: true },
    { id: "runway", host: "runwayml.com", label: "Runway", enabled: true },
    { id: "sora", host: "sora.com", label: "Sora", enabled: true },
    { id: "stability", host: "stability.ai", label: "Stability AI", enabled: true },
    { id: "huggingface-chat", host: "huggingface.co/chat", label: "HuggingChat", enabled: true },
    { id: "grok", host: "grok.x.ai", label: "Grok", enabled: true },
    { id: "xai", host: "x.ai", label: "xAI", enabled: true },
    { id: "jasper", host: "jasper.ai", label: "Jasper", enabled: true },
    { id: "writesonic", host: "writesonic.com", label: "Writesonic", enabled: true },
    { id: "copyai", host: "copy.ai", label: "Copy.ai", enabled: true },
    { id: "notion-ai", host: "notion.so/product/ai", label: "Notion AI", enabled: false },
    { id: "gamma", host: "gamma.app", label: "Gamma", enabled: true },
    { id: "beautifulai", host: "beautiful.ai", label: "Beautiful.ai", enabled: true },
    { id: "synthesia", host: "synthesia.io", label: "Synthesia", enabled: true },
    { id: "heygen", host: "heygen.com", label: "HeyGen", enabled: true },
    { id: "elevenlabs", host: "elevenlabs.io", label: "ElevenLabs", enabled: true },
    { id: "suno", host: "suno.com", label: "Suno", enabled: true },
    { id: "udio", host: "udio.com", label: "Udio", enabled: true }
  ],
  channels: {
    youtube: [
      // Example placeholders — users customize these
      { id: "yt-example", match: "@AIGeneratedChannel", label: "Example AI channel", enabled: false }
    ],
    twitter: [],
    twitch: [],
    custom: []
  },
  videos: {
    enabled: true,
    youtube: true,
    otherSites: true,
    blockWatchPage: true,
    blockFeedCards: true,
    blockShorts: true,
    titlePatterns: [
      { id: "vt-ai-generated", pattern: "\\bAI[- ]generated\\b", label: "AI-generated", enabled: true },
      { id: "vt-made-with-ai", pattern: "made with (AI|ChatGPT|Sora|Midjourney|Runway|Pika|Kling|Luma|Hailuo)", label: "Made with AI tools", enabled: true },
      { id: "vt-sora", pattern: "\\b(OpenAI )?Sora\\b", label: "Sora", enabled: true },
      { id: "vt-midjourney", pattern: "\\bMidjourney\\b", label: "Midjourney", enabled: true },
      { id: "vt-runway", pattern: "\\bRunway(\\s*ML)?\\b", label: "Runway", enabled: true },
      { id: "vt-ai-video", pattern: "\\bAI (video|film|movie|animation|short|commercial|ad)\\b", label: "AI video/film", enabled: true },
      { id: "vt-ai-cover", pattern: "\\bAI (cover|voice|song|music|rap)\\b", label: "AI music/voice", enabled: true },
      { id: "vt-ai-art", pattern: "#ai(art|video|animation)|\\bAI art\\b", label: "AI art tags", enabled: true },
      { id: "vt-synthesia", pattern: "\\b(Synthesia|HeyGen|D-?ID)\\b", label: "AI avatar tools", enabled: true },
      { id: "vt-eleven", pattern: "\\bElevenLabs\\b", label: "ElevenLabs", enabled: true },
      { id: "vt-suno", pattern: "\\b(Suno|Udio)\\b", label: "Suno / Udio", enabled: true },
      { id: "vt-fully-ai", pattern: "100% AI|fully AI|entirely AI|all AI generated", label: "Fully AI", enabled: true }
    ]
  },
  selectors: [
    { id: "ai-badge", selector: "[data-ai], [data-generated], .ai-badge, .ai-generated, .chatgpt-widget", label: "AI badges & widgets", enabled: true },
    { id: "openai-embed", selector: "iframe[src*='chat.openai.com'], iframe[src*='chatgpt.com']", label: "ChatGPT embeds", enabled: true },
    { id: "gemini-sidebar", selector: "[aria-label*='Gemini'], [data-test-id*='gemini']", label: "Gemini UI hooks", enabled: true },
    { id: "copilot-panel", selector: "#copilot-chat, .copilot-chat, [class*='Copilot']", label: "Copilot panels", enabled: true },
    { id: "ai-summary", selector: "[class*='ai-summary'], [class*='AISummary'], [id*='ai-overview']", label: "AI summaries / overviews", enabled: true },
    { id: "sponsored-ai", selector: "[data-ad-type*='ai'], .ai-ad, .generative-ad", label: "Generative ads", enabled: true }
  ],
  keywords: [
    { id: "kw-ai-generated", pattern: "AI[- ]generated", label: "AI-generated", enabled: true, matchCase: false },
    { id: "kw-made-with-ai", pattern: "made with (ChatGPT|AI|Midjourney|DALL·E|DALL-E)", label: "Made with AI", enabled: true, matchCase: false },
    { id: "kw-chatgpt-wrote", pattern: "(written|created|generated) (by|with|using) (ChatGPT|Claude|Gemini|an AI)", label: "Written by AI", enabled: true, matchCase: false },
    { id: "kw-as-an-ai", pattern: "as an AI language model", label: "As an AI language model", enabled: true, matchCase: false },
    { id: "kw-delve", pattern: "\\bdelve into\\b", label: "Common AI filler: delve into", enabled: false, matchCase: false },
    { id: "kw-landscape", pattern: "in (today|the modern)'?s (digital |rapidly changing )?landscape", label: "Common AI filler: landscape", enabled: false, matchCase: false }
  ],
  aiText: {
    enabled: true,
    sensitivity: "balanced", // low | balanced | high
    minLength: 280,
    blockCommonPhrases: true,
    blockStructuralPatterns: true,
    customPhrases: [
      "In conclusion, it is important to note",
      "Furthermore, it is worth mentioning",
      "In today's rapidly evolving",
      "As an AI",
      "I hope this helps!",
      "Let me know if you need anything else"
    ]
  },
  images: {
    enabled: true,
    blockAiAltText: true,
    blockKnownAiCdn: true,
    cdnPatterns: [
      "cdn.openai.com",
      "images.openai.com",
      "mj-cdn",
      "cdn.midjourney.com",
      "leonardo.ai",
      "stability.ai"
    ]
  },
  allowlist: [],
  stats: {
    blockedElements: 0,
    blockedNavigations: 0,
    blockedText: 0,
    lastReset: null
  }
};

export const THEME_PRESETS = {
  signal: {
    accent: "#1ee0b6",
    surface: "#0c1016",
    text: "#e9eef5",
    muted: "#8a96a5",
    danger: "#ff6b7a",
    bg: "#06080b"
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

export const FONT_STACKS = {
  space: "'Syne', 'Manrope', 'Avenir Next', sans-serif",
  plex: "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
  jetbrains: "'IBM Plex Mono', 'SF Mono', 'Consolas', monospace",
  system: "system-ui, -apple-system, 'Segoe UI', sans-serif"
};
