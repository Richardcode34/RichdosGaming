(function () {
  const MUSIC_ENABLED_KEY = "rgw_music_enabled_v1";
  const MUSIC_VOLUME_KEY = "rgw_music_volume_v1";
  const MUSIC_THEME_MODE_KEY = "rgw_music_theme_mode_v1";
  const MUSIC_LAST_AUTO_THEME_KEY = "rgw_music_last_auto_theme_v1";

  let audioCtx = null;
  let noiseBuffer = null;
  let musicTimer = null;
  let step = 0;
  let loopCount = 0;
  let phraseShift = 0;
  let bassShift = 0;
  let enabled = localStorage.getItem(MUSIC_ENABLED_KEY) !== "0";
  let themeMode = localStorage.getItem(MUSIC_THEME_MODE_KEY) || "auto";
  let volume = Number(localStorage.getItem(MUSIC_VOLUME_KEY) || "0.025");
  if (!Number.isFinite(volume) || volume <= 0) {
    volume = 0.025;
  }

  const THEMES = {
    home: {
      tempo: 360,
      lead: [261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66],
      bass: [65.41, 73.42, 82.41, 98, 110, 98, 82.41, 73.42],
      leadType: "triangle",
      bassType: "sine",
      leadVol: 1,
      bassVol: 0.6
    },
    shooting: {
      tempo: 300,
      lead: [329.63, 392, 523.25, 392, 349.23, 440, 587.33, 440],
      bass: [82.41, 98, 130.81, 98, 87.31, 110, 146.83, 110],
      leadType: "sawtooth",
      bassType: "triangle",
      leadVol: 0.9,
      bassVol: 0.65
    },
    racing: {
      tempo: 260,
      lead: [293.66, 329.63, 349.23, 392, 440, 493.88, 440, 392],
      bass: [73.42, 82.41, 87.31, 98, 110, 123.47, 110, 98],
      leadType: "square",
      bassType: "sawtooth",
      leadVol: 0.8,
      bassVol: 0.75
    },
    puzzle: {
      tempo: 460,
      lead: [261.63, 329.63, 392, 329.63, 293.66, 349.23, 392, 349.23],
      bass: [65.41, 82.41, 98, 82.41, 73.42, 87.31, 98, 87.31],
      leadType: "sine",
      bassType: "triangle",
      leadVol: 0.85,
      bassVol: 0.45
    },
    arcade: {
      tempo: 320,
      lead: [392, 523.25, 587.33, 523.25, 440, 493.88, 523.25, 440],
      bass: [98, 130.81, 146.83, 130.81, 110, 123.47, 130.81, 110],
      leadType: "triangle",
      bassType: "square",
      leadVol: 0.9,
      bassVol: 0.55
    },
    realistic: {
      tempo: 390,
      lead: [220, 261.63, 293.66, 261.63, 246.94, 293.66, 329.63, 293.66],
      bass: [55, 65.41, 73.42, 65.41, 61.74, 73.42, 82.41, 73.42],
      leadType: "sine",
      bassType: "sine",
      leadVol: 0.7,
      bassVol: 0.5
    },
    party: {
      tempo: 280,
      lead: [392, 440, 523.25, 659.25, 523.25, 493.88, 440, 392],
      bass: [98, 110, 130.81, 164.81, 130.81, 123.47, 110, 98],
      leadType: "square",
      bassType: "triangle",
      leadVol: 1,
      bassVol: 0.7
    },
    rhythm: {
      tempo: 220,
      lead: [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 587.33],
      bass: [130.81, 164.81, 196, 164.81, 146.83, 164.81, 130.81, 146.83],
      pulse: [261.63, 261.63, 293.66, 261.63, 261.63, 329.63, 293.66, 261.63],
      leadType: "square",
      bassType: "sawtooth",
      pulseType: "triangle",
      leadVol: 1,
      bassVol: 0.72,
      pulseVol: 0.35
    },
    stealth: {
      tempo: 340,
      lead: [246.94, 261.63, 293.66, 261.63, 233.08, 246.94, 220, 196],
      bass: [61.74, 65.41, 73.42, 65.41, 58.27, 61.74, 55, 49],
      pulse: [123.47, 130.81, 146.83, 130.81, 123.47, 116.54, 110, 98],
      leadType: "sine",
      bassType: "triangle",
      pulseType: "sine",
      leadVol: 0.72,
      bassVol: 0.52,
      pulseVol: 0.24
    },
    tycoon: {
      tempo: 300,
      lead: [329.63, 392, 440, 392, 349.23, 392, 493.88, 440],
      bass: [82.41, 98, 110, 98, 87.31, 98, 123.47, 110],
      pulse: [164.81, 196, 220, 196, 174.61, 196, 246.94, 220],
      leadType: "triangle",
      bassType: "sine",
      pulseType: "square",
      leadVol: 0.82,
      bassVol: 0.6,
      pulseVol: 0.22
    },
    chill: {
      tempo: 420,
      lead: [261.63, 293.66, 329.63, 349.23, 392, 349.23, 329.63, 293.66],
      bass: [65.41, 73.42, 82.41, 87.31, 98, 87.31, 82.41, 73.42],
      leadType: "sine",
      bassType: "sine",
      leadVol: 0.68,
      bassVol: 0.4
    },
    minecraft: {
      tempo: 520,
      lead: [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23],
      bass: [65.41, 82.41, 98, 82.41, 73.42, 87.31, 110, 87.31],
      pulse: [130.81, 164.81, 196, 164.81, 146.83, 174.61, 220, 174.61],
      leadType: "sine",
      bassType: "sine",
      pulseType: "triangle",
      leadVol: 0.58,
      bassVol: 0.42,
      pulseVol: 0.14
    },
    forest: {
      tempo: 500,
      lead: [293.66, 329.63, 392, 349.23, 329.63, 293.66, 261.63, 293.66],
      bass: [73.42, 82.41, 98, 87.31, 82.41, 73.42, 65.41, 73.42],
      pulse: [146.83, 164.81, 196, 174.61, 164.81, 146.83, 130.81, 146.83],
      leadType: "triangle",
      bassType: "sine",
      pulseType: "sine",
      leadVol: 0.62,
      bassVol: 0.4,
      pulseVol: 0.16
    },
    ocean: {
      tempo: 430,
      lead: [329.63, 392, 440, 392, 349.23, 329.63, 293.66, 329.63],
      bass: [82.41, 98, 110, 98, 87.31, 82.41, 73.42, 82.41],
      pulse: [164.81, 196, 220, 196, 174.61, 164.81, 146.83, 164.81],
      leadType: "sine",
      bassType: "triangle",
      pulseType: "triangle",
      leadVol: 0.66,
      bassVol: 0.44,
      pulseVol: 0.18
    },
    desert: {
      tempo: 360,
      lead: [293.66, 349.23, 392, 349.23, 329.63, 293.66, 261.63, 293.66],
      bass: [73.42, 87.31, 98, 87.31, 82.41, 73.42, 65.41, 73.42],
      pulse: [146.83, 174.61, 196, 174.61, 164.81, 146.83, 130.81, 146.83],
      leadType: "sawtooth",
      bassType: "sine",
      pulseType: "square",
      leadVol: 0.54,
      bassVol: 0.42,
      pulseVol: 0.15
    },
    rain: {
      tempo: 560,
      lead: [220, 246.94, 261.63, 293.66, 261.63, 246.94, 220, 196],
      bass: [55, 61.74, 65.41, 73.42, 65.41, 61.74, 55, 49],
      pulse: [110, 123.47, 130.81, 146.83, 130.81, 123.47, 110, 98],
      leadType: "sine",
      bassType: "sine",
      pulseType: "triangle",
      leadVol: 0.52,
      bassVol: 0.34,
      pulseVol: 0.12
    },
    lounge: {
      tempo: 500,
      lead: [261.63, 329.63, 349.23, 392, 349.23, 329.63, 293.66, 261.63],
      bass: [65.41, 82.41, 87.31, 98, 87.31, 82.41, 73.42, 65.41],
      pulse: [130.81, 164.81, 174.61, 196, 174.61, 164.81, 146.83, 130.81],
      leadType: "triangle",
      bassType: "sine",
      pulseType: "sine",
      leadVol: 0.56,
      bassVol: 0.38,
      pulseVol: 0.14
    }
  };

  // Convert legacy arcade timbres to calmer ambient defaults.
  Object.keys(THEMES).forEach(function (k) {
    const t = THEMES[k];
    if (!t) return;
    t.tempo = Math.max(360, Number(t.tempo) + 120);
    if (t.leadType === "square" || t.leadType === "sawtooth") t.leadType = "triangle";
    if (t.bassType === "square" || t.bassType === "sawtooth") t.bassType = "sine";
    if (t.pulseType === "square" || t.pulseType === "sawtooth") t.pulseType = "triangle";
    t.leadVol = Math.min(0.78, Number(t.leadVol || 0.7));
    t.bassVol = Math.min(0.55, Number(t.bassVol || 0.45));
    if (t.pulseVol) t.pulseVol = Math.min(0.2, Number(t.pulseVol));
  });

  const THEME_LABELS = {
    auto: "Auto",
    minecraft: "Minecraft-Like",
    home: "Home",
    shooting: "Shooting",
    racing: "Racing",
    puzzle: "Puzzle",
    arcade: "Arcade",
    realistic: "Realistic",
    party: "Party",
    rhythm: "Rhythm",
    stealth: "Stealth",
    tycoon: "Tycoon",
    chill: "Chill",
    forest: "Forest",
    ocean: "Ocean",
    desert: "Desert"
    ,
    rain: "Rain",
    lounge: "Lounge"
  };

  function getThemeIdFromPath() {
    const path = (location.pathname || "").toLowerCase();

    if (path.indexOf("page-1-shooting") >= 0 || path.indexOf("/games/zombie") >= 0 || path.indexOf("/games/bot-strike") >= 0 || path.indexOf("/games/laser-gauntlet") >= 0 || path.indexOf("/games/sky-blitz") >= 0 || path.indexOf("/games/tank-blitz") >= 0 || path.indexOf("/games/mech-defense") >= 0 || path.indexOf("/games/urban-sniper") >= 0 || path.indexOf("/games/target-blast") >= 0) {
      return "shooting";
    }
    if (path.indexOf("page-2-racing") >= 0 || path.indexOf("/games/turbo-street-racer") >= 0 || path.indexOf("/games/canyon-drift") >= 0 || path.indexOf("/games/drift-city-sim") >= 0 || path.indexOf("/games/bike-trial") >= 0 || path.indexOf("/games/city-parking-pro") >= 0) {
      return "racing";
    }
    if (path.indexOf("page-3-puzzle") >= 0 || path.indexOf("/games/memory-flip") >= 0 || path.indexOf("/games/maze-escape") >= 0 || path.indexOf("/games/number-ninja") >= 0 || path.indexOf("/games/word-sprint") >= 0 || path.indexOf("/games/block-builder") >= 0 || path.indexOf("/games/pattern-guard") >= 0 || path.indexOf("/games/brain-buzz") >= 0) {
      return "puzzle";
    }
    if (path.indexOf("page-4-arcade") >= 0 || path.indexOf("/games/quick-dodge") >= 0 || path.indexOf("/games/snake-rush") >= 0 || path.indexOf("/games/orbit-runner") >= 0 || path.indexOf("/games/color-rush") >= 0 || path.indexOf("/games/asteroid-miner") >= 0 || path.indexOf("/games/sky-hop") >= 0 || path.indexOf("/games/tower-commander") >= 0) {
      return "arcade";
    }
    if (path.indexOf("page-5-realistic") >= 0 || path.indexOf("/games/penalty-pro") >= 0 || path.indexOf("/games/farm-day") >= 0) {
      return "realistic";
    }
    if (path.indexOf("/games/stealth-heist") >= 0) {
      return "stealth";
    }
    if (path.indexOf("/games/island-tycoon") >= 0) {
      return "tycoon";
    }
    if (path.indexOf("/games/rhythm-smash") >= 0) {
      return "rhythm";
    }
    if (path.indexOf("page-7-minecraft") >= 0 || path.indexOf("/games/voxel-builder") >= 0 || path.indexOf("/games/mine-crafter-survival") >= 0 || path.indexOf("/games/minecraft-parkour") >= 0 || path.indexOf("/games/minecraft-skyblock") >= 0) {
      return "minecraft";
    }
    if (path.indexOf("/games/neon-runner-3d") >= 0 || path.indexOf("/games/sky-cube-assault-3d") >= 0 || path.indexOf("/games/crystal-tunnel-3d") >= 0) {
      return "forest";
    }
    if (path.indexOf("/games/multiplayer-orb-rush") >= 0 || path.indexOf("/games/multiplayer-drift-duel") >= 0) {
      return "ocean";
    }
    if (path.indexOf("/games/ocean-rescue") >= 0) {
      return "ocean";
    }
    if (path.indexOf("page-6-party") >= 0 || path.indexOf("/games/duel-arena") >= 0) {
      return "party";
    }
    if (path.indexOf("account.html") >= 0 || path.indexOf("leaderboard.html") >= 0 || path.indexOf("inventory.html") >= 0 || path.indexOf("updates.html") >= 0) {
      return "chill";
    }
    return "home";
  }

  function resolveThemeId() {
    if (themeMode && themeMode !== "auto" && THEMES[themeMode]) {
      return themeMode;
    }
    const base = getThemeIdFromPath();
    const groups = {
      home: ["home", "chill", "lounge", "rain"],
      shooting: ["shooting", "arcade", "party", "rhythm"],
      racing: ["racing", "arcade", "party"],
      puzzle: ["puzzle", "chill", "forest", "lounge"],
      arcade: ["arcade", "party", "rhythm", "shooting"],
      realistic: ["realistic", "chill", "forest", "rain"],
      party: ["party", "arcade", "rhythm"],
      rhythm: ["rhythm", "party", "arcade"],
      stealth: ["stealth", "rain", "chill", "forest"],
      tycoon: ["tycoon", "lounge", "chill", "home"],
      chill: ["chill", "lounge", "rain", "ocean"],
      minecraft: ["minecraft", "forest", "rain", "chill"],
      forest: ["forest", "rain", "minecraft", "chill"],
      ocean: ["ocean", "rain", "chill", "lounge"],
      desert: ["desert", "tycoon", "realistic", "arcade"],
      rain: ["rain", "ocean", "forest", "chill"],
      lounge: ["lounge", "chill", "home", "rain"]
    };
    const pool = groups[base] || [base, "chill", "lounge"];
    const last = String(localStorage.getItem(MUSIC_LAST_AUTO_THEME_KEY) || "");
    const candidates = pool.filter(function (x) { return THEMES[x]; }).filter(function (x) { return x !== last; });
    const list = candidates.length ? candidates : pool;
    const picked = list[Math.floor(Math.random() * list.length)] || base;
    localStorage.setItem(MUSIC_LAST_AUTO_THEME_KEY, picked);
    return picked;
  }

  let activeThemeId = resolveThemeId();
  let activeTheme = THEMES[activeThemeId] || THEMES.home;

  function ensureAudio() {
    if (audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    return audioCtx;
  }

  function ensureNoiseBuffer() {
    if (!audioCtx) return null;
    if (noiseBuffer) return noiseBuffer;
    const len = audioCtx.sampleRate * 0.25;
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffer = buf;
    return noiseBuffer;
  }

  function tone(freq, dur, type, amp) {
    if (!audioCtx || !enabled) return;

    const now = audioCtx.currentTime;
    const oscA = audioCtx.createOscillator();
    const oscB = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    oscA.type = type || "triangle";
    oscB.type = type === "sine" ? "triangle" : type || "triangle";
    oscA.frequency.value = freq;
    oscB.frequency.value = freq;
    oscA.detune.value = -6;
    oscB.detune.value = 6;

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(4200, freq * 6 + 500), now);
    filter.Q.value = 0.7;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, amp), now + 0.03);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, amp * 0.75), now + dur * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    oscA.connect(gain);
    oscB.connect(gain);
    gain.connect(filter);
    filter.connect(audioCtx.destination);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + dur + 0.04);
    oscB.stop(now + dur + 0.04);
  }

  function playPad(rootFreq, amp) {
    if (!rootFreq) return;
    tone(rootFreq, 0.85, "sine", amp * 0.7);
    tone(rootFreq * 1.25, 0.85, "triangle", amp * 0.5);
    tone(rootFreq * 1.5, 0.85, "sine", amp * 0.4);
  }

  function playKick(amp) {
    if (!audioCtx || !enabled) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(46, now + 0.14);
    gain.gain.setValueAtTime(Math.max(0.0001, amp), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  function playHat(amp) {
    if (!audioCtx || !enabled) return;
    const src = audioCtx.createBufferSource();
    src.buffer = ensureNoiseBuffer();
    if (!src.buffer) return;
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    filter.type = "highpass";
    filter.frequency.value = 5000;
    gain.gain.setValueAtTime(Math.max(0.0001, amp), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    src.start(now);
    src.stop(now + 0.07);
  }

  function themeUsesBeat(themeId) {
    return themeId === "rhythm";
  }

  function musicTick() {
    if (!enabled || !audioCtx) return;
    const i = (step + phraseShift) % activeTheme.lead.length;
    const nextIdx = (i + 1) % activeTheme.lead.length;
    const bi = (step + bassShift) % activeTheme.bass.length;
    const leadDur = activeTheme.tempo >= 520 ? 0.62 : 0.42;
    const bassDur = activeTheme.tempo >= 520 ? 0.76 : 0.5;

    tone(activeTheme.lead[i], leadDur, activeTheme.leadType, volume * activeTheme.leadVol);
    tone(activeTheme.lead[nextIdx] * 0.5, leadDur + 0.08, "sine", volume * 0.16);
    tone(activeTheme.bass[bi], bassDur, activeTheme.bassType, volume * activeTheme.bassVol);
    if (activeTheme.pulse && activeTheme.pulse.length) {
      const pi = (step + phraseShift) % activeTheme.pulse.length;
      tone(activeTheme.pulse[pi], 0.34, activeTheme.pulseType || "triangle", volume * (activeTheme.pulseVol || 0.2));
    }

    if (step % 2 === 0) {
      playPad(activeTheme.bass[i] * 2, volume * 0.2);
    }

    if (themeUsesBeat(activeThemeId)) {
      if (step % 2 === 0) {
        playKick(volume * 0.45);
      } else {
        playHat(volume * 0.2);
      }
    }

    step += 1;
    if (step % activeTheme.lead.length === 0) {
      loopCount += 1;
      phraseShift = (phraseShift + 2) % activeTheme.lead.length;
      bassShift = (bassShift + 1) % activeTheme.bass.length;
      if (themeMode === "auto" && loopCount % 4 === 0) {
        activeThemeId = resolveThemeId();
        activeTheme = THEMES[activeThemeId] || THEMES.home;
        phraseShift = 0;
        bassShift = 0;
        updateThemeLabel();
      }
    }
  }

  function startMusic() {
    if (!enabled) return;
    const ctx = ensureAudio();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    if (!musicTimer) {
      musicTimer = setInterval(musicTick, activeTheme.tempo);
    }
  }

  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function restartMusicWithTheme() {
    stopMusic();
    step = 0;
    loopCount = 0;
    phraseShift = 0;
    bassShift = 0;
    activeThemeId = resolveThemeId();
    activeTheme = THEMES[activeThemeId] || THEMES.home;
    startMusic();
    updateThemeLabel();
  }

  function updateThemeLabel() {
    const tag = document.getElementById("rgwMusicTheme");
    if (!tag) return;
    const modeText = themeMode === "auto" ? "auto" : "manual";
    const label = THEME_LABELS[activeThemeId] || activeThemeId;
    tag.textContent = "Theme: " + label + " (" + modeText + ")";
  }

  function setThemeMode(nextMode) {
    const m = String(nextMode || "auto");
    themeMode = m;
    localStorage.setItem(MUSIC_THEME_MODE_KEY, m);
    restartMusicWithTheme();
  }

  function setEnabled(next) {
    enabled = !!next;
    localStorage.setItem(MUSIC_ENABLED_KEY, enabled ? "1" : "0");
    if (enabled) {
      startMusic();
    } else {
      stopMusic();
    }
    updateButton();
  }

  function updateButton() {
    const btn = document.getElementById("rgwMusicBtn");
    if (!btn) return;
    btn.textContent = enabled ? "Music: ON" : "Music: OFF";
  }

  function injectUI() {
    const wrap = document.createElement("div");
    wrap.className = "rgw-music-wrap";
    wrap.innerHTML = '<button id="rgwMusicBtn" type="button">Music: ON</button><select id="rgwMusicMode"></select><span id="rgwMusicTheme"></span>';

    const style = document.createElement("style");
    style.textContent =
      ".rgw-music-wrap{position:fixed;left:86px;top:10px;z-index:10001;display:flex;align-items:center;gap:8px}" +
      ".rgw-music-wrap button{border:1px solid rgba(174,234,255,.65);background:rgba(15,40,63,.94);color:#eef8ff;padding:6px 10px;border-radius:9px;font:700 12px Trebuchet MS,sans-serif;cursor:pointer}" +
      ".rgw-music-wrap select{border:1px solid rgba(174,234,255,.65);background:rgba(12,34,52,.95);color:#eef8ff;padding:5px 8px;border-radius:8px;font:700 12px Trebuchet MS,sans-serif}" +
      ".rgw-music-wrap button:hover{background:rgba(29,72,108,.94)}" +
      ".rgw-music-wrap span{color:#cfe9ff;font:700 11px Trebuchet MS,sans-serif;background:rgba(9,26,41,.9);border:1px solid rgba(163,225,255,.5);padding:4px 7px;border-radius:8px}" +
      "@media (max-width: 980px){.rgw-music-wrap{left:74px;top:10px;gap:6px}.rgw-music-wrap span{display:none}}";

    document.head.appendChild(style);
    document.body.appendChild(wrap);

    const btn = document.getElementById("rgwMusicBtn");
    const mode = document.getElementById("rgwMusicMode");
    const themeTag = document.getElementById("rgwMusicTheme");

    const keys = ["auto", "rain", "lounge", "minecraft", "forest", "ocean", "desert", "home", "shooting", "racing", "puzzle", "arcade", "realistic", "party", "rhythm", "stealth", "tycoon", "chill"];
    for (let i = 0; i < keys.length; i += 1) {
      const k = keys[i];
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = THEME_LABELS[k] || k;
      mode.appendChild(opt);
    }

    mode.value = (themeMode && THEME_LABELS[themeMode]) ? themeMode : "auto";
    updateButton();
    updateThemeLabel();
    btn.addEventListener("click", function () {
      setEnabled(!enabled);
    });
    mode.addEventListener("change", function () {
      setThemeMode(mode.value);
    });
  }

  function onFirstInteract() {
    restartMusicWithTheme();
    window.removeEventListener("pointerdown", onFirstInteract);
    window.removeEventListener("keydown", onFirstInteract);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injectUI();
      window.addEventListener("pointerdown", onFirstInteract, { passive: true });
      window.addEventListener("keydown", onFirstInteract);
    });
  } else {
    injectUI();
    window.addEventListener("pointerdown", onFirstInteract, { passive: true });
    window.addEventListener("keydown", onFirstInteract);
  }
})();
