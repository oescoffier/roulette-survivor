window.RS = window.RS || {};

RS.CONFIG = {
  spinsPerRound: 3,

  shopOfferCounts: { balls: 2, gridMods: 2, wheelMods: 2 },

  // Each round starts with a fresh bankroll: a fraction of the round's base
  // threshold. Generous early (×1.18 growth needed), tightening to ×1.43 by
  // round 11. Surplus chips at round end convert into $ via moneyReward.
  bankrollRatio(round) {
    return Math.max(0.70, 0.85 - 0.015 * (round - 1));
  },

  // Escalating growth ratio: starts at ×1.45 per round, +0.03 per round,
  // capped at ×2.0 — keeps late game tense even as the ball arsenal grows.
  threshold(round) {
    let t = 200;
    for (let i = 2; i <= round; i++) {
      t *= Math.min(1.45 + 0.03 * (i - 2), 2.0);
    }
    return Math.round(t);
  },

  // Boss rounds every 5 rounds: a named boss with a harsh handicap replaces
  // the random event; clearing it multiplies the $ reward.
  isBossRound(round) {
    return round > 1 && round % 5 === 0;
  },

  // Shop item prices scale up each round so the economy stays relevant.
  // base is the item's intrinsic price; round starts at 1.
  shopItemPrice(base, round) {
    return Math.round(base * Math.pow(1.1, round - 1));
  },

  // Reroll all shop offers: cost grows with round and with each reroll
  // in the same shop visit.
  rerollCost(round, rerollsUsed) {
    return Math.round((4 + rerollsUsed * 2) * Math.pow(1.1, round - 1));
  },

  // Sell an owned item back for half its current shop price.
  sellPrice(base, round) {
    return Math.max(1, Math.round(this.shopItemPrice(base, round) / 2));
  },

  // Interest paid at round clear: +1$ per 10$ held, capped at +10$.
  interest(money) {
    return Math.min(10, Math.floor(money / 10));
  },

  // Streak: consecutive winning spins boost the profit portion of payouts.
  // +10% per consecutive win, capped at +50%.
  streakMultiplier(streak) {
    return 1 + 0.1 * Math.min(streak, 5);
  },

  // $ earned when a round is cleared. Scales with round so players can keep
  // buying in late game, but prices scale too — net ~2 items per visit.
  // Surplus-chips bonus is capped so the late-game economy stays under
  // pressure instead of exploding with snowballed chips.
  moneyReward(round, finalChips, threshold) {
    const base = 10 + round * 2;
    const bonus = Math.min(30, Math.floor(Math.max(0, finalChips - threshold) / 20));
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
