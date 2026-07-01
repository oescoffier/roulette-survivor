window.RS = window.RS || {};

RS.SPIN_RESOLVER = {
  // How many extra independent balls the player's equipped balls add this spin.
  extraBallCount(state) {
    return state.ownedBalls.reduce((sum, inst) => {
      const def = RS.BALLS.byId(inst.id);
      return sum + (def && def.extraBalls ? def.extraBalls : 0);
    }, 0);
  },

  resolve(state, primaryIndex, extraIndices) {
    const layout = state.wheelLayout;
    const n = layout.length;
    const primaryPocket = layout[primaryIndex];
    extraIndices = extraIndices || [];

    const balls = state.ownedBalls
      .map((inst) => ({ inst, def: RS.BALLS.byId(inst.id) }))
      .filter((b) => b.def);

    // Build the set of hit pockets (primary + ball spread effects + extra balls)
    let hitIndices = [primaryIndex];
    const extraResults = extraIndices.map((idx) => layout[idx]);

    balls.forEach(({ def }) => {
      if (def.neighborSpread) {
        hitIndices.push((primaryIndex - 1 + n) % n, (primaryIndex + 1) % n);
      }
      if (def.wideSpread) {
        for (let d = 1; d <= def.wideSpread; d++) {
          hitIndices.push((primaryIndex - d + n) % n, (primaryIndex + d) % n);
        }
      }
      if (def.ricochet) {
        hitIndices.push((primaryIndex + Math.floor(n / 2)) % n);
      }
    });

    extraIndices.forEach((idx) => hitIndices.push(idx));
    hitIndices = Array.from(new Set(hitIndices));

    // Aggregate ball multipliers and flat bonuses
    const payoutMultiplier = balls.reduce(
      (m, { def }) => (def.payoutMultiplier ? m * def.payoutMultiplier : m), 1
    );
    const flatBonusPerWin = balls.reduce((s, { def }) => s + (def.flatBonusPerWin || 0), 0);

    const betResults = [];
    const totalWagered = state.currentBets.reduce((s, b) => s + b.amount, 0);

    state.currentBets.forEach((bet) => {
      let betWonAny = false;
      let betPayout = 0;
      hitIndices.forEach((idx) => {
        const pocket = layout[idx];
        const res = RS.PAYOUTS.resolveBet(bet, pocket, state.ownedGridMods);
        if (res.win) {
          betWonAny = true;
          let payout = res.payout;
          if (payoutMultiplier !== 1) {
            const winnings = payout - bet.amount;
            payout = bet.amount + winnings * payoutMultiplier;
          }
          payout += flatBonusPerWin;
          betPayout += payout;
        }
      });
      if (betWonAny) betPayout = Math.round(betPayout);
      betResults.push({ bet, win: betWonAny, payout: betPayout });
    });

    // --- Event effects on individual bets ---
    const evtDef = state.currentEvent ? RS.EVENTS.byId(state.currentEvent.id) : null;
    const evtParams = state.currentEvent ? state.currentEvent.params : null;

    if (evtDef) {
      betResults.forEach((br) => {
        if (!br.win) return;
        if (evtDef.id === 'fever') {
          const winnings = br.payout - br.bet.amount;
          br.payout = br.bet.amount + Math.round(winnings * 1.5);
        }
        if (evtDef.id === 'tax') {
          br.payout = Math.max(br.bet.amount, br.payout - 12);
        }
        if (evtDef.id === 'jackpot' && evtParams && br.bet.type === 'straight') {
          if (String(br.bet.numbers[0]) === String(evtParams.number) &&
              String(primaryPocket.number) === String(evtParams.number)) {
            br.payout += br.bet.amount * 35; // +35x more = 70:1 total
          }
        }
        if (evtDef.id === 'bounty' && evtParams && br.bet.type === 'straight') {
          if (String(br.bet.numbers[0]) === String(evtParams.number) &&
              String(primaryPocket.number) === String(evtParams.number)) {
            br.payout += 80;
          }
        }
      });
    }

    // Total payout from bets (recomputed after event modifications)
    let totalPayout = betResults.reduce((s, br) => s + (br.win ? br.payout : 0), 0);

    // --- Wheel mod onWin hooks (flat bonuses) ---
    let wheelBonus = 0;
    state.ownedWheelMods.forEach((mod) => {
      const def = RS.WHEEL_MODS.byId(mod.id);
      if (def && def.onWin) wheelBonus += def.onWin(primaryPocket, mod) || 0;
    });
    totalPayout += wheelBonus;

    // --- Grid mod onZero hooks ---
    let zeroBonus = 0;
    if (primaryPocket.number === 0 || primaryPocket.number === '00') {
      state.ownedGridMods.forEach((mod) => {
        const def = RS.GRID_MODS.byId(mod.id);
        if (def && def.onZero) zeroBonus += def.onZero(totalWagered, mod);
      });
    }
    totalPayout += zeroBonus;

    // --- Event global bonuses (e.g. lucky_zero) ---
    let eventBonus = 0;
    if (evtDef && evtDef.id === 'lucky_zero' && primaryPocket.number === 0) {
      eventBonus = 100;
    }
    totalPayout += eventBonus;

    // --- Refund (ghost ball) — only when no bets won ---
    let refund = 0;
    const anyBetWon = betResults.some((br) => br.win);
    if (!anyBetWon && totalWagered > 0) {
      balls.forEach(({ def }) => {
        if (def.lossRefundPct) refund += totalWagered * def.lossRefundPct;
      });
      refund = Math.round(refund);
    }

    state.chips = Math.round(state.chips + totalPayout + refund);

    // Consume maxUses balls
    const removedBalls = [];
    state.ownedBalls.forEach((inst) => {
      const def = RS.BALLS.byId(inst.id);
      if (def && def.maxUses && inst.usesLeft !== undefined) inst.usesLeft -= 1;
    });
    state.ownedBalls = state.ownedBalls.filter((inst) => {
      const def = RS.BALLS.byId(inst.id);
      if (def && def.maxUses && inst.usesLeft <= 0) {
        removedBalls.push(def.name);
        return false;
      }
      return true;
    });

    state.spinsRemaining -= 1;
    state.currentBets = [];

    return {
      primaryPocket, extraResults, betResults,
      totalPayout, refund, wheelBonus, zeroBonus, eventBonus,
      removedBalls, totalWagered
    };
  }
};
