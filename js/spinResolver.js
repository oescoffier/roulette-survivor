window.RS = window.RS || {};

RS.SPIN_RESOLVER = {
  // Pre-roll a landing index for each owned ball, using the primary index for
  // mirror balls. Called in roundScreen before animation so visuals and results
  // are determined at the same time.
  rollOwnedBallIndices(state, primaryIndex) {
    const n = state.wheelLayout.length;
    return state.ownedBalls.map((inst) => {
      const def = RS.BALLS.byId(inst.id);
      if (def && def.mirrorPrimary) {
        return (primaryIndex + Math.floor(n / 2)) % n;
      }
      return RS.WHEEL.spin(state.wheelLayout).index;
    });
  },

  // Resolve a full spin.
  // ownedBallIndices[i] must correspond to state.ownedBalls[i] in order.
  // Each ball is applied independently: its landing pocket (+ optional spread)
  // is matched against every placed bet, accumulating payout per bet.
  resolve(state, primaryIndex, ownedBallIndices) {
    const layout = state.wheelLayout;
    const n = layout.length;
    const primaryPocket = layout[primaryIndex];
    ownedBallIndices = ownedBallIndices || [];

    const owned = state.ownedBalls
      .map((inst, i) => ({ inst, def: RS.BALLS.byId(inst.id), landingIndex: ownedBallIndices[i] }))
      .filter((b) => b.def && b.landingIndex != null);

    const totalWagered = state.currentBets.reduce((s, b) => s + b.amount, 0);

    // One result entry per placed bet, payout accumulates across all balls.
    const betResults = state.currentBets.map((bet) => ({ bet, win: false, payout: 0 }));

    const bossIron = state.currentEvent && state.currentEvent.id === 'boss_iron';
    const EVEN_MONEY_TYPES = ['red', 'black', 'odd', 'even', 'low', 'high'];

    // Resolve one ball's landing against every placed bet.
    function applyBall(landingIndex, def) {
      const spread = def ? (def.spread || 0) : 0;
      const multiplier = def ? (def.payoutMultiplier || 1) : 1;
      const flatBonus = def ? (def.flatBonusPerWin || 0) : 0;

      const hitSet = new Set([landingIndex]);
      for (let d = 1; d <= spread; d++) {
        hitSet.add((landingIndex - d + n) % n);
        hitSet.add((landingIndex + d) % n);
      }

      betResults.forEach((br) => {
        // MAIN DE FER boss: even-money bets never pay this round.
        if (bossIron && EVEN_MONEY_TYPES.includes(br.bet.type)) return;
        let ballWon = false;
        let ballPay = 0;
        for (const hi of hitSet) {
          const res = RS.PAYOUTS.resolveBet(br.bet, layout[hi], state.ownedGridMods);
          if (res.win) {
            ballWon = true;
            // Each ball contributes its PROFIT only; the stake is returned
            // once per winning bet (added after all balls are resolved).
            let profit = (res.payout - br.bet.amount) * multiplier;
            profit += flatBonus;
            ballPay += profit;
          }
        }
        if (ballWon) {
          br.win = true;
          br.payout += Math.round(ballPay);
        }
      });
    }

    // 1. Primary ball (always present, no special properties).
    applyBall(primaryIndex, null);

    // 2. Each purchased ball (independent, may have spread/multiplier/etc.).
    const extraResults = owned.map(({ def, landingIndex }) => {
      applyBall(landingIndex, def);
      return layout[landingIndex];
    });

    // Return the stake once per winning bet (no matter how many balls hit it).
    betResults.forEach((br) => {
      if (br.win) br.payout += br.bet.amount;
    });

    let totalPayout = betResults.reduce((s, br) => s + (br.win ? br.payout : 0), 0);

    // --- Event effects ---
    const evtDef = state.currentEvent ? RS.EVENTS.byId(state.currentEvent.id) : null;
    const evtParams = state.currentEvent ? state.currentEvent.params : null;

    if (evtDef) {
      if (evtDef.id === 'fever') {
        // Add 50% of all winnings (excluding returned stakes)
        const wageredWon = betResults.filter((br) => br.win).reduce((s, br) => s + br.bet.amount, 0);
        totalPayout += Math.round((totalPayout - wageredWon) * 0.5);
      }
      if (evtDef.id === 'tax') {
        betResults.forEach((br) => {
          if (br.win) br.payout = Math.max(br.bet.amount, br.payout - 12);
        });
        totalPayout = betResults.reduce((s, br) => s + (br.win ? br.payout : 0), 0);
      }
      if (evtDef.id === 'boss_croupier') {
        betResults.forEach((br) => {
          if (br.win) br.payout = Math.max(0, br.payout - 25);
        });
        totalPayout = betResults.reduce((s, br) => s + (br.win ? br.payout : 0), 0);
      }
      if (evtDef.id === 'jackpot' && evtParams) {
        betResults.forEach((br) => {
          if (br.win && br.bet.type === 'straight' &&
              String(br.bet.numbers[0]) === String(evtParams.number) &&
              String(primaryPocket.number) === String(evtParams.number)) {
            const extra = br.bet.amount * 35;
            br.payout += extra;
            totalPayout += extra;
          }
        });
      }
      if (evtDef.id === 'bounty' && evtParams) {
        betResults.forEach((br) => {
          if (br.win && br.bet.type === 'straight' &&
              String(br.bet.numbers[0]) === String(evtParams.number) &&
              String(primaryPocket.number) === String(evtParams.number)) {
            br.payout += 80;
            totalPayout += 80;
          }
        });
      }
    }

    // --- Streak bonus: consecutive winning spins boost the profit portion ---
    let streakBonus = 0;
    const wonBefore = betResults.some((br) => br.win);
    if (wonBefore && state.streak > 0) {
      const mult = RS.CONFIG.streakMultiplier(state.streak);
      const wageredWon = betResults.filter((br) => br.win).reduce((s, br) => s + br.bet.amount, 0);
      streakBonus = Math.round(Math.max(0, totalPayout - wageredWon) * (mult - 1));
      totalPayout += streakBonus;
    }

    // --- Wheel mod onWin hooks (primary ball pocket only) ---
    let wheelBonus = 0;
    state.ownedWheelMods.forEach((mod) => {
      const def = RS.WHEEL_MODS.byId(mod.id);
      if (def && def.onWin) wheelBonus += def.onWin(primaryPocket, mod) || 0;
    });
    totalPayout += wheelBonus;

    // --- Grid mod onZero hooks (primary ball pocket, capped at wagered to avoid overpay) ---
    let zeroBonus = 0;
    if (primaryPocket.number === 0 || primaryPocket.number === '00') {
      state.ownedGridMods.forEach((mod) => {
        const def = RS.GRID_MODS.byId(mod.id);
        if (def && def.onZero) zeroBonus += def.onZero(totalWagered, mod);
      });
      if (totalWagered > 0) zeroBonus = Math.min(zeroBonus, totalWagered);
    }
    totalPayout += zeroBonus;

    // --- Event global bonuses ---
    let eventBonus = 0;
    if (evtDef && evtDef.id === 'lucky_zero' && primaryPocket.number === 0) {
      eventBonus = 100;
      totalPayout += eventBonus;
    }

    // --- Ghost ball refund (only when NO bet won from any ball) ---
    let refund = 0;
    const anyBetWon = betResults.some((br) => br.win);
    if (!anyBetWon && totalWagered > 0) {
      owned.forEach(({ def }) => {
        if (def.lossRefundPct) refund += totalWagered * def.lossRefundPct;
      });
      refund = Math.round(refund);
    }

    state.chips = Math.round(state.chips + totalPayout + refund);

    // Update the win streak (only spins with bets placed count).
    if (totalWagered > 0) {
      state.streak = anyBetWon ? state.streak + 1 : 0;
    }

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
      totalPayout, refund, wheelBonus, zeroBonus, eventBonus, streakBonus,
      removedBalls, totalWagered
    };
  }
};
