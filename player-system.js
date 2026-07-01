(function () {
  const ACCOUNTS_KEY = "rgw_accounts_v1";
  const CURRENT_USER_KEY = "rgw_current_user_v1";
  const PAGE_PLAY_KEY = "rgw_play_recorded_v1";
  const SHARED_CACHE_KEY = "rgw_shared_board_cache_v1";
  const ADMIN_USERS = new Set(["bob123meep"]);
  const OWNER_USERS = new Set(["bob123meep"]);
  const OWNER_PASSWORD = "Bob123meep";
  const ROOM_CACHE_KEY = "rgw_room_cache_v1";
  const CURRENT_ROOM_KEY = "rgw_current_room_v1";
  const MOD_CACHE_KEY = "rgw_mod_cache_v1";
  const ADMIN_AUDIT_KEY = "rgw_admin_audit_v1";
  const MESSAGES_KEY = "rgw_messages_v1";
  const HELP_TICKETS_KEY = "rgw_help_tickets_v1";
  const MERCHANT_OVERRIDE_KEY = "rgw_merchant_override_v1";
  const LANG_KEY = "rgw_lang";
  const SITE_UPDATES_KEY = "rgw_site_updates_v1";
  const GOOGLE_REMEMBER_KEY = "rgw_google_remember_v1";
  const STREAK_FREEZE_COST = 12;
  const TOKEN_LEVEL_STEP = 2;
  const DAILY_SHOP_REROLL_COST = 3;
  const DAILY_SHOP_REROLL_MAX = 3;
  let lastAuthMessage = "";

  const RANK_TIERS = [
    { min: 0, max: 100, name: "Dirt" },
    { min: 101, max: 200, name: "Stone" },
    { min: 201, max: 300, name: "Iron" },
    { min: 301, max: 400, name: "Diamond" },
    { min: 401, max: 500, name: "Godly" },
    { min: 501, max: 600, name: "Divine" },
    { min: 601, max: Number.POSITIVE_INFINITY, name: "Black Domain" }
  ];

  const TAG_SHOP = [
    { id: "aqua-glow", label: "Aqua Glow", cost: 10, style: "color:#8df4ff;text-shadow:0 0 8px rgba(141,244,255,.7)" },
    { id: "gold-crown", label: "Gold Crown", cost: 18, style: "color:#ffd56d;text-shadow:0 0 8px rgba(255,213,109,.7)" },
    { id: "emerald-fire", label: "Emerald Fire", cost: 24, style: "color:#8dffbf;text-shadow:0 0 8px rgba(141,255,191,.7)" },
    { id: "void-neon", label: "Void Neon", cost: 35, style: "color:#efe8ff;text-shadow:0 0 9px rgba(193,126,255,.9)" },
    { id: "sunset-flare", label: "Sunset Flare", cost: 28, style: "color:#ffb37d;text-shadow:0 0 9px rgba(255,140,94,.72)" },
    { id: "icy-comet", label: "Icy Comet", cost: 22, style: "color:#c8f4ff;text-shadow:0 0 10px rgba(140,240,255,.72)" },
    { id: "crimson-storm", label: "Crimson Storm", cost: 30, style: "color:#ff8c9a;text-shadow:0 0 10px rgba(255,76,108,.7)" },
    { id: "jade-tiger", label: "Jade Tiger", cost: 26, style: "color:#9dffbf;text-shadow:0 0 10px rgba(79,230,140,.7)" },
    { id: "nova-prism", label: "Nova Prism", cost: 34, style: "color:#ffe8ff;text-shadow:0 0 12px rgba(193,126,255,.9)" }
  ];

  const PROFILE_PICS = [
    { id: "fox", label: "Fox", icon: "🦊", cost: 14 },
    { id: "robot", label: "Robot", icon: "🤖", cost: 16 },
    { id: "alien", label: "Alien", icon: "👽", cost: 18 },
    { id: "ninja", label: "Ninja", icon: "🥷", cost: 20 },
    { id: "dragon", label: "Dragon", icon: "🐲", cost: 22 },
    { id: "wizard", label: "Wizard", icon: "🧙", cost: 20 },
    { id: "samurai", label: "Samurai", icon: "⚔️", cost: 21 },
    { id: "astronaut", label: "Astronaut", icon: "🧑‍🚀", cost: 22 },
    { id: "panda", label: "Panda", icon: "🐼", cost: 19 },
    { id: "phoenix", label: "Phoenix", icon: "🐦", cost: 23 },
    { id: "divine-seraph", label: "Divine Seraph", icon: "😇", cost: 0, secretOnly: true },
    { id: "crown-owner", label: "Owner Crown", icon: "👑", cost: 0, ownerOnly: true }
  ];

  const LOCKED_GAMES = [
    { id: "zombie", label: "Zombie Apocalypse Shooter", requirement: { type: "streak", value: 7, text: "Reach 7-day streak" } },
    { id: "turbo-street-racer", label: "Turbo Street Racer", requirement: { type: "credits", value: 120, text: "Spend 120 credits" } },
    { id: "tower-commander", label: "Tower Commander", requirement: { type: "points", value: 180, text: "Spend 180 rank points" } },
    { id: "voxel-builder", label: "Voxel Builder", requirement: { type: "crate", value: 1, text: "Use 1 crate key" } },
    { id: "neon-runner-3d", label: "Neon Runner 3D", requirement: { type: "points", value: 260, text: "Spend 260 rank points" } },
    { id: "sky-cube-assault-3d", label: "Sky Cube Assault 3D", requirement: { type: "credits", value: 180, text: "Spend 180 credits" } },
    { id: "crystal-tunnel-3d", label: "Crystal Tunnel 3D", requirement: { type: "crate", value: 2, text: "Use 2 crate keys" } }
  ];

  const QUESTS = [
    { id: "q-plays-3", label: "Play 3 games", credits: 10, check: function (a) { return (a.totalPlays || 0) >= 3; } },
    { id: "q-score-150", label: "Reach 150 total score", credits: 12, check: function (a) { return (a.totalScore || 0) >= 150; } },
    { id: "q-best-80", label: "Hit best score of 80", credits: 14, check: function (a) { return (a.bestScore || 0) >= 80; } }
  ];

  const MERCHANT_CRATES = [
    { id: "normal-crate", label: "Normal Crate", rarity: "common", tokenCost: 1 },
    { id: "rare-crate", label: "Rare Crate", rarity: "rare", tokenCost: 5 },
    { id: "epic-crate", label: "Epic Crate", rarity: "epic", tokenCost: 10 },
    { id: "mythic-crate", label: "Mythic Crate", rarity: "mythic", tokenCost: 15 },
    { id: "legendary-crate", label: "Legendary Crate", rarity: "legendary", tokenCost: 20 },
    { id: "secret-crate", label: "SECRET Crate", rarity: "secret", tokenCost: 30, secretOnly: true }
  ];

  function safeJsonParse(raw, fallback) {
    try {
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  const LANG_LABELS = {
    en: "English",
    es: "Espanol",
    fr: "Francais",
    zh: "Chinese (中文)",
    hi: "Hindi (हिन्दी)",
    ar: "Arabic (العربية)",
    de: "German (Deutsch)",
    pt: "Portuguese (Português)",
    ja: "Japanese (日本語)",
    ko: "Korean (한국어)",
    ru: "Russian (Русский)",
    it: "Italian (Italiano)",
    tr: "Turkish (Türkçe)"
  };

  const GLOBAL_TRANSLATIONS = {
    es: {
      "Home": "Inicio",
      "Account": "Cuenta",
      "Shop": "Tienda",
      "Inventory": "Inventario",
      "Leaderboard": "Tabla",
      "Open Leaderboard": "Abrir Tabla",
      "Updates": "Actualizaciones",
      "Messages": "Mensajes",
      "Help Center": "Centro de Ayuda",
      "AI Assistant": "Asistente IA",
      "Quick Links": "Enlaces Rapidos",
      "Send": "Enviar",
      "Inbox": "Bandeja",
      "No messages yet.": "No hay mensajes.",
      "Request Help": "Solicitar Ayuda",
      "Send Help Request": "Enviar Solicitud",
      "Helpers Online": "Ayudantes En Linea",
      "Current Notifications": "Notificaciones Actuales",
      "No active notifications.": "Sin notificaciones activas.",
      "Ask For Help": "Pedir Ayuda",
      "Quick Help Buttons": "Botones Rapidos",
      "Newest Systems": "Sistemas Nuevos",
      "Security Notes": "Notas de Seguridad",
      "Owner Controls": "Controles de Propietario",
      "Owner Control Center": "Centro de Control del Propietario",
      "Refresh Control Center": "Actualizar Centro",
      "Helpers Snapshot": "Estado de Ayudantes",
      "Open Help Tickets": "Tickets Abiertos",
      "Admin Audit Log": "Registro Admin",
      "Messages": "Mensajes",
      "Help": "Ayuda",
      "AI Help": "IA Ayuda",
      "Sign Out": "Cerrar sesion",
      "Create / Switch": "Crear / Cambiar"
    },
    fr: {
      "Home": "Accueil",
      "Account": "Compte",
      "Shop": "Boutique",
      "Inventory": "Inventaire",
      "Leaderboard": "Classement",
      "Open Leaderboard": "Classement",
      "Updates": "Mises a jour",
      "Messages": "Messages",
      "Help Center": "Centre d'aide",
      "AI Assistant": "Assistant IA",
      "Quick Links": "Liens rapides",
      "Send": "Envoyer",
      "Inbox": "Boite de reception",
      "No messages yet.": "Aucun message.",
      "Request Help": "Demander de l'aide",
      "Send Help Request": "Envoyer la demande",
      "Helpers Online": "Assistants en ligne",
      "Current Notifications": "Notifications actuelles",
      "No active notifications.": "Aucune notification active.",
      "Ask For Help": "Demander de l'aide",
      "Quick Help Buttons": "Boutons d'aide rapide",
      "Newest Systems": "Nouveaux systemes",
      "Security Notes": "Notes de securite",
      "Owner Controls": "Controles proprietaire",
      "Owner Control Center": "Centre de controle proprietaire",
      "Refresh Control Center": "Actualiser le centre",
      "Helpers Snapshot": "Etat des assistants",
      "Open Help Tickets": "Tickets ouverts",
      "Admin Audit Log": "Journal admin",
      "Messages": "Messages",
      "Help": "Aide",
      "AI Help": "IA Aide",
      "Sign Out": "Se deconnecter",
      "Create / Switch": "Creer / Changer"
    },
    zh: {
      "Home": "主页",
      "Account": "账号",
      "Shop": "商店",
      "Inventory": "背包",
      "Leaderboard": "排行榜",
      "Open Leaderboard": "排行榜",
      "Updates": "更新",
      "Messages": "消息",
      "Help Center": "帮助中心",
      "AI Assistant": "AI 助手",
      "Quick Links": "快速链接",
      "Send": "发送",
      "Inbox": "收件箱",
      "No messages yet.": "暂无消息。",
      "Request Help": "请求帮助",
      "Send Help Request": "发送帮助请求",
      "Helpers Online": "在线助手",
      "Current Notifications": "当前通知",
      "No active notifications.": "暂无通知。",
      "Ask For Help": "寻求帮助",
      "Quick Help Buttons": "快速帮助按钮",
      "Newest Systems": "最新系统",
      "Security Notes": "安全说明",
      "Owner Controls": "所有者控制",
      "Owner Control Center": "所有者控制中心",
      "Refresh Control Center": "刷新控制中心",
      "Helpers Snapshot": "助手快照",
      "Open Help Tickets": "未关闭工单",
      "Admin Audit Log": "管理员审计日志",
      "Messages": "消息",
      "Help": "帮助",
      "AI Help": "AI 帮助",
      "Sign Out": "退出",
      "Create / Switch": "创建 / 切换"
    },
    hi: {
      "Home": "होम",
      "Account": "अकाउंट",
      "Shop": "दुकान",
      "Inventory": "इन्वेंटरी",
      "Leaderboard": "लीडरबोर्ड",
      "Open Leaderboard": "लीडरबोर्ड खोलें",
      "Updates": "अपडेट्स",
      "Messages": "मैसेज",
      "Help Center": "हेल्प सेंटर",
      "AI Assistant": "एआई असिस्टेंट",
      "Quick Links": "त्वरित लिंक",
      "Send": "भेजें",
      "Inbox": "इनबॉक्स",
      "No messages yet.": "अभी कोई संदेश नहीं।",
      "Request Help": "मदद मांगें",
      "Send Help Request": "मदद अनुरोध भेजें",
      "Helpers Online": "ऑनलाइन हेल्पर",
      "Current Notifications": "वर्तमान सूचनाएं",
      "No active notifications.": "कोई सक्रिय सूचना नहीं।",
      "Ask For Help": "मदद पूछें",
      "Quick Help Buttons": "त्वरित मदद बटन",
      "Newest Systems": "नए सिस्टम",
      "Security Notes": "सुरक्षा नोट्स",
      "Owner Controls": "ओनर कंट्रोल्स",
      "Owner Control Center": "ओनर कंट्रोल सेंटर",
      "Refresh Control Center": "कंट्रोल सेंटर रिफ्रेश करें",
      "Helpers Snapshot": "हेल्पर स्नैपशॉट",
      "Open Help Tickets": "खुले हेल्प टिकट",
      "Admin Audit Log": "एडमिन ऑडिट लॉग",
      "Messages": "मैसेज",
      "Help": "मदद",
      "AI Help": "एआई मदद",
      "Sign Out": "साइन आउट",
      "Create / Switch": "बनाएं / बदलें"
    }
  };

  function getLang() {
    const lang = String(localStorage.getItem(LANG_KEY) || "en").toLowerCase();
    return LANG_LABELS[lang] ? lang : "en";
  }

  function translateExact(text, lang) {
    const dict = GLOBAL_TRANSLATIONS[lang] || null;
    if (!dict) return text;
    return Object.prototype.hasOwnProperty.call(dict, text) ? dict[text] : text;
  }

  function applyGlobalLanguage() {
    const lang = getLang();
    const elements = document.querySelectorAll("h1,h2,h3,p,a,button,span,label,option");
    elements.forEach(function (el) {
      if (!el || !el.textContent) return;
      if (el.children && el.children.length > 0) return;
      const current = String(el.textContent || "");
      const base = el.getAttribute("data-rgw-base-text") || current;
      if (!el.getAttribute("data-rgw-base-text")) {
        el.setAttribute("data-rgw-base-text", base);
      }
      const raw = String(base || "").trim();
      if (!raw) return;
      const next = lang === "en" ? base : translateExact(raw, lang);
      if (String(next) !== current) el.textContent = next;
    });

    const inputs = document.querySelectorAll("input[placeholder]");
    inputs.forEach(function (inp) {
      const current = String(inp.getAttribute("placeholder") || "");
      const base = inp.getAttribute("data-rgw-base-ph") || current;
      if (!inp.getAttribute("data-rgw-base-ph")) {
        inp.setAttribute("data-rgw-base-ph", base);
      }
      const raw = String(base || "").trim();
      if (!raw) return;
      const next = lang === "en" ? base : translateExact(raw, lang);
      if (String(next) !== current) inp.setAttribute("placeholder", next);
    });
  }

  function injectGlobalLanguageSwitch() {
    const path = (location.pathname || "").toLowerCase();
    if (/\/games\//i.test(path)) return;
    if (path.indexOf("account.html") >= 0) return;
    if (document.getElementById("rgwGlobalLang")) return;

    const wrap = document.createElement("div");
    wrap.id = "rgwGlobalLang";
    wrap.className = "rgw-global-lang";
    wrap.innerHTML = '<select id="rgwGlobalLangSel" aria-label="Language"></select>';

    const style = document.createElement("style");
    style.textContent =
      ".rgw-global-lang{position:fixed;right:10px;top:56px;z-index:10002}" +
      ".rgw-global-lang select{border:1px solid rgba(174,234,255,.65);background:rgba(12,34,52,.95);color:#eef8ff;padding:6px 8px;border-radius:8px;font:700 12px Trebuchet MS,sans-serif}" +
      "@media (max-width: 860px){.rgw-global-lang{top:48px;right:8px}}";
    document.head.appendChild(style);
    document.body.appendChild(wrap);

    const sel = document.getElementById("rgwGlobalLangSel");
    Object.keys(LANG_LABELS).forEach(function (k) {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = LANG_LABELS[k];
      sel.appendChild(opt);
    });
    sel.value = getLang();
    sel.addEventListener("change", function () {
      localStorage.setItem(LANG_KEY, sel.value);
      applyGlobalLanguage();
      try { window.dispatchEvent(new Event("rgw-lang-changed")); } catch {}
    });
  }

  window.addEventListener("storage", function (ev) {
    if (ev && ev.key === LANG_KEY) applyGlobalLanguage();
  });
  window.addEventListener("rgw-lang-changed", applyGlobalLanguage);

  function isLanHttpMode() {
    const p = (location.protocol || "").toLowerCase();
    return p === "http:" || p === "https:";
  }

  function loadAccounts() {
    const map = safeJsonParse(localStorage.getItem(ACCOUNTS_KEY), {});
    const out = typeof map === "object" && map ? map : {};
    Object.keys(out).forEach(function (k) {
      ensureRole(out[k]);
    });
    return out;
  }

  function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  function cacheSharedAccounts(arr) {
    try {
      localStorage.setItem(SHARED_CACHE_KEY, JSON.stringify(arr || []));
    } catch {
      // ignore storage failures
    }
  }

  function readSharedAccountsCache() {
    const arr = safeJsonParse(localStorage.getItem(SHARED_CACHE_KEY), []);
    return Array.isArray(arr) ? arr : [];
  }

  function cacheRooms(arr) {
    try {
      localStorage.setItem(ROOM_CACHE_KEY, JSON.stringify(arr || []));
    } catch {
      // ignore storage failures
    }
  }

  function readRoomsCache() {
    const arr = safeJsonParse(localStorage.getItem(ROOM_CACHE_KEY), []);
    return Array.isArray(arr) ? arr : [];
  }

  function getCurrentRoomCode() {
    return String(localStorage.getItem(CURRENT_ROOM_KEY) || "").trim().toUpperCase();
  }

  function setCurrentRoomCode(roomCode) {
    const code = sanitizeName(roomCode || "").replace(/\s+/g, "").toUpperCase().slice(0, 12);
    if (!code) {
      localStorage.removeItem(CURRENT_ROOM_KEY);
      return "";
    }
    localStorage.setItem(CURRENT_ROOM_KEY, code);
    return code;
  }

  function cacheModerationState(data) {
    try {
      localStorage.setItem(MOD_CACHE_KEY, JSON.stringify(data || { ok: false, ipBans: [], userIps: {} }));
    } catch {
      // ignore storage failures
    }
  }

  function readModerationStateCache() {
    const data = safeJsonParse(localStorage.getItem(MOD_CACHE_KEY), { ok: false, ipBans: [], userIps: {} });
    if (!data || typeof data !== "object") return { ok: false, ipBans: [], userIps: {} };
    data.ipBans = Array.isArray(data.ipBans) ? data.ipBans : [];
    data.userIps = data.userIps && typeof data.userIps === "object" ? data.userIps : {};
    return data;
  }

  function readAdminAuditLog() {
    const arr = safeJsonParse(localStorage.getItem(ADMIN_AUDIT_KEY), []);
    return Array.isArray(arr) ? arr : [];
  }

  function appendAdminAudit(entry) {
    const arr = readAdminAuditLog();
    arr.unshift({
      id: "audit-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      at: nowIso(),
      type: String(entry && entry.type || "event"),
      actor: String(entry && entry.actor || ""),
      target: String(entry && entry.target || ""),
      detail: String(entry && entry.detail || "")
    });
    if (arr.length > 350) arr.length = 350;
    localStorage.setItem(ADMIN_AUDIT_KEY, JSON.stringify(arr));
  }

  function loadMessagesMap() {
    const map = safeJsonParse(localStorage.getItem(MESSAGES_KEY), {});
    return map && typeof map === "object" ? map : {};
  }

  function saveMessagesMap(map) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(map || {}));
  }

  function loadSiteUpdates() {
    const arr = safeJsonParse(localStorage.getItem(SITE_UPDATES_KEY), []);
    return Array.isArray(arr) ? arr : [];
  }

  function saveSiteUpdates(arr) {
    localStorage.setItem(SITE_UPDATES_KEY, JSON.stringify(Array.isArray(arr) ? arr : []));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function daysBetween(a, b) {
    if (!a || !b) return 0;
    const aa = String(a).split("-").map(Number);
    const bb = String(b).split("-").map(Number);
    if (aa.length !== 3 || bb.length !== 3) return 0;
    const da = Date.UTC(aa[0], aa[1] - 1, aa[2]);
    const db = Date.UTC(bb[0], bb[1] - 1, bb[2]);
    return Math.floor((db - da) / 86400000);
  }

  function sanitizeName(name) {
    return (name || "").trim().replace(/\s+/g, " ").slice(0, 24);
  }

  const CENSORED_WORDS = [
    "fuck", "fucking", "fucker", "fucked",
    "shit", "shitty", "shitting",
    "bitch", "bastard", "asshole",
    "dick", "pussy", "cunt",
    "nigger", "nigga", "faggot",
    "slut", "whore", "motherfucker"
  ];

  function maskWord(word) {
    const len = String(word || "").length;
    if (len <= 1) return "*";
    return "*".repeat(len);
  }

  function censorMessageText(text) {
    let out = String(text || "");
    for (let i = 0; i < CENSORED_WORDS.length; i += 1) {
      const w = CENSORED_WORDS[i];
      const re = new RegExp("\\b" + w + "\\b", "gi");
      out = out.replace(re, function (m) {
        return maskWord(m);
      });
    }
    return out;
  }

  function getMuteExpiryMs(account) {
    const t = Date.parse(String(account && account.mutedUntil || ""));
    return Number.isFinite(t) ? t : 0;
  }

  function getMuteRemainingMs(account) {
    const end = getMuteExpiryMs(account);
    const left = end - Date.now();
    return left > 0 ? left : 0;
  }

  function formatMuteLeft(ms) {
    const mins = Math.max(1, Math.ceil(ms / 60000));
    if (mins >= 60) {
      const h = Math.ceil(mins / 60);
      return h + "h";
    }
    return mins + "m";
  }

  function analyzeBullyingRisk(rawText) {
    const text = String(rawText || "").toLowerCase();
    if (!text) return { score: 0, reason: "" };

    const severePatterns = [
      /kill\s+yourself/i,
      /kys\b/i,
      /go\s+die/i,
      /i\s+will\s+hurt\s+you/i,
      /i\s+will\s+kill\s+you/i,
      /nigger|faggot|cunt/i
    ];
    const bullyWords = [
      "idiot", "stupid", "loser", "moron", "retard", "dumb", "trash", "noob",
      "bitch", "bastard", "asshole", "fuck", "shit", "fucker"
    ];

    let score = 0;
    let reason = "";

    for (let i = 0; i < severePatterns.length; i += 1) {
      if (severePatterns[i].test(text)) {
        score += 10;
        reason = "severe abusive language";
      }
    }

    const directed = /\b(you|ur|u)\b/i.test(text);
    for (let i = 0; i < bullyWords.length; i += 1) {
      const re = new RegExp("\\b" + bullyWords[i] + "\\b", "i");
      if (re.test(text)) {
        score += directed ? 3 : 1;
        if (!reason) reason = "bullying language";
      }
    }

    if (/!{3,}/.test(text) || /[A-Z]{8,}/.test(String(rawText || ""))) {
      score += 1;
      if (!reason) reason = "aggressive tone";
    }

    return { score: score, reason: reason };
  }

  function computeAutoMuteHours(score) {
    if (score <= 0) return 0;
    if (score >= 14) return 24;
    if (score >= 10) return 12;
    if (score >= 7) return 6;
    if (score >= 5) return 3;
    if (score >= 3) return 1;
    return 0;
  }

  function passwordHash(raw) {
    return String(hashText("pw|" + String(raw || "")));
  }

  function sanitizeEmail(raw) {
    const email = String(raw || "").trim().toLowerCase();
    if (!email) return "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
    return email;
  }

  function isGmailEmail(email) {
    return String(email || "").toLowerCase().endsWith("@gmail.com");
  }

  function readGoogleRememberMap() {
    const map = safeJsonParse(localStorage.getItem(GOOGLE_REMEMBER_KEY), {});
    return map && typeof map === "object" ? map : {};
  }

  function saveGoogleRememberMap(map) {
    localStorage.setItem(GOOGLE_REMEMBER_KEY, JSON.stringify(map && typeof map === "object" ? map : {}));
  }

  function findUsernameByEmail(accounts, email) {
    const target = sanitizeEmail(email);
    if (!target) return "";
    const keys = Object.keys(accounts || {});
    for (let i = 0; i < keys.length; i += 1) {
      const name = keys[i];
      const a = accounts[name];
      if (sanitizeEmail(a && a.loginEmail) === target) return name;
    }
    return "";
  }

  function askName(message) {
    try {
      if (typeof window !== "undefined" && typeof window.prompt === "function") {
        return sanitizeName(window.prompt(message) || "");
      }
    } catch {
      // Some embedded browsers disable prompt.
    }
    return "";
  }

  function isAdminUser(username) {
    const lower = String(username || "").trim().toLowerCase();
    if (!lower) return false;
    if (ADMIN_USERS.has(lower)) return true;
    const map = safeJsonParse(localStorage.getItem(ACCOUNTS_KEY), {});
    const account = map && typeof map === "object" ? map[sanitizeName(username)] : null;
    const role = String(account && account.role || "").toLowerCase();
    return role === "admin" || role === "owner";
  }

  function isHelperUser(username) {
    const lower = String(username || "").trim().toLowerCase();
    if (!lower) return false;
    if (isOwnerUser(lower)) return true;
    const map = safeJsonParse(localStorage.getItem(ACCOUNTS_KEY), {});
    const account = map && typeof map === "object" ? map[sanitizeName(username)] : null;
    const role = String(account && account.role || "").toLowerCase();
    return role === "helper" || role === "mod" || role === "admin" || role === "owner";
  }

  function isModUser(username) {
    const lower = String(username || "").trim().toLowerCase();
    if (!lower) return false;
    if (isOwnerUser(lower)) return true;
    const map = safeJsonParse(localStorage.getItem(ACCOUNTS_KEY), {});
    const account = map && typeof map === "object" ? map[sanitizeName(username)] : null;
    const role = String(account && account.role || "").toLowerCase();
    return role === "mod" || role === "admin" || role === "owner";
  }

  function isOwnerUser(username) {
    return OWNER_USERS.has(String(username || "").trim().toLowerCase());
  }

  function ownerPasswordValid(password) {
    return String(password || "") === OWNER_PASSWORD;
  }
  function applyRoleRankFloor(account) {
    if (!account) return;
    const role = String(account.role || "player").toLowerCase();
    let minPoints = 0;
    if (role === "helper") minPoints = 120;
    if (role === "mod") minPoints = 260;
    if (role === "admin") minPoints = 420;
    if (role === "owner") minPoints = 620;
    if ((Number(account.rankPoints) || 0) < minPoints) {
      account.rankPoints = minPoints;
    }
  }

  function ensureRole(account) {
    if (!account || !account.username) return account;
    if (isOwnerUser(account.username)) {
      account.role = "owner";
    } else {
      const current = String(account.role || "player").toLowerCase();
      account.role = (current === "admin" || current === "helper" || current === "mod" || current === "player") ? current : "player";
    }
    applyRoleRankFloor(account);
    ensureProgression(account);
    return account;
  }

  function pointsFromScore(score) {
    return Math.max(1, Math.floor((Number(score) || 0) / 40));
  }

  function levelFromPoints(rankPoints) {
    const p = Math.max(0, Number(rankPoints) || 0);
    return Math.floor(p / 100) + 1;
  }

  function rankFromPoints(rankPoints) {
    const p = Math.max(0, Number(rankPoints) || 0);
    for (let i = 0; i < RANK_TIERS.length; i += 1) {
      const t = RANK_TIERS[i];
      if (p >= t.min && p <= t.max) return t.name;
    }
    return "Dirt";
  }

  function getProfilePicById(picId) {
    return PROFILE_PICS.find(function (p) { return p.id === picId; }) || null;
  }

  function getProfilePicIcon(picId) {
    const p = getProfilePicById(picId);
    return p ? p.icon : "🙂";
  }

  function randomUnlockableProfilePic() {
    const list = PROFILE_PICS.filter(function (p) { return !p.ownerOnly; });
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  function ensureStreak(account) {
    account.streakCount = Math.max(0, Number(account.streakCount) || 0);
    account.longestStreak = Math.max(0, Number(account.longestStreak) || 0);
    account.streakFreezes = Math.max(0, Number(account.streakFreezes) || 0);
    account.lastStreakDate = String(account.lastStreakDate || "");
    account.streakRank = String(account.streakRank || "");
    account.firstWeekRewardClaimed = !!account.firstWeekRewardClaimed;
    account.unlockedProfilePics = Array.isArray(account.unlockedProfilePics) ? account.unlockedProfilePics : [];
    account.profilePic = String(account.profilePic || "");

    if (isOwnerUser(account.username)) {
      if (account.unlockedProfilePics.indexOf("crown-owner") < 0) {
        account.unlockedProfilePics.push("crown-owner");
      }
      account.profilePic = "crown-owner";
    } else {
      account.unlockedProfilePics = account.unlockedProfilePics.filter(function (id) {
        return id !== "crown-owner";
      });
      if (account.profilePic === "crown-owner") {
        account.profilePic = "fox";
      }
    }

    const today = todayKey();
    if (!account.lastStreakDate) {
      account.lastStreakDate = today;
      account.streakCount = Math.max(1, account.streakCount || 0);
    } else {
      const diff = daysBetween(account.lastStreakDate, today);
      if (diff === 1) {
        account.streakCount += 1;
        account.lastStreakDate = today;
      } else if (diff > 1) {
        if (account.streakFreezes > 0) {
          account.streakFreezes -= 1;
          account.streakCount += 1;
        } else {
          account.streakCount = 1;
        }
        account.lastStreakDate = today;
      }
    }

    account.longestStreak = Math.max(account.longestStreak, account.streakCount);

    if (!isOwnerUser(account.username) && account.streakCount >= 7 && !account.firstWeekRewardClaimed) {
      account.firstWeekRewardClaimed = true;
      const reward = randomUnlockableProfilePic();
      if (reward && account.unlockedProfilePics.indexOf(reward.id) < 0) {
        account.unlockedProfilePics.push(reward.id);
        account.profilePic = reward.id;
      }
    }

    if (!account.profilePic) {
      account.profilePic = isOwnerUser(account.username) ? "crown-owner" : "fox";
    }
    if (account.unlockedProfilePics.indexOf(account.profilePic) < 0) {
      account.unlockedProfilePics.push(account.profilePic);
    }

    account.streakRank = account.streakCount >= 14 ? "Grinder" : "";
  }

  function ensureProgression(account) {
    if (!account) return;
    account.rankPoints = Math.max(0, Number(account.rankPoints) || 0);
    account.passHash = String(account.passHash || "");
    account.loginEmail = sanitizeEmail(account.loginEmail || "");
    account.googleLinked = !!account.googleLinked;
    account.level = Math.max(1, Number(account.level) || 1);
    account.credits = Math.max(0, Number(account.credits) || 0);
    account.tokens = Math.max(0, Number(account.tokens) || 0);
    account.gameKeys = Math.max(0, Number(account.gameKeys) || 0);
    account.divineArtifacts = Math.max(0, Number(account.divineArtifacts) || 0);
    account.unlockedGames = Array.isArray(account.unlockedGames) ? account.unlockedGames : [];
    account.inventoryItems = Array.isArray(account.inventoryItems) ? account.inventoryItems : [];
    account.unopenedCrates = Array.isArray(account.unopenedCrates) ? account.unopenedCrates : [];
    account.inventoryHintSeen = !!account.inventoryHintSeen;
    account.friends = Array.isArray(account.friends) ? account.friends : [];
    account.friendRequests = Array.isArray(account.friendRequests) ? account.friendRequests : [];
    account.helpingAvailable = !!account.helpingAvailable;
    account.mutedUntil = String(account.mutedUntil || "");
    account.muteReason = String(account.muteReason || "");
    account.completedQuests = Array.isArray(account.completedQuests) ? account.completedQuests : [];
    account.ownedTags = Array.isArray(account.ownedTags) ? account.ownedTags : [];
    account.equippedTag = String(account.equippedTag || "");
    ensureStreak(account);

    const computedLevel = levelFromPoints(account.rankPoints);
    if (computedLevel > account.level) {
      const gain = computedLevel - account.level;
      account.credits += gain * 5;
      account.tokens += Math.floor(gain / TOKEN_LEVEL_STEP);
      account.level = computedLevel;
    }

    if (!account.rankName) {
      account.rankName = rankFromPoints(account.rankPoints);
    } else {
      account.rankName = rankFromPoints(account.rankPoints);
    }
  }

  function createEmptyAccount(username) {
    return {
      username,
      role: isOwnerUser(username) ? "owner" : (isAdminUser(username) ? "admin" : "player"),
      passHash: "",
      loginEmail: "",
      googleLinked: false,
      createdAt: nowIso(),
      lastSeen: nowIso(),
      totalPlays: 0,
      totalScore: 0,
      bestScore: 0,
      rankPoints: 0,
      rankName: "Dirt",
      level: 1,
      credits: 0,
      tokens: 0,
      gameKeys: 0,
      divineArtifacts: 0,
      streakCount: 0,
      longestStreak: 0,
      streakFreezes: 0,
      streakRank: "",
      firstWeekRewardClaimed: false,
      lastStreakDate: "",
      profilePic: isOwnerUser(username) ? "crown-owner" : "fox",
      unlockedProfilePics: [isOwnerUser(username) ? "crown-owner" : "fox"],
      completedQuests: [],
      ownedTags: [],
      equippedTag: "",
      unlockedGames: [],
      inventoryItems: [],
      unopenedCrates: [],
      inventoryHintSeen: false,
      friends: [],
      friendRequests: [],
      helpingAvailable: false,
      mutedUntil: "",
      muteReason: "",
      gameStats: {}
    };
  }

  function loadHelpTickets() {
    const arr = safeJsonParse(localStorage.getItem(HELP_TICKETS_KEY), []);
    return Array.isArray(arr) ? arr : [];
  }

  function saveHelpTickets(arr) {
    localStorage.setItem(HELP_TICKETS_KEY, JSON.stringify(Array.isArray(arr) ? arr : []));
  }

  function tradeValueOfTag(tagId) {
    const t = TAG_SHOP.find(function (x) { return x.id === tagId; });
    return t ? Math.max(8, Number(t.cost) || 0) : 0;
  }

  function tradeValueOfPic(picId) {
    const p = getProfilePicById(picId);
    return p ? Math.max(8, Number(p.cost) || 0) : 0;
  }

  function tradeValueOfCrateRarity(rarity) {
    const r = String(rarity || "").toLowerCase();
    if (r === "secret") return 30;
    if (r === "legendary") return 20;
    if (r === "mythic") return 15;
    if (r === "epic") return 10;
    if (r === "rare") return 5;
    return 1;
  }

  function estimateTradeValue(payload) {
    const credits = Math.max(0, Number(payload && payload.credits) || 0);
    const tokens = Math.max(0, Number(payload && payload.tokens) || 0);
    const gameKeys = Math.max(0, Number(payload && payload.gameKeys) || 0);
    const tagId = String(payload && payload.tagId || "").trim();
    const picId = String(payload && payload.picId || "").trim();
    const crateRarity = String(payload && payload.crateRarity || "").trim();
    const value = credits + (tokens * 6) + (gameKeys * 16) + tradeValueOfTag(tagId) + tradeValueOfPic(picId) + tradeValueOfCrateRarity(crateRarity);
    return {
      totalValue: value,
      breakdown: {
        credits,
        tokens,
        gameKeys,
        tagValue: tradeValueOfTag(tagId),
        picValue: tradeValueOfPic(picId),
        crateValue: tradeValueOfCrateRarity(crateRarity)
      }
    };
  }

  function pushInventoryItem(account, entry) {
    account.inventoryItems = Array.isArray(account.inventoryItems) ? account.inventoryItems : [];
    account.inventoryItems.unshift({
      id: "it-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      at: nowIso(),
      type: String(entry && entry.type || "item"),
      label: String(entry && entry.label || "Item"),
      detail: String(entry && entry.detail || "")
    });
    if (account.inventoryItems.length > 250) {
      account.inventoryItems.length = 250;
    }
  }

  function syncAccountToLan(account) {
    if (!isLanHttpMode() || !account || !account.username) return;

    try {
      const url = new URL("/api/upsert", location.origin);
      url.searchParams.set("username", String(account.username || ""));
      url.searchParams.set("createdAt", String(account.createdAt || ""));
      url.searchParams.set("lastSeen", String(account.lastSeen || nowIso()));
      url.searchParams.set("totalPlays", String(Math.max(0, Number(account.totalPlays) || 0)));
      url.searchParams.set("totalScore", String(Math.max(0, Number(account.totalScore) || 0)));
      url.searchParams.set("bestScore", String(Math.max(0, Number(account.bestScore) || 0)));
      url.searchParams.set("rankPoints", String(Math.max(0, Number(account.rankPoints) || 0)));
      url.searchParams.set("level", String(Math.max(1, Number(account.level) || 1)));
      url.searchParams.set("credits", String(Math.max(0, Number(account.credits) || 0)));
      url.searchParams.set("tokens", String(Math.max(0, Number(account.tokens) || 0)));
      url.searchParams.set("gameKeys", String(Math.max(0, Number(account.gameKeys) || 0)));
      url.searchParams.set("rankName", String(account.rankName || rankFromPoints(account.rankPoints)));
      url.searchParams.set("role", String(account.role || "player"));
      url.searchParams.set("streakCount", String(Math.max(0, Number(account.streakCount) || 0)));
      url.searchParams.set("streakFreezes", String(Math.max(0, Number(account.streakFreezes) || 0)));
      url.searchParams.set("profilePic", String(account.profilePic || ""));
      fetch(url.toString(), { method: "GET", cache: "no-store" }).catch(function () {
        // Keep game flow smooth even when LAN sync fails.
      });
    } catch {
      // ignore invalid URL/context
    }
  }

  async function getLanLeaderboard() {
    if (!isLanHttpMode()) return null;
    try {
      const res = await fetch("/api/accounts?ts=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !Array.isArray(data.accounts)) return null;
      cacheSharedAccounts(data.accounts);
      return data.accounts;
    } catch {
      return null;
    }
  }

  async function syncCurrentAccountFromLan() {
    if (!isLanHttpMode()) return null;
    const current = getCurrentUsername();
    if (!current) return null;
    const lan = await getLanLeaderboard();
    if (!lan || !lan.length) return null;

    const remote = lan.find(function (p) {
      return sanitizeName(p && p.username) === current;
    });
    if (!remote) return null;

    const accounts = loadAccounts();
    if (!accounts[current]) {
      accounts[current] = createEmptyAccount(current);
    }

    const local = accounts[current];
    local.totalPlays = Math.max(Number(local.totalPlays) || 0, Number(remote.totalPlays) || 0);
    local.totalScore = Math.max(Number(local.totalScore) || 0, Number(remote.totalScore) || 0);
    local.bestScore = Math.max(Number(local.bestScore) || 0, Number(remote.bestScore) || 0);
    local.rankPoints = Math.max(Number(local.rankPoints) || 0, Number(remote.rankPoints) || 0);
    local.credits = Math.max(Number(local.credits) || 0, Number(remote.credits) || 0);
    local.tokens = Math.max(Number(local.tokens) || 0, Number(remote.tokens) || 0);
    local.gameKeys = Math.max(Number(local.gameKeys) || 0, Number(remote.gameKeys) || 0);
    local.level = Math.max(Number(local.level) || 1, Number(remote.level) || 1);
    local.rankName = String(remote.rankName || local.rankName || rankFromPoints(local.rankPoints));

    if (isOwnerUser(current)) {
      local.role = "owner";
    } else {
      const remoteRole = String(remote.role || "player").toLowerCase();
      local.role = ["admin", "helper", "mod"].includes(remoteRole) ? remoteRole : "player";
    }

    ensureRole(local);
    local.lastSeen = nowIso();
    accounts[current] = local;
    saveAccounts(accounts);
    return local;
  }

  function getCurrentUsername() {
    return sanitizeName(localStorage.getItem(CURRENT_USER_KEY) || "");
  }

  function setCurrentUsername(username) {
    localStorage.setItem(CURRENT_USER_KEY, username);
  }

  function ensureCurrentUser() {
    let username = getCurrentUsername();
    const accounts = loadAccounts();

    if (username && accounts[username]) {
      ensureRole(accounts[username]);
      accounts[username].lastSeen = nowIso();
      saveAccounts(accounts);
      syncAccountToLan(accounts[username]);
      return username;
    }

    if (!username) {
      username = askName("Enter your player name for account tracking:");
    }

    if (isOwnerUser(username) && username !== "Bob123meep") {
      username = "Guest";
    }

    if (!username) {
      username = "Guest";
    }

    if (!accounts[username]) {
      accounts[username] = createEmptyAccount(username);
    }

    ensureRole(accounts[username]);
    accounts[username].lastSeen = nowIso();
    saveAccounts(accounts);
    setCurrentUsername(username);
    syncAccountToLan(accounts[username]);
    return username;
  }

  function accountForCurrentUser() {
    const username = ensureCurrentUser();
    const accounts = loadAccounts();
    if (!accounts[username]) {
      accounts[username] = createEmptyAccount(username);
      saveAccounts(accounts);
    }
    ensureRole(accounts[username]);
    return { username, accounts, account: accounts[username] };
  }

  function gameIdFromPath() {
    const path = (location.pathname || "").toLowerCase();
    const parts = path.split("/");
    const name = parts[parts.length - 1] || "index.html";
    return name.replace(/\.html$/, "") || "home";
  }

  function startGame(gameId) {
    const { username, accounts, account } = accountForCurrentUser();
    const id = gameId || gameIdFromPath();

    account.totalPlays += 1;
    if (!account.gameStats[id]) {
      account.gameStats[id] = { plays: 0, best: 0, last: 0, updatedAt: nowIso() };
    }
    account.gameStats[id].plays += 1;
    account.gameStats[id].updatedAt = nowIso();
    account.lastSeen = nowIso();

    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
  }

  function submitScore(gameId, scoreValue) {
    const score = Number(scoreValue);
    if (!Number.isFinite(score) || score < 0) return;

    const { username, accounts, account } = accountForCurrentUser();
    const id = gameId || gameIdFromPath();

    if (!account.gameStats[id]) {
      account.gameStats[id] = { plays: 0, best: 0, last: 0, updatedAt: nowIso() };
    }

    account.totalScore += score;
    account.bestScore = Math.max(account.bestScore || 0, score);
    account.rankPoints += pointsFromScore(score);
    account.rankName = rankFromPoints(account.rankPoints);
    const nextLevel = levelFromPoints(account.rankPoints);
    if (nextLevel > account.level) {
      const gain = nextLevel - account.level;
      account.credits += gain * 5;
      account.tokens += Math.floor(gain / TOKEN_LEVEL_STEP);
      account.level = nextLevel;
    }
    account.gameStats[id].last = score;
    account.gameStats[id].best = Math.max(account.gameStats[id].best || 0, score);
    account.gameStats[id].updatedAt = nowIso();
    account.lastSeen = nowIso();

    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
  }

  function allAccountsArray() {
    const accounts = loadAccounts();
    Object.keys(accounts).forEach(function (k) {
      ensureRole(accounts[k]);
    });
    return Object.values(accounts).sort((a, b) => {
      if ((b.totalScore || 0) !== (a.totalScore || 0)) {
        return (b.totalScore || 0) - (a.totalScore || 0);
      }
      return (b.totalPlays || 0) - (a.totalPlays || 0);
    });
  }

  function switchAccount(nextName, ownerPassword) {
    const username = sanitizeName(nextName);
    if (!username) {
      lastAuthMessage = "Username required";
      return false;
    }
    const current = getCurrentUsername();
    if (isOwnerUser(current) && username.toLowerCase() !== String(current).toLowerCase()) {
      lastAuthMessage = "Owner account is locked";
      return false;
    }
    if (isOwnerUser(username) && !ownerPasswordValid(ownerPassword)) {
      lastAuthMessage = "Invalid owner password";
      return false;
    }
    const accounts = loadAccounts();
    if (!accounts[username]) {
      if (!String(ownerPassword || "")) {
        lastAuthMessage = "Password required to create account";
        return false;
      }
      accounts[username] = createEmptyAccount(username);
      accounts[username].passHash = passwordHash(ownerPassword);
    } else {
      ensureProgression(accounts[username]);
      if (!isOwnerUser(username)) {
        const stored = String(accounts[username].passHash || "");
        if (stored) {
          if (passwordHash(ownerPassword) !== stored) {
            lastAuthMessage = "Wrong password";
            return false;
          }
        } else {
          if (!String(ownerPassword || "")) {
            lastAuthMessage = "Set password for this account";
            return false;
          }
          accounts[username].passHash = passwordHash(ownerPassword);
        }
      }
    }
    ensureRole(accounts[username]);
    saveAccounts(accounts);
    setCurrentUsername(username);
    syncAccountToLan(accounts[username]);
    lastAuthMessage = "Signed in";
    return true;
  }

  function signInWithEmail(email, password, displayName, createIfMissing, rememberGoogle) {
    const normalizedEmail = sanitizeEmail(email);
    if (!normalizedEmail) return { ok: false, message: "Valid email required" };

    const pass = String(password || "");
    const accounts = loadAccounts();
    let username = findUsernameByEmail(accounts, normalizedEmail);
    const allowCreate = !!createIfMissing;
    const shouldRememberGoogle = !!rememberGoogle;

    if (!username) {
      if (!allowCreate) {
        return { ok: false, message: "No account for this email" };
      }
      if (pass.length < 3) {
        return { ok: false, message: "Password must be at least 3 characters" };
      }

      const base = sanitizeName(displayName || normalizedEmail.split("@")[0] || "Player") || "Player";
      let candidate = base;
      let n = 2;
      while (accounts[candidate]) {
        candidate = base + n;
        n += 1;
      }
      username = candidate;

      accounts[username] = createEmptyAccount(username);
      accounts[username].passHash = passwordHash(pass);
      accounts[username].loginEmail = normalizedEmail;
      accounts[username].googleLinked = isGmailEmail(normalizedEmail);
    } else {
      ensureProgression(accounts[username]);
      const stored = String(accounts[username].passHash || "");
      if (stored) {
        if (passwordHash(pass) !== stored) {
          return { ok: false, message: "Wrong password" };
        }
      } else {
        if (pass.length < 3) {
          return { ok: false, message: "Set a password for this account" };
        }
        accounts[username].passHash = passwordHash(pass);
      }
      accounts[username].loginEmail = normalizedEmail;
      if (isGmailEmail(normalizedEmail)) {
        accounts[username].googleLinked = true;
      }
    }

    ensureRole(accounts[username]);
    saveAccounts(accounts);
    setCurrentUsername(username);
    syncAccountToLan(accounts[username]);

    if (shouldRememberGoogle && isGmailEmail(normalizedEmail)) {
      const remembered = readGoogleRememberMap();
      remembered[normalizedEmail] = username;
      saveGoogleRememberMap(remembered);
    }

    return {
      ok: true,
      username: username,
      message: "Signed in"
    };
  }

  function signInGoogleStyle(email) {
    const normalizedEmail = sanitizeEmail(email);
    if (!normalizedEmail) return { ok: false, message: "Valid Gmail required" };
    if (!isGmailEmail(normalizedEmail)) {
      return { ok: false, message: "Google sign-in requires a Gmail address" };
    }

    const accounts = loadAccounts();
    const username = findUsernameByEmail(accounts, normalizedEmail);
    if (!username) {
      return { ok: false, message: "No Google-linked account yet. Use email sign in first." };
    }

    const remembered = readGoogleRememberMap();
    if (String(remembered[normalizedEmail] || "") !== username) {
      return { ok: false, message: "Use email + password once and enable remember, then try Google sign-in." };
    }

    ensureRole(accounts[username]);
    accounts[username].googleLinked = true;
    saveAccounts(accounts);
    setCurrentUsername(username);
    syncAccountToLan(accounts[username]);
    return { ok: true, username: username, message: "Signed in with Google" };
  }

  function getRememberedGoogleAccounts() {
    const remembered = readGoogleRememberMap();
    const emails = Object.keys(remembered || {}).filter(function (e) { return isGmailEmail(e); });
    return emails.map(function (email) {
      return { email: email, username: String(remembered[email] || "") };
    });
  }

  function getLastAuthMessage() {
    return String(lastAuthMessage || "");
  }

  function changeMyPassword(currentPassword, newPassword) {
    const username = getCurrentUsername();
    if (!username) return { ok: false, message: "No active account" };
    if (isOwnerUser(username)) return { ok: false, message: "Owner password is fixed" };
    const next = String(newPassword || "");
    if (next.length < 3) return { ok: false, message: "New password too short" };

    const accounts = loadAccounts();
    if (!accounts[username]) accounts[username] = createEmptyAccount(username);
    const account = accounts[username];
    ensureProgression(account);
    const stored = String(account.passHash || "");
    if (stored && passwordHash(currentPassword) !== stored) {
      return { ok: false, message: "Current password is wrong" };
    }
    account.passHash = passwordHash(next);
    accounts[username] = account;
    saveAccounts(accounts);
    return { ok: true, message: "Password updated" };
  }

  function signOut() {
    if (isOwnerUser(getCurrentUsername())) {
      return false;
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    return true;
  }

  function getAccount(username) {
    const accounts = loadAccounts();
    const name = sanitizeName(username || getCurrentUsername());
    if (!name) return null;
    if (!accounts[name]) {
      accounts[name] = createEmptyAccount(name);
      saveAccounts(accounts);
    }
    ensureRole(accounts[name]);
    return accounts[name];
  }

  function ownerSetPointsCredits(targetUsername, rankPointsValue, creditsValue, tokensValue, gameKeysValue, password) {
    const current = getCurrentUsername();
    if (!isOwnerUser(current)) {
      return { ok: false, message: "Owner only" };
    }
    if (!ownerPasswordValid(password)) {
      return { ok: false, message: "Invalid owner password" };
    }

    const target = sanitizeName(targetUsername);
    if (!target) {
      return { ok: false, message: "Target username required" };
    }

    const points = Math.max(0, Number(rankPointsValue) || 0);
    const credits = Math.max(0, Number(creditsValue) || 0);
    const tokens = Math.max(0, Number(tokensValue) || 0);
    const gameKeys = Math.max(0, Number(gameKeysValue) || 0);
    const accounts = loadAccounts();
    if (!accounts[target]) {
      accounts[target] = createEmptyAccount(target);
    }

    const account = accounts[target];
    account.rankPoints = Math.floor(points);
    account.credits = Math.floor(credits);
    account.tokens = Math.floor(tokens);
    account.gameKeys = Math.floor(gameKeys);
    account.level = levelFromPoints(account.rankPoints);
    account.rankName = rankFromPoints(account.rankPoints);
    applyRoleRankFloor(account);
    account.rankName = rankFromPoints(account.rankPoints);
    account.level = Math.max(account.level || 1, levelFromPoints(account.rankPoints));
    ensureRole(account);
    account.lastSeen = nowIso();
    accounts[target] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);

    return {
      ok: true,
      message: "Updated",
      account: {
        username: account.username,
        rankPoints: account.rankPoints,
        credits: account.credits,
        tokens: account.tokens,
        gameKeys: account.gameKeys,
        level: account.level,
        rankName: account.rankName
      }
    };
  }

  async function ownerSetRole(targetUsername, roleValue, password) {
    const current = getCurrentUsername();
    if (!isOwnerUser(current)) return { ok: false, message: "Owner only" };
    if (!ownerPasswordValid(password)) return { ok: false, message: "Invalid owner password" };

    const target = sanitizeName(targetUsername);
    if (!target) return { ok: false, message: "Target username required" };

    const role = String(roleValue || "player").toLowerCase();
    if (!["player", "helper", "mod", "admin", "owner"].includes(role)) {
      return { ok: false, message: "Invalid role" };
    }

    if (target.toLowerCase() === "bob123meep" && role !== "owner") {
      return { ok: false, message: "Bob123meep must remain owner" };
    }
    if (target.toLowerCase() !== "bob123meep" && role === "owner") {
      return { ok: false, message: "Only Bob123meep can be owner" };
    }

    const accounts = loadAccounts();
    if (!accounts[target]) accounts[target] = createEmptyAccount(target);
    accounts[target].role = role;
    accounts[target].lastSeen = nowIso();
    saveAccounts(accounts);
    syncAccountToLan(accounts[target]);

    if (isLanHttpMode()) {
      try {
        const url = new URL("/api/set-admin", location.origin);
        url.searchParams.set("username", current);
        url.searchParams.set("password", String(password || ""));
        url.searchParams.set("target", target);
        url.searchParams.set("role", role);
        const res = await fetch(url.toString(), { cache: "no-store" });
        const data = await res.json().catch(function () { return { ok: false, error: "Invalid response" }; });
        if (!res.ok || !data || !data.ok) {
          return { ok: false, message: data && (data.error || data.message) ? (data.error || data.message) : "Failed to sync role to server" };
        }
      } catch {
        return { ok: false, message: "Role changed locally but failed to sync to LAN server" };
      }
    }

    return { ok: true, message: "Role updated" };
  }

  async function getModerationState() {
    const current = getCurrentUsername();
    if (!isOwnerUser(current) && !isAdminUser(current) && !isModUser(current) && !isHelperUser(current)) {
      return { ok: false, message: "Staff role required", ipBans: [], userIps: {} };
    }
    if (!isLanHttpMode()) {
      return readModerationStateCache();
    }
    try {
      const url = new URL("/api/mod-state", location.origin);
      url.searchParams.set("username", current);
      url.searchParams.set("ts", String(Date.now()));
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json().catch(function () { return { ok: false, error: "Invalid response" }; });
      if (!res.ok || !data || !data.ok) {
        const cached = readModerationStateCache();
        return { ok: false, message: data && (data.error || data.message) ? (data.error || data.message) : "Moderation state unavailable", ipBans: cached.ipBans || [], userIps: cached.userIps || {} };
      }
      cacheModerationState(data);
      return data;
    } catch {
      const cached = readModerationStateCache();
      return { ok: false, message: "Moderation state unavailable", ipBans: cached.ipBans || [], userIps: cached.userIps || {} };
    }
  }

  async function banTarget(target, reason, hours, password) {
    const current = getCurrentUsername();
    if (!isOwnerUser(current) && !isAdminUser(current) && !isModUser(current)) {
      return { ok: false, message: "Mod, admin, or owner required" };
    }
    if (!target || !String(target).trim()) {
      return { ok: false, message: "Target required" };
    }
    if (!isLanHttpMode()) {
      return { ok: false, message: "LAN mode required" };
    }
    try {
      const url = new URL("/api/ban-ip", location.origin);
      url.searchParams.set("username", current);
      url.searchParams.set("target", String(target).trim());
      url.searchParams.set("reason", String(reason || "").trim());
      url.searchParams.set("hours", String(Math.max(0, Number(hours) || 0)));
      url.searchParams.set("password", String(password || ""));
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json().catch(function () { return { ok: false, error: "Invalid response" }; });
      if (!res.ok || !data || !data.ok) {
        return { ok: false, message: data && (data.error || data.message) ? (data.error || data.message) : "Ban failed" };
      }
      return { ok: true, message: "Ban applied", ip: data.ip || "", until: data.until || "" };
    } catch {
      return { ok: false, message: "Ban request failed" };
    }
  }

  async function unbanIp(ip, password) {
    const current = getCurrentUsername();
    if (!isOwnerUser(current) && !isAdminUser(current) && !isModUser(current)) {
      return { ok: false, message: "Mod, admin, or owner required" };
    }
    if (!ip || !String(ip).trim()) {
      return { ok: false, message: "IP required" };
    }
    if (!isLanHttpMode()) {
      return { ok: false, message: "LAN mode required" };
    }
    try {
      const url = new URL("/api/unban-ip", location.origin);
      url.searchParams.set("username", current);
      url.searchParams.set("ip", String(ip).trim());
      url.searchParams.set("password", String(password || ""));
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json().catch(function () { return { ok: false, error: "Invalid response" }; });
      if (!res.ok || !data || !data.ok) {
        return { ok: false, message: data && (data.error || data.message) ? (data.error || data.message) : "Unban failed" };
      }
      return { ok: true, message: "IP unbanned" };
    } catch {
      return { ok: false, message: "Unban request failed" };
    }
  }

  function ownerResetPlayer(targetUsername, password) {
    const current = getCurrentUsername();
    if (!isOwnerUser(current)) return { ok: false, message: "Owner only" };
    if (!ownerPasswordValid(password)) return { ok: false, message: "Invalid owner password" };

    const target = sanitizeName(targetUsername);
    if (!target) return { ok: false, message: "Target username required" };

    const accounts = loadAccounts();
    const old = accounts[target] || createEmptyAccount(target);
    const role = target.toLowerCase() === "bob123meep" ? "owner" : (old.role || "player");
    const rebuilt = createEmptyAccount(target);
    rebuilt.role = role;
    accounts[target] = rebuilt;
    saveAccounts(accounts);
    syncAccountToLan(accounts[target]);
    return { ok: true, message: "Player reset" };
  }

  async function ownerResetLeaderboard(password) {
    const current = getCurrentUsername();
    if (!isOwnerUser(current)) return { ok: false, message: "Owner only" };
    if (!ownerPasswordValid(password)) return { ok: false, message: "Invalid owner password" };

    const owner = createEmptyAccount(current);
    owner.role = "owner";
    const accounts = {};
    accounts[current] = owner;
    saveAccounts(accounts);
    saveCurrentUsername(current);
    syncAccountToLan(owner);

    if (isLanHttpMode()) {
      try {
        const url = new URL("/api/reset-leaderboard", location.origin);
        url.searchParams.set("username", current);
        url.searchParams.set("password", String(password || ""));
        const res = await fetch(url.toString(), { cache: "no-store" });
        const data = await res.json().catch(function () { return { ok: false, error: "Invalid response" }; });
        if (!res.ok || !data || !data.ok) {
          return { ok: false, message: data && (data.error || data.message) ? (data.error || data.message) : "Server reset failed" };
        }
      } catch {
        return { ok: false, message: "Leaderboard reset locally but failed to sync to LAN server" };
      }
    }

    return { ok: true, message: "Leaderboard reset complete" };
  }

  async function setWeeklyCompetition(payload, password) {
    const current = getCurrentUsername();
    if (!isOwnerUser(current)) return { ok: false, message: "Owner only" };
    if (!ownerPasswordValid(password)) return { ok: false, message: "Invalid owner password" };
    if (!isLanHttpMode()) {
      localStorage.setItem("rgw_weekly_comp_local_v1", JSON.stringify(payload || {}));
      return { ok: true, message: "Weekly competition saved (local mode)" };
    }
    try {
      const url = new URL("/api/weekly-comp-set", location.origin);
      url.searchParams.set("username", current);
      url.searchParams.set("password", password);
      url.searchParams.set("title", String((payload && payload.title) || "Weekly Drawing Competition"));
      url.searchParams.set("theme", String((payload && payload.theme) || ""));
      url.searchParams.set("deadline", String((payload && payload.deadline) || ""));
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json().catch(function () { return { ok: false, message: "Invalid response" }; });
      return data;
    } catch {
      return { ok: false, message: "Failed to publish competition" };
    }
  }

  async function getWeeklyCompetition() {
    if (!isLanHttpMode()) {
      return safeJsonParse(localStorage.getItem("rgw_weekly_comp_local_v1"), {});
    }
    try {
      const res = await fetch("/api/weekly-comp?ts=" + Date.now(), { cache: "no-store" });
      const data = await res.json().catch(function () { return {}; });
      return (data && data.competition) || {};
    } catch {
      return {};
    }
  }

  function claimQuest(questId) {
    const { username, accounts, account } = accountForCurrentUser();
    const quest = QUESTS.find(function (q) { return q.id === questId; });
    if (!quest) return { ok: false, message: "Quest not found" };
    if (account.completedQuests.indexOf(questId) >= 0) {
      return { ok: false, message: "Already claimed" };
    }
    if (!quest.check(account)) {
      return { ok: false, message: "Quest requirements not met" };
    }
    account.completedQuests.push(questId);
    account.credits += quest.credits;
    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
    return { ok: true, message: "Quest claimed", credits: account.credits };
  }

  function getStreakStatus(username) {
    const account = getAccount(username || getCurrentUsername());
    if (!account) {
      return {
        streakCount: 0,
        longestStreak: 0,
        streakFreezes: 0,
        streakRank: "",
        lastStreakDate: "",
        firstWeekRewardClaimed: false,
        checkedToday: false,
        nextMilestoneIn: 7
      };
    }
    const today = todayKey();
    const diff = daysBetween(account.lastStreakDate, today);
    const checkedToday = diff === 0;
    const streakCount = Math.max(0, Number(account.streakCount) || 0);
    const remainder = streakCount % 7;
    const nextMilestoneIn = remainder === 0 ? 7 : (7 - remainder);
    return {
      streakCount,
      longestStreak: Math.max(0, Number(account.longestStreak) || 0),
      streakFreezes: Math.max(0, Number(account.streakFreezes) || 0),
      streakRank: String(account.streakRank || ""),
      lastStreakDate: String(account.lastStreakDate || ""),
      firstWeekRewardClaimed: !!account.firstWeekRewardClaimed,
      checkedToday,
      nextMilestoneIn
    };
  }

  function getStreakHistory(username) {
    const account = getAccount(username || getCurrentUsername());
    const streakCount = Math.max(0, Number(account && account.streakCount) || 0);
    const lastDate = String(account && account.lastStreakDate || "");
    const out = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = y + "-" + m + "-" + day;

      let active = false;
      if (lastDate && streakCount > 0) {
        const delta = daysBetween(key, lastDate);
        active = delta >= 0 && delta < streakCount;
      }

      out.push({
        key,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        active
      });
    }

    return out;
  }

  function hashText(text) {
    const s = String(text || "");
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return Math.abs(h >>> 0);
  }

  function ensureDailyShopState(account) {
    account.dailyShopPurchased = account.dailyShopPurchased && typeof account.dailyShopPurchased === "object"
      ? account.dailyShopPurchased
      : {};
    account.dailyShopRolls = account.dailyShopRolls && typeof account.dailyShopRolls === "object"
      ? account.dailyShopRolls
      : {};
    account.merchantPurchased = account.merchantPurchased && typeof account.merchantPurchased === "object"
      ? account.merchantPurchased
      : {};
  }

  function pickBySeed(arr, seed) {
    if (!arr.length) return null;
    return arr[seed % arr.length];
  }

  function getDailyShopOffers(username) {
    const account = getAccount(username || getCurrentUsername());
    if (!account) return { dayKey: todayKey(), offers: [] };
    ensureDailyShopState(account);

    const dayKey = todayKey();
    const rollCount = Math.max(0, Number(account.dailyShopRolls[dayKey]) || 0);
    const baseSeed = hashText(account.username + "|" + dayKey + "|roll:" + rollCount);

    const tags = TAG_SHOP.map(function (t) { return t; });
    const pics = PROFILE_PICS.filter(function (p) {
      if (p.secretOnly) return false;
      return !p.ownerOnly || isOwnerUser(account.username);
    });

    const tagA = pickBySeed(tags, baseSeed + 11);
    const tagB = pickBySeed(tags, baseSeed + 23);
    const picA = pickBySeed(pics, baseSeed + 37);

    const offers = [];
    if (tagA) {
      offers.push({
        id: "daily-tag-1-r" + rollCount,
        kind: "tag",
        refId: tagA.id,
        label: "Daily Tag: " + tagA.label,
        cost: Math.max(6, Math.floor(tagA.cost * 0.7))
      });
    }
    if (picA) {
      offers.push({
        id: "daily-pic-1-r" + rollCount,
        kind: "pic",
        refId: picA.id,
        label: "Daily Pic: " + picA.label,
        cost: Math.max(8, Math.floor(picA.cost * 0.75))
      });
    }
    if (tagB) {
      offers.push({
        id: "daily-freeze-1-r" + rollCount,
        kind: "freeze",
        refId: "freeze-bundle",
        label: "Daily Streak Freeze",
        cost: 9,
        amount: 1
      });
    }

    const purchasedToday = account.dailyShopPurchased[dayKey] && typeof account.dailyShopPurchased[dayKey] === "object"
      ? account.dailyShopPurchased[dayKey]
      : {};

    return {
      dayKey,
      rollCount,
      rerollCost: DAILY_SHOP_REROLL_COST,
      rerollsLeft: Math.max(0, DAILY_SHOP_REROLL_MAX - rollCount),
      offers: offers.map(function (o) {
        return {
          id: o.id,
          kind: o.kind,
          refId: o.refId,
          label: o.label,
          cost: o.cost,
          amount: o.amount || 1,
          purchased: !!purchasedToday[o.id]
        };
      })
    };
  }

  function rerollDailyShop() {
    const { username, accounts, account } = accountForCurrentUser();
    ensureDailyShopState(account);
    const dayKey = todayKey();
    const currentRolls = Math.max(0, Number(account.dailyShopRolls[dayKey]) || 0);
    if (currentRolls >= DAILY_SHOP_REROLL_MAX) {
      return { ok: false, message: "Daily reroll limit reached" };
    }
    if ((Number(account.tokens) || 0) < DAILY_SHOP_REROLL_COST) {
      return { ok: false, message: "Not enough tokens" };
    }

    account.tokens = Math.max(0, Number(account.tokens) || 0) - DAILY_SHOP_REROLL_COST;
    account.dailyShopRolls[dayKey] = currentRolls + 1;
    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
    return {
      ok: true,
      message: "Daily shop rerolled",
      tokens: account.tokens,
      rollCount: account.dailyShopRolls[dayKey],
      rerollsLeft: Math.max(0, DAILY_SHOP_REROLL_MAX - account.dailyShopRolls[dayKey])
    };
  }

  function buyDailyOffer(offerId) {
    const { username, accounts, account } = accountForCurrentUser();
    ensureDailyShopState(account);
    const daily = getDailyShopOffers(username);
    const offer = daily.offers.find(function (o) { return o.id === offerId; });
    if (!offer) return { ok: false, message: "Offer not found" };

    account.dailyShopPurchased[daily.dayKey] = account.dailyShopPurchased[daily.dayKey] && typeof account.dailyShopPurchased[daily.dayKey] === "object"
      ? account.dailyShopPurchased[daily.dayKey]
      : {};

    if (account.dailyShopPurchased[daily.dayKey][offer.id]) {
      return { ok: false, message: "Already purchased today" };
    }

    if (account.credits < offer.cost) {
      return { ok: false, message: "Not enough credits" };
    }

    if (offer.kind === "tag") {
      if (account.ownedTags.indexOf(offer.refId) < 0) {
        account.credits -= offer.cost;
        account.ownedTags.push(offer.refId);
      }
      account.equippedTag = offer.refId;
      pushInventoryItem(account, { type: "tag", label: "Daily Tag", detail: offer.label });
      appendAdminAudit({ type: "buy", actor: username, target: username, detail: "daily tag " + offer.label });
    } else if (offer.kind === "pic") {
      const pic = getProfilePicById(offer.refId);
      if (!pic) return { ok: false, message: "Profile pic not found" };
      if (pic.ownerOnly && !isOwnerUser(username)) {
        return { ok: false, message: "Owner-only profile pic" };
      }
      if (account.unlockedProfilePics.indexOf(offer.refId) < 0) {
        account.credits -= offer.cost;
        account.unlockedProfilePics.push(offer.refId);
      }
      account.profilePic = offer.refId;
      pushInventoryItem(account, { type: "profile", label: "Daily Profile Pic", detail: offer.label });
      appendAdminAudit({ type: "buy", actor: username, target: username, detail: "daily pic " + offer.label });
    } else if (offer.kind === "freeze") {
      account.credits -= offer.cost;
      account.streakFreezes = Math.max(0, Number(account.streakFreezes) || 0) + Math.max(1, Number(offer.amount) || 1);
      pushInventoryItem(account, { type: "utility", label: "Streak Freeze", detail: "+" + Math.max(1, Number(offer.amount) || 1) });
      appendAdminAudit({ type: "buy", actor: username, target: username, detail: "daily freeze x" + Math.max(1, Number(offer.amount) || 1) });
    } else {
      return { ok: false, message: "Unsupported offer" };
    }

    account.dailyShopPurchased[daily.dayKey][offer.id] = true;
    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
    return { ok: true, message: "Daily offer purchased", credits: account.credits };
  }

  function merchantDayKey() {
    return todayKey() + "-m";
  }

  function getMerchantOverride() {
    const cfg = safeJsonParse(localStorage.getItem(MERCHANT_OVERRIDE_KEY), { mode: "auto" });
    const mode = String(cfg && cfg.mode || "auto").toLowerCase();
    if (["auto", "off", "force-open", "force-secret"].indexOf(mode) < 0) {
      return { mode: "auto" };
    }
    return { mode: mode };
  }

  function setMerchantMode(mode) {
    const current = getCurrentUsername();
    if (!isOwnerUser(current) && !isAdminUser(current)) {
      return { ok: false, message: "Admin or owner required" };
    }
    const next = String(mode || "auto").toLowerCase();
    if (["auto", "off", "force-open", "force-secret"].indexOf(next) < 0) {
      return { ok: false, message: "Invalid merchant mode" };
    }
    localStorage.setItem(MERCHANT_OVERRIDE_KEY, JSON.stringify({ mode: next }));
    return { ok: true, message: "Merchant mode set to " + next };
  }

  function secondsUntilNextMidnight() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return Math.max(1, Math.floor((next.getTime() - now.getTime()) / 1000));
  }

  function getShopTimers() {
    const dayNum = merchantDayNumber();
    const merchantActiveAuto = dayNum % 2 === 0;
    const secretAuto = dayNum % 20 === 0;
    const override = getMerchantOverride();
    let merchantActive = merchantActiveAuto;
    let secretActive = secretAuto;
    if (override.mode === "off") merchantActive = false;
    if (override.mode === "force-open") merchantActive = true;
    if (override.mode === "force-secret") {
      merchantActive = true;
      secretActive = true;
    }

    return {
      dailyResetIn: secondsUntilNextMidnight(),
      merchantSwitchIn: secondsUntilNextMidnight(),
      merchantActive,
      secretActive,
      mode: override.mode
    };
  }

  function merchantDayNumber() {
    return Math.floor(Date.now() / 86400000);
  }

  function isMerchantDay() {
    const dayNum = merchantDayNumber();
    return dayNum % 2 === 0;
  }

  function isSecretMerchantDay() {
    const dayNum = merchantDayNumber();
    return dayNum % 20 === 0;
  }

  function rarityTagPool(rarity) {
    if (rarity === "common") {
      return TAG_SHOP.filter(function (t) { return t.cost <= 18; });
    }
    if (rarity === "rare") {
      return TAG_SHOP.filter(function (t) { return t.cost >= 18 && t.cost <= 24; });
    }
    return TAG_SHOP.slice();
  }

  function rarityPicPool(rarity, username) {
    const all = PROFILE_PICS.filter(function (p) { return !p.ownerOnly && !p.secretOnly; });
    if (rarity === "common") {
      return all.filter(function (p) { return p.cost <= 16; });
    }
    if (rarity === "rare") {
      return all.filter(function (p) { return p.cost >= 16 && p.cost <= 18; });
    }
    if (rarity === "epic") {
      return all.filter(function (p) { return p.cost >= 18; });
    }
    if (rarity === "mythic" || rarity === "legendary" || rarity === "secret") {
      return all.filter(function (p) { return p.cost >= 20; });
    }
    return all;
  }

  function rollBetween(seedBase, min, max) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    const span = (hi - lo) + 1;
    return lo + (seedBase % span);
  }

  function rarityRewardOptions(rarity, username, account) {
    const tagPool = rarityTagPool(rarity);
    const picPool = rarityPicPool(rarity, username);
    const list = [];

    if (rarity === "common") {
      list.push({ kind: "credits", min: 4, max: 9 });
      list.push({ kind: "points", min: 3, max: 7 });
      if (tagPool.length) list.push({ kind: "tag", pool: tagPool });
      if (picPool.length) list.push({ kind: "pic", pool: picPool });
    } else if (rarity === "rare") {
      list.push({ kind: "credits", min: 10, max: 18 });
      list.push({ kind: "points", min: 8, max: 14 });
      list.push({ kind: "tokens", min: 1, max: 2 });
      if (tagPool.length) list.push({ kind: "tag", pool: tagPool });
      if (picPool.length) list.push({ kind: "pic", pool: picPool });
      list.push({ kind: "freeze", amount: 1 });
      list.push({ kind: "key", amount: 1 });
    } else if (rarity === "epic") {
      list.push({ kind: "credits", min: 18, max: 30 });
      list.push({ kind: "points", min: 14, max: 24 });
      list.push({ kind: "tokens", min: 2, max: 4 });
      if (tagPool.length) list.push({ kind: "tag", pool: tagPool });
      if (picPool.length) list.push({ kind: "pic", pool: picPool });
      list.push({ kind: "freeze", amount: 1 });
      list.push({ kind: "key", amount: 1 });
    } else if (rarity === "mythic") {
      list.push({ kind: "credits", min: 28, max: 44 });
      list.push({ kind: "points", min: 24, max: 38 });
      list.push({ kind: "tokens", min: 4, max: 6 });
      if (tagPool.length) list.push({ kind: "tag", pool: tagPool });
      if (picPool.length) list.push({ kind: "pic", pool: picPool });
      list.push({ kind: "freeze", amount: 2 });
      list.push({ kind: "key", amount: 1 });
    } else if (rarity === "legendary") {
      list.push({ kind: "credits", min: 40, max: 65 });
      list.push({ kind: "points", min: 36, max: 55 });
      list.push({ kind: "tokens", min: 6, max: 9 });
      if (tagPool.length) list.push({ kind: "tag", pool: tagPool });
      if (picPool.length) list.push({ kind: "pic", pool: picPool });
      list.push({ kind: "freeze", amount: 2 });
      list.push({ kind: "key", amount: 2 });
    } else {
      list.push({ kind: "credits", min: 60, max: 95 });
      list.push({ kind: "points", min: 50, max: 80 });
      list.push({ kind: "tokens", min: 10, max: 14 });
      if (tagPool.length) list.push({ kind: "tag", pool: tagPool });
      if (picPool.length) list.push({ kind: "pic", pool: picPool });
      list.push({ kind: "freeze", amount: 3 });
      list.push({ kind: "key", amount: 3 });
      list.push({ kind: "divine", amount: 1 });
    }

    return list;
  }

  function applyMerchantReward(account, username, dayKey, offer, rewardSeed) {
    const options = rarityRewardOptions(offer.rarity, username, account);
    if (!options.length) {
      return { text: "+0", rewardKind: "none", cinematicTier: "normal", rewardRarity: offer.rarity };
    }
    const reward = options[rewardSeed % options.length];

    function pack(text, kind) {
      let cinematicTier = "normal";
      if (offer.rarity === "mythic" || offer.rarity === "legendary") cinematicTier = "high";
      if (offer.rarity === "secret" || kind === "divine") cinematicTier = "secret";
      return { text: text, rewardKind: kind, cinematicTier: cinematicTier, rewardRarity: offer.rarity };
    }

    if (reward.kind === "credits") {
      const amount = rollBetween(rewardSeed, reward.min, reward.max);
      account.credits += amount;
      return pack("+" + amount + " credits", "credits");
    }
    if (reward.kind === "points") {
      const amount = rollBetween(rewardSeed, reward.min, reward.max);
      account.rankPoints += amount;
      account.rankName = rankFromPoints(account.rankPoints);
      const nextLevel = levelFromPoints(account.rankPoints);
      if (nextLevel > account.level) {
        const gain = nextLevel - account.level;
        account.credits += gain * 5;
        account.tokens += Math.floor(gain / TOKEN_LEVEL_STEP);
        account.level = nextLevel;
      }
      return pack("+" + amount + " rank points", "points");
    }
    if (reward.kind === "tokens") {
      const amount = rollBetween(rewardSeed, reward.min, reward.max);
      account.tokens = Math.max(0, Number(account.tokens) || 0) + amount;
      return pack("+" + amount + " tokens", "tokens");
    }
    if (reward.kind === "freeze") {
      const amount = Math.max(1, Number(reward.amount) || 1);
      account.streakFreezes = Math.max(0, Number(account.streakFreezes) || 0) + amount;
      return pack("+" + amount + " streak freezes", "freeze");
    }
    if (reward.kind === "key") {
      const amount = Math.max(1, Number(reward.amount) || 1);
      account.gameKeys = Math.max(0, Number(account.gameKeys) || 0) + amount;
      return pack("+" + amount + " crate keys", "key");
    }
    if (reward.kind === "divine") {
      const divineId = "divine-seraph";
      if (account.unlockedProfilePics.indexOf(divineId) < 0) {
        account.unlockedProfilePics.push(divineId);
      }
      account.profilePic = divineId;
      account.divineArtifacts = Math.max(0, Number(account.divineArtifacts) || 0) + 1;
      return pack("DIVINE DROP: Divine Seraph unlocked", "divine");
    }
    if (reward.kind === "tag") {
      const pool = Array.isArray(reward.pool) ? reward.pool : [];
      if (!pool.length) return pack("+0", "none");
      const tag = pool[rewardSeed % pool.length];
      if (account.ownedTags.indexOf(tag.id) < 0) {
        account.ownedTags.push(tag.id);
      }
      account.equippedTag = tag.id;
      return pack("Tag unlocked: " + tag.label, "tag");
    }
    if (reward.kind === "pic") {
      const pool = Array.isArray(reward.pool) ? reward.pool : [];
      if (!pool.length) return pack("+0", "none");
      const pic = pool[rewardSeed % pool.length];
      if (account.unlockedProfilePics.indexOf(pic.id) < 0) {
        account.unlockedProfilePics.push(pic.id);
      }
      account.profilePic = pic.id;
      return pack("Profile pic unlocked: " + pic.label, "pic");
    }

    return pack("+0", "none");
  }

  function getMerchantShop(username) {
    const account = getAccount(username || getCurrentUsername());
    if (!account) return { active: false, dayKey: merchantDayKey(), offers: [], reason: "No account" };
    ensureDailyShopState(account);

    const dayKey = merchantDayKey();
    const override = getMerchantOverride();
    let active = isMerchantDay();
    let secretDay = isSecretMerchantDay();
    if (override.mode === "off") active = false;
    if (override.mode === "force-open") active = true;
    if (override.mode === "force-secret") {
      active = true;
      secretDay = true;
    }

    if (!active) {
      return { active: false, dayKey, offers: [], reason: "Merchant returns tomorrow" };
    }

    const crates = MERCHANT_CRATES.filter(function (crate) {
      return !crate.secretOnly || secretDay;
    });

    const offers = crates.map(function (crate, idx) {
      const id = "merchant-" + idx + "-" + crate.id;
      const purchased = !!(account.merchantPurchased[dayKey] && account.merchantPurchased[dayKey][id]);
      return {
        id,
        crateId: crate.id,
        label: crate.label,
        rarity: crate.rarity,
        tokenCost: crate.tokenCost,
        purchased
      };
    });

    return { active: true, dayKey, offers };
  }

  function buyMerchantCrate(offerId) {
    const { username, accounts, account } = accountForCurrentUser();
    ensureDailyShopState(account);
    const shop = getMerchantShop(username);
    if (!shop.active) return { ok: false, message: shop.reason || "Merchant is away" };

    const offer = shop.offers.find(function (o) { return o.id === offerId; });
    if (!offer) return { ok: false, message: "Offer not found" };

    account.merchantPurchased[shop.dayKey] = account.merchantPurchased[shop.dayKey] && typeof account.merchantPurchased[shop.dayKey] === "object"
      ? account.merchantPurchased[shop.dayKey]
      : {};
    if (account.merchantPurchased[shop.dayKey][offer.id]) {
      return { ok: false, message: "Already bought this crate" };
    }
    if ((Number(account.tokens) || 0) < offer.tokenCost) {
      return { ok: false, message: "Not enough tokens" };
    }

    account.tokens = Math.max(0, Number(account.tokens) || 0) - offer.tokenCost;
    account.unopenedCrates = Array.isArray(account.unopenedCrates) ? account.unopenedCrates : [];
    const crateUid = "crate-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
    account.unopenedCrates.unshift({
      uid: crateUid,
      boughtAt: nowIso(),
      dayKey: shop.dayKey,
      offerId: offer.id,
      crateId: offer.crateId,
      label: offer.label,
      rarity: offer.rarity
    });
    pushInventoryItem(account, { type: "crate", label: "Crate Purchased", detail: offer.label + " (unopened)" });
    appendAdminAudit({ type: "buy", actor: username, target: username, detail: "merchant crate " + offer.label });
    const showInventoryHint = !account.inventoryHintSeen;
    account.inventoryHintSeen = true;

    account.merchantPurchased[shop.dayKey][offer.id] = true;
    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
    return {
      ok: true,
      message: "Crate added to inventory",
      tokens: account.tokens,
      crateUid: crateUid,
      crateRarity: offer.rarity,
      unopenedCrates: account.unopenedCrates.length,
      showInventoryHint: showInventoryHint
    };
  }

  function getInventory(username) {
    const account = getAccount(username || getCurrentUsername());
    if (!account) return { items: [], unopenedCrates: [] };
    return {
      items: (Array.isArray(account.inventoryItems) ? account.inventoryItems : []).slice(),
      unopenedCrates: (Array.isArray(account.unopenedCrates) ? account.unopenedCrates : []).slice(),
      tags: (Array.isArray(account.ownedTags) ? account.ownedTags : []).slice(),
      profilePics: (Array.isArray(account.unlockedProfilePics) ? account.unlockedProfilePics : []).slice(),
      unlockedGames: (Array.isArray(account.unlockedGames) ? account.unlockedGames : []).slice()
    };
  }

  function openInventoryCrate(crateUid) {
    const { username, accounts, account } = accountForCurrentUser();
    account.unopenedCrates = Array.isArray(account.unopenedCrates) ? account.unopenedCrates : [];
    const idx = account.unopenedCrates.findIndex(function (c) { return String(c.uid || "") === String(crateUid || ""); });
    if (idx < 0) return { ok: false, message: "Crate not found" };

    const crate = account.unopenedCrates[idx];
    const offer = {
      id: crate.offerId || crate.uid,
      crateId: crate.crateId || "inventory-crate",
      label: crate.label || "Inventory Crate",
      rarity: crate.rarity || "common"
    };
    const rewardSeed = hashText(username + "|" + String(crate.uid || "") + "|" + offer.rarity);
    const reward = applyMerchantReward(account, username, String(crate.dayKey || merchantDayKey()), offer, rewardSeed);

    account.unopenedCrates.splice(idx, 1);
    pushInventoryItem(account, { type: "reward", label: "Crate Opened", detail: reward.text });
    appendAdminAudit({ type: "open-crate", actor: username, target: username, detail: reward.text });
    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);

    return {
      ok: true,
      message: "Crate opened: " + reward.text,
      reward: reward.text,
      rewardKind: reward.rewardKind,
      rewardRarity: reward.rewardRarity,
      cinematicTier: reward.cinematicTier,
      crateRarity: offer.rarity,
      unopenedCrates: account.unopenedCrates.length
    };
  }

  function buyTag(tagId) {
    const tag = TAG_SHOP.find(function (t) { return t.id === tagId; });
    if (!tag) return { ok: false, message: "Tag not found" };
    const { username, accounts, account } = accountForCurrentUser();
    if (account.ownedTags.indexOf(tagId) >= 0) {
      account.equippedTag = tagId;
      accounts[username] = account;
      saveAccounts(accounts);
      syncAccountToLan(account);
      return { ok: true, message: "Tag equipped", credits: account.credits };
    }
    if (account.credits < tag.cost) {
      return { ok: false, message: "Not enough credits" };
    }
    account.credits -= tag.cost;
    account.ownedTags.push(tagId);
    account.equippedTag = tagId;
    pushInventoryItem(account, { type: "tag", label: "Tag Purchased", detail: tag.label });
    appendAdminAudit({ type: "buy", actor: username, target: username, detail: "tag " + tag.label });
    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
    return { ok: true, message: "Tag purchased", credits: account.credits };
  }

  function buyStreakFreeze() {
    const { username, accounts, account } = accountForCurrentUser();
    if (account.credits < STREAK_FREEZE_COST) {
      return { ok: false, message: "Not enough credits" };
    }
    account.credits -= STREAK_FREEZE_COST;
    account.streakFreezes = Math.max(0, Number(account.streakFreezes) || 0) + 1;
    pushInventoryItem(account, { type: "utility", label: "Streak Freeze", detail: "+1 freeze" });
    appendAdminAudit({ type: "buy", actor: username, target: username, detail: "streak freeze" });
    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
    return { ok: true, message: "Streak freeze purchased", credits: account.credits, streakFreezes: account.streakFreezes };
  }

  function buyProfilePic(picId) {
    const pic = getProfilePicById(picId);
    if (!pic) return { ok: false, message: "Profile pic not found" };
    const { username, accounts, account } = accountForCurrentUser();
    if (pic.ownerOnly && !isOwnerUser(username)) {
      return { ok: false, message: "Owner-only profile pic" };
    }
    if (pic.secretOnly) {
      return { ok: false, message: "This pic is only from secret crates" };
    }
    if (account.unlockedProfilePics.indexOf(pic.id) >= 0) {
      account.profilePic = pic.id;
      accounts[username] = account;
      saveAccounts(accounts);
      syncAccountToLan(account);
      return { ok: true, message: "Profile pic equipped" };
    }
    if (account.credits < pic.cost) {
      return { ok: false, message: "Not enough credits" };
    }
    account.credits -= pic.cost;
    account.unlockedProfilePics.push(pic.id);
    account.profilePic = pic.id;
    pushInventoryItem(account, { type: "profile", label: "Profile Pic Purchased", detail: pic.label });
    appendAdminAudit({ type: "buy", actor: username, target: username, detail: "profile pic " + pic.label });
    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
    return { ok: true, message: "Profile pic purchased", credits: account.credits };
  }

  function equipProfilePic(picId) {
    const { username, accounts, account } = accountForCurrentUser();
    const pic = getProfilePicById(picId);
    if (pic && pic.ownerOnly && !isOwnerUser(username)) {
      return { ok: false, message: "Owner-only profile pic" };
    }
    if (!picId || account.unlockedProfilePics.indexOf(picId) < 0) {
      return { ok: false, message: "Profile pic not unlocked" };
    }
    account.profilePic = picId;
    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
    return { ok: true, message: "Profile pic equipped" };
  }

  function equipTag(tagId) {
    const { username, accounts, account } = accountForCurrentUser();
    if (!tagId) {
      account.equippedTag = "";
    } else if (account.ownedTags.indexOf(tagId) < 0) {
      return { ok: false, message: "Tag not owned" };
    } else {
      account.equippedTag = tagId;
    }
    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
    return { ok: true, message: "Tag equipped" };
  }

  function getTagStyle(tagId) {
    const tag = TAG_SHOP.find(function (t) { return t.id === tagId; });
    return tag ? tag.style : "";
  }

  async function getRooms() {
    if (!isLanHttpMode()) return readRoomsCache();
    try {
      const res = await fetch("/api/rooms?ts=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return readRoomsCache();
      const data = await res.json();
      const rooms = Array.isArray(data.rooms) ? data.rooms : [];
      cacheRooms(rooms);
      return rooms;
    } catch {
      return readRoomsCache();
    }
  }

  async function upsertRoom(roomCode) {
    if (!isLanHttpMode()) return { ok: false, message: "LAN mode required" };
    const username = ensureCurrentUser();
    const clean = sanitizeName(roomCode || "").replace(/\s+/g, "").toUpperCase().slice(0, 12);
    if (!clean) return { ok: false, message: "Room code required" };
    try {
      const url = new URL("/api/room-join", location.origin);
      url.searchParams.set("room", clean);
      url.searchParams.set("username", username);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json().catch(function () { return { ok: false }; });
      if (data && data.ok) {
        setCurrentRoomCode(clean);
      }
      return data;
    } catch {
      return { ok: false, message: "Room join failed" };
    }
  }

  async function submitRoomScore(gameId, scoreValue, roomCode) {
    if (!isLanHttpMode()) return { ok: false, message: "LAN mode required" };
    const username = ensureCurrentUser();
    const cleanRoom = sanitizeName(roomCode || getCurrentRoomCode()).replace(/\s+/g, "").toUpperCase().slice(0, 12);
    const cleanGame = sanitizeName(gameId || "").replace(/\s+/g, "-").toLowerCase().slice(0, 40);
    const score = Math.max(0, Number(scoreValue) || 0);
    if (!cleanRoom || !cleanGame) return { ok: false, message: "Room and game required" };
    try {
      const url = new URL("/api/room-score", location.origin);
      url.searchParams.set("room", cleanRoom);
      url.searchParams.set("username", username);
      url.searchParams.set("game", cleanGame);
      url.searchParams.set("score", String(Math.floor(score)));
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json().catch(function () { return { ok: false, message: "Invalid response" }; });
      return data;
    } catch {
      return { ok: false, message: "Failed to submit room score" };
    }
  }

  async function getRoomLeaderboard(gameId, roomCode) {
    if (!isLanHttpMode()) return { ok: false, message: "LAN mode required", scores: [] };
    const cleanRoom = sanitizeName(roomCode || getCurrentRoomCode()).replace(/\s+/g, "").toUpperCase().slice(0, 12);
    const cleanGame = sanitizeName(gameId || "").replace(/\s+/g, "-").toLowerCase().slice(0, 40);
    if (!cleanRoom || !cleanGame) return { ok: false, message: "Room and game required", scores: [] };
    try {
      const url = new URL("/api/room-scores", location.origin);
      url.searchParams.set("room", cleanRoom);
      url.searchParams.set("game", cleanGame);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json().catch(function () { return { ok: false, scores: [] }; });
      if (!data || !Array.isArray(data.scores)) {
        return { ok: false, message: "Invalid leaderboard", scores: [] };
      }
      return data;
    } catch {
      return { ok: false, message: "Failed to fetch room scores", scores: [] };
    }
  }

  async function setRoomGame(roomCode, gameId) {
    if (!isLanHttpMode()) return { ok: false, message: "LAN mode required" };
    const username = ensureCurrentUser();
    const cleanRoom = sanitizeName(roomCode || "").replace(/\s+/g, "").toUpperCase().slice(0, 12);
    const cleanGame = sanitizeName(gameId || "").replace(/\s+/g, "-").toLowerCase().slice(0, 32);
    if (!cleanRoom || !cleanGame) return { ok: false, message: "Room and game required" };
    try {
      const url = new URL("/api/room-set-game", location.origin);
      url.searchParams.set("room", cleanRoom);
      url.searchParams.set("username", username);
      url.searchParams.set("game", cleanGame);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json().catch(function () { return { ok: false, message: "Invalid response" }; });
      return data;
    } catch {
      return { ok: false, message: "Failed to set game" };
    }
  }

  async function kickRoomPlayer(roomCode, targetUsername) {
    if (!isLanHttpMode()) return { ok: false, message: "LAN mode required" };
    const username = ensureCurrentUser();
    const cleanRoom = sanitizeName(roomCode || "").replace(/\s+/g, "").toUpperCase().slice(0, 12);
    const target = sanitizeName(targetUsername || "");
    if (!cleanRoom || !target) return { ok: false, message: "Room and target required" };
    try {
      const url = new URL("/api/room-kick", location.origin);
      url.searchParams.set("room", cleanRoom);
      url.searchParams.set("username", username);
      url.searchParams.set("target", target);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json().catch(function () { return { ok: false, message: "Invalid response" }; });
      return data;
    } catch {
      return { ok: false, message: "Kick failed" };
    }
  }

  function getLockedGamesCatalog() {
    return LOCKED_GAMES.map(function (g) {
      return {
        id: g.id,
        label: g.label,
        requirement: {
          type: g.requirement.type,
          value: g.requirement.value,
          text: g.requirement.text
        }
      };
    });
  }

  function findLockedGame(gameId) {
    const id = String(gameId || "").trim().toLowerCase();
    return LOCKED_GAMES.find(function (g) { return g.id === id; }) || null;
  }

  function isGameUnlocked(gameId, username) {
    const rule = findLockedGame(gameId);
    if (!rule) return true;
    const name = sanitizeName(username || getCurrentUsername());
    if (!name) return false;
    if (isOwnerUser(name)) return true;
    const account = getAccount(name);
    const unlocked = Array.isArray(account.unlockedGames) ? account.unlockedGames : [];
    return unlocked.indexOf(rule.id) >= 0;
  }

  function getGameUnlockState(gameId, username) {
    const name = sanitizeName(username || getCurrentUsername());
    const rule = findLockedGame(gameId);
    if (!rule) {
      return { locked: false, unlocked: true, gameId: String(gameId || "") };
    }
    const account = getAccount(name);
    const unlocked = isGameUnlocked(rule.id, name);
    return {
      locked: !unlocked,
      unlocked,
      gameId: rule.id,
      label: rule.label,
      requirementText: rule.requirement.text,
      requirementType: rule.requirement.type,
      requirementValue: rule.requirement.value,
      streakCount: Number(account.streakCount) || 0,
      credits: Number(account.credits) || 0,
      rankPoints: Number(account.rankPoints) || 0,
      gameKeys: Number(account.gameKeys) || 0
    };
  }

  function unlockGame(gameId) {
    const rule = findLockedGame(gameId);
    if (!rule) return { ok: true, message: "Game already available" };

    const { username, accounts, account } = accountForCurrentUser();
    if (isOwnerUser(username)) {
      if (account.unlockedGames.indexOf(rule.id) < 0) {
        account.unlockedGames.push(rule.id);
      }
      accounts[username] = account;
      saveAccounts(accounts);
      syncAccountToLan(account);
      return { ok: true, message: "Game unlocked" };
    }

    if (account.unlockedGames.indexOf(rule.id) >= 0) {
      return { ok: true, message: "Game already unlocked" };
    }

    if (rule.requirement.type === "streak") {
      if ((Number(account.streakCount) || 0) < rule.requirement.value) {
        return { ok: false, message: "Need higher streak" };
      }
    } else if (rule.requirement.type === "credits") {
      if ((Number(account.credits) || 0) < rule.requirement.value) {
        return { ok: false, message: "Not enough credits" };
      }
      account.credits -= rule.requirement.value;
    } else if (rule.requirement.type === "points") {
      if ((Number(account.rankPoints) || 0) < rule.requirement.value) {
        return { ok: false, message: "Not enough rank points" };
      }
      account.rankPoints -= rule.requirement.value;
      account.rankName = rankFromPoints(account.rankPoints);
    } else if (rule.requirement.type === "crate") {
      if ((Number(account.gameKeys) || 0) < rule.requirement.value) {
        return { ok: false, message: "Need crate key" };
      }
      account.gameKeys -= rule.requirement.value;
    }

    account.unlockedGames.push(rule.id);
    pushInventoryItem(account, { type: "unlock", label: "Game Unlocked", detail: rule.label });
    appendAdminAudit({ type: "unlock", actor: username, target: username, detail: rule.label });
    ensureProgression(account);
    accounts[username] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
    return { ok: true, message: "Unlocked " + rule.label };
  }

  function extractBestNumericScore(text) {
    if (!text) return null;

    const scoreMatch = text.match(/score\s*[:=]\s*(\d+)/i);
    if (scoreMatch) return Number(scoreMatch[1]);

    const goalsMatch = text.match(/goals\s*[:=]\s*(\d+)/i);
    if (goalsMatch) return Number(goalsMatch[1]) * 10;

    const distanceMatch = text.match(/distance\s*[:=]\s*(\d+)/i);
    if (distanceMatch) return Number(distanceMatch[1]);

    return null;
  }

  function maybeAttachHudTracking() {
    const inGamePage = /\/games\//i.test(location.pathname || "");
    if (!inGamePage) return;

    const gid = gameIdFromPath();
    if (!isGameUnlocked(gid)) {
      try {
        alert("This game is locked. Unlock it from the Home page first.");
      } catch {
        // ignore alert failures
      }
      location.href = "../index.html";
      return;
    }

    const key = PAGE_PLAY_KEY + ":" + location.pathname;
    if (sessionStorage.getItem(key) !== "1") {
      startGame();
      sessionStorage.setItem(key, "1");
    }

    let lastSubmittedSignature = "";

    const doneWords = [
      "game over",
      "round over",
      "match over",
      "mission ended",
      "time up",
      "crash",
      "caught",
      "you escaped",
      "city saved",
      "you were overrun",
      "final score"
    ];

    const evaluate = function () {
      const hud = document.getElementById("hud") || document.getElementById("info");
      if (!hud) return;
      const text = (hud.textContent || "").trim();
      if (!text) return;

      const lower = text.toLowerCase();
      const done = doneWords.some(function (w) { return lower.indexOf(w) >= 0; });
      if (!done) return;

      const score = extractBestNumericScore(text);
      if (!Number.isFinite(score)) return;

      const signature = gameIdFromPath() + "|" + text;
      if (signature === lastSubmittedSignature) return;
      lastSubmittedSignature = signature;
      submitScore(gameIdFromPath(), score);
    };

    setInterval(evaluate, 900);
  }

  function injectAccountBar() {
    const bar = document.createElement("div");
    const username = ensureCurrentUser();
    const account = getAccount(username);
    const tagStyle = account && account.equippedTag ? getTagStyle(account.equippedTag) : "";
    const tagClass = account && account.equippedTag ? ' class="rgw-name-tagged" style="' + tagStyle + '"' : "";
    const avatar = account ? getProfilePicIcon(account.profilePic) : "🙂";
    const rankPoints = account ? Math.max(0, Number(account.rankPoints) || 0) : 0;
    const credits = account ? Math.max(0, Number(account.credits) || 0) : 0;
    const tokens = account ? Math.max(0, Number(account.tokens) || 0) : 0;
    const keys = account ? Math.max(0, Number(account.gameKeys) || 0) : 0;
    const ownerBadge = isOwnerUser(username) ? ' <span class="rgw-owner-badge">OWNER</span>' : "";
    const adminBadge = !ownerBadge && isAdminUser(username) ? ' <span class="rgw-admin-badge">ADMIN</span>' : "";
    bar.className = "rgw-account-bar";
    bar.innerHTML =
      '<span class="rgw-user"><span class="rgw-avatar">' + avatar + '</span> Player: <strong' + tagClass + '>' + username + '</strong>' + ownerBadge + adminBadge + '</span>' +
      '<span class="rgw-res">Pts ' + rankPoints.toLocaleString() + '</span>' +
      '<span class="rgw-res">Cr ' + credits.toLocaleString() + '</span>' +
      '<span class="rgw-res">Tk ' + tokens.toLocaleString() + '</span>' +
      '<span class="rgw-res">Keys ' + keys.toLocaleString() + '</span>' +
      '<a href="' + (/\/games\//i.test(location.pathname || "") ? "../account.html" : "account.html") + '">Account</a>' +
      '<a href="' + (/\/games\//i.test(location.pathname || "") ? "../inventory.html" : "inventory.html") + '">Inventory</a>' +
      '<a href="' + (/\/games\//i.test(location.pathname || "") ? "../leaderboard.html" : "leaderboard.html") + '">Leaderboard</a>' +
      '<button type="button" id="rgwSwitchBtn">Sign In / Switch</button>';

    const style = document.createElement("style");
    style.textContent =
      ".rgw-account-bar{position:fixed;top:10px;right:10px;z-index:9999;display:flex;gap:8px;align-items:center;padding:7px 11px;border-radius:12px;color:#eef8ff;font:700 12px 'Trebuchet MS','Segoe UI',sans-serif;border:1px solid rgba(174,233,255,.65);background:linear-gradient(135deg,rgba(8,26,42,.92),rgba(15,43,67,.92));box-shadow:0 10px 22px rgba(0,0,0,.34),0 0 0 1px rgba(255,255,255,.04) inset}" +
      ".rgw-account-bar .rgw-user strong{color:#aef2ff}" +
      ".rgw-account-bar .rgw-avatar{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:999px;background:rgba(255,255,255,.1);margin-right:4px;font-size:13px}" +
      ".rgw-account-bar .rgw-user strong.rgw-name-tagged{font-weight:900}" +
      ".rgw-account-bar .rgw-owner-badge{margin-left:6px;display:inline-flex;align-items:center;padding:1px 6px;border-radius:999px;border:1px solid rgba(255,156,115,.78);background:linear-gradient(135deg,rgba(255,125,72,.97),rgba(255,196,131,.97));color:#2c1200;font-size:10px;font-weight:900;letter-spacing:.04em}" +
      ".rgw-account-bar .rgw-admin-badge{margin-left:6px;display:inline-flex;align-items:center;padding:1px 6px;border-radius:999px;border:1px solid rgba(255,221,135,.68);background:linear-gradient(135deg,rgba(245,197,90,.95),rgba(255,235,163,.95));color:#3a2400;font-size:10px;font-weight:900;letter-spacing:.04em}" +
      ".rgw-account-bar .rgw-res{display:inline-flex;align-items:center;padding:2px 7px;border-radius:999px;border:1px solid rgba(171,230,255,.45);background:rgba(21,66,98,.62);font-size:11px;line-height:1}" +
      ".rgw-account-bar a{color:#d5f6ff;text-decoration:none;border:1px solid rgba(194,236,255,.42);border-radius:7px;padding:3px 7px;background:rgba(22,65,98,.56)}" +
      ".rgw-account-bar a:hover{filter:brightness(1.08)}" +
      ".rgw-account-bar button{border:1px solid rgba(189,238,255,.7);background:linear-gradient(135deg,#4bd5f8,#58e8a7);color:#052236;border-radius:7px;padding:3px 8px;cursor:pointer;font-weight:800}" +
      ".rgw-account-bar button:hover{filter:brightness(1.05)}" +
      "@media (max-width: 700px){.rgw-account-bar{left:8px;right:8px;top:auto;bottom:8px;justify-content:center;flex-wrap:wrap}}";

    document.head.appendChild(style);
    document.body.appendChild(bar);

    const btn = document.getElementById("rgwSwitchBtn");
    if (btn) {
      btn.addEventListener("click", function () {
        const id = String((typeof window !== "undefined" && typeof window.prompt === "function" ? window.prompt("Enter username or email:") : "") || "").trim();
        if (!id) return;
        if (id.indexOf("@") >= 0) {
          const email = sanitizeEmail(id);
          if (!email) {
            try { window.alert("Enter a valid email address."); } catch {}
            return;
          }
          const useGoogleQuick = isGmailEmail(email) && !!window.confirm("Use Google quick sign-in (no password)? Click Cancel for email+password.");
          if (useGoogleQuick) {
            const quick = signInGoogleStyle(email);
            if (quick.ok) {
              location.reload();
            } else {
              try { window.alert(quick.message || "Google sign-in failed"); } catch {}
            }
            return;
          }

          const pass = String(window.prompt("Enter account password:") || "");
          if (!pass) return;
          const createIfMissing = !!window.confirm("Create this email account if it does not exist?");
          const remember = isGmailEmail(email) ? !!window.confirm("Remember this Gmail on this device for quick Google sign-in?") : false;
          const auth = signInWithEmail(email, pass, email.split("@")[0], createIfMissing, remember);
          if (auth.ok) {
            location.reload();
          } else {
            try { window.alert(auth.message || "Sign-in failed"); } catch {}
          }
          return;
        }

        const pass = String(window.prompt("Enter account password:") || "");
        if (switchAccount(id, pass)) {
          location.reload();
        } else {
          try { window.alert(getLastAuthMessage() || "Sign-in failed"); } catch {}
        }
      });
    }
  }

  function adminGiveAny(payload) {
    const actor = getCurrentUsername();
    if (!isOwnerUser(actor) && !isAdminUser(actor)) {
      return { ok: false, message: "Admin or owner required" };
    }

    const target = sanitizeName(payload && payload.targetUsername || "");
    if (!target) return { ok: false, message: "Target username required" };

    const accounts = loadAccounts();
    if (!accounts[target]) accounts[target] = createEmptyAccount(target);
    const account = accounts[target];
    ensureProgression(account);

    const addCredits = Math.max(0, Number(payload && payload.credits) || 0);
    const addTokens = Math.max(0, Number(payload && payload.tokens) || 0);
    const addPoints = Math.max(0, Number(payload && payload.rankPoints) || 0);
    const addKeys = Math.max(0, Number(payload && payload.gameKeys) || 0);
    const addFreezes = Math.max(0, Number(payload && payload.streakFreezes) || 0);
    const unlockTagId = String(payload && payload.tagId || "").trim();
    const unlockPicId = String(payload && payload.picId || "").trim();
    const unlockGameId = String(payload && payload.gameId || "").trim().toLowerCase();
    const addCrateRarity = String(payload && payload.crateRarity || "").trim().toLowerCase();

    if (addCredits > 0) account.credits += Math.floor(addCredits);
    if (addTokens > 0) account.tokens += Math.floor(addTokens);
    if (addPoints > 0) {
      account.rankPoints += Math.floor(addPoints);
      account.rankName = rankFromPoints(account.rankPoints);
      account.level = Math.max(account.level || 1, levelFromPoints(account.rankPoints));
    }
    if (addKeys > 0) account.gameKeys += Math.floor(addKeys);
    if (addFreezes > 0) account.streakFreezes += Math.floor(addFreezes);

    if (unlockTagId) {
      const t = TAG_SHOP.find(function (x) { return x.id === unlockTagId; });
      if (t && account.ownedTags.indexOf(t.id) < 0) account.ownedTags.push(t.id);
      if (t) account.equippedTag = t.id;
    }
    if (unlockPicId) {
      const p = getProfilePicById(unlockPicId);
      if (p && account.unlockedProfilePics.indexOf(p.id) < 0) account.unlockedProfilePics.push(p.id);
      if (p) account.profilePic = p.id;
    }
    if (unlockGameId) {
      const r = findLockedGame(unlockGameId);
      if (r && account.unlockedGames.indexOf(r.id) < 0) account.unlockedGames.push(r.id);
    }
    if (addCrateRarity) {
      const label = addCrateRarity.toUpperCase() + " Gift Crate";
      account.unopenedCrates = Array.isArray(account.unopenedCrates) ? account.unopenedCrates : [];
      account.unopenedCrates.unshift({
        uid: "crate-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
        boughtAt: nowIso(),
        dayKey: merchantDayKey(),
        offerId: "gift-" + addCrateRarity,
        crateId: "gift-crate",
        label: label,
        rarity: addCrateRarity
      });
    }

    pushInventoryItem(account, { type: "admin-gift", label: "Admin Grant", detail: "Granted by " + actor });
    accounts[target] = account;
    saveAccounts(accounts);
    syncAccountToLan(account);
    appendAdminAudit({ type: "grant", actor: actor, target: target, detail: "admin panel grant" });

    return { ok: true, message: "Grant applied to " + target };
  }

  function tradeWithPlayer(payload) {
    const from = getCurrentUsername();
    const to = sanitizeName(payload && payload.targetUsername || "");
    if (!from) return { ok: false, message: "No current user" };
    if (!to) return { ok: false, message: "Target username required" };
    if (from.toLowerCase() === to.toLowerCase()) return { ok: false, message: "Cannot trade with yourself" };

    const credits = Math.max(0, Number(payload && payload.credits) || 0);
    const tokens = Math.max(0, Number(payload && payload.tokens) || 0);
    const gameKeys = Math.max(0, Number(payload && payload.gameKeys) || 0);
    const sendTag = String(payload && payload.tagId || "").trim();
    const sendPic = String(payload && payload.picId || "").trim();
    if (credits <= 0 && tokens <= 0 && gameKeys <= 0 && !sendTag && !sendPic) {
      return { ok: false, message: "Nothing selected to trade" };
    }

    const accounts = loadAccounts();
    if (!accounts[from]) accounts[from] = createEmptyAccount(from);
    if (!accounts[to]) accounts[to] = createEmptyAccount(to);
    const a = accounts[from];
    const b = accounts[to];
    ensureProgression(a);
    ensureProgression(b);

    if ((Number(a.credits) || 0) < credits) return { ok: false, message: "Not enough credits" };
    if ((Number(a.tokens) || 0) < tokens) return { ok: false, message: "Not enough tokens" };
    if ((Number(a.gameKeys) || 0) < gameKeys) return { ok: false, message: "Not enough crate keys" };
    if (sendTag && a.ownedTags.indexOf(sendTag) < 0) return { ok: false, message: "You do not own that tag" };
    if (sendPic && a.unlockedProfilePics.indexOf(sendPic) < 0) return { ok: false, message: "You do not own that profile pic" };

    a.credits -= credits; b.credits += credits;
    a.tokens -= tokens; b.tokens += tokens;
    a.gameKeys -= gameKeys; b.gameKeys += gameKeys;

    if (sendTag) {
      a.ownedTags = a.ownedTags.filter(function (x) { return x !== sendTag; });
      if (b.ownedTags.indexOf(sendTag) < 0) b.ownedTags.push(sendTag);
      if (a.equippedTag === sendTag) a.equippedTag = "";
      b.equippedTag = sendTag;
    }
    if (sendPic) {
      a.unlockedProfilePics = a.unlockedProfilePics.filter(function (x) { return x !== sendPic; });
      if (!a.unlockedProfilePics.length) a.unlockedProfilePics.push("fox");
      if (a.profilePic === sendPic) a.profilePic = a.unlockedProfilePics[0] || "fox";
      if (b.unlockedProfilePics.indexOf(sendPic) < 0) b.unlockedProfilePics.push(sendPic);
      b.profilePic = sendPic;
    }

    pushInventoryItem(a, { type: "trade", label: "Trade Sent", detail: "to " + to });
    pushInventoryItem(b, { type: "trade", label: "Trade Received", detail: "from " + from });
    appendAdminAudit({ type: "trade", actor: from, target: to, detail: "player trade" });

    accounts[from] = a;
    accounts[to] = b;
    saveAccounts(accounts);
    syncAccountToLan(a);
    syncAccountToLan(b);
    return { ok: true, message: "Trade completed" };
  }

  function sendFriendRequest(targetUsername) {
    const from = getCurrentUsername();
    const to = sanitizeName(targetUsername || "");
    if (!from) return { ok: false, message: "No current user" };
    if (!to) return { ok: false, message: "Target username required" };
    if (from.toLowerCase() === to.toLowerCase()) return { ok: false, message: "Cannot add yourself" };

    const accounts = loadAccounts();
    if (!accounts[from]) accounts[from] = createEmptyAccount(from);
    if (!accounts[to]) accounts[to] = createEmptyAccount(to);
    const a = accounts[from];
    const b = accounts[to];
    ensureProgression(a);
    ensureProgression(b);
    if (a.friends.indexOf(to) >= 0) return { ok: false, message: "Already friends" };
    if (b.friendRequests.indexOf(from) < 0) b.friendRequests.push(from);
    accounts[from] = a;
    accounts[to] = b;
    saveAccounts(accounts);
    syncAccountToLan(a);
    syncAccountToLan(b);
    appendAdminAudit({ type: "friend-request", actor: from, target: to, detail: "friend request sent" });
    return { ok: true, message: "Friend request sent" };
  }

  function acceptFriendRequest(fromUsername) {
    const me = getCurrentUsername();
    const from = sanitizeName(fromUsername || "");
    if (!me || !from) return { ok: false, message: "User required" };
    const accounts = loadAccounts();
    if (!accounts[me]) accounts[me] = createEmptyAccount(me);
    if (!accounts[from]) accounts[from] = createEmptyAccount(from);
    const a = accounts[me];
    const b = accounts[from];
    ensureProgression(a);
    ensureProgression(b);
    if (a.friendRequests.indexOf(from) < 0) return { ok: false, message: "Request not found" };
    a.friendRequests = a.friendRequests.filter(function (x) { return x !== from; });
    if (a.friends.indexOf(from) < 0) a.friends.push(from);
    if (b.friends.indexOf(me) < 0) b.friends.push(me);
    accounts[me] = a;
    accounts[from] = b;
    saveAccounts(accounts);
    syncAccountToLan(a);
    syncAccountToLan(b);
    appendAdminAudit({ type: "friend-accept", actor: me, target: from, detail: "friend request accepted" });
    return { ok: true, message: "Friend added" };
  }

  function removeFriend(targetUsername) {
    const me = getCurrentUsername();
    const target = sanitizeName(targetUsername || "");
    if (!me || !target) return { ok: false, message: "User required" };
    const accounts = loadAccounts();
    if (!accounts[me]) accounts[me] = createEmptyAccount(me);
    if (!accounts[target]) accounts[target] = createEmptyAccount(target);
    const a = accounts[me];
    const b = accounts[target];
    ensureProgression(a);
    ensureProgression(b);
    a.friends = a.friends.filter(function (x) { return x !== target; });
    b.friends = b.friends.filter(function (x) { return x !== me; });
    accounts[me] = a;
    accounts[target] = b;
    saveAccounts(accounts);
    syncAccountToLan(a);
    syncAccountToLan(b);
    return { ok: true, message: "Friend removed" };
  }

  function getFriendsState(username) {
    const name = sanitizeName(username || getCurrentUsername());
    const a = getAccount(name);
    if (!a) return { friends: [], requests: [] };
    return {
      friends: Array.isArray(a.friends) ? a.friends.slice() : [],
      requests: Array.isArray(a.friendRequests) ? a.friendRequests.slice() : []
    };
  }

  function setHelpingAvailability(next) {
    const username = getCurrentUsername();
    if (!isHelperUser(username)) return { ok: false, message: "Helper+ only" };
    const accounts = loadAccounts();
    if (!accounts[username]) accounts[username] = createEmptyAccount(username);
    const a = accounts[username];
    ensureProgression(a);
    a.helpingAvailable = !!next;
    accounts[username] = a;
    saveAccounts(accounts);
    syncAccountToLan(a);
    return { ok: true, message: a.helpingAvailable ? "You are now available" : "You are now unavailable" };
  }

  function getHelpersSnapshot() {
    const accounts = loadAccounts();
    const list = Object.values(accounts || {}).map(function (a) {
      ensureProgression(a);
      const role = String(a.role || "player").toLowerCase();
      const canHelp = role === "helper" || role === "mod" || role === "admin" || role === "owner";
      const seenMs = Date.parse(String(a.lastSeen || ""));
      const online = Number.isFinite(seenMs) ? ((Date.now() - seenMs) <= 10 * 60 * 1000) : false;
      return {
        username: String(a.username || ""),
        role: role,
        online: online,
        available: !!a.helpingAvailable,
        canHelp: canHelp
      };
    }).filter(function (x) { return x.canHelp; });

    const availableCount = list.filter(function (x) { return x.online && x.available; }).length;
    return { helpers: list, availableCount: availableCount };
  }

  function requestHelp(messageText) {
    const username = getCurrentUsername();
    const msg = String(messageText || "").trim().slice(0, 300);
    if (!username) return { ok: false, message: "No current user" };
    if (!msg) return { ok: false, message: "Message required" };
    const tickets = loadHelpTickets();
    tickets.unshift({
      id: "help-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      username: username,
      message: msg,
      status: "open",
      createdAt: nowIso(),
      handledBy: "",
      handledNote: ""
    });
    if (tickets.length > 300) tickets.length = 300;
    saveHelpTickets(tickets);
    return { ok: true, message: "Help request sent" };
  }

  function getHelpTickets() {
    const username = getCurrentUsername();
    const helper = isHelperUser(username);
    const all = loadHelpTickets();
    if (helper) return all;
    return all.filter(function (t) { return String(t.username || "") === username; });
  }

  function closeHelpTicket(ticketId, note) {
    const username = getCurrentUsername();
    if (!isHelperUser(username)) return { ok: false, message: "Helper+ only" };
    const tickets = loadHelpTickets();
    const id = String(ticketId || "");
    const n = String(note || "").trim().slice(0, 240);
    for (let i = 0; i < tickets.length; i += 1) {
      if (String(tickets[i].id || "") === id) {
        tickets[i].status = "closed";
        tickets[i].handledBy = username;
        tickets[i].handledNote = n;
        tickets[i].closedAt = nowIso();
        saveHelpTickets(tickets);
        return { ok: true, message: "Ticket closed" };
      }
    }
    return { ok: false, message: "Ticket not found" };
  }

  function sendMessage(targetUsername, text) {
    const from = getCurrentUsername();
    const to = sanitizeName(targetUsername || "");
    const rawMsg = String(text || "").trim().slice(0, 280);
    const msg = censorMessageText(rawMsg);
    if (!from) return { ok: false, message: "No current user" };
    if (!to) return { ok: false, message: "Target username required" };
    if (!msg) return { ok: false, message: "Message is empty" };

    const accounts = loadAccounts();
    if (!accounts[from]) accounts[from] = createEmptyAccount(from);
    if (!accounts[to]) accounts[to] = createEmptyAccount(to);
    const a = accounts[from];
    const b = accounts[to];
    ensureProgression(a);
    ensureProgression(b);

    const muteLeft = getMuteRemainingMs(a);
    if (muteLeft > 0) {
      return {
        ok: false,
        message: "AI Mod muted you for " + formatMuteLeft(muteLeft) + (a.muteReason ? " (" + a.muteReason + ")" : "")
      };
    }

    if (a.friends.indexOf(to) < 0) {
      return { ok: false, message: "You can only message friends" };
    }

    const risk = analyzeBullyingRisk(rawMsg);
    const muteHours = computeAutoMuteHours(risk.score);
    if (muteHours > 0) {
      a.mutedUntil = new Date(Date.now() + (muteHours * 60 * 60 * 1000)).toISOString();
      a.muteReason = risk.reason || "bullying";
      accounts[from] = a;
      saveAccounts(accounts);
      syncAccountToLan(a);
      appendAdminAudit({
        type: "ai-auto-mute",
        actor: "AI_MOD",
        target: from,
        detail: "Muted for " + muteHours + "h (target: " + to + ")"
      });
      return { ok: false, message: "AI Mod detected bullying. You were muted for " + muteHours + " hour(s)." };
    }

    const map = loadMessagesMap();
    if (!Array.isArray(map[to])) map[to] = [];
    const entry = {
      id: "msg-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      from: from,
      to: to,
      text: msg,
      at: nowIso(),
      read: false
    };
    map[to].unshift(entry);
    if (map[to].length > 250) map[to].length = 250;
    saveMessagesMap(map);
    appendAdminAudit({ type: "message", actor: from, target: to, detail: "message sent" });
    return { ok: true, message: "Message sent" };
  }

  function sendStaffBroadcast(text) {
    const actor = getCurrentUsername();
    if (!actor) return { ok: false, message: "No current user" };
    if (!isOwnerUser(actor) && !isAdminUser(actor)) {
      return { ok: false, message: "Owner/Admin only" };
    }
    const rawMsg = String(text || "").trim().slice(0, 280);
    const msg = censorMessageText(rawMsg);
    if (!msg) return { ok: false, message: "Message is empty" };

    const accounts = loadAccounts();
    const targets = Object.keys(accounts || {}).filter(function (u) {
      return !!sanitizeName(u);
    });
    if (targets.indexOf(actor) < 0) targets.push(actor);

    const map = loadMessagesMap();
    let sent = 0;
    for (let i = 0; i < targets.length; i += 1) {
      const to = sanitizeName(targets[i]);
      if (!to) continue;
      if (!Array.isArray(map[to])) map[to] = [];
      map[to].unshift({
        id: "msg-" + Date.now() + "-" + Math.floor(Math.random() * 100000) + "-" + i,
        from: "[STAFF] " + actor,
        to: to,
        text: msg,
        at: nowIso(),
        read: false
      });
      if (map[to].length > 250) map[to].length = 250;
      sent += 1;
    }
    saveMessagesMap(map);
    appendAdminAudit({ type: "staff-broadcast", actor: actor, target: "all", detail: "sent to " + sent + " player(s)" });
    return { ok: true, message: "Broadcast sent to " + sent + " player(s)", sent: sent };
  }

  function postSiteUpdate(text) {
    const actor = getCurrentUsername();
    if (!actor) return { ok: false, message: "No current user" };
    if (!isOwnerUser(actor) && !isAdminUser(actor)) {
      return { ok: false, message: "Owner/Admin only" };
    }
    const msg = String(text || "").trim().slice(0, 320);
    if (!msg) return { ok: false, message: "Update text is empty" };
    const arr = loadSiteUpdates();
    arr.unshift({
      id: "up-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      text: msg,
      author: actor,
      at: nowIso()
    });
    if (arr.length > 120) arr.length = 120;
    saveSiteUpdates(arr);
    appendAdminAudit({ type: "site-update", actor: actor, target: "updates", detail: "posted update" });
    return { ok: true, message: "Update posted" };
  }

  function getSiteUpdates() {
    return loadSiteUpdates();
  }

  function getInbox(username) {
    const u = sanitizeName(username || getCurrentUsername());
    const map = loadMessagesMap();
    const arr = Array.isArray(map[u]) ? map[u] : [];
    return arr.slice();
  }

  function markMessageRead(messageId) {
    const u = getCurrentUsername();
    if (!u) return { ok: false, message: "No current user" };
    const map = loadMessagesMap();
    const arr = Array.isArray(map[u]) ? map[u] : [];
    let changed = false;
    for (let i = 0; i < arr.length; i += 1) {
      if (String(arr[i].id || "") === String(messageId || "")) {
        arr[i].read = true;
        changed = true;
        break;
      }
    }
    if (changed) {
      map[u] = arr;
      saveMessagesMap(map);
      return { ok: true };
    }
    return { ok: false, message: "Message not found" };
  }

  async function getNotifications() {
    const current = getCurrentUsername();
    const notices = [];
    const inbox = getInbox(current);
    const unread = inbox.filter(function (m) { return !m.read; }).length;
    if (unread > 0) {
      notices.push({ type: "message", text: "You have " + unread + " unread message(s)" });
    }

    const me = getAccount(current);
    if (me) {
      const reqs = Array.isArray(me.friendRequests) ? me.friendRequests.length : 0;
      if (reqs > 0) notices.push({ type: "friend", text: reqs + " friend request(s) pending" });
    }

    if (isOwnerUser(current) || isAdminUser(current)) {
      const mod = await getModerationState();
      const hist = mod && mod.userIpHistory && typeof mod.userIpHistory === "object" ? mod.userIpHistory : {};
      Object.keys(hist).forEach(function (u) {
        const ips = Array.isArray(hist[u]) ? hist[u] : [];
        if (ips.length > 1) {
          notices.push({ type: "security", text: "Multi-device alert: " + u + " on " + ips.length + " IPs" });
        }
      });
    }

    return notices;
  }

  function injectBottomPageNav() {
    const path = (location.pathname || "").toLowerCase();
    if (/\/games\//i.test(path)) return;

    const pages = [
      { n: 1, href: "index.html", key: "index.html" },
      { n: 2, href: "account.html", key: "account.html" },
      { n: 3, href: "shop.html", key: "shop.html" },
      { n: 4, href: "inventory.html", key: "inventory.html" },
      { n: 5, href: "streak.html", key: "streak.html" },
      { n: 6, href: "leaderboard.html", key: "leaderboard.html" },
      { n: 7, href: "updates.html", key: "updates.html" },
      { n: 8, href: "ai-assistant.html", key: "ai-assistant.html" },
      { n: 9, href: "help-center.html", key: "help-center.html" }
    ];
    const current = path.split("/").pop() || "index.html";
    const bar = document.createElement("nav");
    bar.className = "rgw-bottom-pages";
    bar.setAttribute("aria-label", "Page numbers");
    bar.innerHTML = pages.map(function (p) {
      const active = current === p.key ? " aria-current=\"page\" class=\"active\"" : "";
      return '<a href="' + p.href + '"' + active + '>' + p.n + '</a>';
    }).join("");

    const style = document.createElement("style");
    style.textContent =
      ".rgw-bottom-pages{position:fixed;left:50%;transform:translateX(-50%);bottom:12px;z-index:9998;display:flex;gap:8px;padding:8px 10px;border-radius:999px;background:rgba(6,20,34,.9);border:1px solid rgba(164,220,255,.45);box-shadow:0 12px 24px rgba(0,0,0,.32)}" +
      ".rgw-bottom-pages a{width:30px;height:30px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;color:#e9f9ff;font-weight:800;background:rgba(32,77,107,.65);border:1px solid rgba(167,224,255,.36)}" +
      ".rgw-bottom-pages a.active{background:linear-gradient(135deg,#4bd5f8,#58e8a7);color:#082637;border-color:rgba(145,255,225,.85)}";
    document.head.appendChild(style);
    document.body.appendChild(bar);
  }

  function injectQuickSideDock() {
    const path = (location.pathname || "").toLowerCase();
    if (/\/games\//i.test(path)) return;
    if (document.getElementById("rgwSideDock")) return;

    const dock = document.createElement("nav");
    dock.id = "rgwSideDock";
    dock.className = "rgw-side-dock";
    dock.innerHTML =
      '<a href="messages.html" title="Messages">Messages</a>' +
      '<a href="help-center.html" title="Help Center">Help</a>' +
      '<a href="updates.html" title="Updates">Updates</a>';

    const style = document.createElement("style");
    style.textContent =
      ".rgw-side-dock{position:fixed;right:10px;top:50%;transform:translateY(-50%);z-index:9997;display:flex;flex-direction:column;gap:8px}" +
      ".rgw-side-dock a{writing-mode:vertical-rl;text-orientation:mixed;padding:8px 6px;border-radius:10px;border:1px solid rgba(155,221,255,.42);background:rgba(13,38,60,.92);color:#dff7ff;text-decoration:none;font:800 11px Trebuchet MS,sans-serif;letter-spacing:.04em}" +
      ".rgw-side-dock a:hover{filter:brightness(1.08)}" +
      "@media (max-width: 860px){.rgw-side-dock{display:none}}";
    document.head.appendChild(style);
    document.body.appendChild(dock);
  }

  function injectAiRobotHelper() {
    const path = (location.pathname || "").toLowerCase();
    if (/\/games\//i.test(path)) return;
    if (document.getElementById("rgwAiRobot")) return;

    const robot = document.createElement("button");
    robot.id = "rgwAiRobot";
    robot.className = "rgw-ai-robot";
    robot.type = "button";
    robot.title = "Open AI Helper";
    robot.setAttribute("aria-label", "Open AI Helper");
    robot.innerHTML = '<span class="face">🤖</span><span class="txt">AI Help</span>';

    const style = document.createElement("style");
    style.textContent =
      ".rgw-ai-robot{position:fixed;right:12px;bottom:86px;z-index:10000;display:flex;align-items:center;gap:6px;border:1px solid rgba(148,229,255,.62);background:linear-gradient(135deg,rgba(10,45,73,.96),rgba(17,84,68,.96));color:#e9fbff;border-radius:999px;padding:7px 10px;cursor:pointer;font:800 12px Trebuchet MS,sans-serif;box-shadow:0 10px 20px rgba(0,0,0,.35)}" +
      ".rgw-ai-robot .face{font-size:16px;line-height:1}" +
      ".rgw-ai-robot .txt{line-height:1}" +
      ".rgw-ai-robot:hover{filter:brightness(1.08)}" +
      "@media (max-width: 860px){.rgw-ai-robot{right:8px;bottom:74px;padding:6px 9px}.rgw-ai-robot .txt{display:none}}";
    document.head.appendChild(style);
    document.body.appendChild(robot);

    robot.addEventListener("click", function () {
      const target = /\/games\//i.test(location.pathname || "") ? "../ai-assistant.html" : "ai-assistant.html";
      location.href = target;
    });
  }

  function injectAboutSiteButton() {
    const path = (location.pathname || "").toLowerCase();
    if (/\/games\//i.test(path)) return;
    if (document.getElementById("rgwAboutBtn")) return;

    const wrap = document.createElement("div");
    wrap.id = "rgwAboutWrap";
    wrap.className = "rgw-about-wrap";
    wrap.innerHTML =
      '<button id="rgwAboutBtn" type="button" aria-label="About this site">About</button>' +
      '<div id="rgwAboutPanel" class="rgw-about-panel" hidden>' +
      '<p>Richdos Gaming uses points, credits, and tokens as currency: points raise rank/level, credits buy tags and profile items, and tokens buy merchant crates. Keys are used to open crates and unlock some games. The merchant shop rotates crate offers (with rerolls), then items go to Inventory where you open and equip rewards. Play games in solo or multiplayer rooms to earn more currency, climb leaderboards, and unlock more game content.</p>' +
      '<h4>Quick Games Access</h4>' +
      '<div class="rgw-about-games">' +
      '<a href="games/asteroid-miner.html">Asteroid Miner</a>' +
      '<a href="games/bike-trial.html">Bike Trial</a>' +
      '<a href="games/bot-strike-arena.html">Bot Strike Arena</a>' +
      '<a href="games/canyon-drift.html">Canyon Drift</a>' +
      '<a href="games/city-parking-pro.html">City Parking Pro</a>' +
      '<a href="games/crystal-tunnel-3d.html">Crystal Tunnel 3D</a>' +
      '<a href="games/drift-city-sim.html">Drift City Sim</a>' +
      '<a href="games/duel-arena.html">Duel Arena</a>' +
      '<a href="games/laser-gauntlet.html">Laser Gauntlet</a>' +
      '<a href="games/maze-escape.html">Maze Escape</a>' +
      '<a href="games/minecraft-parkour.html">Minecraft Parkour</a>' +
      '<a href="games/minecraft-skyblock.html">Minecraft Skyblock</a>' +
      '<a href="games/multiplayer-orb-rush.html">Multiplayer Orb Rush</a>' +
      '<a href="games/multiplayer-drift-duel.html">Multiplayer Drift Duel</a>' +
      '<a href="games/neon-runner-3d.html">Neon Runner 3D</a>' +
      '<a href="games/sky-cube-assault-3d.html">Sky Cube Assault 3D</a>' +
      '<a href="games/tank-blitz.html">Tank Blitz</a>' +
      '<a href="games/tower-commander.html">Tower Commander</a>' +
      '<a href="games/turbo-street-racer.html">Turbo Street Racer</a>' +
      '<a href="games/urban-sniper.html">Urban Sniper</a>' +
      '</div>' +
      '</div>';

    const style = document.createElement("style");
    style.textContent =
      ".rgw-about-wrap{position:fixed;left:10px;top:50%;transform:translateY(-50%);z-index:10000;display:flex;flex-direction:column;gap:8px;max-width:min(320px,84vw)}" +
      ".rgw-about-wrap button{width:max-content;border:1px solid rgba(174,234,255,.65);background:rgba(15,40,63,.94);color:#eef8ff;padding:6px 10px;border-radius:10px;font:800 12px Trebuchet MS,sans-serif;cursor:pointer}" +
      ".rgw-about-panel{background:rgba(7,23,37,.96);border:1px solid rgba(164,224,255,.45);border-radius:12px;padding:9px 10px;box-shadow:0 12px 22px rgba(0,0,0,.34)}" +
      ".rgw-about-panel p{margin:0;color:#eaf9ff;font:700 12px/1.45 Trebuchet MS,sans-serif}" +
      ".rgw-about-panel h4{margin:10px 0 6px 0;color:#d9f7ff;font:800 12px Trebuchet MS,sans-serif}" +
      ".rgw-about-games{max-height:180px;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:6px}" +
      ".rgw-about-games a{text-decoration:none;color:#c8ecff;background:rgba(11,35,52,.88);border:1px solid rgba(150,218,255,.34);border-radius:8px;padding:5px 6px;font:700 11px Trebuchet MS,sans-serif}" +
      ".rgw-about-games a:hover{filter:brightness(1.12)}" +
      "@media (max-width: 860px){.rgw-about-wrap{top:52%;left:8px}.rgw-about-wrap button{padding:5px 9px;font-size:11px}}";
    document.head.appendChild(style);
    document.body.appendChild(wrap);

    const btn = document.getElementById("rgwAboutBtn");
    const panel = document.getElementById("rgwAboutPanel");
    btn.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
    });
  }

  function injectReportSystem() {
    const path = (location.pathname || "").toLowerCase();
    if (/\/games\//i.test(path)) return;
    if (document.getElementById("rgwReportWrap")) return;

    const wrap = document.createElement("div");
    wrap.id = "rgwReportWrap";
    wrap.className = "rgw-report-wrap";
    wrap.innerHTML =
      '<button id="rgwReportBtn" type="button" aria-label="Open report panel">Report</button>' +
      '<div id="rgwReportPanel" class="rgw-report-panel" hidden>' +
      '<h4>Report System</h4>' +
      '<p>Report bugs, abuse, or broken game pages for staff review.</p>' +
      '<div class="rgw-report-row"><label for="rgwReportType">Type</label><select id="rgwReportType"><option value="bug">Bug</option><option value="abuse">Abuse</option><option value="game">Game Issue</option><option value="other">Other</option></select></div>' +
      '<textarea id="rgwReportText" maxlength="280" placeholder="Describe the issue"></textarea>' +
      '<div class="rgw-report-actions"><button id="rgwReportSend" type="button">Send Report</button><a href="help-center.html">Open Help Center</a></div>' +
      '<p id="rgwReportStatus"></p>' +
      '</div>';

    const style = document.createElement("style");
    style.textContent =
      ".rgw-report-wrap{position:fixed;left:10px;top:106px;z-index:10000;display:flex;flex-direction:column;gap:8px;max-width:min(320px,84vw)}" +
      ".rgw-report-wrap > button{width:max-content;border:1px solid rgba(174,234,255,.65);background:rgba(15,40,63,.94);color:#eef8ff;padding:6px 10px;border-radius:10px;font:800 12px Trebuchet MS,sans-serif;cursor:pointer}" +
      ".rgw-report-panel{background:rgba(7,23,37,.96);border:1px solid rgba(164,224,255,.45);border-radius:12px;padding:9px 10px;box-shadow:0 12px 22px rgba(0,0,0,.34)}" +
      ".rgw-report-panel h4{margin:0 0 6px 0;color:#d8f6ff;font:800 13px Trebuchet MS,sans-serif}" +
      ".rgw-report-panel p{margin:0 0 8px 0;color:#e8fbff;font:700 12px/1.4 Trebuchet MS,sans-serif}" +
      ".rgw-report-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}" +
      ".rgw-report-row label{color:#e2f6ff;font:700 12px Trebuchet MS,sans-serif}" +
      ".rgw-report-row select{flex:1;border:1px solid rgba(174,234,255,.65);background:rgba(12,34,52,.95);color:#eef8ff;padding:5px 8px;border-radius:8px;font:700 12px Trebuchet MS,sans-serif}" +
      ".rgw-report-panel textarea{width:100%;min-height:66px;resize:vertical;border:1px solid rgba(160,221,255,.45);background:rgba(9,29,46,.95);color:#eefbff;border-radius:8px;padding:8px;font:700 12px Trebuchet MS,sans-serif;box-sizing:border-box}" +
      ".rgw-report-actions{display:flex;align-items:center;gap:8px;margin-top:8px}" +
      ".rgw-report-actions button{border:1px solid rgba(174,234,255,.65);background:rgba(15,40,63,.94);color:#eef8ff;padding:6px 10px;border-radius:9px;font:700 12px Trebuchet MS,sans-serif;cursor:pointer}" +
      ".rgw-report-actions a{text-decoration:none;color:#c7ecff;font:700 12px Trebuchet MS,sans-serif}" +
      "#rgwReportStatus{margin-top:8px;min-height:16px;color:#aef3cb;font:800 12px Trebuchet MS,sans-serif}" +
      "@media (max-width: 860px){.rgw-report-wrap{left:8px;top:96px;max-width:min(300px,92vw)}.rgw-report-wrap > button{padding:5px 9px;font-size:11px}}";
    document.head.appendChild(style);
    document.body.appendChild(wrap);

    const btn = document.getElementById("rgwReportBtn");
    const panel = document.getElementById("rgwReportPanel");
    const sendBtn = document.getElementById("rgwReportSend");
    const typeSel = document.getElementById("rgwReportType");
    const textBox = document.getElementById("rgwReportText");
    const status = document.getElementById("rgwReportStatus");

    function updateReportStatusHint() {
      const tickets = getHelpTickets();
      const openCount = (Array.isArray(tickets) ? tickets : []).filter(function (t) {
        return String(t && t.status || "") !== "closed";
      }).length;
      if (isHelperUser(getCurrentUsername())) {
        status.textContent = "Open reports in queue: " + openCount;
      } else {
        status.textContent = "Your open reports: " + openCount;
      }
    }

    btn.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) updateReportStatusHint();
    });

    sendBtn.addEventListener("click", function () {
      const type = String(typeSel && typeSel.value || "other").trim();
      const msg = String(textBox && textBox.value || "").trim();
      if (!msg) {
        status.textContent = "Write your report before sending.";
        return;
      }
      const payload = "[Report:" + type + "] " + msg;
      const result = requestHelp(payload);
      status.textContent = String(result && result.message || "Report sent");
      if (result && result.ok && textBox) {
        textBox.value = "";
      }
      updateReportStatusHint();
    });
  }

  function injectNotificationBell() {
    const path = (location.pathname || "").toLowerCase();
    if (/\/games\//i.test(path)) return;
    if (document.getElementById("rgwBell")) return;

    const wrap = document.createElement("div");
    wrap.id = "rgwBell";
    wrap.className = "rgw-bell-wrap";
    wrap.innerHTML =
      '<button id="rgwBellBtn" type="button" aria-label="Notifications">🔔<span id="rgwBellCount">0</span></button>' +
      '<div id="rgwBellPanel" class="rgw-bell-panel" hidden><h4>Notifications</h4><ul id="rgwBellList"></ul></div>';

    const style = document.createElement("style");
    style.textContent =
      ".rgw-bell-wrap{position:fixed;left:10px;top:10px;z-index:10001}" +
      ".rgw-bell-wrap button{position:relative;border:1px solid rgba(174,234,255,.65);background:rgba(15,40,63,.94);color:#eef8ff;padding:6px 10px;border-radius:10px;font:700 14px Trebuchet MS,sans-serif;cursor:pointer}" +
      ".rgw-bell-wrap button span{position:absolute;right:-5px;top:-6px;min-width:18px;height:18px;border-radius:999px;background:#ff6a70;color:#fff;display:inline-flex;align-items:center;justify-content:center;font:800 10px Trebuchet MS,sans-serif;padding:0 3px}" +
      ".rgw-bell-panel{margin-top:8px;width:min(340px,86vw);max-height:44vh;overflow:auto;background:rgba(6,21,35,.95);border:1px solid rgba(160,221,255,.4);border-radius:12px;padding:10px;box-shadow:0 14px 24px rgba(0,0,0,.35)}" +
      ".rgw-bell-panel h4{margin:0 0 8px 0;color:#d8f6ff;font:800 13px Trebuchet MS,sans-serif}" +
      ".rgw-bell-panel ul{margin:0;padding-left:18px;color:#e9fbff;font:700 12px Trebuchet MS,sans-serif}"
    ;
    document.head.appendChild(style);
    document.body.appendChild(wrap);

    const btn = document.getElementById("rgwBellBtn");
    const panel = document.getElementById("rgwBellPanel");
    const list = document.getElementById("rgwBellList");
    const countTag = document.getElementById("rgwBellCount");

    async function refreshBell() {
      const notices = await getNotifications();
      const n = Array.isArray(notices) ? notices.length : 0;
      countTag.textContent = String(n);
      if (!n) {
        list.innerHTML = "<li>No notifications.</li>";
      } else {
        list.innerHTML = notices.slice(0, 30).map(function (x) {
          return "<li>" + String(x.text || "") + "</li>";
        }).join("");
      }
    }

    btn.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) refreshBell();
    });
    refreshBell();
    setInterval(refreshBell, 20000);
  }

  window.RGW = {
    ensureCurrentUser,
    getCurrentUsername,
    getLastAuthMessage,
    switchAccount,
    signInWithEmail,
    signInGoogleStyle,
    getRememberedGoogleAccounts,
    changeMyPassword,
    signOut,
    isOwnerUser,
    ownerPasswordValid,
    isAdminUser,
    isHelperUser,
    isModUser,
    isCurrentAdmin() {
      return isAdminUser(getCurrentUsername());
    },
    isCurrentOwner() {
      return isOwnerUser(getCurrentUsername());
    },
    getTagShop() {
      return TAG_SHOP.map(function (t) { return { id: t.id, label: t.label, cost: t.cost, style: t.style }; });
    },
    getProfilePicShop() {
      return PROFILE_PICS.filter(function (p) {
        return !p.secretOnly;
      }).map(function (p) {
        return { id: p.id, label: p.label, icon: p.icon, cost: p.cost, ownerOnly: !!p.ownerOnly };
      });
    },
    getMerchantOverride,
    setMerchantMode,
    getShopTimers,
    getLockedGamesCatalog,
    getGameUnlockState,
    isGameUnlocked,
    unlockGame,
    getMerchantShop,
    buyMerchantCrate,
    getInventory,
    openInventoryCrate,
    getDailyShopOffers,
    rerollDailyShop,
    buyDailyOffer,
    getQuests() {
      return QUESTS.map(function (q) { return { id: q.id, label: q.label, credits: q.credits }; });
    },
    getStreakStatus,
    getStreakHistory,
    claimQuest,
    ownerSetPointsCredits,
    ownerSetRole,
    ownerResetPlayer,
    ownerResetLeaderboard,
    setWeeklyCompetition,
    getWeeklyCompetition,
    getModerationState,
    banTarget,
    unbanIp,
    buyTag,
    buyStreakFreeze,
    buyProfilePic,
    equipProfilePic,
    getProfilePicIcon,
    equipTag,
    getAccount,
    getRankTiers() {
      return RANK_TIERS.map(function (r) { return { min: r.min, max: r.max, name: r.name }; });
    },
    rankFromPoints,
    levelFromPoints,
    pointsFromScore,
    getRooms,
    getCurrentRoomCode,
    setCurrentRoomCode,
    setRoomGame,
    kickRoomPlayer,
    submitRoomScore,
    getRoomLeaderboard,
    joinRoom(roomCode) {
      return upsertRoom(roomCode);
    },
    getAdminAuditLog() {
      const current = getCurrentUsername();
      if (!isOwnerUser(current) && !isAdminUser(current)) return [];
      return readAdminAuditLog();
    },
    adminGiveAny,
    estimateTradeValue,
    tradeWithPlayer,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    getFriendsState,
    sendMessage,
    sendStaffBroadcast,
    getInbox,
    markMessageRead,
    postSiteUpdate,
    getSiteUpdates,
    getNotifications,
    setHelpingAvailability,
    getHelpersSnapshot,
    requestHelp,
    getHelpTickets,
    closeHelpTicket,
    startGame,
    submitScore,
    allAccountsArray,
    syncCurrentAccountFromLan,
    async getLeaderboardArray() {
      const lan = await getLanLeaderboard();
      if (lan && lan.length) return lan;
      const cached = readSharedAccountsCache();
      if (cached.length) return cached;
      return allAccountsArray();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injectGlobalLanguageSwitch();
      injectAccountBar();
      injectNotificationBell();
      injectAboutSiteButton();
      injectReportSystem();
      injectQuickSideDock();
      injectAiRobotHelper();
      injectBottomPageNav();
      applyGlobalLanguage();
      maybeAttachHudTracking();
    });
  } else {
    injectGlobalLanguageSwitch();
    injectAccountBar();
    injectNotificationBell();
    injectAboutSiteButton();
    injectReportSystem();
    injectQuickSideDock();
    injectAiRobotHelper();
    injectBottomPageNav();
    applyGlobalLanguage();
    maybeAttachHudTracking();
  }

  window.RGWApplyLanguage = applyGlobalLanguage;
})();
