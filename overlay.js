(() => {
  if (window.__dripOverlayInstalled) return;
  window.__dripOverlayInstalled = true;

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

  let root = null;
  const close = () => {
    root?.remove();
    root = null;
  };

  function render(card) {
    close();
    root = document.createElement("div");
    root.id = "drip-overlay-root";
    root.innerHTML = `
      <div class="drip-top"><span>Drip · flashcard</span><button class="drip-x" aria-label="Dismiss">✕</button></div>
      <div class="drip-front">${esc(card.front)}</div>
      <div class="drip-body" hidden>
        <div class="drip-back">${esc(card.back)}</div>
        ${card.scenarios ? `<div class="drip-scen"><b>Commonly used in:</b> ${esc(card.scenarios)}</div>` : ""}
      </div>
      <div class="drip-actions">
        <button class="drip-btn drip-primary drip-show">Show answer</button>
      </div>`;
    document.documentElement.appendChild(root);

    root.querySelector(".drip-x").addEventListener("click", close);
    root.querySelector(".drip-show").addEventListener("click", () => {
      root.querySelector(".drip-body").hidden = false;
      const actions = root.querySelector(".drip-actions");
      actions.innerHTML = "";
      [
        ["Again", 0],
        ["Hard", 3],
        ["Good", 4],
        ["Easy", 5],
      ].forEach(([label, grade]) => {
        const b = document.createElement("button");
        b.className = "drip-btn" + (grade === 4 ? " drip-primary" : "");
        b.textContent = label;
        b.addEventListener("click", () => {
          chrome.runtime.sendMessage({ type: "DRIP_GRADE", cardId: card.id, grade });
          close();
        });
        actions.appendChild(b);
      });
    });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "DRIP_SHOW") render(msg.card);
  });
})();
