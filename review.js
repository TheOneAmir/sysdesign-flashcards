import { ensureSeeded, getState, updateCard } from "./store.js";
import { isDue, pickDue, schedule } from "./srs.js";

const stage = document.getElementById("stage");
const subjectEl = document.getElementById("subject");
const statsEl = document.getElementById("stats");
document.getElementById("manage").addEventListener("click", () => chrome.runtime.openOptionsPage());

let current = null;

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

  current = pickDue(cards);
  render();
}

function render() {
  if (!current) {
    stage.innerHTML = `<div class="card-front">All caught up.</div><p class="muted" style="margin-top:10px">Add cards from the deck manager to keep the drip going.</p>`;
    return;
  }
  stage.innerHTML = `
    <div class="card-front">${esc(current.front)}</div>
    <div class="card-back">${esc(current.back)}</div>
    ${current.scenarios ? `<div class="scen"><b>Commonly used in:</b> ${esc(current.scenarios)}</div>` : ""}
    <div class="grade">
      <button data-g="0">Again</button>
      <button data-g="3">Hard</button>
      <button class="primary" data-g="4">Good</button>
      <button data-g="5">Easy</button>
      <button id="next">Next card</button>
    </div>`;

  stage.querySelectorAll("[data-g]").forEach((b) =>
    b.addEventListener("click", () => grade(Number(b.dataset.g))),
  );
  document.getElementById("next")?.addEventListener("click", () => load());
}

async function grade(g) {
  if (!current) return;
  await updateCard(schedule(current, g));
  load();
}

document.addEventListener("keydown", (e) => {
  if (!current) return;
  if (["1", "2", "3", "4"].includes(e.key)) {
    grade([0, 3, 4, 5][Number(e.key) - 1]);
  }
});

load();
