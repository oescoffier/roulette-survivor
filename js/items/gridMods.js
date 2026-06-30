window.RS = window.RS || {};

// Grid modifiers alter the betting grid's payout table.
// modifyOdds(odds, bet, modInstance) returns the new odds for that bet type.
RS.GRID_MODS = (function () {
  const list = [
    {
      id: 'gold_straight',
      name: 'Mise Dorée',
      description: 'Les mises en plein paient 40:1 au lieu de 35:1.',
      price: 8,
      modifyOdds(odds, bet) {
        return bet.type === 'straight' ? 40 : odds;
      }
    },
    {
      id: 'even_money_boost',
      name: 'Chances Doublées',
      description: 'Rouge/Noir, Pair/Impair, Manque/Passe paient 2:1 au lieu de 1:1.',
      price: 9,
      modifyOdds(odds, bet) {
        const evenMoneyTypes = ['red', 'black', 'odd', 'even', 'low', 'high'];
        return evenMoneyTypes.includes(bet.type) ? 2 : odds;
      }
    },
    {
      id: 'dozen_boost',
      name: 'Douzaine Boost',
      description: 'Douzaines et colonnes paient 3:1 au lieu de 2:1.',
      price: 7,
      modifyOdds(odds, bet) {
        return (bet.type === 'dozen' || bet.type === 'column') ? 3 : odds;
      }
    },
    {
      id: 'favorite_number',
      name: 'Numéro Fétiche',
      description: 'Un numéro tiré au sort paie double en plein.',
      price: 6,
      paramsFactory() {
        return { number: Math.floor(Math.random() * 37) };
      },
      formatDescription(params) {
        return `Le numéro ${params.number} paie double en plein.`;
      },
      modifyOdds(odds, bet, mod) {
        if (bet.type === 'straight' && bet.numbers[0] === mod.params.number) {
          return odds * 2;
        }
        return odds;
      }
    },
    {
      id: 'street_boost',
      name: 'Transversale Renforcée',
      description: 'Transversales et sixains paient +3 de cote.',
      price: 6,
      modifyOdds(odds, bet) {
        if (bet.type === 'street') return odds + 3;
        if (bet.type === 'sixline') return odds + 3;
        return odds;
      }
    }
  ];

  function byId(id) {
    return list.find((m) => m.id === id);
  }

  return { list, byId };
})();
