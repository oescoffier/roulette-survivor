window.RS = window.RS || {};

// Wheel modifiers alter the physical wheel layout (37 pockets, rebuilt fresh from
// the base layout then replayed through every owned mod in purchase order).
// applyToLayout(layout, modInstance) must return a (possibly new) layout array.
// onWin(pocket, modInstance) is an optional hook for effects that don't touch the layout.
RS.WHEEL_MODS = (function () {
  function colorOf(n) { return RS.WHEEL.colorOf(n); }

  const list = [
    {
      id: 'number_swap',
      name: 'Remplacement de Numéro',
      description: 'Une case du tirage au sort est remplacée par un doublon d\'un autre numéro, augmentant ses chances de sortir.',
      price: 9,
      paramsFactory() {
        const victim = 1 + Math.floor(Math.random() * 36);
        let target = 1 + Math.floor(Math.random() * 36);
        while (target === victim) target = 1 + Math.floor(Math.random() * 36);
        return { victimNumber: victim, targetNumber: target };
      },
      formatDescription(params) {
        return `La case ${params.victimNumber} est remplacée par un doublon du ${params.targetNumber}.`;
      },
      applyToLayout(layout, mod) {
        return layout.map((p) => {
          if (p.number === mod.params.victimNumber) {
            return { number: mod.params.targetNumber, color: colorOf(mod.params.targetNumber) };
          }
          return p;
        });
      }
    },
    {
      id: 'color_swap',
      name: 'Inversion de Couleur',
      description: 'La couleur d\'un numéro tiré au sort est inversée (rouge devient noir, et inversement).',
      price: 7,
      paramsFactory() {
        return { number: 1 + Math.floor(Math.random() * 36) };
      },
      formatDescription(params) {
        return `La couleur du numéro ${params.number} est inversée.`;
      },
      applyToLayout(layout, mod) {
        return layout.map((p) => {
          if (p.number === mod.params.number) {
            return { number: p.number, color: p.color === 'red' ? 'black' : 'red' };
          }
          return p;
        });
      }
    },
    {
      id: 'zero_bonus',
      name: 'Zéro Bonus',
      description: 'Si la bille tombe sur 0, gagne 30 jetons bonus en plus des mises couvrant le 0.',
      price: 8,
      applyToLayout(layout) { return layout; },
      onWin(pocket) {
        return pocket.number === 0 ? 30 : 0;
      }
    },
    {
      id: 'double_zero',
      name: 'Double Zéro',
      description: 'Ajoute une case 00 (verte) à la roue, à l\'américaine. Dilue légèrement les probabilités.',
      price: 8,
      applyToLayout(layout) {
        if (layout.some((p) => p.number === '00')) return layout;
        return layout.concat([{ number: '00', color: 'green' }]);
      }
    }
  ];

  function byId(id) {
    return list.find((m) => m.id === id);
  }

  return { list, byId };
})();
