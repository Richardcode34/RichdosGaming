const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startMenu = document.getElementById("startMenu");
const weaponSelect = document.getElementById("weaponSelect");
const utilitySelect = document.getElementById("utilitySelect");
const difficultySelect = document.getElementById("difficultySelect");
const startButton = document.getElementById("startButton");
const resetSaveButton = document.getElementById("resetSaveButton");
const saveStats = document.getElementById("saveStats");
const upgradeDamageButton = document.getElementById("upgradeDamage");
const upgradeFireRateButton = document.getElementById("upgradeFireRate");
const upgradeArmorButton = document.getElementById("upgradeArmor");
const shopWeaponButton = document.getElementById("shopWeapon");
const shopAmmoButton = document.getElementById("shopAmmo");
const shopBarrierButton = document.getElementById("shopBarrier");
const shopLifeButton = document.getElementById("shopLife");
const helpModeToggleButton = document.getElementById("helpModeToggle");
const tutorialToggle = document.getElementById("tutorialToggle");
const tutorialOverlay = document.getElementById("tutorialOverlay");
const tutorialTitle = document.getElementById("tutorialTitle");
const tutorialText = document.getElementById("tutorialText");
const tutorialStep = document.getElementById("tutorialStep");
const tutorialNextButton = document.getElementById("tutorialNext");
const tutorialSkipButton = document.getElementById("tutorialSkip");

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const SAVE_KEY = "zombie_apocalypse_save_v1";
const FINAL_STAGE = 6;

const difficultyConfig = {
  rookie: {
    label: "Rookie",
    enemyHp: 0.82,
    enemySpeed: 0.9,
    spawnRate: 1.12,
    bossHp: 0.84,
    bossSpeed: 0.9,
    livesBonus: 1,
    supplyBonus: 0.95
  },
  survivor: {
    label: "Survivor",
    enemyHp: 1,
    enemySpeed: 1,
    spawnRate: 1,
    bossHp: 1,
    bossSpeed: 1,
    livesBonus: 0,
    supplyBonus: 1
  },
  nightmare: {
    label: "Nightmare",
    enemyHp: 1.28,
    enemySpeed: 1.14,
    spawnRate: 0.86,
    bossHp: 1.35,
    bossSpeed: 1.12,
    livesBonus: -1,
    supplyBonus: 1.25
  }
};

const keys = {
  left: false,
  right: false,
  shoot: false,
  repair: false
};

const defaultProfile = {
  highScore: 0,
  totalKills: 0,
  supplies: 0,
  gamesPlayed: 0,
  upgrades: {
    damage: 0,
    fireRate: 0,
    armor: 0
  }
};

let profile = loadProfile();

const player = {
  width: 52,
  height: 24,
  x: GAME_WIDTH / 2 - 26,
  y: GAME_HEIGHT - 58,
  speed: 6,
  lives: 4,
  armor: 0,
  cooldown: 0,
  fireDelay: 11,
  ammo: 45,
  maxAmmo: 45,
  ammoRegenTick: 0,
  shotLevel: 1,
  bulletDamage: 1,
  spread: 10,
  grenadeCharges: 2,
  maxGrenades: 2,
  grenadeCooldown: 0,
  medkitCooldown: 0,
  medkitStrength: 1,
  scoreMultiplier: 1,
  scavengeBonus: 0
};

const prepBuffs = {
  weaponBoost: 0,
  ammoBoost: 0,
  barrierBoost: 0,
  lifeBoost: 0
};

const bullets = [];
const enemyBullets = [];
const enemies = [];
const pickups = [];
const objectiveItems = [];
const explosions = [];
const barriers = [];
const splats = [];
const embers = Array.from({ length: 24 }, () => ({
  x: Math.random() * GAME_WIDTH,
  y: Math.random() * GAME_HEIGHT,
  size: Math.random() * 2 + 1,
  speed: Math.random() * 0.9 + 0.2
}));
const stars = Array.from({ length: 100 }, () => ({
  x: Math.random() * GAME_WIDTH,
  y: Math.random() * GAME_HEIGHT,
  size: Math.random() * 2 + 1,
  speed: Math.random() * 0.8 + 0.2
}));

let score = 0;
let stage = 1;
let killsThisRun = 0;
let gameOver = false;
let gameStarted = false;
let gameOverHandled = false;
let frameId = null;
let spawnTimer = 0;
let boss = null;
let objective = null;
let objectiveSpawnTimer = 0;
let stageKillTarget = 22;
let stageKills = 0;
let stageBanner = "Outbreak - Day 1";
let stageBannerTimer = 180;
let runWon = false;
let selectedDifficulty = "survivor";

let audioCtx = null;
let musicOn = true;
let musicStarted = false;
let musicTimer = 0;
let musicStep = 0;
let helpModeOn = false;
let tutorialActive = false;
let tutorialIndex = 0;

const leadNotes = [329.63, 392, 440, 392, 293.66, 349.23, 392, 261.63];
const bassNotes = [82.41, 98, 110, 98, 73.42, 82.41, 98, 65.41];
const tutorialSteps = [
  {
    title: "Welcome",
    text: "Survive waves, complete the stage objective, reach the kill target, then defeat the stage boss."
  },
  {
    title: "Core Controls",
    text: "Move with A/D or Arrow keys, shoot with Space, use grenade with F, and medkit with E."
  },
  {
    title: "Defense",
    text: "Barriers protect you from zombies and projectiles. Repair them with B using score."
  },
  {
    title: "Progression",
    text: "Use upgrades for permanent boosts and shop items for next-run buffs before starting each mission."
  }
];

function cloneData(value) {
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
  } catch {
    // Fall through to JSON clone for older browsers.
  }
  return JSON.parse(JSON.stringify(value));
}

function getDifficulty() {
  return difficultyConfig[selectedDifficulty] || difficultyConfig.survivor;
}

function setHelpMode(enabled) {
  helpModeOn = enabled;
  document.body.classList.toggle("help-mode", helpModeOn);
  if (helpModeToggleButton) {
    helpModeToggleButton.textContent = `Help Mode: ${helpModeOn ? "ON" : "OFF"}`;
  }
}

function renderTutorialStep() {
  if (!tutorialActive || !tutorialTitle || !tutorialText || !tutorialStep || !tutorialNextButton) {
    return;
  }

  const step = tutorialSteps[tutorialIndex];
  tutorialTitle.textContent = step.title;
  tutorialText.textContent = step.text;
  tutorialStep.textContent = `Step ${tutorialIndex + 1} / ${tutorialSteps.length}`;
  tutorialNextButton.textContent = tutorialIndex === tutorialSteps.length - 1 ? "Finish" : "Next";
}

function closeTutorial() {
  tutorialActive = false;
  if (tutorialOverlay) {
    tutorialOverlay.classList.add("hidden");
  }
}

function openTutorial() {
  if (!tutorialOverlay) {
    return;
  }
  tutorialActive = true;
  tutorialIndex = 0;
  tutorialOverlay.classList.remove("hidden");
  renderTutorialStep();
}

function nextTutorialStep() {
  if (!tutorialActive) {
    return;
  }
  if (tutorialIndex >= tutorialSteps.length - 1) {
    closeTutorial();
    return;
  }
  tutorialIndex += 1;
  renderTutorialStep();
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return cloneData(defaultProfile);
    }
    const parsed = JSON.parse(raw);
    return {
      ...cloneData(defaultProfile),
      ...parsed,
      upgrades: {
        ...defaultProfile.upgrades,
        ...(parsed.upgrades || {})
      }
    };
  } catch {
    return cloneData(defaultProfile);
  }
}

function saveProfile() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
}

function getUpgradeCost(kind) {
  const level = profile.upgrades[kind] || 0;
  const base = kind === "armor" ? 16 : 12;
  return base + level * 12;
}

function refreshMenuText() {
  if (!saveStats) {
    return;
  }
  const damageCost = getUpgradeCost("damage");
  const fireRateCost = getUpgradeCost("fireRate");
  const armorCost = getUpgradeCost("armor");

  upgradeDamageButton.textContent = `Damage Lv ${profile.upgrades.damage} (${damageCost})`;
  upgradeFireRateButton.textContent = `Fire Rate Lv ${profile.upgrades.fireRate} (${fireRateCost})`;
  upgradeArmorButton.textContent = `Armor Lv ${profile.upgrades.armor} (${armorCost})`;
  upgradeDamageButton.title = `Permanent upgrade. Increases bullet damage for every run. Current level ${profile.upgrades.damage}. Cost ${damageCost} supplies.`;
  upgradeFireRateButton.title = `Permanent upgrade. Lowers fire cooldown for every run. Current level ${profile.upgrades.fireRate}. Cost ${fireRateCost} supplies.`;
  upgradeArmorButton.title = `Permanent upgrade. Reduces incoming damage for every run. Current level ${profile.upgrades.armor}. Cost ${armorCost} supplies.`;
  if (shopWeaponButton) {
    shopWeaponButton.textContent = "Weapon Crate (35)";
    shopWeaponButton.title = "One-time next-run buff: +1 weapon power and +1 bullet damage at mission start. Cost 35 supplies.";
  }
  if (shopAmmoButton) {
    shopAmmoButton.textContent = "Ammo Cache (24)";
    shopAmmoButton.title = "One-time next-run buff: extra starting and max ammo. Cost 24 supplies.";
  }
  if (shopBarrierButton) {
    shopBarrierButton.textContent = "Barrier Kit (28)";
    shopBarrierButton.title = "One-time next-run buff: stronger starting barriers. Cost 28 supplies.";
  }
  if (shopLifeButton) {
    shopLifeButton.textContent = "Med Supplies (30)";
    shopLifeButton.title = "One-time next-run buff: extra starting life. Cost 30 supplies.";
  }

  const pending = `Pending buffs - W:${prepBuffs.weaponBoost} A:${prepBuffs.ammoBoost} B:${prepBuffs.barrierBoost} L:${prepBuffs.lifeBoost}`;
  saveStats.textContent = `Supplies: ${profile.supplies} | High Score: ${profile.highScore} | Total Kills: ${profile.totalKills} | Runs: ${profile.gamesPlayed} | ${pending}`;
  startButton.title = "Starts the mission using selected weapon, utility kit, upgrades, and pending shop buffs.";
  resetSaveButton.title = "Resets saved profile data: supplies, upgrades, and lifetime stats.";
  if (helpModeToggleButton) {
    helpModeToggleButton.title = "Toggle expanded help mode to keep all ? help text visible.";
  }
}

function buyUpgrade(kind) {
  const cost = getUpgradeCost(kind);
  if (profile.supplies < cost) {
    stageBanner = "Not enough supplies";
    stageBannerTimer = 90;
    return;
  }
  profile.supplies -= cost;
  profile.upgrades[kind] += 1;
  saveProfile();
  refreshMenuText();
}

function buyShopItem(kind) {
  const costs = {
    weapon: 35,
    ammo: 24,
    barrier: 28,
    life: 30
  };
  const cost = costs[kind];
  if (!cost) {
    return;
  }
  if (profile.supplies < cost) {
    stageBanner = "Not enough supplies";
    stageBannerTimer = 90;
    return;
  }

  profile.supplies -= cost;
  if (kind === "weapon") {
    prepBuffs.weaponBoost += 1;
    stageBanner = "Bought: Weapon Crate";
  } else if (kind === "ammo") {
    prepBuffs.ammoBoost += 1;
    stageBanner = "Bought: Ammo Cache";
  } else if (kind === "barrier") {
    prepBuffs.barrierBoost += 1;
    stageBanner = "Bought: Barrier Kit";
  } else {
    prepBuffs.lifeBoost += 1;
    stageBanner = "Bought: Med Supplies";
  }
  stageBannerTimer = 95;
  saveProfile();
  refreshMenuText();
}

function addSplat(x, y, size, life) {
  splats.push({ x, y, size, life, maxLife: life });
}

function initAudio() {
  if (audioCtx) {
    return;
  }
  const AudioContextRef = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextRef) {
    return;
  }
  audioCtx = new AudioContextRef();
}

function playTone(freq, duration, type, volume) {
  if (!audioCtx || !musicOn) {
    return;
  }
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function sfxShoot() {
  if (!audioCtx) {
    return;
  }
  playTone(720, 0.07, "square", 0.03);
}

function sfxHit() {
  if (!audioCtx) {
    return;
  }
  playTone(230, 0.1, "triangle", 0.04);
}

function sfxPickup() {
  if (!audioCtx) {
    return;
  }
  playTone(900, 0.1, "triangle", 0.05);
}

function sfxExplosion() {
  if (!audioCtx) {
    return;
  }
  playTone(120, 0.2, "sawtooth", 0.05);
}

function musicTick() {
  if (!audioCtx || !musicOn || gameOver || !gameStarted) {
    return;
  }
  const lead = leadNotes[musicStep % leadNotes.length];
  const bass = bassNotes[musicStep % bassNotes.length];
  playTone(lead, 0.2, "triangle", 0.03);
  playTone(bass, 0.25, "sawtooth", 0.02);
  musicStep += 1;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function setStageObjective() {
  const objectiveType = ["rescue", "holdout", "extraction"][(stage - 1) % 3];

  if (objectiveType === "rescue") {
    objective = {
      type: "rescue",
      label: "Rescue survivors",
      target: 2 + Math.floor(stage / 4),
      progress: 0,
      timer: 0,
      completed: false
    };
  } else if (objectiveType === "holdout") {
    objective = {
      type: "holdout",
      label: "Hold out until evac",
      target: Math.max(520, 980 - stage * 28),
      progress: 0,
      timer: Math.max(520, 980 - stage * 28),
      completed: false
    };
  } else {
    objective = {
      type: "extraction",
      label: "Collect supply crates",
      target: 2 + Math.floor(stage / 3),
      progress: 0,
      timer: 0,
      completed: false
    };
  }

  objectiveItems.length = 0;
  objectiveSpawnTimer = 0;
  stageKillTarget = stage >= FINAL_STAGE ? 40 : 16 + stage * 4;
  stageKills = 0;
}

function applyPersistentUpgrades() {
  player.bulletDamage += profile.upgrades.damage;
  player.fireDelay = Math.max(5, player.fireDelay - profile.upgrades.fireRate);
  player.armor = Math.min(3, player.armor + profile.upgrades.armor);
}

function applyLoadout() {
  const weapon = weaponSelect.value;
  const utility = utilitySelect.value;
  const difficulty = getDifficulty();

  if (weapon === "shotgun") {
    player.shotLevel = 4;
    player.fireDelay = 14;
    player.bulletDamage = 3;
    player.maxAmmo = 40;
    player.ammo = 40;
    player.spread = 14;
  } else if (weapon === "smg") {
    player.shotLevel = 2;
    player.fireDelay = 5;
    player.bulletDamage = 2;
    player.maxAmmo = 84;
    player.ammo = 84;
    player.spread = 8;
  } else {
    player.shotLevel = 3;
    player.fireDelay = 8;
    player.bulletDamage = 2;
    player.maxAmmo = 60;
    player.ammo = 60;
    player.spread = 10;
  }

  if (utility === "grenadier") {
    player.maxGrenades = 4;
    player.grenadeCharges = 4;
  } else if (utility === "medic") {
    player.lives += 1;
    player.medkitStrength = 2;
  } else {
    player.scavengeBonus = 0.16;
    player.ammoRegenTick = 20;
  }

  player.lives = Math.max(1, player.lives + difficulty.livesBonus);

  applyPersistentUpgrades();
}

function applyPrepBuffs() {
  player.bulletDamage += prepBuffs.weaponBoost;
  player.shotLevel = Math.min(6, player.shotLevel + prepBuffs.weaponBoost);
  player.maxAmmo += prepBuffs.ammoBoost * 20;
  player.ammo = Math.min(player.maxAmmo, player.ammo + prepBuffs.ammoBoost * 20);
  player.lives += prepBuffs.lifeBoost;

  for (const barrier of barriers) {
    barrier.hp += prepBuffs.barrierBoost * 28;
    barrier.maxHp += prepBuffs.barrierBoost * 28;
  }

  prepBuffs.weaponBoost = 0;
  prepBuffs.ammoBoost = 0;
  prepBuffs.barrierBoost = 0;
  prepBuffs.lifeBoost = 0;
  refreshMenuText();
}

function initBarriers() {
  barriers.length = 0;
  const y = GAME_HEIGHT - 130;
  const width = 110;
  const height = 20;
  const gap = 75;
  const totalWidth = width * 3 + gap * 2;
  let x = (GAME_WIDTH - totalWidth) / 2;

  for (let i = 0; i < 3; i += 1) {
    barriers.push({
      x,
      y,
      width,
      height,
      hp: 74,
      maxHp: 74
    });
    x += width + gap;
  }
}

function resetGameState() {
  player.x = GAME_WIDTH / 2 - player.width / 2;
  player.lives = 4;
  player.armor = 0;
  player.cooldown = 0;
  player.fireDelay = 11;
  player.ammo = 45;
  player.maxAmmo = 45;
  player.ammoRegenTick = 0;
  player.shotLevel = 1;
  player.bulletDamage = 1;
  player.spread = 10;
  player.grenadeCharges = 2;
  player.maxGrenades = 2;
  player.grenadeCooldown = 0;
  player.medkitCooldown = 0;
  player.medkitStrength = 1;
  player.scoreMultiplier = 1;
  player.scavengeBonus = 0;

  bullets.length = 0;
  enemyBullets.length = 0;
  enemies.length = 0;
  pickups.length = 0;
  objectiveItems.length = 0;
  explosions.length = 0;
  barriers.length = 0;
  splats.length = 0;

  score = 0;
  killsThisRun = 0;
  stage = 1;
  spawnTimer = 0;
  boss = null;
  gameOver = false;
  gameOverHandled = false;
  stageBanner = "Outbreak - Day 1";
  stageBannerTimer = 190;
  runWon = false;

  setStageObjective();
  initBarriers();
}

function startMission() {
  selectedDifficulty = difficultySelect ? difficultySelect.value : "survivor";
  resetGameState();
  applyLoadout();
  applyPrepBuffs();
  gameStarted = true;
  startMenu.style.display = "none";
  stageBanner = `${getDifficulty().label} - Day ${stage}/${FINAL_STAGE}`;
  stageBannerTimer = 150;

  if (tutorialToggle && tutorialToggle.checked) {
    openTutorial();
  } else {
    closeTutorial();
  }
}

function finishRun() {
  if (gameOverHandled) {
    return;
  }
  gameOverHandled = true;

  const difficulty = getDifficulty();
  let gainedSupplies = Math.floor(score / 120) + stage * 3;
  gainedSupplies = Math.floor(gainedSupplies * difficulty.supplyBonus);
  if (runWon) {
    gainedSupplies += 80;
  }
  profile.supplies += gainedSupplies;
  profile.highScore = Math.max(profile.highScore, score);
  profile.totalKills += killsThisRun;
  profile.gamesPlayed += 1;
  saveProfile();
  refreshMenuText();

  startButton.textContent = runWon ? "Play Again" : "Start Next Mission";
  startMenu.style.display = "block";
  gameStarted = false;
  closeTutorial();
  stageBanner = runWon
    ? `Final Level Cleared! +${gainedSupplies} supplies`
    : `Run complete: +${gainedSupplies} supplies`;
  stageBannerTimer = 160;
}

function getZombieType() {
  const roll = Math.random();
  if (stage >= 5 && roll < 0.08) {
    return "brute";
  }
  if (stage >= 4 && roll < 0.2) {
    return "runner";
  }
  if (stage >= 6 && roll < 0.3) {
    return "spitter";
  }
  return "walker";
}

function makeZombie(type) {
  const difficulty = getDifficulty();

  if (type === "runner") {
    return {
      kind: "runner",
      width: 26,
      height: 22,
      hp: Math.max(1, Math.round((1 + Math.floor(stage / 4)) * difficulty.enemyHp)),
      speed: (randomRange(1.8, 2.5) + stage * 0.05) * difficulty.enemySpeed,
      color: "#c5ff5a",
      reward: 16,
      shootCooldown: 999
    };
  }

  if (type === "brute") {
    return {
      kind: "brute",
      width: 44,
      height: 30,
      hp: Math.max(2, Math.round((5 + stage) * difficulty.enemyHp)),
      speed: (randomRange(0.7, 1) + stage * 0.02) * difficulty.enemySpeed,
      color: "#84c750",
      reward: 30,
      shootCooldown: 999
    };
  }

  if (type === "spitter") {
    return {
      kind: "spitter",
      width: 32,
      height: 24,
      hp: Math.max(1, Math.round((2 + Math.floor(stage * 0.7)) * difficulty.enemyHp)),
      speed: (randomRange(1.1, 1.5) + stage * 0.03) * difficulty.enemySpeed,
      color: "#7af08c",
      reward: 22,
      shootCooldown: 80
    };
  }

  return {
    kind: "walker",
    width: 32,
    height: 26,
    hp: Math.max(1, Math.round((1 + Math.floor(stage / 4)) * difficulty.enemyHp)),
    speed: (randomRange(0.9, 1.3) + stage * 0.04) * difficulty.enemySpeed,
    color: "#9de96a",
    reward: 12,
    shootCooldown: 999
  };
}

function spawnZombie() {
  const type = getZombieType();
  const config = makeZombie(type);
  const x = Math.random() * (GAME_WIDTH - config.width);

  enemies.push({
    x,
    y: -config.height,
    width: config.width,
    height: config.height,
    hp: config.hp,
    maxHp: config.hp,
    speed: config.speed,
    color: config.color,
    kind: config.kind,
    reward: config.reward,
    wobble: Math.random() * Math.PI * 2,
    shootCooldown: config.shootCooldown
  });
}

function spawnBoss() {
  const difficulty = getDifficulty();
  const hp = Math.round((55 + stage * 16) * difficulty.bossHp);
  boss = {
    x: GAME_WIDTH / 2 - 105,
    y: 50,
    width: 210,
    height: 78,
    hp,
    maxHp: hp,
    speed: (2.2 + stage * 0.16) * difficulty.bossSpeed,
    direction: 1,
    shootCooldown: 50,
    slamCooldown: 160
  };
  stageBanner = stage >= FINAL_STAGE ? "Final Boss - Last Stand" : `Mutant Boss - Sector ${stage}`;
  stageBannerTimer = 170;
}

function advanceStage() {
  if (stage >= FINAL_STAGE) {
    return;
  }
  stage += 1;
  boss = null;
  stageBanner = `Outbreak - Day ${stage}`;
  stageBannerTimer = 150;
  setStageObjective();
}

function resolveBossDefeat() {
  if (!boss) {
    return;
  }

  score += 500 + stage * 140;
  maybeDropPickup(boss.x + 70, boss.y + boss.height + 6, "upgrade");
  maybeDropPickup(boss.x + 120, boss.y + boss.height + 6, "life");
  maybeDropPickup(boss.x + 20, boss.y + boss.height + 6, "grenade");

  if (stage >= FINAL_STAGE) {
    boss = null;
    runWon = true;
    gameOver = true;
    enemies.length = 0;
    enemyBullets.length = 0;
    objectiveItems.length = 0;
    stageBanner = "Final Level Complete";
    stageBannerTimer = 240;
    return;
  }

  advanceStage();
}

function maybeDropPickup(x, y, forcedType) {
  const dropRoll = Math.random();
  let type = forcedType || "";

  if (!type) {
    const bonus = player.scavengeBonus;
    if (dropRoll < 0.08 + bonus * 0.3) {
      type = "life";
    } else if (dropRoll < 0.25 + bonus * 0.5) {
      type = "ammo";
    } else if (dropRoll < 0.43 + bonus * 0.5) {
      type = "upgrade";
    } else if (dropRoll < 0.51 + bonus * 0.4) {
      type = "grenade";
    }
  }

  if (!type) {
    return;
  }

  pickups.push({
    x,
    y,
    width: 18,
    height: 18,
    type,
    speed: 2.2
  });
}

function fireWeapon() {
  if (player.cooldown > 0 || gameOver || player.ammo <= 0 || !gameStarted) {
    return;
  }

  const baseX = player.x + player.width / 2 - 2;
  const baseY = player.y - 12;

  for (let i = 0; i < player.shotLevel; i += 1) {
    const offset = (i - (player.shotLevel - 1) / 2) * player.spread;
    bullets.push({
      x: baseX + offset,
      y: baseY,
      width: 4,
      height: 12,
      speed: 9,
      damage: player.bulletDamage
    });
  }

  player.ammo -= 1;
  player.cooldown = player.fireDelay;
  sfxShoot();
}

function useGrenade() {
  if (!gameStarted || gameOver || player.grenadeCharges <= 0 || player.grenadeCooldown > 0) {
    return;
  }

  player.grenadeCharges -= 1;
  player.grenadeCooldown = 240;
  createExplosion(player.x + player.width / 2, player.y - 70, 95, 10 + stage);
}

function useMedkit() {
  if (!gameStarted || gameOver || player.medkitCooldown > 0 || player.lives >= 10) {
    return;
  }

  player.lives += player.medkitStrength;
  player.medkitCooldown = 520;
  stageBanner = "Medkit applied";
  stageBannerTimer = 80;
  sfxPickup();
}

function createExplosion(x, y, radius, damage) {
  explosions.push({
    x,
    y,
    radius,
    damage,
    life: 24
  });
  sfxExplosion();
}

function applyExplosionDamage(explosion) {
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const enemy = enemies[i];
    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height / 2;
    const dx = cx - explosion.x;
    const dy = cy - explosion.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= explosion.radius) {
      enemy.hp -= explosion.damage;
      if (enemy.hp <= 0) {
        score += Math.floor(enemy.reward * player.scoreMultiplier);
        killsThisRun += 1;
        stageKills += 1;
        maybeDropPickup(enemy.x + enemy.width / 2 - 9, enemy.y + 5);
        addSplat(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.kind === "brute" ? 24 : 16, 150);
        enemies.splice(i, 1);
      }
    }
  }

  if (boss) {
    const cx = boss.x + boss.width / 2;
    const cy = boss.y + boss.height / 2;
    const dx = cx - explosion.x;
    const dy = cy - explosion.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= explosion.radius + 40) {
      boss.hp -= explosion.damage;
      if (boss.hp <= 0) {
        resolveBossDefeat();
      }
    }
  }
}

function hurtPlayer(amount) {
  const reduced = Math.max(1, amount - player.armor);
  player.lives -= reduced;
  if (player.lives <= 0) {
    gameOver = true;
  }
}

function damageBarrier(barrier, amount) {
  barrier.hp -= amount;
  if (barrier.hp < 0) {
    barrier.hp = 0;
  }
}

function tryRepairBarrier() {
  if (!gameStarted || gameOver || score < 120) {
    return;
  }
  score -= 120;
  for (const barrier of barriers) {
    if (barrier.hp > 0) {
      barrier.hp = Math.min(barrier.maxHp, barrier.hp + 22);
    }
  }
  stageBanner = "Barriers repaired";
  stageBannerTimer = 80;
}

function applyUpgrade() {
  const options = ["fireRate", "multishot", "damage", "armor", "ammo", "grenade", "multiplier"];
  const pick = options[Math.floor(Math.random() * options.length)];

  if (pick === "fireRate") {
    player.fireDelay = Math.max(5, player.fireDelay - 1);
    stageBanner = "Upgrade: Faster Fire";
  } else if (pick === "multishot") {
    player.shotLevel = Math.min(5, player.shotLevel + 1);
    stageBanner = "Upgrade: Multi Shot";
  } else if (pick === "damage") {
    player.bulletDamage += 1;
    stageBanner = "Upgrade: Bullet Damage";
  } else if (pick === "armor") {
    player.armor = Math.min(3, player.armor + 1);
    stageBanner = "Upgrade: Armor Plates";
  } else if (pick === "ammo") {
    player.maxAmmo += 10;
    player.ammo = Math.min(player.maxAmmo, player.ammo + 18);
    stageBanner = "Upgrade: Ammo Racks";
  } else if (pick === "grenade") {
    player.maxGrenades = Math.min(6, player.maxGrenades + 1);
    player.grenadeCharges = Math.min(player.maxGrenades, player.grenadeCharges + 1);
    stageBanner = "Upgrade: Explosives Kit";
  } else {
    player.scoreMultiplier = Math.min(3, player.scoreMultiplier + 0.2);
    stageBanner = "Upgrade: Score Multiplier";
  }

  stageBannerTimer = 95;
  sfxPickup();
}

function spawnAcid(enemy) {
  enemyBullets.push({
    x: enemy.x + enemy.width / 2 - 3,
    y: enemy.y + enemy.height,
    width: 6,
    height: 13,
    speedX: randomRange(-0.6, 0.6),
    speedY: 2.8 + stage * 0.08,
    damage: 1
  });
}

function spawnBossVolley() {
  if (!boss) {
    return;
  }

  const shots = 5 + Math.floor(stage / 2);
  for (let i = 0; i < shots; i += 1) {
    const t = shots === 1 ? 0 : i / (shots - 1);
    const dir = -1.2 + t * 2.4;
    enemyBullets.push({
      x: boss.x + boss.width / 2 - 4,
      y: boss.y + boss.height,
      width: 8,
      height: 15,
      speedX: dir,
      speedY: 3 + stage * 0.09,
      damage: 1
    });
  }
}

function spawnObjectiveItem(type) {
  const width = 20;
  const x = Math.random() * (GAME_WIDTH - width);
  objectiveItems.push({
    x,
    y: -20,
    width,
    height: 20,
    type,
    speed: 1.8
  });
}

function updateObjective() {
  if (!objective || objective.completed) {
    return;
  }

  if (objective.type === "holdout") {
    objective.timer -= 1;
    objective.progress = objective.target - Math.max(0, objective.timer);
    if (objective.timer <= 0) {
      objective.completed = true;
      stageBanner = "Objective complete: Holdout";
      stageBannerTimer = 110;
    }
  } else {
    objectiveSpawnTimer += 1;
    const spawnGap = objective.type === "rescue" ? 210 : 230;
    if (objectiveSpawnTimer >= spawnGap) {
      spawnObjectiveItem(objective.type === "rescue" ? "survivor" : "supply");
      objectiveSpawnTimer = 0;
    }
  }

  for (let i = objectiveItems.length - 1; i >= 0; i -= 1) {
    const item = objectiveItems[i];
    item.y += item.speed;

    if (item.y > GAME_HEIGHT) {
      objectiveItems.splice(i, 1);
      continue;
    }

    if (rectsOverlap(player, item)) {
      objective.progress += 1;
      objectiveItems.splice(i, 1);
      sfxPickup();
      if (objective.progress >= objective.target) {
        objective.completed = true;
        stageBanner = `Objective complete: ${objective.label}`;
        stageBannerTimer = 120;
      }
    }
  }
}

function updateStars() {
  for (const star of stars) {
    star.y += star.speed;
    if (star.y > GAME_HEIGHT) {
      star.y = -star.size;
      star.x = Math.random() * GAME_WIDTH;
    }
  }

  for (const ember of embers) {
    ember.y += ember.speed;
    ember.x += Math.sin(ember.y * 0.02) * 0.35;
    if (ember.y > GAME_HEIGHT) {
      ember.y = -ember.size;
      ember.x = Math.random() * GAME_WIDTH;
    }
  }
}

function updatePlayer() {
  if (keys.left) {
    player.x -= player.speed;
  }
  if (keys.right) {
    player.x += player.speed;
  }
  player.x = clamp(player.x, 0, GAME_WIDTH - player.width);

  if (keys.shoot) {
    fireWeapon();
  }

  if (player.cooldown > 0) {
    player.cooldown -= 1;
  }

  if (player.grenadeCooldown > 0) {
    player.grenadeCooldown -= 1;
    if (player.grenadeCooldown % 180 === 0) {
      player.grenadeCharges = Math.min(player.maxGrenades, player.grenadeCharges + 1);
    }
  }

  if (player.medkitCooldown > 0) {
    player.medkitCooldown -= 1;
  }

  player.ammoRegenTick += 1;
  if (player.ammoRegenTick >= 65) {
    player.ammo = Math.min(player.maxAmmo, player.ammo + 1);
    player.ammoRegenTick = 0;
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    bullets[i].y -= bullets[i].speed;
    if (bullets[i].y + bullets[i].height < 0) {
      bullets.splice(i, 1);
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = enemyBullets[i];
    bullet.x += bullet.speedX;
    bullet.y += bullet.speedY;

    let barrierBlocked = false;
    for (const barrier of barriers) {
      if (barrier.hp > 0 && rectsOverlap(bullet, barrier)) {
        damageBarrier(barrier, 6);
        barrierBlocked = true;
        break;
      }
    }

    if (barrierBlocked) {
      enemyBullets.splice(i, 1);
      continue;
    }

    if (bullet.y > GAME_HEIGHT || bullet.x + bullet.width < 0 || bullet.x > GAME_WIDTH) {
      enemyBullets.splice(i, 1);
      continue;
    }

    if (rectsOverlap(player, bullet)) {
      enemyBullets.splice(i, 1);
      hurtPlayer(bullet.damage);
      if (gameOver) {
        return;
      }
    }
  }
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const enemy = enemies[i];
    enemy.y += enemy.speed;
    enemy.wobble += enemy.kind === "runner" ? 0.14 : 0.06;
    enemy.x += Math.sin(enemy.wobble) * (enemy.kind === "runner" ? 1.6 : 0.8);
    enemy.x = clamp(enemy.x, 0, GAME_WIDTH - enemy.width);

    if (enemy.kind === "spitter") {
      enemy.shootCooldown -= 1;
      if (enemy.shootCooldown <= 0) {
        spawnAcid(enemy);
        enemy.shootCooldown = Math.max(36, 86 - stage * 2);
      }
    }

    if (enemy.y > GAME_HEIGHT) {
      enemies.splice(i, 1);
      hurtPlayer(1);
      if (gameOver) {
        return;
      }
      continue;
    }

    let hitBarrier = false;
    for (const barrier of barriers) {
      if (barrier.hp > 0 && rectsOverlap(enemy, barrier)) {
        damageBarrier(barrier, enemy.kind === "brute" ? 16 : 10);
        enemies.splice(i, 1);
        hitBarrier = true;
        break;
      }
    }

    if (hitBarrier) {
      continue;
    }

    if (rectsOverlap(player, enemy)) {
      enemies.splice(i, 1);
      hurtPlayer(1);
      createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.kind === "brute" ? 70 : 40, 3);
      if (gameOver) {
        return;
      }
      continue;
    }

    for (let j = bullets.length - 1; j >= 0; j -= 1) {
      if (rectsOverlap(enemy, bullets[j])) {
        enemy.hp -= bullets[j].damage;
        bullets.splice(j, 1);

        if (enemy.hp <= 0) {
          score += Math.floor(enemy.reward * player.scoreMultiplier);
          killsThisRun += 1;
          stageKills += 1;
          maybeDropPickup(enemy.x + enemy.width / 2 - 9, enemy.y + 6);
          addSplat(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.kind === "brute" ? 24 : 16, 160);
          if (enemy.kind === "brute") {
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 65, 4);
          }
          sfxHit();
          enemies.splice(i, 1);
          break;
        }
      }
    }
  }
}

function updateBoss() {
  if (!boss) {
    return;
  }

  boss.x += boss.speed * boss.direction;
  if (boss.x <= 0 || boss.x + boss.width >= GAME_WIDTH) {
    boss.direction *= -1;
  }

  boss.shootCooldown -= 1;
  if (boss.shootCooldown <= 0) {
    spawnBossVolley();
    boss.shootCooldown = Math.max(28, 54 - stage * 2);
  }

  boss.slamCooldown -= 1;
  if (boss.slamCooldown <= 0) {
    createExplosion(boss.x + boss.width / 2, boss.y + boss.height + 30, 110, 2);
    boss.slamCooldown = 150;
  }

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    if (rectsOverlap(boss, bullets[i])) {
      boss.hp -= bullets[i].damage;
      bullets.splice(i, 1);
      if (boss.hp <= 0) {
        resolveBossDefeat();
        return;
      }
    }
  }

  if (rectsOverlap(player, boss)) {
    hurtPlayer(1);
  }
}

function updatePickups() {
  for (let i = pickups.length - 1; i >= 0; i -= 1) {
    const item = pickups[i];
    item.y += item.speed;

    if (item.y > GAME_HEIGHT) {
      pickups.splice(i, 1);
      continue;
    }

    if (rectsOverlap(player, item)) {
      if (item.type === "life") {
        player.lives += 1;
      } else if (item.type === "ammo") {
        player.maxAmmo += 4;
        player.ammo = Math.min(player.maxAmmo, player.ammo + 16);
      } else if (item.type === "upgrade") {
        applyUpgrade();
      } else if (item.type === "grenade") {
        player.grenadeCharges = Math.min(player.maxGrenades, player.grenadeCharges + 1);
      }
      sfxPickup();
      pickups.splice(i, 1);
    }
  }
}

function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i -= 1) {
    const ex = explosions[i];
    if (ex.life === 24) {
      applyExplosionDamage(ex);
    }
    ex.life -= 1;
    if (ex.life <= 0) {
      explosions.splice(i, 1);
    }
  }
}

function updateSplats() {
  for (let i = splats.length - 1; i >= 0; i -= 1) {
    splats[i].life -= 1;
    if (splats[i].life <= 0) {
      splats.splice(i, 1);
    }
  }
}

function updateStageFlow() {
  if (runWon) {
    return;
  }

  const stageReady = objective && objective.completed && stageKills >= stageKillTarget;

  if (!boss && stageReady) {
    if (enemies.length === 0) {
      spawnBoss();
    }
    return;
  }

  if (!boss) {
    const difficulty = getDifficulty();
    spawnTimer += 1;
    const spawnRate = Math.max(26, Math.floor((72 - stage * 2) * difficulty.spawnRate));
    if (spawnTimer >= spawnRate) {
      spawnZombie();
      spawnTimer = 0;
    }
  }
}

function getStageProgressRatio() {
  if (boss) {
    return 1;
  }

  const objectiveRatio = (() => {
    if (!objective) {
      return 0;
    }
    if (objective.type === "holdout") {
      return clamp(objective.progress / objective.target, 0, 1);
    }
    return clamp(objective.progress / objective.target, 0, 1);
  })();

  const killRatio = clamp(stageKills / stageKillTarget, 0, 1);
  return Math.min(objectiveRatio, killRatio);
}

function update() {
  if (!gameStarted) {
    updateStars();
    return;
  }

  if (tutorialActive) {
    updateStars();
    return;
  }

  if (!gameOver) {
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateBoss();
    updatePickups();
    updateObjective();
    updateExplosions();
    updateSplats();
    updateStageFlow();
  } else {
    finishRun();
  }

  if (stageBannerTimer > 0) {
    stageBannerTimer -= 1;
  }

  musicTimer += 1;
  if (musicTimer >= 24) {
    musicTick();
    musicTimer = 0;
  }

  updateStars();
}

function drawStars() {
  ctx.save();
  ctx.fillStyle = "rgba(212, 255, 214, 0.7)";
  for (const star of stars) {
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }

  ctx.fillStyle = "rgba(255, 164, 96, 0.45)";
  for (const ember of embers) {
    ctx.fillRect(ember.x, ember.y, ember.size, ember.size);
  }
  ctx.restore();
}

function drawBackgroundDetails() {
  ctx.save();

  const moonX = GAME_WIDTH - 90;
  const moonY = 90;
  const moonGrad = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 70);
  moonGrad.addColorStop(0, "rgba(220,255,226,0.9)");
  moonGrad.addColorStop(1, "rgba(220,255,226,0)");
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 70, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(20, 30, 26, 0.6)";
  const heights = [120, 180, 100, 150, 210, 130, 170];
  let x = -10;
  for (let i = 0; i < heights.length; i += 1) {
    ctx.fillRect(x, GAME_HEIGHT - 220 - heights[i], 100, heights[i]);
    x += 90;
  }

  ctx.fillStyle = "rgba(52, 78, 62, 0.5)";
  ctx.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);

  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.fillStyle = "#4de5ae";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "#c2ffe9";
  ctx.beginPath();
  ctx.moveTo(player.x + player.width / 2, player.y - 16);
  ctx.lineTo(player.x + player.width - 8, player.y + 6);
  ctx.lineTo(player.x + 8, player.y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBullets() {
  ctx.save();
  ctx.fillStyle = "#ffdf80";
  for (const bullet of bullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }

  ctx.fillStyle = "#8af769";
  for (const bullet of enemyBullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
  ctx.restore();
}

function drawEnemies() {
  ctx.save();
  for (const enemy of enemies) {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

    ctx.fillStyle = "#21390f";
    ctx.fillRect(enemy.x + 5, enemy.y + 5, 5, 5);
    ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + 5, 5, 5);

    if (enemy.hp > 1) {
      const hpBarW = enemy.width;
      const hpRatio = enemy.hp / enemy.maxHp;
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(enemy.x, enemy.y - 6, hpBarW, 3);
      ctx.fillStyle = "#ff6b6b";
      ctx.fillRect(enemy.x, enemy.y - 6, hpBarW * hpRatio, 3);
    }
  }
  ctx.restore();
}

function drawBoss() {
  if (!boss) {
    return;
  }

  ctx.save();
  ctx.fillStyle = "#7bc146";
  ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
  ctx.fillStyle = "#d0ff87";
  ctx.fillRect(boss.x + 24, boss.y + 16, 32, 20);
  ctx.fillRect(boss.x + boss.width - 56, boss.y + 16, 32, 20);

  const barW = 280;
  const barX = GAME_WIDTH / 2 - barW / 2;
  const hpRatio = Math.max(0, boss.hp / boss.maxHp);
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(barX, 54, barW, 13);
  ctx.fillStyle = "#fd5f5f";
  ctx.fillRect(barX, 54, barW * hpRatio, 13);
  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(barX, 54, barW, 13);
  ctx.restore();
}

function drawPickups() {
  ctx.save();
  for (const item of pickups) {
    if (item.type === "life") {
      ctx.fillStyle = "#4ef58e";
    } else if (item.type === "ammo") {
      ctx.fillStyle = "#73b9ff";
    } else if (item.type === "grenade") {
      ctx.fillStyle = "#ff895f";
    } else {
      ctx.fillStyle = "#ffd166";
    }
    ctx.fillRect(item.x, item.y, item.width, item.height);
  }
  ctx.restore();
}

function drawBarriers() {
  ctx.save();
  for (const barrier of barriers) {
    if (barrier.hp <= 0) {
      ctx.fillStyle = "rgba(80, 80, 80, 0.35)";
      ctx.fillRect(barrier.x, barrier.y, barrier.width, barrier.height);
      continue;
    }

    const hpRatio = barrier.hp / barrier.maxHp;
    ctx.fillStyle = "#5ec4ff";
    ctx.fillRect(barrier.x, barrier.y, barrier.width, barrier.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(barrier.x, barrier.y - 7, barrier.width, 4);
    ctx.fillStyle = "#7cff95";
    ctx.fillRect(barrier.x, barrier.y - 7, barrier.width * hpRatio, 4);
  }
  ctx.restore();
}

function drawSplats() {
  ctx.save();
  for (const splat of splats) {
    const alpha = splat.life / splat.maxLife;
    ctx.fillStyle = `rgba(145, 20, 28, ${0.5 * alpha})`;
    ctx.beginPath();
    ctx.arc(splat.x, splat.y, splat.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawObjectiveItems() {
  ctx.save();
  for (const item of objectiveItems) {
    ctx.fillStyle = item.type === "survivor" ? "#66f7ff" : "#ffcf5c";
    ctx.fillRect(item.x, item.y, item.width, item.height);
  }
  ctx.restore();
}

function drawExplosions() {
  ctx.save();
  for (const ex of explosions) {
    const alpha = ex.life / 24;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 131, 70, ${0.35 * alpha})`;
    ctx.arc(ex.x, ex.y, ex.radius * (1 - alpha * 0.5), 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = `rgba(255, 223, 140, ${0.7 * alpha})`;
    ctx.lineWidth = 2;
    ctx.arc(ex.x, ex.y, ex.radius * 0.8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFog() {
  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, "rgba(130, 180, 90, 0.09)");
  gradient.addColorStop(1, "rgba(40, 60, 30, 0.2)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.restore();
}

function getObjectiveText() {
  if (!objective) {
    return "Objective: --";
  }
  if (objective.type === "holdout") {
    const left = Math.ceil(Math.max(0, objective.timer) / 60);
    return `Objective: ${objective.label} (${left}s)`;
  }
  return `Objective: ${objective.label} (${objective.progress}/${objective.target})`;
}

function drawHud() {
  ctx.save();
  const difficulty = getDifficulty();
  ctx.fillStyle = "#ebffe8";
  ctx.font = "bold 20px Trebuchet MS";
  ctx.fillText(`Score: ${score}`, 14, 28);
  ctx.fillText(`Day: ${stage}/${FINAL_STAGE}`, 14, 54);
  ctx.fillText(`Lives: ${player.lives}`, GAME_WIDTH - 110, 28);
  ctx.fillText(`Ammo: ${player.ammo}/${player.maxAmmo}`, GAME_WIDTH - 190, 54);
  ctx.fillText(`Weapon Lv: ${player.shotLevel}`, GAME_WIDTH - 160, 80);

  ctx.font = "14px Trebuchet MS";
  ctx.fillStyle = "#cde5d0";
  ctx.fillText(`Armor: ${player.armor}  Mult: x${player.scoreMultiplier.toFixed(1)}`, 14, 78);
  ctx.fillText(`Grenades: ${player.grenadeCharges}/${player.maxGrenades} (F)`, 14, 98);
  ctx.fillText(`Medkit: ${Math.ceil(player.medkitCooldown / 60)}s (E)`, GAME_WIDTH - 160, 98);
  ctx.fillText(getObjectiveText(), 14, 118);
  ctx.fillText(`Music: ${musicOn ? "ON" : "OFF"} (M)`, GAME_WIDTH - 130, 118);
  ctx.fillText(`Supplies: ${profile.supplies}`, GAME_WIDTH - 140, 138);
  ctx.fillText(`Mode: ${difficulty.label}`, 14, 158);
  ctx.fillText("Repair barriers: 120 score (B)", 14, 138);

  const progressRatio = getStageProgressRatio();
  const barX = GAME_WIDTH / 2 - 120;
  const barY = 16;
  const barW = 240;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(barX, barY, barW, 10);
  ctx.fillStyle = boss ? "#ff8466" : "#6ef7a5";
  ctx.fillRect(barX, barY, barW * progressRatio, 10);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.strokeRect(barX, barY, barW, 10);
  ctx.fillStyle = "#d6ffe4";
  ctx.font = "12px Trebuchet MS";
  const progressLabel = boss ? "Boss Fight" : `Stage Progress ${Math.floor(progressRatio * 100)}%`;
  ctx.fillText(progressLabel, GAME_WIDTH / 2 - 45, 40);

  if (player.grenadeCooldown > 0) {
    ctx.fillStyle = "#ffb18a";
    ctx.fillText(`Explosive CD: ${Math.ceil(player.grenadeCooldown / 60)}s`, GAME_WIDTH - 190, 138);
  }
  ctx.restore();
}

function drawStageBanner() {
  if (stageBannerTimer <= 0) {
    return;
  }
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(240, 255, 232, 0.95)";
  ctx.font = "bold 34px Trebuchet MS";
  ctx.fillText(stageBanner, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110);
  ctx.restore();
}

function drawGameOver() {
  if (!gameOver) {
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 50px Trebuchet MS";
  ctx.fillText(runWon ? "CITY SAVED" : "YOU WERE OVERRUN", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
  ctx.font = "22px Trebuchet MS";
  ctx.fillText(`Final Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
  ctx.fillText(
    runWon ? "Final level complete. Start a new campaign." : "Choose loadout and start next mission",
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2 + 44
  );
  ctx.restore();
}

function drawIdleOverlay() {
  if (gameStarted) {
    return;
  }
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 36px Trebuchet MS";
  ctx.fillText("Prepare Your Mission", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
  ctx.font = "20px Trebuchet MS";
  ctx.fillText("Select loadout and press Start Mission", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawStars();

  if (gameStarted) {
    drawBackgroundDetails();
    drawPlayer();
    drawBullets();
    drawBarriers();
    drawSplats();
    drawEnemies();
    drawBoss();
    drawPickups();
    drawObjectiveItems();
    drawExplosions();
    drawFog();
    drawHud();
    drawStageBanner();
    drawGameOver();
  } else {
    drawFog();
    drawIdleOverlay();
  }
}

function gameLoop() {
  update();
  draw();
  frameId = requestAnimationFrame(gameLoop);
}

if (startButton) {
  startButton.addEventListener("click", () => {
    startMission();
  });
}

if (resetSaveButton) {
  resetSaveButton.addEventListener("click", () => {
    profile = cloneData(defaultProfile);
    saveProfile();
    refreshMenuText();
  });
}

if (upgradeDamageButton) {
  upgradeDamageButton.addEventListener("click", () => buyUpgrade("damage"));
}
if (upgradeFireRateButton) {
  upgradeFireRateButton.addEventListener("click", () => buyUpgrade("fireRate"));
}
if (upgradeArmorButton) {
  upgradeArmorButton.addEventListener("click", () => buyUpgrade("armor"));
}
if (shopWeaponButton) {
  shopWeaponButton.addEventListener("click", () => buyShopItem("weapon"));
}
if (shopAmmoButton) {
  shopAmmoButton.addEventListener("click", () => buyShopItem("ammo"));
}
if (shopBarrierButton) {
  shopBarrierButton.addEventListener("click", () => buyShopItem("barrier"));
}
if (shopLifeButton) {
  shopLifeButton.addEventListener("click", () => buyShopItem("life"));
}
if (helpModeToggleButton) {
  helpModeToggleButton.addEventListener("click", () => {
    setHelpMode(!helpModeOn);
  });
}
if (tutorialNextButton) {
  tutorialNextButton.addEventListener("click", () => {
    nextTutorialStep();
  });
}
if (tutorialSkipButton) {
  tutorialSkipButton.addEventListener("click", () => {
    closeTutorial();
  });
}

window.addEventListener("keydown", (event) => {
  if (tutorialActive) {
    if (event.code === "Enter" || event.code === "Space") {
      nextTutorialStep();
      event.preventDefault();
    }
    if (event.code === "Escape") {
      closeTutorial();
      event.preventDefault();
    }
    return;
  }

  if (!musicStarted) {
    initAudio();
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    musicStarted = true;
  }

  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    keys.left = true;
  }
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    keys.right = true;
  }
  if (event.code === "Space") {
    keys.shoot = true;
    event.preventDefault();
  }
  if (event.code === "KeyF") {
    useGrenade();
  }
  if (event.code === "KeyE") {
    useMedkit();
  }
  if (event.code === "KeyB") {
    tryRepairBarrier();
  }
  if (event.code === "KeyM") {
    musicOn = !musicOn;
  }
  if (event.code === "KeyH") {
    setHelpMode(!helpModeOn);
  }
  if (event.code === "KeyR" && gameOver) {
    startMission();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    keys.left = false;
  }
  if (event.code === "ArrowRight" || event.code === "KeyD") {
    keys.right = false;
  }
  if (event.code === "Space") {
    keys.shoot = false;
    event.preventDefault();
  }
});

refreshMenuText();
setHelpMode(false);
if (frameId) {
  cancelAnimationFrame(frameId);
}
gameLoop();
