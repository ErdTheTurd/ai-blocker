import { getSettings, saveSettings, getStats } from "../lib/storage.js";

const CAT_LABELS = {
  platforms: "AI platforms",
  channels: "Channels / accounts",
  videos: "Videos (YouTube+)",
  selectors: "Widgets & badges",
  keywords: "Keywords",
  aiText: "AI-written text",
  images: "AI images",
  embeds: "Embeds"
};

async function currentHost() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    return new URL(tab.url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function render() {
  const settings = await getSettings();
  const stats = await getStats();
  const enabled = document.getElementById("enabled");
  enabled.checked = !!settings.enabled;
  document.body.classList.toggle("is-off", !settings.enabled);

  document.getElementById("stat-elements").textContent = stats.blockedElements || 0;
  document.getElementById("stat-text").textContent = stats.blockedText || 0;
  document.getElementById("stat-nav").textContent = stats.blockedNavigations || 0;

  const cats = document.getElementById("categories");
  cats.innerHTML = "";
  for (const [key, label] of Object.entries(CAT_LABELS)) {
    const row = document.createElement("label");
    row.className = "cat";
    row.innerHTML = `
      <span>${label}</span>
      <span class="switch mini">
        <input type="checkbox" data-cat="${key}" ${settings.categories[key] ? "checked" : ""} />
        <span class="slider"></span>
      </span>
    `;
    cats.appendChild(row);
  }

  cats.querySelectorAll("input[data-cat]").forEach((input) => {
    input.addEventListener("change", async () => {
      const s = await getSettings();
      s.categories[input.dataset.cat] = input.checked;
      await saveSettings(s);
      await chrome.runtime.sendMessage({ type: "REBUILD_RULES" });
    });
  });
}

document.getElementById("enabled").addEventListener("change", async (e) => {
  await chrome.runtime.sendMessage({ type: "SET_ENABLED", enabled: e.target.checked });
  document.body.classList.toggle("is-off", !e.target.checked);
});

document.getElementById("open-options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("allow-site").addEventListener("click", async () => {
  const host = await currentHost();
  if (!host) return;
  const s = await getSettings();
  if (!s.allowlist.includes(host)) s.allowlist.push(host);
  for (const p of s.platforms) {
    if (p.host.split("/")[0].replace(/^www\./, "") === host) p.enabled = false;
  }
  await saveSettings(s);
  await chrome.runtime.sendMessage({ type: "REBUILD_RULES" });
  const btn = document.getElementById("allow-site");
  btn.textContent = "Allowed";
  setTimeout(() => (btn.textContent = "Allow this site"), 1200);
});

render();
