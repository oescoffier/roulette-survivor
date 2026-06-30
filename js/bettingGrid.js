window.RS = window.RS || {};

RS.GRID = (function () {
  // number (1-36) -> { row: 1|2|3, col: 1..12 }
  const pos = {};
  const numAt = {}; // "r,c" -> number
  for (let c = 1; c <= 12; c++) {
    const bottom = 3 * c - 2, mid = 3 * c - 1, top = 3 * c;
    pos[bottom] = { row: 3, col: c };
    pos[mid] = { row: 2, col: c };
    pos[top] = { row: 1, col: c };
    numAt[`3,${c}`] = bottom;
    numAt[`2,${c}`] = mid;
    numAt[`1,${c}`] = top;
  }

  function isRed(n) { return RS.WHEEL.RED_NUMBERS.has(n); }

  // Shared with roundScreen.js so a bet placed on a zone and the DOM element
  // that should display its chip stack always agree on the same identifier.
  function betKey(type, numbers, label) {
    return `${type}:${(numbers && numbers.length) ? numbers.join(',') : label}`;
  }

  function makeCell(label, cls, gridRow, gridCol, span) {
    const el = document.createElement('div');
    el.className = `cell ${cls}`;
    el.textContent = label;
    el.style.gridRow = gridRow;
    el.style.gridColumn = span ? `${gridCol} / span ${span}` : gridCol;
    return el;
  }

  // Overlay hit-zones are positioned with measured pixel rects (not CSS Grid
  // placement) because absolutely-positioned grid items don't reliably use
  // their grid area as containing block across browsers - percentages ended
  // up resolving against the whole grid, letting zones bleed into unrelated
  // rows (e.g. blocking the outside bets row).
  function makeOverlay(x, y, w, h) {
    const el = document.createElement('div');
    el.className = 'hit-zone';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    return el;
  }

  function render(containerEl, onCellClick) {
    containerEl.innerHTML = '';

    const fire = (type, numbers, label) => onCellClick({ type, numbers, label });

    // Zero
    const zero = makeCell('0', 'zero green', '1 / span 3', 1);
    zero.dataset.number = '0';
    zero.dataset.betKey = betKey('straight', [0], '0');
    zero.addEventListener('click', () => fire('straight', [0], '0'));
    containerEl.appendChild(zero);

    // Number cells (1-36)
    for (let n = 1; n <= 36; n++) {
      const p = pos[n];
      const cell = makeCell(String(n), isRed(n) ? 'red' : '', p.row, p.col + 1);
      cell.dataset.number = String(n);
      cell.dataset.betKey = betKey('straight', [n], String(n));
      cell.addEventListener('click', () => fire('straight', [n], String(n)));
      containerEl.appendChild(cell);
    }

    // Measure rendered cell rects (relative to the container) so overlay
    // hit-zones for split/street/corner/sixline can be placed in pixels.
    const containerRect = containerEl.getBoundingClientRect();
    const rectOf = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - containerRect.left, y: r.top - containerRect.top, w: r.width, h: r.height };
    };
    const numRect = {};
    for (let n = 1; n <= 36; n++) {
      numRect[n] = rectOf(containerEl.querySelector(`.cell[data-number="${n}"]`));
    }
    const zeroRect = rectOf(zero);
    const SPLIT_SIZE = 16;
    const CORNER_SIZE = 20;
    const EDGE_SIZE = 16;

    // Split zones: zero <-> column1 numbers
    for (let r = 1; r <= 3; r++) {
      const n = numAt[`${r},1`];
      const rect = numRect[n];
      const edgeX = zeroRect.x + zeroRect.w;
      const zone = makeOverlay(edgeX - SPLIT_SIZE / 2, rect.y, SPLIT_SIZE, rect.h);
      zone.dataset.betKey = betKey('split', [0, n], `0/${n}`);
      zone.addEventListener('click', () => fire('split', [0, n], `0/${n}`));
      containerEl.appendChild(zone);
    }

    // Split zones: horizontal neighbours within a row (centred on the shared edge)
    for (let r = 1; r <= 3; r++) {
      for (let c = 1; c <= 11; c++) {
        const n1 = numAt[`${r},${c}`], n2 = numAt[`${r},${c + 1}`];
        const rect = numRect[n1];
        const edgeX = rect.x + rect.w;
        const zone = makeOverlay(edgeX - SPLIT_SIZE / 2, rect.y, SPLIT_SIZE, rect.h);
        zone.dataset.betKey = betKey('split', [n1, n2], `${n1}/${n2}`);
        zone.addEventListener('click', () => fire('split', [n1, n2], `${n1}/${n2}`));
        containerEl.appendChild(zone);
      }
    }

    // Split zones: vertical neighbours within a column (centred on the shared edge)
    for (let c = 1; c <= 12; c++) {
      for (let r = 1; r <= 2; r++) {
        const n1 = numAt[`${r},${c}`], n2 = numAt[`${r + 1},${c}`];
        const rect = numRect[n1];
        const edgeY = rect.y + rect.h;
        const zone = makeOverlay(rect.x, edgeY - SPLIT_SIZE / 2, rect.w, SPLIT_SIZE);
        zone.dataset.betKey = betKey('split', [n1, n2], `${n1}/${n2}`);
        zone.addEventListener('click', () => fire('split', [n1, n2], `${n1}/${n2}`));
        containerEl.appendChild(zone);
      }
    }

    // Corner zones (4 numbers meeting at an internal vertex, centred on that vertex)
    for (let r = 1; r <= 2; r++) {
      for (let c = 1; c <= 11; c++) {
        const a = numAt[`${r},${c}`], b = numAt[`${r},${c + 1}`];
        const d = numAt[`${r + 1},${c}`], e = numAt[`${r + 1},${c + 1}`];
        const rect = numRect[a];
        const vertexX = rect.x + rect.w;
        const vertexY = rect.y + rect.h;
        const zone = makeOverlay(vertexX - CORNER_SIZE / 2, vertexY - CORNER_SIZE / 2, CORNER_SIZE, CORNER_SIZE);
        zone.dataset.betKey = betKey('corner', [a, b, d, e], `${a}/${b}/${d}/${e}`);
        zone.addEventListener('click', () => fire('corner', [a, b, d, e], `${a}/${b}/${d}/${e}`));
        containerEl.appendChild(zone);
      }
    }

    // Street zones (bottom edge of each column's 3-number group)
    for (let c = 1; c <= 12; c++) {
      const a = numAt[`1,${c}`], b = numAt[`2,${c}`], d = numAt[`3,${c}`];
      const rect = numRect[d];
      const edgeY = rect.y + rect.h;
      const zone = makeOverlay(rect.x + rect.w * 0.15, edgeY - EDGE_SIZE / 2, rect.w * 0.7, EDGE_SIZE);
      zone.dataset.betKey = betKey('street', [a, b, d], `Rue ${d}-${a}`);
      zone.addEventListener('click', () => fire('street', [a, b, d], `Rue ${d}-${a}`));
      containerEl.appendChild(zone);
    }

    // Six line zones (bottom edge, centred on the boundary between two columns)
    for (let c = 1; c <= 11; c++) {
      const nums = [
        numAt[`1,${c}`], numAt[`2,${c}`], numAt[`3,${c}`],
        numAt[`1,${c + 1}`], numAt[`2,${c + 1}`], numAt[`3,${c + 1}`]
      ];
      const rect = numRect[nums[2]];
      const edgeX = rect.x + rect.w;
      const edgeY = rect.y + rect.h;
      const zone = makeOverlay(edgeX - CORNER_SIZE / 2, edgeY - EDGE_SIZE / 2, CORNER_SIZE, EDGE_SIZE);
      zone.dataset.betKey = betKey('sixline', nums, `Sixain ${nums[2]}-${nums[5]}`);
      zone.addEventListener('click', () => fire('sixline', nums, `Sixain ${nums[2]}-${nums[5]}`));
      containerEl.appendChild(zone);
    }

    // Dozens
    const dozens = [
      { label: '1er 12', range: [1, 12], col: 2 },
      { label: '2e 12', range: [13, 24], col: 6 },
      { label: '3e 12', range: [25, 36], col: 10 }
    ];
    dozens.forEach((d) => {
      const cell = makeCell(d.label, 'outside', 4, d.col, 4);
      cell.dataset.betKey = betKey('dozen', d.range, d.label);
      cell.addEventListener('click', () => fire('dozen', d.range, d.label));
      containerEl.appendChild(cell);
    });

    // Columns (2 to 1)
    for (let r = 1; r <= 3; r++) {
      const nums = [];
      for (let c = 1; c <= 12; c++) nums.push(numAt[`${r},${c}`]);
      const cell = makeCell('2 to 1', 'outside', r, 14);
      cell.dataset.betKey = betKey('column', nums, `Colonne ${r}`);
      cell.addEventListener('click', () => fire('column', nums, `Colonne ${r}`));
      containerEl.appendChild(cell);
    }

    // Even-money outside bets
    const outside = [
      { label: '1-18', type: 'low', col: 2 },
      { label: 'PAIR', type: 'even', col: 4 },
      { label: 'ROUGE', type: 'red', col: 6 },
      { label: 'NOIR', type: 'black', col: 8 },
      { label: 'IMPAIR', type: 'odd', col: 10 },
      { label: '19-36', type: 'high', col: 12 }
    ];
    outside.forEach((o) => {
      const cell = makeCell(o.label, `outside ${o.type === 'red' ? 'red' : ''}`, 5, o.col, 2);
      cell.dataset.betKey = betKey(o.type, [], o.label);
      cell.addEventListener('click', () => fire(o.type, [], o.label));
      containerEl.appendChild(cell);
    });
  }

  // Builds a small stacked-chips visual (layers + amount label) centred on
  // whatever cell/hit-zone carries this bet's data-bet-key.
  function updateMarkers(containerEl, bets) {
    containerEl.querySelectorAll('.chip-stack').forEach((m) => m.remove());
    bets.forEach((bet) => {
      const targetEl = containerEl.querySelector(`[data-bet-key="${bet.key}"]`);
      if (!targetEl) return;

      const stack = document.createElement('div');
      stack.className = 'chip-stack';

      // No cap on purpose: a big bet should pile up into a huge, absurd, hard
      // to read tower of chips - 100 jetons = 2 layers, scaling unbounded.
      const layerCount = Math.max(1, Math.ceil(bet.amount / 50));
      for (let i = 0; i < layerCount; i++) {
        const layer = document.createElement('div');
        layer.className = 'chip-layer' + (i % 2 === 1 ? ' alt' : '');
        layer.style.bottom = `${i * 5}px`;
        stack.appendChild(layer);
      }

      const amount = document.createElement('div');
      amount.className = 'chip-amount';
      amount.textContent = bet.amount;
      amount.style.bottom = `${layerCount * 5 + 8}px`;
      stack.appendChild(amount);

      targetEl.appendChild(stack);
    });
  }

  function highlightResult(containerEl, winningNumber) {
    containerEl.querySelectorAll('.cell.win').forEach((c) => c.classList.remove('win'));
    const cellEl = containerEl.querySelector(`.cell[data-number="${winningNumber}"]`);
    if (cellEl) cellEl.classList.add('win');
  }

  return { pos, numAt, isRed, betKey, render, updateMarkers, highlightResult };
})();
