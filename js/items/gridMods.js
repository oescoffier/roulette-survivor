window.RS = window.RS || {};

// Grid modifiers alter the betting grid's payout table.
// modifyOdds(odds, bet, modInstance) → new odds (ADDITIVE so duplicates stack).
// onZero(totalWagered, modInstance) → bonus chips when ball lands on 0.
RS.GRID_MODS = (function () {
  const list = [
    {
      id: 'gold_straight',
      name: 'Mise Dorée',
      description: 'Les mises en plein paient +5 de cote supplémentaire (35→40, empilable).',
      price: 8,
      modifyOdds(odds, bet) {
        return bet.type === 'straight' ? odds + 5 : odds;
      }
    },
    {
      id: 'even_money_boost',
      name: 'Chances Doublées',
      description: 'Rouge/Noir, Pair/Impair, Manque/Passe paient +1 de cote (1→2, empilable).',
      price: 9,
      modifyOdds(odds, bet) {
        const t = ['red', 'black', 'odd', 'even', 'low', 'high'];
        return t.includes(bet.type) ? odds + 1 : odds;
      }
    },
    {
      id: 'dozen_boost',
      name: 'Douzaine Boost',
      description: 'Douzaines et colonnes paient +1 de cote (2→3, empilable).',
      price: 7,
      modifyOdds(odds, bet) {
        return (bet.type === 'dozen' || bet.type === 'column') ? odds + 1 : odds;
      }
    },
    {
      id: 'favorite_number',
      name: 'Numéro Fétiche',
      description: 'Un numéro tiré au sort paie le double en plein (chaque achat choisit un nouveau numéro).',
      price: 6,
      paramsFactory() {
        return { number: Math.floor(Math.random() * 37) };
      },
      formatDescription(params) {
        return `Le numéro ${params.number} paie le double en plein.`;
      },
      modifyOdds(odds, bet, mod) {
        if (bet.type === 'straight' && String(bet.numbers[0]) === String(mod.params.number)) {
          return odds * 2;
        }
        return odds;
      }
    },
    {
      id: 'street_boost',
      name: 'Transversale Renforcée',
      description: 'Transversales et sixains paient +3 de cote (empilable).',
      price: 6,
      modifyOdds(odds, bet) {
        if (bet.type === 'street') return odds + 3;
        if (bet.type === 'sixline') return odds + 3;
        return odds;
      }
    },
    {
      id: 'zero_shield',
      name: 'Bouclier Zéro',
      description: 'Si la bille tombe sur le 0, récupérez 80% des jetons misés (plafonné à 100% si plusieurs exemplaires).',
      price: 7,
      onZero(totalWagered) {
        return Math.round(totalWagered * 0.8);
      }
    },
    {
      id: 'corner_boost',
      name: 'Maître des Coins',
      description: 'Carrés et sixains paient +2 de cote chacun (empilable).',
      price: 6,
      modifyOdds(odds, bet) {
        if (bet.type === 'corner') return odds + 2;
        if (bet.type === 'sixline') return odds + 2;
        return odds;
      }
    }
  ];

  function byId(id) {
    return list.find((m) => m.id === id);
  }

  return { list, byId };
})();
