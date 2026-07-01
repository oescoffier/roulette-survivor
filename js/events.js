window.RS = window.RS || {};

// Round events (like Balatro's blind modifiers): one random event per round from round 2.
// positive:true = beneficial, false = detrimental, null = mixed/neutral.
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
      positive: null
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

  function byId(id) { return list.find((e) => e.id === id); }

  function rollEvent(round) {
    if (round <= 1) return null;
    const def = list[Math.floor(Math.random() * list.length)];
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

  return { list, byId, rollEvent, getDescription };
})();
