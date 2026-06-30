window.RS = window.RS || {};

RS.MENU_SCREEN = (function () {
  function init() {
    const btnNew = document.getElementById('btn-new-game');
    const btnContinue = document.getElementById('btn-continue-game');

    btnContinue.style.display = RS.state.hasSave() ? '' : 'none';

    btnNew.addEventListener('click', () => {
      RS.state.clearSave();
      RS.state.newGame();
      RS.UI.showScreen('round');
      RS.ROUND_SCREEN.enter();
    });

    btnContinue.addEventListener('click', () => {
      RS.state.load();
      if (RS.state.pendingShop) {
        RS.UI.showScreen('shop');
        RS.SHOP_SCREEN.enter();
      } else {
        RS.UI.showScreen('round');
        RS.ROUND_SCREEN.enter();
      }
    });
  }

  return { init };
})();
