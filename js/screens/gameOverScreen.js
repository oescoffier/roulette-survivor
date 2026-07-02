window.RS = window.RS || {};

RS.GAME_OVER_SCREEN = (function () {
  const BEST_KEY = 'rouletteSurvivorBest';

  function enter() {
    const statsEl = document.getElementById('gameover-stats');

    // Persistent best round across runs
    const prevBest = Number(localStorage.getItem(BEST_KEY) || 0);
    const isRecord = RS.state.round > prevBest;
    if (isRecord) localStorage.setItem(BEST_KEY, String(RS.state.round));
    const best = Math.max(prevBest, RS.state.round);

    statsEl.textContent =
      `Manche atteinte : ${RS.state.round} — Argent final : ${RS.UI.fmt(RS.state.money)}$` +
      (isRecord ? ' — NOUVEAU RECORD !' : ` — Record : manche ${best}`);

    const btnRestart = document.getElementById('btn-restart');
    btnRestart.onclick = () => {
      RS.state.clearSave();
      RS.state.newGame();
      RS.UI.showScreen('round');
      RS.ROUND_SCREEN.enter();
    };
  }

  return { enter };
})();
