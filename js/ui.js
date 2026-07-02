window.RS = window.RS || {};

RS.UI = (function () {
  const screens = ['menu', 'round', 'shop', 'gameover'];

  function showScreen(name) {
    screens.forEach((s) => {
      const el = document.getElementById(`screen-${s}`);
      if (el) el.style.display = s === name ? '' : 'none';
    });
  }

  // Compact number display: 1 234 → "1 234", 12 345 → "12.3K", etc.
  function fmt(n) {
    n = Math.round(n);
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'G';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toString();
  }

  // --- Tooltip system ---
  // Usage: RS.UI.TOOLTIP.attach(element, () => 'text to show')
  const TOOLTIP = (function () {
    let el = null;

    function init() {
      el = document.createElement('div');
      el.className = 'game-tooltip';
      el.style.display = 'none';
      document.body.appendChild(el);
      document.addEventListener('mousemove', move);
    }

    function show(text) {
      el.innerHTML = text;
      el.style.display = '';
    }

    function hide() {
      if (el) el.style.display = 'none';
    }

    function move(e) {
      if (!el || el.style.display === 'none') return;
      const pad = 14;
      let x = e.clientX + pad;
      let y = e.clientY - el.offsetHeight - pad;
      if (x + el.offsetWidth > window.innerWidth - 8) x = e.clientX - el.offsetWidth - pad;
      if (y < 8) y = e.clientY + pad;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }

    // Attach hover tooltip to any element. getText() is called each time so it can be dynamic.
    function attach(element, getText) {
      element.addEventListener('mouseenter', () => show(getText()));
      element.addEventListener('mouseleave', hide);
    }

    return { init, attach };
  })();

  // Full-screen announcement banner (round cleared, boss, game over).
  // kind: '' | 'win' | 'lose' | 'boss'
  function showBanner(title, subtitle, kind) {
    const el = document.createElement('div');
    el.className = 'wave-banner' + (kind ? ' ' + kind : '');

    const t = document.createElement('div');
    t.className = 'wave-title';
    t.textContent = title;
    el.appendChild(t);

    if (subtitle) {
      const s = document.createElement('div');
      s.className = 'wave-sub';
      s.textContent = subtitle;
      el.appendChild(s);
    }

    document.body.appendChild(el);
    setTimeout(() => el.classList.add('out'), 1500);
    setTimeout(() => el.remove(), 2000);
  }

  return { showScreen, fmt, TOOLTIP, showBanner };
})();
