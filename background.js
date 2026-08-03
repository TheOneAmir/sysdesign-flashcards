import { ensureSeeded, getState, updateCard } from "./store.js";
import { pickDue, schedule } from "./srs.js";

const ALARM = "drip-review";

async function syncAlarm() {
  const { settings } = await getState();
  await chrome.alarms.clear(ALARM);
  chrome.alarms.create(ALARM, {
    periodInMinutes: Math.max(1, Number(settings.intervalMinutes) || 45),
    delayInMinutes: Math.max(1, Number(settings.intervalMinutes) || 45),
  });
}

function configureSidePanel() {
  if (chrome.sidePanel?.setOptions) {
    chrome.sidePanel.setOptions({ path: "sidebar.html" });
  }
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
}

function openSidePanel() {
  if (chrome.sidePanel?.open) {
    try {
      return chrome.sidePanel
        .open({ windowId: chrome.windows.WINDOW_ID_CURRENT })
        .then(() => true)
        .catch(() => false);
    } catch (error) {
      console.warn("Drip: sidePanel.open threw", error);
      return Promise.resolve(false);
    }
  }
  if (chrome.sidebarAction?.open) {
    chrome.sidebarAction.open();
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
}

configureSidePanel();

chrome.runtime.onInstalled.addListener(async () => {
  await ensureSeeded();
  configureSidePanel();
  await syncAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  configureSidePanel();
  syncAlarm();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings) syncAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;
  const state = await getState();
  const card = pickDue(state.cards.filter((c) => c.subjectId === state.activeSubjectId));
  if (!card) return;

  openSidePanel();
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
  openSidePanel().then((opened) => {
    if (!opened) {
      console.warn("Drip: sidePanel API open failed or is unavailable.");
    }
  });
});

ensureSeeded().then(syncAlarm);
