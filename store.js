import { SEED_CARDS, SEED_SUBJECT } from "./seed.js";

const DEFAULTS = {
  settings: { newTabEnabled: true, aggressiveMode: false, intervalMinutes: 45 },
  activeSubjectId: null,
  subjects: [],
  cards: [],
};

function uid() {
  return crypto.randomUUID();
}

export function newCard(subjectId, { front, back, scenarios = "", tags = [] }) {
  return {
    id: uid(),
    subjectId,
    front,
    back,
    scenarios,
    tags,
    easeFactor: 2.5,
    reps: 0,
    interval: 0,
    lastReviewed: null,
    nextReview: Date.now(),
  };
}

export async function getState() {
  const state = await chrome.storage.local.get(DEFAULTS);
  return { ...DEFAULTS, ...state };
}

export async function setState(patch) {
  await chrome.storage.local.set(patch);
}

export async function ensureSeeded() {
  const state = await getState();
  if (state.subjects.length) return state;
  const subject = { id: uid(), name: SEED_SUBJECT, createdAt: Date.now() };
  const cards = SEED_CARDS.map((c) => newCard(subject.id, c));
  const next = { subjects: [subject], cards, activeSubjectId: subject.id };
  await setState(next);
  return { ...state, ...next };
}

export async function addSubject(name) {
  const state = await getState();
  const subject = { id: uid(), name, createdAt: Date.now() };
  await setState({ subjects: [...state.subjects, subject], activeSubjectId: subject.id });
  return subject;
}

export async function deleteSubject(subjectId) {
  const state = await getState();
  const subjects = state.subjects.filter((s) => s.id !== subjectId);
  await setState({
    subjects,
    cards: state.cards.filter((c) => c.subjectId !== subjectId),
    activeSubjectId: state.activeSubjectId === subjectId ? (subjects[0]?.id ?? null) : state.activeSubjectId,
  });
}

export async function addCards(subjectId, items) {
  const state = await getState();
  const cards = items.map((i) => newCard(subjectId, i));
  await setState({ cards: [...state.cards, ...cards] });
  return cards;
}

export async function deleteCard(cardId) {
  const state = await getState();
  await setState({ cards: state.cards.filter((c) => c.id !== cardId) });
}

export async function updateCard(card) {
  const state = await getState();
  await setState({ cards: state.cards.map((c) => (c.id === card.id ? card : c)) });
}

// Parses "front, back" CSV rows or "front | back" / "front :: back" lines.
export function parseBulk(text) {
  const out = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    let parts;
    if (line.includes("::")) parts = line.split("::");
    else if (line.includes("|")) parts = line.split("|");
    else parts = splitCsv(line);
    if (parts.length < 2) continue;
    out.push({
      front: parts[0].trim().replace(/^"|"$/g, ""),
      back: parts[1].trim().replace(/^"|"$/g, ""),
      scenarios: (parts[2] ?? "").trim().replace(/^"|"$/g, ""),
      tags: (parts[3] ?? "")
        .split(";")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }
  return out;
}

function splitCsv(line) {
  const res = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      res.push(cur);
      cur = "";
    } else cur += ch;
  }
  res.push(cur);
  return res;
}
