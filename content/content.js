(function () {
  "use strict";

  const SHARED = globalThis.NullgenShared || {
    deepMerge: (a, b) => Object.assign({}, a, b),
    THEME_PRESETS: {},
    FONT_STACKS: { system: "system-ui, sans-serif" },
    DEFAULT_SETTINGS: { enabled: true }
  };

  let settings = null;
  let blockedCount = 0;
  let observer = null;
  let scanScheduled = false;
  const revealed = new WeakSet();

  const AI_PHRASE_BANK = [
    /as an ai (language )?model/i,
    /i (don't|do not) have personal (opinions|experiences|feelings)/i,
    /i('m| am) (just |only )?(an? )?(ai|artificial intelligence|language model)/i,
    /certainly[!.,] (i('d| would) be happy to|here('s| is))/i,
    /in (conclusion|summary), it is important to (note|remember|consider)/i,
    /in today'?s (fast[- ]paced|digital|rapidly (changing|evolving)) (world|landscape)/i,
    /delve(s|d)? into/i,
    /it('s| is) worth noting that/i,
    /a (symphony|tapestry) of/i,
    /navigate the (complexities|nuances) of/i,
    /unlock the (full )?potential of/i,
    /game[- ]changer/i,
    /in the realm of/i,
    /multifaceted (approach|nature)/i
  ];

  function hostname() {
    try {
      return location.hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  }

  function isAiToolHost() {
    const host = hostname();
    const tools = [
      "claude.ai",
      "anthropic.com",
      "chatgpt.com",
      "chat.openai.com",
      "openai.com",
      "gemini.google.com",
      "bard.google.com",
      "copilot.microsoft.com",
      "perplexity.ai",
      "character.ai",
      "poe.com",
      "grok.x.ai",
      "x.ai",
      "midjourney.com",
      "sora.com",
      "huggingface.co"
    ];
    return tools.some((t) => host === t || host.endsWith("." + t));
  }

  function isAllowlisted() {
    const host = hostname();
    if (isAiToolHost()) return true; // never filter inside AI apps you intentionally open
    return (settings.allowlist || []).some((h) => {
      const n = String(h).replace(/^www\./, "").toLowerCase();
      return host === n || host.endsWith("." + n);
    });
  }

  function applyAppearance() {
    const a = settings.appearance || {};
    const preset = SHARED.THEME_PRESETS[a.theme] || SHARED.THEME_PRESETS.signal || {};
    const accent = a.theme === "custom" ? a.accent : preset.accent || a.accent;
    const surface = a.theme === "custom" ? a.surface : preset.surface || a.surface;
    const text = a.theme === "custom" ? a.text : preset.text || a.text;
    const muted = preset.muted || "#8b98a5";
    const root = document.documentElement;
    root.style.setProperty("--nullgen-accent", accent || "#00d4b4");
    root.style.setProperty("--nullgen-surface", surface || "#161a20");
    root.style.setProperty("--nullgen-text", text || "#e8eef2");
    root.style.setProperty("--nullgen-muted", muted);
    root.style.setProperty("--nullgen-radius", `${a.borderRadius ?? 8}px`);
    root.style.setProperty(
      "--nullgen-font",
      SHARED.FONT_STACKS[a.font] || SHARED.FONT_STACKS.system
    );

    let style = document.getElementById("nullgen-custom-css");
    if (a.customCss) {
      if (!style) {
        style = document.createElement("style");
        style.id = "nullgen-custom-css";
        (document.head || document.documentElement).appendChild(style);
      }
      style.textContent = a.customCss;
    } else if (style) {
      style.remove();
    }
  }

  let toastTimer = null;
  let toastPending = 0;
  function showToast(msg) {
    if (!document.body) return;
    let el = document.getElementById("nullgen-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "nullgen-toast";
      el.className = "nullgen-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("nullgen-toast-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("nullgen-toast-show"), 1600);
  }

  function bump(key, by = 1) {
    blockedCount += by;
    toastPending += by;
    try {
      chrome.runtime.sendMessage({ type: "BUMP_STAT", key, by });
    } catch {
      /* extension context invalidated */
    }
    if (settings.appearance?.showBadge) {
      clearTimeout(bump.toastDelay);
      bump.toastDelay = setTimeout(() => {
        if (!toastPending) return;
        showToast(`Blocked ${blockedCount} AI item${blockedCount === 1 ? "" : "s"}`);
        toastPending = 0;
      }, 400);
    }
  }

  function placeholderMessage(reason) {
    const mode = settings.appearance?.placeholderMode || "label";
    if (mode === "custom") return settings.appearance.customMessage || "Blocked by Nullgen";
    if (mode === "blank") return "";
    return reason || "AI content blocked";
  }

  function markBlocked(el, reason, statKey = "blockedElements") {
    if (!el || el.nodeType !== 1 || revealed.has(el) || el.classList.contains("nullgen-blocked")) {
      return;
    }
    if (el.closest?.(".nullgen-blocked, .nullgen-placeholder, #nullgen-toast")) return;

    const mode = settings.appearance?.placeholderMode || "label";
    el.classList.add("nullgen-blocked", `nullgen-mode-${mode}`);
    el.setAttribute("data-nullgen-reason", reason || "ai");

    if (mode !== "blank") {
      const ph = document.createElement("div");
      ph.className = "nullgen-placeholder";
      ph.innerHTML = `
        <div class="nullgen-mark" aria-hidden="true"></div>
        <strong>Nullgen</strong>
        <span></span>
        <button type="button">Show anyway</button>
      `;
      ph.querySelector("span").textContent = placeholderMessage(reason);
      ph.querySelector("button").addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          revealed.add(el);
          el.classList.remove(
            "nullgen-blocked",
            "nullgen-mode-label",
            "nullgen-mode-custom",
            "nullgen-mode-blur",
            "nullgen-mode-blank"
          );
          ph.remove();
        },
        { once: true }
      );

      const style = getComputedStyle(el);
      if (style.position === "static") {
        el.style.position = "relative";
      }
      if (mode === "label" || mode === "custom") {
        const minH = Math.max(el.offsetHeight || 0, 64);
        if (el.offsetHeight < 64) el.style.minHeight = `${minH}px`;
      }
      el.appendChild(ph);
    }

    bump(statKey, 1);
  }

  function hideCompletely(el, reason) {
    if (!el || el.classList.contains("nullgen-hidden")) return;
    el.classList.add("nullgen-hidden");
    el.setAttribute("data-nullgen-reason", reason || "ai");
    bump("blockedElements", 1);
  }

  /* ——— Channels (YouTube / X / Twitch) ——— */
  function normalizeHandle(match) {
    return String(match || "")
      .replace(/^@/, "")
      .replace(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i, "")
      .replace(/^channel\//i, "")
      .replace(/^@/, "")
      .split(/[/?#]/)[0]
      .toLowerCase();
  }

  function youtubeCardFrom(node) {
    return (
      node.closest(
        [
          "ytd-video-renderer",
          "ytd-rich-item-renderer",
          "ytd-grid-video-renderer",
          "ytd-compact-video-renderer",
          "ytd-playlist-panel-video-renderer",
          "ytd-reel-item-renderer",
          "ytd-short",
          "ytd-rich-grid-media",
          "ytd-watch-card-compact-video-renderer",
          "ytm-video-with-context-renderer",
          "ytm-rich-item-renderer"
        ].join(", ")
      ) || node
    );
  }

  function scanChannels() {
    if (!settings.categories.channels) return;
    const path = location.pathname + location.search;
    const host = hostname();

    const yt = settings.channels?.youtube || [];
    if (host.includes("youtube.com") || host === "youtu.be" || host === "m.youtube.com") {
      for (const ch of yt) {
        if (!ch.enabled || !ch.match) continue;
        const needle = normalizeHandle(ch.match);
        if (!needle) continue;
        const hay = (path + " " + document.title).toLowerCase();
        if (
          hay.includes("/@" + needle) ||
          hay.includes("channel/" + needle) ||
          hay.includes("/c/" + needle) ||
          hay.includes("/user/" + needle)
        ) {
          const primary =
            document.querySelector(
              "#page-manager, ytd-browse, ytd-two-column-browse-results-renderer, ytd-watch-flexy"
            ) || document.body;
          markBlocked(primary, `YouTube channel: ${ch.label || ch.match}`);
        }

        document
          .querySelectorAll(
            "a[href*='/@'], a[href*='/channel/'], a[href*='/c/'], a[href*='/user/'], ytd-channel-name, #channel-name, #text.ytd-channel-name"
          )
          .forEach((node) => {
            const text = (
              node.getAttribute("href") ||
              node.getAttribute("title") ||
              node.textContent ||
              ""
            ).toLowerCase();
            if (!text.includes(needle) && !text.includes(ch.match.toLowerCase())) return;
            markBlocked(youtubeCardFrom(node), `Channel: ${ch.label || ch.match}`);
          });
      }
    }

    const tw = settings.channels?.twitter || [];
    if (host === "x.com" || host === "twitter.com") {
      for (const ch of tw) {
        if (!ch.enabled || !ch.match) continue;
        const handle = ch.match.replace(/^@/, "").toLowerCase();
        document.querySelectorAll("a[href*='/']").forEach((a) => {
          const href = (a.getAttribute("href") || "").toLowerCase();
          if (href === "/" + handle || href.startsWith("/" + handle + "/")) {
            markBlocked(a.closest("article") || a, `Account: @${handle}`);
          }
        });
      }
    }

    const custom = settings.channels?.custom || [];
    for (const ch of custom) {
      if (!ch.enabled || !ch.match) continue;
      try {
        const re = new RegExp(ch.match, "i");
        if (re.test(location.href)) {
          markBlocked(document.body, ch.label || "Custom channel rule");
        }
      } catch {
        /* bad regex */
      }
    }
  }

  /* ——— Videos (YouTube-first, works on other video sites too) ——— */
  const YT_BUILTIN_PATTERNS = [
    /AI[- ]generated/i,
    /made (with|by|using) (AI|ChatGPT|Sora|Midjourney|Runway|Pika|Kling|Luma|Veo)/i,
    /(^|[^a-z0-9])AI([^a-z0-9]|$)/i,
    /\bA\.I\.\b/i,
    /\b(ChatGPT|Midjourney|Sora|ElevenLabs|Synthesia|HeyGen|Runway|Pika|Kling|Veo|Suno|Udio)\b/i,
    /#ai\b|#aivideo\b|#aiart\b|#aianimation\b/i,
    /generative AI|gen[- ]?AI|text[- ]to[- ]video|text[- ]to[- ]image/i,
    /AI (video|film|movie|animation|short|cover|voice|song|music|art|clip|trailer)/i,
    /100% AI|fully AI|entirely AI|completely AI/i
  ];

  function videoTitlePatterns() {
    const custom = (settings.videos?.titlePatterns || [])
      .filter((p) => p.enabled && p.pattern)
      .map((p) => {
        try {
          return { label: p.label || p.pattern, re: new RegExp(p.pattern, "i") };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const builtin = YT_BUILTIN_PATTERNS.map((re, i) => ({
      label: "AI video signal",
      re
    }));
    return custom.concat(builtin);
  }

  function textMatchesVideoAi(text, patterns) {
    if (!text || !String(text).trim()) return null;
    const sample = String(text);
    for (const { label, re } of patterns) {
      re.lastIndex = 0;
      if (re.test(sample)) return label;
    }
    return null;
  }

  function collectYtCardText(card) {
    const bits = [];
    const push = (v) => {
      if (v && typeof v === "string" && v.trim()) bits.push(v.trim());
    };
    push(card.getAttribute?.("aria-label"));
    card.querySelectorAll?.(
      "a#video-title, a#video-title-link, #video-title, yt-formatted-string, a[href*='/watch'], a[href*='/shorts/'], #text, #description-text, #subtitle"
    ).forEach((el) => {
      push(el.getAttribute("aria-label"));
      push(el.getAttribute("title"));
      push(el.textContent);
    });
    return bits.join(" \n ").slice(0, 1200);
  }

  function scanYouTubeVideos() {
    const v = settings.videos || {};
    if (!v.youtube) return;
    const patterns = videoTitlePatterns();
    if (!patterns.length) return;

    const host = hostname();
    if (!(host.includes("youtube.com") || host === "youtu.be" || host === "m.youtube.com")) {
      return;
    }

    // Primary: every watch/shorts link (YouTube puts full titles in aria-label/title)
    if (v.blockFeedCards !== false) {
      document.querySelectorAll("a[href*='/watch'], a[href*='/shorts/']").forEach((a) => {
        if (a.closest(".nullgen-blocked, .nullgen-placeholder")) return;
        const meta = [
          a.getAttribute("aria-label"),
          a.getAttribute("title"),
          a.textContent
        ]
          .filter(Boolean)
          .join(" \n ");
        const hit = textMatchesVideoAi(meta, patterns);
        if (!hit) return;
        const card = youtubeCardFrom(a);
        // Prefer locking the whole tile when possible
        const tile =
          a.closest(
            "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer, ytm-rich-item-renderer"
          ) || card;
        markBlocked(tile, `YouTube: ${hit}`);
      });

      // Secondary: rich item tiles that may not expose a simple watch link yet
      document
        .querySelectorAll(
          "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer, ytd-playlist-panel-video-renderer, ytm-rich-item-renderer"
        )
        .forEach((card) => {
          if (card.classList.contains("nullgen-blocked")) return;
          const hit = textMatchesVideoAi(collectYtCardText(card), patterns);
          if (hit) markBlocked(card, `YouTube: ${hit}`);
        });
    }

    // Shorts shelf / player
    if (v.blockShorts !== false) {
      document
        .querySelectorAll(
          "ytd-reel-video-renderer, ytd-shorts, ytd-reel-item-renderer, shorts-video-renderer"
        )
        .forEach((el) => {
          if (el.classList.contains("nullgen-blocked")) return;
          const meta = collectYtCardText(el) || document.title;
          const hit = textMatchesVideoAi(meta, patterns);
          if (hit) markBlocked(el, `Shorts: ${hit}`);
        });

      if (/\/shorts\//i.test(location.pathname)) {
        const hit = textMatchesVideoAi(
          document.title + " " + (document.querySelector("h2, #video-title, yt-formatted-string")?.textContent || ""),
          patterns
        );
        if (hit) {
          const player =
            document.querySelector("#shorts-player, ytd-reel-video-renderer, #player-container") ||
            document.querySelector("ytd-app") ||
            document.body;
          markBlocked(player, `Shorts: ${hit}`);
        }
      }
    }

    // Watch page
    if (v.blockWatchPage !== false && (/\/watch/.test(location.pathname) || host === "youtu.be")) {
      const title =
        document.querySelector(
          "h1.ytd-watch-metadata yt-formatted-string, ytd-watch-metadata h1, #title h1 yt-formatted-string, #title h1"
        )?.textContent ||
        document.querySelector('meta[property="og:title"]')?.content ||
        document.querySelector('meta[name="title"]')?.content ||
        document.title.replace(/ - YouTube$/i, "");
      const desc =
        document.querySelector(
          "#description-inline-expander, ytd-text-inline-expander, #description, ytd-expander#description"
        )?.innerText ||
        document.querySelector('meta[name="description"]')?.content ||
        "";
      const channel =
        document.querySelector(
          "ytd-channel-name #text, #owner #channel-name a, ytd-video-owner-renderer #text"
        )?.textContent || "";
      const hit = textMatchesVideoAi([title, desc.slice(0, 1500), channel, document.title].join("\n"), patterns);
      if (hit) {
        // Cover player without nuking the whole YouTube chrome when possible
        const watch =
          document.querySelector("#player-container-outer, #player, #movie_player, ytd-player") ||
          document.querySelector("#primary-inner") ||
          document.body;
        markBlocked(watch, `YouTube video: ${hit}`);
      }
    }
  }

  function scanOtherVideoSites() {
    const v = settings.videos || {};
    if (!v.otherSites) return;
    const patterns = videoTitlePatterns();
    if (!patterns.length) return;
    const host = hostname();

    const videoHosts = /(vimeo\.com|dailymotion\.com|tiktok\.com|twitch\.tv|bilibili\.com|rumble\.com)/i;
    if (!videoHosts.test(host)) return;

    document
      .querySelectorAll(
        "article, [data-e2e='feed-video'], .video-card, .shelf-item, .thumb-item, .ClipCard, a[href*='/video']"
      )
      .forEach((el) => {
        if (el.classList.contains("nullgen-blocked")) return;
        const meta = [
          el.getAttribute("aria-label"),
          el.getAttribute("title"),
          el.querySelector("h1, h2, h3, a[title], [data-e2e='video-desc']")?.textContent,
          el.textContent
        ]
          .filter(Boolean)
          .join(" ")
          .slice(0, 600);
        const hit = textMatchesVideoAi(meta, patterns);
        if (hit) markBlocked(el, `Video: ${hit}`);
      });

    const pageHit = textMatchesVideoAi(document.title, patterns);
    if (pageHit) {
      const main =
        document.querySelector("main, #root, .video-player, .player") || document.body;
      markBlocked(main, `Video page: ${pageHit}`);
    }
  }

  function scanVideos() {
    if (!settings.categories.videos || !settings.videos?.enabled) return;
    scanYouTubeVideos();
    scanOtherVideoSites();
  }

  function hookYouTubeSpa() {
    if (!(hostname().includes("youtube") || hostname() === "youtu.be")) return;
    const rescan = () => {
      scheduleScan();
      setTimeout(scheduleScan, 300);
      setTimeout(scheduleScan, 1000);
      setTimeout(scheduleScan, 2500);
    };
    document.addEventListener("yt-navigate-finish", rescan, true);
    document.addEventListener("yt-page-data-updated", rescan, true);
    document.addEventListener("yt-action", () => scheduleScan(), true);
    const wrap = (name) => {
      const orig = history[name];
      if (typeof orig !== "function" || orig.__nullgen) return;
      const fn = function (...args) {
        const ret = orig.apply(this, args);
        rescan();
        return ret;
      };
      fn.__nullgen = true;
      history[name] = fn;
    };
    wrap("pushState");
    wrap("replaceState");
    window.addEventListener("popstate", rescan);
  }

  /* ——— CSS selectors ——— */
  function scanSelectors() {
    if (!settings.categories.selectors) return;
    for (const rule of settings.selectors || []) {
      if (!rule.enabled || !rule.selector) continue;
      let nodes;
      try {
        nodes = document.querySelectorAll(rule.selector);
      } catch {
        continue;
      }
      nodes.forEach((el) => markBlocked(el, rule.label || "Matched selector"));
    }
  }

  /* ——— Keywords ——— */
  function compileKeyword(rule) {
    try {
      return new RegExp(rule.pattern, rule.matchCase ? "g" : "gi");
    } catch {
      return null;
    }
  }

  function scanKeywords() {
    if (!settings.categories.keywords) return;
    const rules = (settings.keywords || []).filter((k) => k.enabled && k.pattern);
    if (!rules.length) return;

    const compiled = rules
      .map((r) => ({ rule: r, re: compileKeyword(r) }))
      .filter((x) => x.re);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName;
        if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE"].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (p.closest(".nullgen-blocked, .nullgen-placeholder, #nullgen-toast")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const hits = [];
    while (walker.nextNode()) {
      const text = walker.currentNode.nodeValue;
      for (const { rule, re } of compiled) {
        re.lastIndex = 0;
        if (re.test(text)) {
          hits.push({ node: walker.currentNode, rule });
          break;
        }
      }
    }

    for (const { node, rule } of hits) {
      const block =
        node.parentElement?.closest(
          "article, li, section, .post, .comment, ytd-comment-thread-renderer, [role='article'], p, div"
        ) || node.parentElement;
      if (block && block !== document.body && block !== document.documentElement) {
        markBlocked(block, `Keyword: ${rule.label || rule.pattern}`, "blockedText");
      }
    }
  }

  /* ——— AI-written text heuristics ——— */
  function scoreAiText(text) {
    if (!text || text.length < (settings.aiText?.minLength || 280)) return 0;
    let score = 0;
    const sensitivity = settings.aiText?.sensitivity || "balanced";
    const threshold = sensitivity === "low" ? 4 : sensitivity === "high" ? 2 : 3;

    if (settings.aiText?.blockCommonPhrases !== false) {
      for (const re of AI_PHRASE_BANK) {
        if (re.test(text)) score += 2;
      }
      for (const phrase of settings.aiText?.customPhrases || []) {
        if (phrase && text.toLowerCase().includes(phrase.toLowerCase())) score += 2;
      }
    }

    if (settings.aiText?.blockStructuralPatterns !== false) {
      // Em-dash density, numbered hedging, balanced triplet lists
      const emDashes = (text.match(/—/g) || []).length;
      if (emDashes >= 3) score += 1;
      if (/\b(Firstly|Secondly|Thirdly|Moreover|Furthermore|Additionally|Overall)\b/i.test(text)) {
        score += 1;
      }
      if (/not only .+ but also/i.test(text)) score += 1;
      if (/\b(leverage|utilize|streamline|robust|comprehensive|cutting-edge)\b/i.test(text)) {
        score += 1;
      }
      // Very uniform paragraph lengths (rough)
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 40);
      if (sentences.length >= 5) {
        const lens = sentences.map((s) => s.trim().length);
        const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
        const variance =
          lens.reduce((a, b) => a + Math.abs(b - avg), 0) / lens.length / avg;
        if (variance < 0.18) score += 1;
      }
    }

    return score >= threshold ? score : 0;
  }

  function scanAiText() {
    if (!settings.categories.aiText || !settings.aiText?.enabled) return;
    const candidates = document.querySelectorAll(
      "article, [role='article'], .post, .comment, .entry-content, .prose, ytd-comment-thread-renderer, p"
    );
    candidates.forEach((el) => {
      if (el.classList.contains("nullgen-blocked")) return;
      if (el.closest(".nullgen-blocked")) return;
      // Prefer larger containers over every paragraph
      if (el.tagName === "P" && el.parentElement?.closest("article, .post, .entry-content, .prose")) {
        return;
      }
      const text = el.innerText || "";
      if (scoreAiText(text) > 0) {
        markBlocked(el, "Likely AI-written text", "blockedText");
      }
    });
  }

  /* ——— Images ——— */
  function scanImages() {
    if (!settings.categories.images || !settings.images?.enabled) return;
    const cdns = settings.images.cdnPatterns || [];
    document.querySelectorAll("img, picture source, video").forEach((el) => {
      const src = el.currentSrc || el.src || el.getAttribute("srcset") || "";
      const alt = (el.getAttribute("alt") || "").toLowerCase();
      let reason = null;
      if (settings.images.blockKnownAiCdn) {
        for (const c of cdns) {
          if (c && src.includes(c)) {
            reason = "AI image CDN";
            break;
          }
        }
      }
      if (
        !reason &&
        settings.images.blockAiAltText &&
        /ai[- ]generated|generated by (ai|dall-?e|midjourney|stable diffusion)|made with (ai|chatgpt)/i.test(
          alt
        )
      ) {
        reason = "AI image (alt text)";
      }
      if (reason) {
        const target = el.closest("figure, picture, a, div") || el;
        markBlocked(target, reason);
      }
    });
  }

  /* ——— Embeds ——— */
  function scanEmbeds() {
    if (!settings.categories.embeds) return;
    document.querySelectorAll("iframe, embed, object").forEach((el) => {
      const src = el.getAttribute("src") || el.getAttribute("data-src") || "";
      const platforms = (settings.platforms || []).filter((p) => p.enabled);
      for (const p of platforms) {
        const host = p.host.split("/")[0];
        if (src.includes(host)) {
          markBlocked(el, `Embed: ${p.label || host}`);
          return;
        }
      }
      if (/chatgpt|openai|claude\.ai|gemini\.google|perplexity|character\.ai|midjourney/i.test(src)) {
        markBlocked(el, "AI embed");
      }
    });
  }

  function scanAll() {
    if (!settings?.enabled || isAllowlisted()) return;
    if (!document.body) return;
    scanChannels();
    scanVideos();
    scanSelectors();
    scanEmbeds();
    scanImages();
    scanKeywords();
    scanAiText();
  }

  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    requestAnimationFrame(() => {
      scanScheduled = false;
      scanAll();
    });
  }

  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => scheduleScan());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  async function loadSettings() {
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
      if (res?.settings) return SHARED.deepMerge(SHARED.DEFAULT_SETTINGS, res.settings);
    } catch {
      /* fall through */
    }
    return new Promise((resolve) => {
      chrome.storage.local.get("settings", (local) => {
        resolve(SHARED.deepMerge(SHARED.DEFAULT_SETTINGS, local.settings || {}));
      });
    });
  }

  async function boot() {
    settings = await loadSettings();
    applyAppearance();
    if (!settings.enabled || isAllowlisted()) return;

    const run = () => {
      scanAll();
      startObserver();
    };

    if (document.body) run();
    else document.addEventListener("DOMContentLoaded", run, { once: true });

    hookYouTubeSpa();

    // YouTube / SPAs settle late
    setTimeout(scheduleScan, 800);
    setTimeout(scheduleScan, 2000);
    setTimeout(scheduleScan, 5000);
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if ((area === "sync" || area === "local") && changes.settings) {
      settings = SHARED.deepMerge(SHARED.DEFAULT_SETTINGS, changes.settings.newValue || {});
      applyAppearance();
      if (!settings.enabled) {
        observer?.disconnect();
        return;
      }
      scheduleScan();
      startObserver();
    }
  });

  boot();
})();
