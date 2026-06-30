window.RS = window.RS || {};

RS.SAVE_KEY = 'rouletteSurvivorSave';

RS.state = {
  round: 1,
  threshold: 0,
  chips: 0,
  spinsRemaining: 3,
  money: 0,
  currentBets: [],
  ownedBalls: [],
  ownedGridMods: [],
  ownedWheelMods: [],
  wheelLayout: [],
  log: [],
  pendingShop: false,

  newGame() {
    this.round = 1;
    this.money = 0;
    this.ownedBalls = [];
    this.ownedGridMods = [];
    this.ownedWheelMods = [];
    this.currentBets = [];
    this.log = [];
    this.rebuildWheelLayout();
    this.startRound();
    this.save();
  },

  startRound() {
    this.threshold = RS.CONFIG.threshold(this.round);
    this.chips = RS.CONFIG.startingChips(this.round);
    this.spinsRemaining = RS.CONFIG.spinsPerRound;
    this.currentBets = [];
    this.log = [];
    this.rebuildWheelLayout();
  },

  nextRound() {
    this.round += 1;
    this.pendingShop = false;
    this.startRound();
    this.save();
  },

  rebuildWheelLayout() {
    let layout = RS.WHEEL.buildLayout();
    this.ownedWheelMods.forEach((mod) => {
      const def = RS.WHEEL_MODS.byId(mod.id);
      if (def && def.applyToLayout) layout = def.applyToLayout(layout, mod);
    });
    this.wheelLayout = layout;
  },

  addLog(text, kind) {
    this.log.push({ text, kind: kind || '' });
    if (this.log.length > 50) this.log.shift();
  },

  save() {
    const data = {
      round: this.round,
      threshold: this.threshold,
      chips: this.chips,
      spinsRemaining: this.spinsRemaining,
      money: this.money,
      ownedBalls: this.ownedBalls,
      ownedGridMods: this.ownedGridMods,
      ownedWheelMods: this.ownedWheelMods,
      log: this.log,
      pendingShop: this.pendingShop
    };
    localStorage.setItem(RS.SAVE_KEY, JSON.stringify(data));
  },

  hasSave() {
    return !!localStorage.getItem(RS.SAVE_KEY);
  },

  load() {
    const raw = localStorage.getItem(RS.SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    Object.assign(this, data);
    this.currentBets = [];
    this.rebuildWheelLayout();
    return true;
  },

  clearSave() {
    localStorage.removeItem(RS.SAVE_KEY);
  }
};
