import { ensureSeeded, getState, updateCard } from "./store.js";
import { isDue, pickDue, schedule } from "./srs.js";

const stage = document.getElementById("stage");
const subjectEl = document.getElementById("subject");
const statsEl = document.getElementById("stats");
document.getElementById("manage").addEventListener("click", () => chrome.runtime.openOptionsPage());

let current = null;
let revealed = false;

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

async function load() {
  await ensureSeeded();
  const state = await getState();
  const subject = state.subjects.find((s) => s.id === state.activeSubjectId) ?? state.subjects[0];
  subjectEl.textContent = subject ? subject.name : "Drip";
  const cards = state.cards.filter((c) => c.subjectId === subject?.id);
  const due = cards.filter((c) => isDue(c)).length;
  statsEl.textContent = `${due} due · ${cards.length} cards`;

  if (!state.settings.newTabEnabled) {
    stage.innerHTML = `<div class="muted">New-tab reviews are off. <a href="#" id="on">Turn them on</a>.</div>`;
    document.getElementById("on").addEventListener("click", async (e) => {
      e.preventDefault();
      await chrome.storage.local.set({ settings: { ...state.settings, newTabEnabled: true } });
      load();
    });
    return;
  }

  current = pickDue(cards);
  revealed = false;
  render();
}

function render() {
  if (!current) {
    stage.innerHTML = `<div class="card-front">All caught up.</div><p class="muted" style="margin-top:10px">Add cards from the deck manager to keep the drip going.</p>`;
    return;
  }
  stage.innerHTML = `
    <div class="card-front">${esc(current.front)}</div>
    ${
      revealed
        ? `<div class="card-back">${esc(current.back)}</div>
           ${current.scenarios ? `<div class="scen"><b>Commonly used in:</b> ${esc(current.scenarios)}</div>` : ""}
           <div class="grade">
             <button data-g="0">Again</button>
             <button data-g="3">Hard</button>
             <button class="primary" data-g="4">Good</button>
             <button data-g="5">Easy</button>
           </div>`
        : `<div class="grade"><button class="primary" id="show">Show answer</button></div>`
    }`;

  document.getElementById("show")?.addEventListener("click", reveal);
  stage.querySelectorAll("[data-g]").forEach((b) =>
    b.addEventListener("click", () => grade(Number(b.dataset.g))),
  );
}

function reveal() {
  revealed = true;
  render();
}

async function grade(g) {
  if (!current) return;
  await updateCard(schedule(current, g));
  load();
}

document.addEventListener("keydown", (e) => {
  if (!current) return;
  if (!revealed && (e.code === "Space" || e.code === "Enter")) {
    e.preventDefault();
    reveal();
  } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
    grade([0, 3, 4, 5][Number(e.key) - 1]);
  }
});

load();
