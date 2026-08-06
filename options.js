import {
  addCards,
  addSubject,
  deleteCard,
  deleteSubject,
  ensureSeeded,
  getState,
  parseBulk,
  setState,
} from "./store.js";

const $ = (id) => document.getElementById(id);
let currentFilter = "";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function matchesFilter(card, filter) {
  if (!filter) return true;
  const needle = filter.toLowerCase();
  const haystack = [card.front, card.back, card.scenarios, ...(card.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function renderTags(tags) {
  return tags?.length ? `<small>Tags: ${esc(tags.join(", "))}</small>` : "";
}

async function render() {
  await ensureSeeded();
  const state = await getState();

  $("subjectSelect").innerHTML = state.subjects
    .map((s) => `<option value="${s.id}" ${s.id === state.activeSubjectId ? "selected" : ""}>${esc(s.name)}</option>`)
    .join("");

  $("intervalMinutes").value = state.settings.intervalMinutes ?? 45;

  const cards = state.cards.filter((c) => c.subjectId === state.activeSubjectId);
  const filteredCards = currentFilter ? cards.filter((c) => matchesFilter(c, currentFilter)) : cards;
  $("count").textContent = `· ${filteredCards.length} / ${cards.length}`;
  $("cardList").innerHTML = filteredCards
    .map(
      (c) => `<div class="item"><div><b>${esc(c.front)}</b>
        <small>${esc(c.back.slice(0, 160))}${c.back.length > 160 ? "…" : ""}</small>
        <small>next: ${c.nextReview ? new Date(c.nextReview).toLocaleDateString() : "now"} · ease ${(c.easeFactor ?? 2.5).toFixed(2)}</small>
        ${renderTags(c.tags)}
      </div><button data-del="${c.id}">Delete</button></div>`,
    )
    .join("");

  $("cardList")
    .querySelectorAll("[data-del]")
    .forEach((b) => b.addEventListener("click", async () => (await deleteCard(b.dataset.del), render())));
}

$("subjectSelect").addEventListener("change", async (e) => {
  await setState({ activeSubjectId: e.target.value });
  render();
});

$("addSubject").addEventListener("click", async () => {
  const name = $("newSubject").value.trim();
  if (!name) return;
  await addSubject(name);
  $("newSubject").value = "";
  render();
});

$("deleteSubject").addEventListener("click", async () => {
  const id = $("subjectSelect").value;
  if (id && confirm("Delete this subject and all of its cards?")) {
    await deleteSubject(id);
    render();
  }
});

$("addCard").addEventListener("click", async () => {
  const front = $("front").value.trim();
  const back = $("back").value.trim();
  if (!front || !back) return;
  const state = await getState();
  await addCards(state.activeSubjectId, [
    {
      front,
      back,
      scenarios: $("scenarios").value.trim(),
      tags: $("tags").value.split(",").map((t) => t.trim()).filter(Boolean),
    },
  ]);
  ["front", "back", "scenarios", "tags"].forEach((id) => ($(id).value = ""));
  render();
});

$("importBulk").addEventListener("click", async () => {
  const items = parseBulk($("bulk").value);
  if (!items.length) {
    $("bulkMsg").textContent = "Nothing parsed — check the separators.";
    return;
  }
  const state = await getState();
  await addCards(state.activeSubjectId, items);
  $("bulk").value = "";
  $("bulkMsg").textContent = `Imported ${items.length} cards.`;
  render();
});

$("topicFilter").addEventListener("input", (e) => {
  currentFilter = e.target.value.trim();
  render();
});

$("clearFilter").addEventListener("click", () => {
  currentFilter = "";
  $("topicFilter").value = "";
  render();
});

$("intervalMinutes").addEventListener("change", async () => {
  await setState({
    settings: {
      intervalMinutes: Math.max(1, Number($("intervalMinutes").value) || 45),
    },
  });
});

render();
