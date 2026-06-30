window.RS = window.RS || {};

RS.GAME_OVER_SCREEN = (function () {
  function enter() {
    const statsEl = document.getElementById('gameover-stats');
    statsEl.textContent = `Manche atteinte : ${RS.state.round} — Argent final : ${RS.UI.fmt(RS.state.money)}$`;

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
