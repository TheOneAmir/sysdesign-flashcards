// SM-2 spaced repetition.
// grade: 0 = Again, 3 = Hard, 4 = Good, 5 = Easy
export function schedule(card, grade) {
  const now = Date.now();
  let ef = card.easeFactor ?? 2.5;
  let reps = card.reps ?? 0;
  let interval = card.interval ?? 0; // days

  if (grade < 3) {
    reps = 0;
    interval = 0; // relearn in ~10 minutes
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ef);
    if (grade === 3) interval = Math.max(1, Math.round(interval * 0.7));
  }

  ef = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (ef < 1.3) ef = 1.3;

  const nextReview = interval === 0 ? now + 10 * 60 * 1000 : now + interval * 86400000;

  return { ...card, easeFactor: ef, reps, interval, lastReviewed: now, nextReview };
}

export function isDue(card, now = Date.now()) {
  return (card.nextReview ?? 0) <= now;
}

export function pickDue(cards, now = Date.now()) {
  const due = cards.filter((c) => isDue(c, now));
  const pool = due.length ? due : cards;
  if (!pool.length) return null;
  pool.sort((a, b) => (a.nextReview ?? 0) - (b.nextReview ?? 0));
  const head = pool.slice(0, Math.min(5, pool.length));
  return head[Math.floor(Math.random() * head.length)];
}
