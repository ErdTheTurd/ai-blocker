(function () {
  const hostEl = document.getElementById("host");

  function readParams() {
    const fromSearch = new URLSearchParams(location.search);
    const fromHash = new URLSearchParams((location.hash || "").replace(/^#/, ""));
    return {
      host: fromSearch.get("host") || fromHash.get("host") || "",
      label: fromSearch.get("label") || fromHash.get("label") || ""
    };
  }

  function applyHost() {
    const { host: raw, label } = readParams();
    let host = raw || "AI platform";
    if (host.includes("/")) host = host.split("/")[0];
    if (hostEl) {
      hostEl.textContent = label ? `${label} · ${host}` : host;
      hostEl.dataset.host = host;
    }
    return host;
  }

  let host = applyHost();
  let attempts = 0;
  const timer = setInterval(() => {
    host = applyHost();
    attempts += 1;
    if ((host && host !== "AI platform") || attempts > 40) {
      clearInterval(timer);
    }
  }, 50);

  window.addEventListener("hashchange", () => {
    host = applyHost();
  });

  document.getElementById("options")?.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  document.getElementById("allowOnce")?.addEventListener("click", async () => {
    host = applyHost();
    const res = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
    const settings = res && res.settings;
    if (!settings) return;
    const clean = host.replace(/^www\./, "");
    if (clean && clean !== "AI platform" && !settings.allowlist.includes(clean)) {
      settings.allowlist.push(clean);
      for (const p of settings.platforms) {
        if (p.host.split("/")[0].replace(/^www\./, "") === clean) p.enabled = false;
      }
      await chrome.storage.local.set({ settings });
      await chrome.runtime.sendMessage({ type: "REBUILD_RULES" });
    }
    if (history.length > 1) history.back();
    else location.href = "about:blank";
  });

  chrome.runtime.sendMessage({ type: "BUMP_STAT", key: "blockedNavigations", by: 1 });
})();
