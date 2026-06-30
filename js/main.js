window.RS = window.RS || {};

RS.debug = {
  // Forces the next wheel spin to land on a specific number (0, 1-36, or '00').
  forceSpin(number) {
    const idx = RS.state.wheelLayout.findIndex((p) => String(p.number) === String(number));
    if (idx === -1) { console.warn('Numéro absent de la roue actuelle :', number); return; }
    RS.WHEEL.forceNextIndex(idx);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  RS.MENU_SCREEN.init();
  RS.UI.showScreen('menu');
});
