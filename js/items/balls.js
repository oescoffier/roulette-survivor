window.RS = window.RS || {};

// Balls are passive equipment (slots limited by RS.CONFIG.ballSlotsMax).
// Each definition may expose:
//   extraBalls: int - additional independent results rolled per "lancer"
//   neighborSpread: bool - the result also activates the two adjacent wheel pockets
//   flatBonusPerWin: int - flat chips added to every winning bet resolution
//   maxUses: int - ball is consumed and removed after this many spins
//   lossRefundPct: float - fraction of total wagered refunded if the spin wins nothing
RS.BALLS = (function () {
  const list = [
    {
      id: 'twin',
      name: 'Bille Jumelle',
      description: '2 billes sont lancées à chaque lancer. Chaque bille est résolue indépendamment.',
      price: 7,
      extraBalls: 1
    },
    {
      id: 'neighbor',
      name: 'Bille Voisine',
      description: 'En plus de la case gagnante, les 2 cases voisines sur la roue sont aussi activées.',
      price: 6,
      neighborSpread: true
    },
    {
      id: 'loaded',
      name: 'Bille Chargée',
      description: '+20 jetons bonus sur chaque mise gagnante.',
      price: 6,
      flatBonusPerWin: 20
    },
    {
      id: 'worn',
      name: 'Bille Usée',
      description: '+50% de gains sur toutes les mises gagnantes, mais se brise après 3 lancers.',
      price: 5,
      payoutMultiplier: 1.5,
      maxUses: 3
    },
    {
      id: 'ghost',
      name: 'Bille Fantôme',
      description: "Si un lancer ne rapporte rien, 50% des jetons misés sont remboursés.",
      price: 6,
      lossRefundPct: 0.5
    }
  ];

  function byId(id) {
    return list.find((b) => b.id === id);
  }

  return { list, byId };
})();
