import { ensureSeeded, getState, setState, updateCard } from "./store.js";
import { pickDue, schedule } from "./srs.js";

const ALARM = "drip-review";

async function syncAlarm() {
  const { settings } = await getState();
  await chrome.alarms.clear(ALARM);
  if (settings.aggressiveMode) {
    chrome.alarms.create(ALARM, {
      periodInMinutes: Math.max(1, Number(settings.intervalMinutes) || 45),
      delayInMinutes: Math.max(1, Number(settings.intervalMinutes) || 45),
    });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await ensureSeeded();
  await syncAlarm();
});

chrome.runtime.onStartup.addListener(syncAlarm);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings) syncAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;
  const state = await getState();
  const card = pickDue(state.cards.filter((c) => c.subjectId === state.activeSubjectId));
  if (!card) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) return;

  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["overlay.css"] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["overlay.js"] });
    await chrome.tabs.sendMessage(tab.id, { type: "DRIP_SHOW", card });
  } catch (e) {
    // page disallows injection (chrome://, web store) — skip silently
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "DRIP_GRADE") {
    (async () => {
      const state = await getState();
      const card = state.cards.find((c) => c.id === msg.cardId);
      if (card) await updateCard(schedule(card, msg.grade));
      sendResponse({ ok: true });
    })();
    return true;
  }
  if (msg?.type === "DRIP_NEXT") {
    (async () => {
      const state = await getState();
      const card = pickDue(state.cards.filter((c) => c.subjectId === state.activeSubjectId));
      sendResponse({ card });
    })();
    return true;
  }
});

chrome.action.onClicked.addListener(() => {
  if (chrome.sidebarAction?.open) {
    chrome.sidebarAction.open();
  }
});

ensureSeeded().then(syncAlarm);
