window.RS = window.RS || {};

RS.CONFIG = {
  spinsPerRound: 3,
  chipDenominations: [1, 5, 10, 25, 50],

  ballSlotsMax: 3,
  gridModSlotsMax: 3,
  wheelModSlotsMax: 3,

  shopOfferCounts: { balls: 2, gridMods: 2, wheelMods: 2 },

  startingChips(round) {
    return 100 + (round - 1) * 25;
  },

  threshold(round) {
    return Math.round(300 * Math.pow(1.35, round - 1));
  },

  // $ earned when a round is cleared
  moneyReward(round, finalChips, threshold) {
    const base = 3 + Math.floor(round / 2);
    const bonus = Math.floor(Math.max(0, finalChips - threshold) / 15);
    return base + bonus;
  },

  basePayouts: {
    straight: 35,
    split: 17,
    street: 11,
    corner: 8,
    sixline: 5,
    dozen: 2,
    column: 2,
    evenmoney: 1 // red/black, odd/even, low/high
  }
};
