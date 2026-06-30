window.RS = window.RS || {};

RS.ROUND_SCREEN = (function () {
  let selectedChip = RS.CONFIG ? RS.CONFIG.chipDenominations[0] : 1;
  let els = null;

  function cacheEls() {
    els = {
      round: document.getElementById('stat-round'),
      threshold: document.getElementById('stat-threshold'),
      chips: document.getElementById('stat-chips'),
      spins: document.getElementById('stat-spins'),
      money: document.getElementById('stat-money'),
      wagered: document.getElementById('stat-wagered'),
      grid: document.getElementById('betting-grid'),
      discWrap: document.getElementById('wheel-wrap'),
      disc: document.getElementById('wheel-disc'),
      ball: document.getElementById('wheel-ball'),
      result: document.getElementById('wheel-result'),
      chipRack: document.getElementById('chip-rack'),
      btnSpin: document.getElementById('btn-spin'),
      btnClear: document.getElementById('btn-clear-bets'),
      log: document.getElementById('spin-log'),
      activeBalls: document.getElementById('active-balls'),
      activeGridMods: document.getElementById('active-grid-mods'),
      activeWheelMods: document.getElementById('active-wheel-mods')
    };
  }

  function updateTopbar() {
    const s = RS.state;
    els.round.textContent = s.round;
    els.threshold.textContent = s.threshold;
    els.chips.textContent = RS.UI.fmt(s.chips);
    els.spins.textContent = s.spinsRemaining;
    els.money.textContent = RS.UI.fmt(s.money);
    const wagered = s.currentBets.reduce((sum, b) => sum + b.amount, 0);
    els.wagered.textContent = wagered;
  }

  function renderActiveItems() {
    els.activeBalls.innerHTML = '';
    RS.state.ownedBalls.forEach((inst) => {
      const def = RS.BALLS.byId(inst.id);
      if (!def) return;
      const b = document.createElement('span');
      b.className = 'item-badge';
      b.textContent = def.name + (inst.usesLeft !== undefined ? ` (${inst.usesLeft})` : '');
      b.title = def.description;
      els.activeBalls.appendChild(b);
    });

    els.activeGridMods.innerHTML = '';
    RS.state.ownedGridMods.forEach((inst) => {
      const def = RS.GRID_MODS.byId(inst.id);
      if (!def) return;
      const b = document.createElement('span');
      b.className = 'item-badge';
      b.textContent = def.name;
      b.title = inst.params && def.formatDescription ? def.formatDescription(inst.params) : def.description;
      els.activeGridMods.appendChild(b);
    });

    els.activeWheelMods.innerHTML = '';
    RS.state.ownedWheelMods.forEach((inst) => {
      const def = RS.WHEEL_MODS.byId(inst.id);
      if (!def) return;
      const b = document.createElement('span');
      b.className = 'item-badge';
      b.textContent = def.name;
      b.title = inst.params && def.formatDescription ? def.formatDescription(inst.params) : def.description;
      els.activeWheelMods.appendChild(b);
    });
  }

  function logLine(text, kind) {
    RS.state.addLog(text, kind);
    const p = document.createElement('p');
    p.textContent = text;
    if (kind) p.classList.add(kind === 'win' ? 'win-line' : 'lose-line');
    els.log.appendChild(p);
    els.log.scrollTop = els.log.scrollHeight;
  }

  function setBettingEnabled(enabled) {
    els.chipRack.querySelectorAll('.chip').forEach((c) => { c.disabled = !enabled; });
    els.btnClear.disabled = !enabled;
    els.grid.style.pointerEvents = enabled ? '' : 'none';
    els.grid.style.opacity = enabled ? '1' : '.55';
  }

  function placeBet(betInfo) {
    const s = RS.state;
    if (s.spinsRemaining <= 0) return;
    if (s.chips < selectedChip) return;
    const key = `${betInfo.type}:${betInfo.numbers.join(',') || betInfo.label}`;
    let bet = s.currentBets.find((b) => b.key === key);
    if (bet) {
      bet.amount += selectedChip;
    } else {
      bet = { key, type: betInfo.type, numbers: betInfo.numbers, amount: selectedChip, label: betInfo.label };
      s.currentBets.push(bet);
    }
    s.chips -= selectedChip;
    RS.GRID.updateMarkers(els.grid, s.currentBets);
    updateTopbar();
  }

  function clearBets() {
    const s = RS.state;
    const refund = s.currentBets.reduce((sum, b) => sum + b.amount, 0);
    s.chips += refund;
    s.currentBets = [];
    RS.GRID.updateMarkers(els.grid, s.currentBets);
    updateTopbar();
  }

  function resetSpinButton() {
    els.btnSpin.textContent = 'LANCER LA BILLE';
    els.btnSpin.disabled = false;
    els.btnSpin.onclick = onSpinClick;
  }

  function onSpinClick() {
    const s = RS.state;
    els.btnSpin.disabled = true;
    setBettingEnabled(false);
    els.result.textContent = '';
    RS.GRID.highlightResult(els.grid, -1);

    const { index } = RS.WHEEL.spin(s.wheelLayout);
    RS.WHEEL.animateSpin(els.disc, els.ball, s.wheelLayout, index, () => onSpinResolved(index));
  }

  function onSpinResolved(index) {
    const s = RS.state;
    const result = RS.SPIN_RESOLVER.resolve(s, index);
    const pocket = result.primaryPocket;

    els.result.textContent = pocket.number;
    els.result.style.color = pocket.color === 'red' ? 'var(--red)' : (pocket.color === 'green' ? 'var(--felt)' : '#fff');
    RS.GRID.highlightResult(els.grid, pocket.number);

    logLine(`Résultat : ${pocket.number} (${pocket.color})`, '');
    if (result.extraResults.length) {
      logLine(`Billes bonus : ${result.extraResults.map((p) => p.number).join(', ')}`, '');
    }
    result.betResults.forEach((br) => {
      if (br.win) {
        logLine(`Gagné — ${br.bet.label} : +${RS.UI.fmt(br.payout)} jetons`, 'win');
      } else {
        logLine(`Perdu — ${br.bet.label} (-${br.bet.amount})`, 'lose');
      }
    });
    if (result.wheelBonus) logLine(`Bonus roue : +${result.wheelBonus} jetons`, 'win');
    if (result.refund) logLine(`Bille fantôme : remboursement de ${result.refund} jetons`, 'win');
    result.removedBalls.forEach((name) => logLine(`${name} s'est brisée et a disparu.`, 'lose'));

    renderActiveItems();
    updateTopbar();
    RS.GRID.updateMarkers(els.grid, s.currentBets);
    s.save();

    if (s.spinsRemaining > 0) {
      resetSpinButton();
      setBettingEnabled(true);
    } else {
      endRound();
    }
  }

  function endRound() {
    const s = RS.state;
    if (s.chips >= s.threshold) {
      const reward = RS.CONFIG.moneyReward(s.round, s.chips, s.threshold);
      s.money += reward;
      logLine(`Seuil atteint ! Manche réussie. +${reward}$`, 'win');
      s.pendingShop = true;
      s.save();
      els.btnSpin.textContent = 'ALLER À LA BOUTIQUE';
      els.btnSpin.disabled = false;
      els.btnSpin.onclick = () => {
        RS.SHOP_SCREEN.enter();
        RS.UI.showScreen('shop');
      };
    } else {
      logLine('Seuil non atteint. Partie terminée.', 'lose');
      s.clearSave();
      els.btnSpin.textContent = 'GAME OVER';
      els.btnSpin.disabled = false;
      els.btnSpin.onclick = () => {
        RS.GAME_OVER_SCREEN.enter();
        RS.UI.showScreen('gameover');
      };
    }
  }

  function enter() {
    if (!els) cacheEls();
    selectedChip = RS.CONFIG.chipDenominations[0];

    RS.GRID.render(els.grid, placeBet);
    RS.WHEEL.renderDisc(els.disc, RS.state.wheelLayout);
    els.result.textContent = '';
    els.log.innerHTML = '';

    els.chipRack.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle('selected', Number(c.dataset.value) === selectedChip);
      c.onclick = () => {
        selectedChip = Number(c.dataset.value);
        els.chipRack.querySelectorAll('.chip').forEach((x) => x.classList.remove('selected'));
        c.classList.add('selected');
      };
    });

    els.btnClear.onclick = clearBets;
    resetSpinButton();
    setBettingEnabled(true);

    renderActiveItems();
    updateTopbar();
  }

  return { enter };
})();
