window.RS = window.RS || {};

RS.CONFIG = {
  spinsPerRound: 3,

  shopOfferCounts: { balls: 2, gridMods: 2, wheelMods: 2 },

  startingChips: 150,

  threshold(round) {
    return Math.round(200 * Math.pow(1.45, round - 1));
  },

  // Shop item prices scale up each round so the economy stays relevant.
  // base is the item's intrinsic price; round starts at 1.
  shopItemPrice(base, round) {
    return Math.round(base * Math.pow(1.1, round - 1));
  },

  // $ earned when a round is cleared. Scales with round so players can keep
  // buying in late game, but prices scale too — net ~2 items per visit.
  moneyReward(round, finalChips, threshold) {
    const base = 10 + round * 2;
    const bonus = Math.floor(Math.max(0, finalChips - threshold) / 20);
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
    evenmoney: 1
  }
};
