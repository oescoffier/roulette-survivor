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
    // Thin separator lines between pockets layered over the color wheel.
    const separators = `repeating-conic-gradient(rgba(244,244,244,.5) 0deg 0.4deg, transparent 0.4deg ${seg.toFixed(4)}deg)`;
    discEl.style.background = `${separators}, conic-gradient(${stops})`;

    const R = discEl.clientWidth ? discEl.clientWidth / 2 : 220;
    layout.forEach((p, i) => {
      const center = i * seg + seg / 2;
      const label = document.createElement('div');
      label.textContent = p.number;
      label.style.position = 'absolute';
      label.style.left = '50%';
      label.style.top = '50%';
      label.style.fontSize = '.72rem';
      label.style.fontFamily = "'Space Mono', monospace";
      label.style.color = '#fff';
      label.style.transformOrigin = '0 0';
      label.style.transform = `rotate(${center}deg) translate(-50%, ${-(R - 24)}px)`;
      discEl.appendChild(label);
    });

    if (!discEl._rotation) discEl._rotation = 0;
    discEl.style.transform = `rotate(${discEl._rotation}deg)`;
  }

  const BALL_SIZE = 14;
  const RIM_INSET = 12; // px the ball orbits inside the outer rim

  // Animates the wheel disc (purely decorative spin) plus one ball per result
  // index (primaryIndex first, then any extraIndices from multiball items).
  // Each ball orbits counter-clockwise - opposite to the disc's clockwise spin -
  // and lands exactly on its pocket's real position once the disc stops, instead
  // of every ball converging on a fixed pointer.
  const DISC_DURATION = 4.2; // seconds

  function animateSpin(discEl, ballsLayerEl, layout, primaryIndex, extraIndices, onDone) {
    const seg = 360 / layout.length;
    const R = discEl.clientWidth ? discEl.clientWidth / 2 : 220;

    discEl._rotation = discEl._rotation || 0;
    const discTurns = 5 + Math.random() * 2;
    discEl._rotation += discTurns * 360;
    const discFinalMod = ((discEl._rotation % 360) + 360) % 360;

    discEl.style.transition = `transform ${DISC_DURATION}s cubic-bezier(.12,.67,.2,1)`;
    discEl.style.transform = `rotate(${discEl._rotation}deg)`;

    ballsLayerEl.innerHTML = '';
    const allIndices = [primaryIndex].concat(extraIndices || []);
    // Every ball must settle at or after the disc does - its landing angle is
    // computed against the disc's FINAL resting orientation, so finishing
    // earlier would have it land where the pocket will be, not where it is yet.
    let maxDuration = DISC_DURATION;

    allIndices.forEach((idx, i) => {
      const ballEl = document.createElement('div');
      ballEl.className = 'wheel-ball' + (i === 0 ? '' : ' extra');
      ballEl.style.width = `${BALL_SIZE}px`;
      ballEl.style.height = `${BALL_SIZE}px`;
      ballEl.style.left = '50%';
      ballEl.style.top = `${RIM_INSET}px`;
      ballEl.style.marginLeft = `${-BALL_SIZE / 2}px`;
      ballEl.style.transformOrigin = `${BALL_SIZE / 2}px ${R - RIM_INSET}px`;
      ballsLayerEl.appendChild(ballEl);

      const pocketBaseAngle = idx * seg + seg / 2;
      const targetMod = (pocketBaseAngle + discFinalMod) % 360;

      // Counter-clockwise (negative rotation), several whole loops around the
      // rim before settling exactly on the pocket's final on-screen position.
      // `turns` MUST be an integer - a fractional loop count would add leftover
      // degrees on top of deltaToTarget and throw off the landing angle.
      const turns = 7 + i * 2 + Math.floor(Math.random() * 2);
      const deltaToTarget = ((360 - targetMod) % 360 + 360) % 360;
      const finalRotation = -(turns * 360 + deltaToTarget);

      const duration = DISC_DURATION + i * 0.35;
      maxDuration = Math.max(maxDuration, duration);

      ballEl.style.transition = `transform ${duration}s cubic-bezier(.1,.6,.15,1)`;
      // Force layout flush so the transition picks up from rotate(0), then animate.
      void ballEl.offsetWidth;
      ballEl.style.transform = `rotate(${finalRotation}deg)`;
    });

    setTimeout(() => {
      if (onDone) onDone();
    }, maxDuration * 1000 + 150);
  }

  return { BASE_ORDER, RED_NUMBERS, colorOf, buildLayout, spin, renderDisc, animateSpin, forceNextIndex };
})();
