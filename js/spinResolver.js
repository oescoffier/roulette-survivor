window.RS = window.RS || {};

RS.SPIN_RESOLVER = {
  // How many extra independent balls the player's equipped balls add this spin
  // (e.g. "Bille Jumelle"). Computed up front so the caller can roll + animate
  // their landing pockets before resolving bets against them.
  extraBallCount(state) {
    return state.ownedBalls.reduce((sum, inst) => {
      const def = RS.BALLS.byId(inst.id);
      return sum + (def && def.extraBalls ? def.extraBalls : 0);
    }, 0);
  },

  // primaryIndex: the index in state.wheelLayout the primary ball landed on.
  // extraIndices: indices already rolled (and animated) for any multiball items.
  resolve(state, primaryIndex, extraIndices) {
    const layout = state.wheelLayout;
    const n = layout.length;
    const primaryPocket = layout[primaryIndex];
    extraIndices = extraIndices || [];

    const balls = state.ownedBalls
      .map((inst) => ({ inst, def: RS.BALLS.byId(inst.id) }))
      .filter((b) => b.def);

    let hitIndices = [primaryIndex];
    const extraResults = extraIndices.map((idx) => layout[idx]);

    balls.forEach(({ def }) => {
      if (def.neighborSpread) {
        hitIndices.push((primaryIndex - 1 + n) % n, (primaryIndex + 1) % n);
      }
    });

    extraIndices.forEach((idx) => hitIndices.push(idx));

    hitIndices = Array.from(new Set(hitIndices));

    const payoutMultiplier = balls.reduce((m, { def }) => (def.payoutMultiplier ? m * def.payoutMultiplier : m), 1);
    const flatBonusPerWin = balls.reduce((s, { def }) => s + (def.flatBonusPerWin || 0), 0);

    const betResults = [];
    let totalPayout = 0;
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
      if (betWonAny) totalPayout += betPayout;
      betResults.push({ bet, win: betWonAny, payout: betPayout });
    });

    let wheelBonus = 0;
    state.ownedWheelMods.forEach((mod) => {
      const def = RS.WHEEL_MODS.byId(mod.id);
      if (def && def.onWin) wheelBonus += def.onWin(primaryPocket, mod) || 0;
    });
    totalPayout += wheelBonus;

    let refund = 0;
    if (totalPayout === 0 && totalWagered > 0) {
      balls.forEach(({ def }) => {
        if (def.lossRefundPct) refund += totalWagered * def.lossRefundPct;
      });
      refund = Math.round(refund);
    }

    state.chips = Math.round(state.chips + totalPayout + refund);

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

    return { primaryPocket, extraResults, betResults, totalPayout, refund, wheelBonus, removedBalls, totalWagered };
  }
};
