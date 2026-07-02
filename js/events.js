window.RS = window.RS || {};

// Round events (like Balatro's blind modifiers): one random event per round from round 2.
// positive:true = beneficial, false = detrimental, null = mixed/neutral.
// Boss events (boss:true) replace the random event every 5 rounds; clearing a
// boss multiplies the $ reward (rewardMultiplier, default 2).
// Optional hooks:
//   applyToRound(state)   — setup effects (threshold, spins)
//   modifyLayout(layout)  — temporary wheel layout change for this round only
//   fogged: true          — wheel is blurred during spins
RS.EVENTS = (function () {
  const list = [
    {
      id: 'fever',
      name: 'FIÈVRE',
      description: 'Tous les gains sont multipliés par ×1.5 ce tour.',
      positive: true
    },
    {
      id: 'bonus_spin',
      name: 'TOUR BONUS',
      description: 'Un lancer supplémentaire est accordé ce tour.',
      positive: true,
      applyToRound(state) { state.spinsRemaining += 1; }
    },
    {
      id: 'jackpot',
      name: 'JACKPOT',
      description: 'Un numéro tiré au sort paie 70:1 en plein ce tour.',
      positive: true,
      paramsFactory() { return { number: Math.floor(Math.random() * 37) }; },
      formatDescription(p) { return `Le ${p.number} paie 70:1 en plein ce tour !`; }
    },
    {
      id: 'lucky_zero',
      name: 'ZÉRO BÉNI',
      description: 'Si la bille tombe sur le 0, vous gagnez 100 jetons.',
      positive: true
    },
    {
      id: 'bounty',
      name: 'PRIME',
      description: 'Un numéro tiré au sort : le toucher en plein rapporte +80 jetons.',
      positive: true,
      paramsFactory() { return { number: Math.floor(Math.random() * 37) }; },
      formatDescription(p) { return `Mise en plein sur le ${p.number} → +80 jetons bonus !`; }
    },
    {
      id: 'tax',
      name: 'TAXE CASINO',
      description: 'Chaque mise gagnante est réduite de 12 jetons.',
      positive: false
    },
    {
      id: 'fog',
      name: 'BROUILLARD',
      description: 'La roue est voilée pendant les lancers — le résultat se révèle à l\'arrêt.',
      positive: null,
      fogged: true
    },
    {
      id: 'high_stakes',
      name: 'GROS ENJEUX',
      description: 'Seuil +25% ce tour, mais un lancer supplémentaire est accordé.',
      positive: null,
      applyToRound(state) {
        state.threshold = Math.round(state.threshold * 1.25);
        state.spinsRemaining += 1;
      }
    }
  ];

  const bosses = [
    {
      id: 'boss_croupier',
      name: 'LE CROUPIER',
      boss: true,
      description: 'Seuil +30%. Chaque mise gagnante est taxée de 25 jetons.',
      positive: false,
      applyToRound(state) { state.threshold = Math.round(state.threshold * 1.3); }
    },
    {
      id: 'boss_veiled',
      name: 'LA ROUE VOILÉE',
      boss: true,
      description: 'Seuil +30%. La roue reste voilée pendant tous les lancers.',
      positive: false,
      fogged: true,
      applyToRound(state) { state.threshold = Math.round(state.threshold * 1.3); }
    },
    {
      id: 'boss_iron',
      name: 'MAIN DE FER',
      boss: true,
      description: 'Seuil +20%. Les chances simples (rouge/noir, pair/impair, manque/passe) ne paient rien ce tour.',
      positive: false,
      applyToRound(state) { state.threshold = Math.round(state.threshold * 1.2); }
    },
    {
      id: 'boss_cursed_zero',
      name: 'ZÉRO MAUDIT',
      boss: true,
      description: 'Seuil +25%. Deux cases 0 supplémentaires sont ajoutées à la roue ce tour.',
      positive: false,
      applyToRound(state) { state.threshold = Math.round(state.threshold * 1.25); },
      modifyLayout(layout) {
        const copy = layout.slice();
        copy.splice(Math.floor(copy.length / 3), 0, { number: 0, color: 'green' });
        copy.splice(Math.floor((2 * copy.length) / 3), 0, { number: 0, color: 'green' });
        return copy;
      }
    },
    {
      id: 'boss_tycoon',
      name: 'LE MAGNAT',
      boss: true,
      description: 'Seuil +50%… mais la récompense de la manche est TRIPLÉE.',
      positive: null,
      rewardMultiplier: 3,
      applyToRound(state) { state.threshold = Math.round(state.threshold * 1.5); }
    }
  ];

  function byId(id) {
    return list.find((e) => e.id === id) || bosses.find((e) => e.id === id);
  }

  function rollEvent(round) {
    if (round <= 1) return null;
    const pool = RS.CONFIG.isBossRound(round) ? bosses : list;
    const def = pool[Math.floor(Math.random() * pool.length)];
    const params = def.paramsFactory ? def.paramsFactory() : undefined;
    return { id: def.id, params };
  }

  function getDescription(inst) {
    if (!inst) return '';
    const def = byId(inst.id);
    if (!def) return '';
    if (inst.params && def.formatDescription) return def.formatDescription(inst.params);
    return def.description;
  }

  return { list, bosses, byId, rollEvent, getDescription };
})();
