window.RS = window.RS || {};

RS.WHEEL = (function () {
  let forcedIndex = null;

  const BASE_ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
    24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ];
  const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

  function colorOf(number) {
    if (number === 0 || number === '00') return 'green';
    return RED_NUMBERS.has(number) ? 'red' : 'black';
  }

  // Fresh, un-modded layout: array of {number, color}
  function buildLayout() {
    return BASE_ORDER.map((n) => ({ number: n, color: colorOf(n) }));
  }

  function spin(layout) {
    let index;
    if (forcedIndex !== null && forcedIndex < layout.length) {
      index = forcedIndex;
      forcedIndex = null;
    } else {
      index = Math.floor(Math.random() * layout.length);
    }
    return { index, pocket: layout[index] };
  }

  function forceNextIndex(index) {
    forcedIndex = index;
  }

  function renderDisc(discEl, layout) {
    discEl.innerHTML = '';
    const seg = 360 / layout.length;
    const colorVar = { red: 'var(--red)', black: 'var(--black-num)', green: 'var(--felt)' };

    const stops = layout.map((p, i) => {
      const from = (i * seg).toFixed(3);
      const to = ((i + 1) * seg).toFixed(3);
      return `${colorVar[p.color]} ${from}deg ${to}deg`;
    }).join(', ');
    discEl.style.background = `conic-gradient(${stops})`;

    const R = discEl.clientWidth ? discEl.clientWidth / 2 : 140;
    layout.forEach((p, i) => {
      const center = i * seg + seg / 2;
      const label = document.createElement('div');
      label.textContent = p.number;
      label.style.position = 'absolute';
      label.style.left = '50%';
      label.style.top = '50%';
      label.style.fontSize = '.6rem';
      label.style.fontFamily = "'Space Mono', monospace";
      label.style.color = '#fff';
      label.style.transformOrigin = '0 0';
      label.style.transform = `rotate(${center}deg) translate(-50%, ${-(R - 16)}px)`;
      discEl.appendChild(label);
    });

    if (!discEl._rotation) discEl._rotation = 0;
    discEl.style.transform = `rotate(${discEl._rotation}deg)`;
  }

  function animateSpin(discEl, ballEl, layout, resultIndex, onDone) {
    const seg = 360 / layout.length;
    const centerAngle = resultIndex * seg + seg / 2;

    discEl._rotation = discEl._rotation || 0;
    const currentMod = ((discEl._rotation % 360) + 360) % 360;
    const target = 360 - centerAngle;
    let delta = ((target - currentMod) % 360 + 360) % 360;
    const fullTurns = 6;
    discEl._rotation += fullTurns * 360 + delta;

    if (!ballEl._rotation) ballEl._rotation = 0;
    ballEl.style.transformOrigin = '6px 134px';
    const ballTurns = 9;
    const ballCurrentMod = ((ballEl._rotation % 360) + 360) % 360;
    let ballDelta = ((0 - ballCurrentMod) % 360 + 360) % 360;
    ballEl._rotation -= ballTurns * 360 + ballDelta;

    discEl.style.transition = 'transform 4s cubic-bezier(.12,.67,.2,1)';
    ballEl.style.transition = 'transform 4s cubic-bezier(.12,.67,.2,1)';
    discEl.style.transform = `rotate(${discEl._rotation}deg)`;
    ballEl.style.transform = `rotate(${ballEl._rotation}deg)`;

    setTimeout(() => {
      if (onDone) onDone(layout[resultIndex]);
    }, 4050);
  }

  return { BASE_ORDER, RED_NUMBERS, colorOf, buildLayout, spin, renderDisc, animateSpin, forceNextIndex };
})();
