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

  function generateOffers(state) {
    const offers = [];
    const pools = [
      { category: 'balls', list: RS.BALLS.list, owned: state.ownedBalls, max: RS.CONFIG.ballSlotsMax, count: RS.CONFIG.shopOfferCounts.balls, label: 'BILLE' },
      { category: 'gridMods', list: RS.GRID_MODS.list, owned: state.ownedGridMods, max: RS.CONFIG.gridModSlotsMax, count: RS.CONFIG.shopOfferCounts.gridMods, label: 'GRILLE' },
      { category: 'wheelMods', list: RS.WHEEL_MODS.list, owned: state.ownedWheelMods, max: RS.CONFIG.wheelModSlotsMax, count: RS.CONFIG.shopOfferCounts.wheelMods, label: 'ROUE' }
    ];

    pools.forEach((pool) => {
      if (pool.owned.length >= pool.max) return;
      const ownedIds = new Set(pool.owned.map((o) => o.id));
      const available = pool.list.filter((d) => !ownedIds.has(d.id));
      const picks = shuffle(available).slice(0, pool.count);
      picks.forEach((def) => {
        const params = def.paramsFactory ? def.paramsFactory() : undefined;
        offers.push({ category: pool.category, label: pool.label, def, params, sold: false });
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
    if (offer.sold || state.money < offer.def.price) return false;
    state.money -= offer.def.price;
    const inst = { id: offer.def.id };
    if (offer.params) inst.params = offer.params;
    if (offer.def.maxUses) inst.usesLeft = offer.def.maxUses;

    if (offer.category === 'balls') state.ownedBalls.push(inst);
    if (offer.category === 'gridMods') state.ownedGridMods.push(inst);
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
