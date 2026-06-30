window.RS = window.RS || {};

RS.SHOP_SCREEN = (function () {
  function render() {
    const moneyEl = document.getElementById('shop-money');
    const offersEl = document.getElementById('shop-offers');
    moneyEl.textContent = RS.UI.fmt(RS.state.money);
    offersEl.innerHTML = '';

    const offers = RS.SHOP.getOffers();
    if (!offers.length) {
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = 'Aucune offre disponible (tous les emplacements sont pleins).';
      offersEl.appendChild(p);
      return;
    }

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
      price.textContent = `${offer.def.price}$`;
      card.appendChild(price);

      const btn = document.createElement('button');
      btn.className = 'btn btn-small';
      btn.textContent = offer.sold ? 'ACHETÉ' : 'ACHETER';
      btn.disabled = offer.sold || RS.state.money < offer.def.price;
      btn.addEventListener('click', () => {
        if (RS.SHOP.buy(RS.state, offer)) {
          render();
        }
      });
      card.appendChild(btn);

      offersEl.appendChild(card);
    });
  }

  function enter() {
    RS.SHOP.generateOffers(RS.state);
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
