window.RS = window.RS || {};

RS.SHOP_SCREEN = (function () {
  const CATEGORY_LABELS = { balls: 'BILLE', gridMods: 'GRILLE', wheelMods: 'ROUE' };

  function render() {
    const moneyEl = document.getElementById('shop-money');
    const offersEl = document.getElementById('shop-offers');
    moneyEl.textContent = RS.UI.fmt(RS.state.money);
    offersEl.innerHTML = '';

    // Reroll button
    const btnReroll = document.getElementById('btn-reroll-shop');
    const rerollCost = RS.SHOP.rerollCost(RS.state);
    btnReroll.textContent = `RELANCER ${rerollCost}$`;
    btnReroll.disabled = RS.state.money < rerollCost;
    btnReroll.onclick = () => {
      if (RS.SHOP.reroll(RS.state)) render();
    };

    const offers = RS.SHOP.getOffers();
    offers.forEach((offer) => {
      const card = document.createElement('div');
      card.className = 'shop-card';

      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.textContent = offer.label;
      card.appendChild(tag);

      const h3 = document.createElement('h3');
      h3.textContent = offer.def.name;
      card.appendChild(h3);

      const p = document.createElement('p');
      p.textContent = RS.SHOP.descriptionFor(offer);
      card.appendChild(p);

      const price = document.createElement('div');
      price.className = 'price';
      price.textContent = `${offer.price}$`;
      card.appendChild(price);

      const btn = document.createElement('button');
      btn.className = 'btn btn-small';
      btn.textContent = offer.sold ? 'ACHETÉ' : 'ACHETER';
      btn.disabled = offer.sold || RS.state.money < offer.price;
      btn.addEventListener('click', () => {
        if (RS.SHOP.buy(RS.state, offer)) {
          render(); // re-render to update money display and sold state
        }
      });
      card.appendChild(btn);

      offersEl.appendChild(card);
    });

    renderOwned();
  }

  // Owned items list with sell-back buttons (50% of current shop price).
  function renderOwned() {
    const section = document.getElementById('shop-owned-section');
    const listEl = document.getElementById('shop-owned');
    listEl.innerHTML = '';

    const items = RS.SHOP.ownedItems(RS.state);
    section.style.display = items.length ? '' : 'none';

    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'owned-item';

      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = CATEGORY_LABELS[item.category];
      row.appendChild(tag);

      const name = document.createElement('span');
      name.className = 'owned-name';
      name.textContent = item.def.name +
        (item.inst.usesLeft !== undefined ? ` (${item.inst.usesLeft})` : '');
      RS.UI.TOOLTIP.attach(name, () =>
        item.inst.params && item.def.formatDescription
          ? item.def.formatDescription(item.inst.params)
          : item.def.description);
      row.appendChild(name);

      const btn = document.createElement('button');
      btn.className = 'btn btn-small btn-sell';
      btn.textContent = `VENDRE ${item.sellPrice}$`;
      btn.addEventListener('click', () => {
        if (RS.SHOP.sell(RS.state, item.category, item.index)) render();
      });
      row.appendChild(btn);

      listEl.appendChild(row);
    });
  }

  function enter() {
    RS.SHOP.enterShop(RS.state);
    render();

    const btnLeave = document.getElementById('btn-leave-shop');
    btnLeave.onclick = () => {
      RS.state.nextRound();
      RS.UI.showScreen('round');
      RS.ROUND_SCREEN.enter();
    };
  }

  return { enter };
})();
