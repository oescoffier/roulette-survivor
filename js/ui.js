window.RS = window.RS || {};

RS.UI = (function () {
  const screens = ['menu', 'round', 'shop', 'gameover'];

  function showScreen(name) {
    screens.forEach((s) => {
      const el = document.getElementById(`screen-${s}`);
      if (el) el.style.display = s === name ? '' : 'none';
    });
  }

  function fmt(n) {
    return Math.round(n).toString();
  }

  return { showScreen, fmt };
})();
