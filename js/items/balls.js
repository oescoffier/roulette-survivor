window.RS = window.RS || {};

// Each ball bought is a physical ball launched into the wheel during a spin.
// The player always has 1 primary ball (free). Every purchased ball adds a
// second (or third…) ball that lands independently.
//
// Per-ball properties:
//   spread:          int  — also activates N pockets on each side of landing (0 = single pocket)
//   mirrorPrimary:   bool — always lands at the pocket directly opposite the primary ball
//   flatBonusPerWin: int  — flat chips bonus added each time a winning bet is hit by THIS ball
//   payoutMultiplier:float— winnings multiplier for bets won by THIS ball
//   maxUses:         int  — ball is consumed after this many spins
//   lossRefundPct:   float— fraction of total wagered refunded when ALL balls lose everything
RS.BALLS = (function () {
  const list = [
    {
      id: 'twin',
      name: 'Bille Jumelle',
      description: 'Lance une 2ème bille identique à la bille principale. Double vos chances.',
      price: 5,
      spread: 0
    },
    {
      id: 'neighbor',
      name: 'Bille Voisine',
      description: 'Lance une bille qui active aussi les 2 cases voisines sur la roue (3 poches en tout).',
      price: 6,
      spread: 1
    },
    {
      id: 'pulsar',
      name: 'Bille Pulsar',
      description: 'Lance une bille qui active les 4 cases voisines (±2) en plus de sa case d\'atterrissage.',
      price: 9,
      spread: 2
    },
    {
      id: 'mirror',
      name: 'Bille Miroir',
      description: 'Lance une bille qui atterrit toujours à l\'opposé de la bille principale sur la roue.',
      price: 7,
      mirrorPrimary: true,
      spread: 0
    },
    {
      id: 'loaded',
      name: 'Bille Chargée',
      description: 'Lance une bille qui ajoute +25 jetons à chaque mise gagnante qu\'elle touche.',
      price: 7,
      spread: 0,
      flatBonusPerWin: 25
    },
    {
      id: 'worn',
      name: 'Bille Usée',
      description: 'Lance une bille qui paie ×1.5 les gains. Se brise après 3 lancers.',
      price: 5,
      spread: 0,
      payoutMultiplier: 1.5,
      maxUses: 3
    },
    {
      id: 'ghost',
      name: 'Bille Fantôme',
      description: 'Lance une bille fantôme. Si aucune bille ne rapporte rien ce lancer, 50% des mises sont remboursées.',
      price: 6,
      spread: 0,
      lossRefundPct: 0.5
    },
    {
      id: 'golden',
      name: 'Bille Dorée',
      description: 'Lance une bille dorée qui paie ×2 les gains. Se brise après 2 lancers.',
      price: 9,
      spread: 0,
      payoutMultiplier: 2.0,
      maxUses: 2
    }
  ];

  function byId(id) {
    return list.find((b) => b.id === id);
  }

  return { list, byId };
})();
