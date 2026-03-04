// service_worker.js
//
// Global toggle for Old Reddit Redirect (MV3 + DNR static ruleset).
// - Click the extension icon to toggle ON/OFF
// - Enables/disables ruleset_1 (rules.json) via updateEnabledRulesets
// - Swaps toolbar icon between orange and gray icon sets
// - Persists setting via chrome.storage.sync

const STORAGE_KEY = "enabled";
const RULESET_ID = "ruleset_1";

// Icon paths (match repo naming + your new gray_* assets)
const ICON_ON = {
  16: "img/icon16.png",
  32: "img/icon32.png",
  48: "img/icon48.png",
  64: "img/icon64.png",
  96: "img/icon96.png",
  128: "img/icon128.png",
};

const ICON_OFF = {
  16: "img/gray_icon16.png",
  32: "img/gray_icon32.png",
  48: "img/gray_icon48.png",
  64: "img/gray_icon64.png",
  96: "img/gray_icon96.png",
  128: "img/gray_icon128.png",
};

async function getEnabled() {
  const res = await chrome.storage.sync.get({ [STORAGE_KEY]: true });
  return Boolean(res[STORAGE_KEY]);
}

async function setEnabledInStorage(enabled) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: enabled });
}

async function applyRuleset(enabled) {
  // Toggle the existing static ruleset defined in manifest.json -> rules.json
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enabled ? [RULESET_ID] : [],
    disableRulesetIds: enabled ? [] : [RULESET_ID],
  });
}

async function updateToolbarUI(enabled) {
  // Icon
  await chrome.action.setIcon({ path: enabled ? ICON_ON : ICON_OFF });

  // Tooltip (helps when icon is small)
  await chrome.action.setTitle({
    title: enabled ? "Old Reddit Redirect: ON" : "Old Reddit Redirect: OFF",
  });

  // Optional badge: remove these 2 lines if you want *only* icon color
  await chrome.action.setBadgeText({ text: enabled ? "ON" : "OFF" });
  await chrome.action.setBadgeBackgroundColor({ color: enabled ? "#ff4500" : "#666666" });
}

async function syncFromStorage() {
  const enabled = await getEnabled();
  await applyRuleset(enabled);
  await updateToolbarUI(enabled);
}

async function toggle() {
  const enabled = await getEnabled();
  const next = !enabled;
  await setEnabledInStorage(next);
  await applyRuleset(next);
  await updateToolbarUI(next);
}

// Ensure state is applied after install/update.
// (Updates can revert ruleset enablement to manifest defaults.)
chrome.runtime.onInstalled.addListener(() => {
  void syncFromStorage();
});

// Best-effort apply on browser startup (supported in Chrome).
chrome.runtime.onStartup?.addListener(() => {
  void syncFromStorage();
});

// Also apply whenever the MV3 service worker wakes/loads.
void syncFromStorage();

// Click the extension icon to toggle globally.
chrome.action.onClicked.addListener(() => {
  void toggle();
});