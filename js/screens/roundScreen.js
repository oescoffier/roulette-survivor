window.RS = window.RS || {};

RS.ROUND_SCREEN = (function () {
  let selectedChip = 1;
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
      ballsLayer: document.getElementById('wheel-balls-layer'),
      result: document.getElementById('wheel-result'),
      chipSlider: document.getElementById('chip-slider'),
      chipSliderValue: document.getElementById('chip-slider-value'),
      btnSpin: document.getElementById('btn-spin'),
      btnClear: document.getElementById('btn-clear-bets'),
      log: document.getElementById('spin-log'),
      activeBalls: document.getElementById('active-balls'),
      activeGridMods: document.getElementById('active-grid-mods'),
      activeWheelMods: document.getElementById('active-wheel-mods'),
      eventPanel: document.getElementById('round-event-panel'),
      eventTag: document.getElementById('round-event-tag'),
      eventDesc: document.getElementById('round-event-desc')
    };
  }

  function updateChipSlider() {
    const s = RS.state;
    const max = Math.max(1, Math.floor(s.chips));
    els.chipSlider.min = 1;
    els.chipSlider.max = max;
    els.chipSlider.disabled = s.chips < 1;
    if (selectedChip > max) selectedChip = max;
    if (selectedChip < 1) selectedChip = 1;
    els.chipSlider.value = selectedChip;
    els.chipSliderValue.textContent = selectedChip;
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
    updateChipSlider();
  }

  // Animate the chip counter when chips change
  function pulseChips(gained) {
    const cl = els.chips.classList;
    cl.remove('chip-pop-win', 'chip-pop-lose');
    void els.chips.offsetWidth;
    cl.add(gained > 0 ? 'chip-pop-win' : 'chip-pop-lose');
  }

  // Spawn a "+XXX" floating label above a bet zone
  function spawnFloat(bet, payout) {
    const targetEl = els.grid.querySelector(`[data-bet-key="${bet.key}"]`);
    if (!targetEl) return;
    const gRect = els.grid.getBoundingClientRect();
    const tRect = targetEl.getBoundingClientRect();
    const floater = document.createElement('div');
    floater.className = 'float-win';
    floater.textContent = `+${RS.UI.fmt(payout)}`;
    floater.style.left = `${tRect.left - gRect.left + tRect.width / 2}px`;
    floater.style.top = `${tRect.top - gRect.top - 4}px`;
    els.grid.appendChild(floater);
    setTimeout(() => floater.remove(), 1300);
  }

  function renderEvent() {
    const evt = RS.state.currentEvent;
    if (!evt) { els.eventPanel.style.display = 'none'; return; }
    const def = RS.EVENTS.byId(evt.id);
    if (!def) { els.eventPanel.style.display = 'none'; return; }
    els.eventPanel.style.display = '';
    els.eventPanel.className = 'round-event ' +
      (def.positive === true ? 'positive' : def.positive === false ? 'negative' : 'neutral');
    els.eventTag.textContent = def.name;
    els.eventDesc.textContent = RS.EVENTS.getDescription(evt);
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
    els.chipSlider.disabled = !enabled || RS.state.chips < 1;
    els.btnClear.disabled = !enabled;
    els.grid.style.pointerEvents = enabled ? '' : 'none';
    els.grid.style.opacity = enabled ? '1' : '.55';
  }

  function placeBet(betInfo) {
    const s = RS.state;
    if (s.spinsRemaining <= 0) return;
    if (s.chips < selectedChip) return;
    const key = RS.GRID.betKey(betInfo.type, betInfo.numbers, betInfo.label);
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

    const { index: primaryIndex } = RS.WHEEL.spin(s.wheelLayout);
    const extraCount = RS.SPIN_RESOLVER.extraBallCount(s);
    const extraIndices = [];
    for (let i = 0; i < extraCount; i++) extraIndices.push(RS.WHEEL.spin(s.wheelLayout).index);

    // Fog event: hide wheel until ball stops
    const isFog = s.currentEvent && s.currentEvent.id === 'fog';
    if (isFog) {
      els.disc.classList.add('fogged');
      els.ballsLayer.classList.add('fogged');
      els.result.textContent = '?';
      els.result.style.color = 'var(--muted)';
    }

    RS.WHEEL.animateSpin(els.disc, els.ballsLayer, s.wheelLayout, primaryIndex, extraIndices, () => {
      if (isFog) {
        els.disc.classList.remove('fogged');
        els.ballsLayer.classList.remove('fogged');
        els.result.textContent = '';
      }
      onSpinResolved(primaryIndex, extraIndices);
    });
  }

  function onSpinResolved(primaryIndex, extraIndices) {
    const s = RS.state;
    const chipsBefore = s.chips;
    const result = RS.SPIN_RESOLVER.resolve(s, primaryIndex, extraIndices);
    const pocket = result.primaryPocket;
    const chipsGained = s.chips - chipsBefore;

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
        spawnFloat(br.bet, br.payout);
      } else {
        logLine(`Perdu — ${br.bet.label} (-${br.bet.amount})`, 'lose');
      }
    });
    if (result.wheelBonus) logLine(`Bonus roue : +${result.wheelBonus} jetons`, 'win');
    if (result.zeroBonus) logLine(`Bouclier Zéro : +${result.zeroBonus} jetons récupérés`, 'win');
    if (result.eventBonus) logLine(`Évènement — Zéro Béni : +${result.eventBonus} jetons !`, 'win');
    if (result.refund) logLine(`Bille fantôme : remboursement de ${result.refund} jetons`, 'win');
    result.removedBalls.forEach((name) => logLine(`${name} s'est brisée et a disparu.`, 'lose'));

    if (chipsGained !== 0) pulseChips(chipsGained);

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
    selectedChip = 1;

    RS.GRID.render(els.grid, placeBet);
    RS.WHEEL.renderDisc(els.disc, RS.state.wheelLayout);
    els.result.textContent = '';
    els.log.innerHTML = '';

    els.chipSlider.oninput = () => {
      selectedChip = Number(els.chipSlider.value);
      els.chipSliderValue.textContent = selectedChip;
    };

    els.btnClear.onclick = clearBets;
    resetSpinButton();
    setBettingEnabled(true);

    renderEvent();
    renderActiveItems();
    updateTopbar();
  }

  return { enter };
})();
