window.RS = window.RS || {};

RS.SHOP = (function () {
  let currentOffers = [];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Generates a fresh set of offers. No slot caps, duplicates allowed —
  // every item can be purchased multiple times and effects stack.
  function generateOffers(state) {
    const round = state.round;
    const offers = [];
    const pools = [
      { category: 'balls',     list: RS.BALLS.list,      count: RS.CONFIG.shopOfferCounts.balls,     label: 'BILLE' },
      { category: 'gridMods',  list: RS.GRID_MODS.list,  count: RS.CONFIG.shopOfferCounts.gridMods,  label: 'GRILLE' },
      { category: 'wheelMods', list: RS.WHEEL_MODS.list, count: RS.CONFIG.shopOfferCounts.wheelMods, label: 'ROUE' }
    ];

    pools.forEach((pool) => {
      const picks = shuffle(pool.list).slice(0, pool.count);
      picks.forEach((def) => {
        const params = def.paramsFactory ? def.paramsFactory() : undefined;
        const price = RS.CONFIG.shopItemPrice(def.price, round);
        offers.push({ category: pool.category, label: pool.label, def, params, price, sold: false });
      });
    });

    currentOffers = offers;
    return offers;
  }

  function descriptionFor(offer) {
    if (offer.params && offer.def.formatDescription) return offer.def.formatDescription(offer.params);
    return offer.def.description;
  }

  function buy(state, offer) {
    if (offer.sold || state.money < offer.price) return false;
    state.money -= offer.price;
    const inst = { id: offer.def.id };
    if (offer.params) inst.params = offer.params;
    if (offer.def.maxUses) inst.usesLeft = offer.def.maxUses;

    if (offer.category === 'balls')     state.ownedBalls.push(inst);
    if (offer.category === 'gridMods')  state.ownedGridMods.push(inst);
    if (offer.category === 'wheelMods') {
      state.ownedWheelMods.push(inst);
      state.rebuildWheelLayout();
    }

    offer.sold = true;
    state.save();
    return true;
  }

  function getOffers() { return currentOffers; }

  return { generateOffers, getOffers, descriptionFor, buy };
})();
