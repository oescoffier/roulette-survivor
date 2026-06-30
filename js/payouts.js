window.RS = window.RS || {};

RS.PAYOUTS = {
  isWin(bet, pocket) {
    const num = pocket.number;
    switch (bet.type) {
      case 'straight':
      case 'split':
      case 'street':
      case 'corner':
      case 'sixline':
      case 'column':
        return bet.numbers.some((n) => String(n) === String(num));
      case 'dozen':
        if (num === 0 || num === '00') return false;
        return num >= bet.numbers[0] && num <= bet.numbers[1];
      case 'red':
        return pocket.color === 'red';
      case 'black':
        return pocket.color === 'black';
      case 'odd':
        return typeof num === 'number' && num !== 0 && num % 2 === 1;
      case 'even':
        return typeof num === 'number' && num !== 0 && num % 2 === 0;
      case 'low':
        return typeof num === 'number' && num >= 1 && num <= 18;
      case 'high':
        return typeof num === 'number' && num >= 19 && num <= 36;
      default:
        return false;
    }
  },

  baseOddsFor(type) {
    const map = RS.CONFIG.basePayouts;
    if (map[type] !== undefined) return map[type];
    return map.evenmoney; // red/black/odd/even/low/high
  },

  effectiveOdds(bet, ownedGridMods) {
    let odds = this.baseOddsFor(bet.type);
    ownedGridMods.forEach((mod) => {
      const def = RS.GRID_MODS.byId(mod.id);
      if (def && def.modifyOdds) odds = def.modifyOdds(odds, bet, mod);
    });
    return odds;
  },

  // Returns { win, payout } - payout is the TOTAL returned to chips (stake + winnings) on a win.
  resolveBet(bet, pocket, ownedGridMods) {
    const win = this.isWin(bet, pocket);
    if (!win) return { win: false, payout: 0 };
    const odds = this.effectiveOdds(bet, ownedGridMods);
    const payout = bet.amount * (odds + 1);
    return { win: true, payout };
  }
};
