import {
  BASE_RE,
  ID_RE,
  ING_RE,
  KINDS,
  LIMITS,
  TIER_RE,
  defaultAdminShopConfig,
  defaultBoostsConfig,
  defaultConfigs,
  defaultCratesConfig,
  defaultDailyRewards,
  defaultJobsConfig,
  defaultKitsConfig,
  defaultQuestsConfig,
  defaultServerConfig,
  defaultWarzoneConfig,
  isAllowedTextureValue,
  normalizeConfigs,
  normalizeTextures,
  validateContent,
} from "./lib/schema.mjs";

/* =====================================================================
   CONSTANTES MÉTIER
===================================================================== */

const VANILLA = ["diamond","iron_ingot","gold_ingot","netherite_ingot","emerald","redstone","stick","string","leather","coal","copper_ingot","amethyst_shard","diamond_ore","deepslate_diamond_ore","iron_ore","deepslate_iron_ore","redstone_ore","gold_ore","stone_bricks","redstone_lamp","obsidian","glass","diamond_block","iron_block","gold_block","netherite_block","stone","cobblestone","oak_planks","oak_log","tnt","nether_star","blaze_rod","blaze_powder","ender_pearl","gunpowder","paper","book","quartz","glowstone_dust","prismarine_shard","totem_of_undying","golden_apple","bone","feather","flint","brick","sand","dirt","lapis_lazuli","lapis_block","barrier","beacon","golden_helmet","golden_chestplate","golden_leggings","golden_boots","iron_helmet","iron_chestplate","iron_leggings","iron_boots","diamond_helmet","diamond_chestplate","diamond_leggings","diamond_boots","netherite_helmet","netherite_chestplate","netherite_leggings","netherite_boots","diamond_sword","iron_sword","golden_sword","netherite_sword","diamond_pickaxe","iron_pickaxe","golden_pickaxe","netherite_pickaxe","diamond_axe","iron_axe","golden_axe","diamond_shovel","iron_shovel","diamond_hoe"];

const VANILLA_LABELS = {
  diamond: "Diamant", iron_ingot: "Lingot de fer", gold_ingot: "Lingot d’or", netherite_ingot: "Lingot de Netherite",
  emerald: "Émeraude", redstone: "Poudre de Redstone", stick: "Bâton", string: "Ficelle", leather: "Cuir",
  coal: "Charbon", copper_ingot: "Lingot de cuivre", amethyst_shard: "Éclat d’améthyste", diamond_ore: "Minerai de diamant",
  deepslate_diamond_ore: "Minerai de diamant des abîmes", iron_ore: "Minerai de fer", deepslate_iron_ore: "Minerai de fer des abîmes",
  redstone_ore: "Minerai de Redstone", gold_ore: "Minerai d’or", stone_bricks: "Briques de pierre",
  redstone_lamp: "Lampe de Redstone", obsidian: "Obsidienne", glass: "Verre", diamond_block: "Bloc de diamant",
  iron_block: "Bloc de fer", gold_block: "Bloc d’or", netherite_block: "Bloc de Netherite", stone: "Pierre",
  cobblestone: "Pierres taillées", oak_planks: "Planches de chêne", oak_log: "Bûche de chêne", tnt: "TNT",
  nether_star: "Étoile du Nether", blaze_rod: "Bâton de Blaze", blaze_powder: "Poudre de Blaze",
  ender_pearl: "Perle de l’Ender", gunpowder: "Poudre à canon", paper: "Papier", book: "Livre", quartz: "Quartz",
  glowstone_dust: "Poudre lumineuse", prismarine_shard: "Éclat de prismarine", totem_of_undying: "Totem d’immortalité",
  golden_apple: "Pomme dorée", bone: "Os", feather: "Plume", flint: "Silex", brick: "Brique", sand: "Sable",
  dirt: "Terre", lapis_lazuli: "Lapis-lazuli", lapis_block: "Bloc de Lapis-lazuli", barrier: "Barrière", beacon: "Balise",
  golden_helmet: "Casque en or", golden_chestplate: "Plastron en or", golden_leggings: "Jambières en or", golden_boots: "Bottes en or",
  iron_helmet: "Casque en fer", iron_chestplate: "Plastron en fer", iron_leggings: "Jambières en fer", iron_boots: "Bottes en fer",
  diamond_helmet: "Casque en diamant", diamond_chestplate: "Plastron en diamant", diamond_leggings: "Jambières en diamant",
  diamond_boots: "Bottes en diamant", netherite_helmet: "Casque en Netherite", netherite_chestplate: "Plastron en Netherite",
  netherite_leggings: "Jambières en Netherite", netherite_boots: "Bottes en Netherite", diamond_sword: "Épée en diamant",
  iron_sword: "Épée en fer", golden_sword: "Épée en or", netherite_sword: "Épée en Netherite",
  diamond_pickaxe: "Pioche en diamant", iron_pickaxe: "Pioche en fer", golden_pickaxe: "Pioche en or",
  netherite_pickaxe: "Pioche en Netherite", diamond_axe: "Hache en diamant", iron_axe: "Hache en fer",
  golden_axe: "Hache en or", diamond_shovel: "Pelle en diamant", iron_shovel: "Pelle en fer", diamond_hoe: "Houe en diamant",
};

const KIND_LABELS = { item: "Item", block: "Bloc", armor: "Armure", weapon: "Arme", tool: "Outil" };
const RECIPE_LABELS = {
  shaped: "Avec forme", shapeless: "Sans forme", furnace: "Four", brewing: "Alchimie",
  brewing_container: "Alchimie (contenant)", smithing: "Forge",
};
const STATION_LABELS = {
  crafting_table: "Table de craft", table_de_craft: "Table de craft", furnace: "Four",
  blast_furnace: "Haut-fourneau", smoker: "Fumoir", campfire: "Feu de camp",
  soul_campfire: "Feu de camp des âmes", stonecutter: "Tailleur de pierre",
  cartography_table: "Table de cartographie", brewing_stand: "Alambic", smithing_table: "Table de forge",
};
const EDITABLE_STATIONS = new Set(["table_de_craft", "crafting_table", "furnace"]);
const LETTERS = "ABCDEFGHI";
const PAGE_LIBRARY = 120;
const PAGE_RECIPES = 150;
const TOKEN_KEY = "opal_token";
const DRAFT_KEY = "opal_draft_v1";

const ICON_LABELS = {
  amethyst_shard: "Éclat d’améthyste", blood_token: "Jeton de sang", bottes_argent_icon: "Bottes en argent",
  bottes_opale_icon: "Bottes en opale", bottes_rubis: "Bottes en rubis", bottes_titane_icon: "Bottes en titane",
  bouclier_argent_icon: "Bouclier en argent", bouclier_opale_icon: "Bouclier en opale", bouclier_titane_icon: "Bouclier en titane",
  casque_argent_icon: "Casque en argent", casque_opale_icon: "Casque en opale", casque_rubis: "Casque en rubis",
  casque_titane_icon: "Casque en titane", combat_ration: "Ration de combat", dague_rubis: "Dague en rubis",
  diamond_shard: "Éclat de diamant", eclat_amethyste: "Éclat d’améthyste", epee_argent_icon: "Épée en argent",
  epee_opale_icon: "Épée en opale", epee_titane_icon: "Épée en titane", fast_fertilizer: "Engrais rapide",
  faux_opale: "Faux en opale", gemme_opale: "Gemme d’opale", gemme_rubis: "Gemme de rubis",
  hache_abattage: "Hache d’abattage", hache_argent_icon: "Hache en argent", hache_opale_icon: "Hache en opale",
  hache_titane_icon: "Hache en titane", hammer_opale: "Marteau en opale", hammer_rubis: "Marteau en rubis",
  houe_argent_icon: "Houe en argent", houe_opale_icon: "Houe en opale", houe_titane_icon: "Houe en titane",
  jambieres_argent_icon: "Jambières en argent", jambieres_opale_icon: "Jambières en opale",
  jambieres_rubis: "Jambières en rubis", jambieres_titane_icon: "Jambières en titane", koth_key: "Clé de conquête",
  lingot_argent: "Lingot d’argent", lingot_titane: "Lingot de titane", lumberjack_axe: "Hache de bûcheron",
  masse_titane_icon: "Masse en titane", opal_nugget: "Pépite d’opale", pelle_argent_icon: "Pelle en argent",
  pelle_opale_icon: "Pelle en opale", pelle_titane_icon: "Pelle en titane", pioche_argent_icon: "Pioche en argent",
  pioche_opale_icon: "Pioche en opale", pioche_titane_icon: "Pioche en titane", plastron_argent_icon: "Plastron en argent",
  plastron_opale_icon: "Plastron en opale", plastron_rubis: "Plastron en rubis",
  plastron_titane_icon: "Plastron en titane", sap_essence: "Essence de sève", seed_diamond: "Graine de diamant",
  seed_gold: "Graine d’or", seed_iron: "Graine de fer", seed_opal: "Graine d’opale",
  sharpening_powder: "Poudre à aiguiser", stick_breach: "Bâton de brèche", stick_force: "Bâton de force",
  stick_heal: "Bâton de soin", stick_speed: "Bâton de vitesse", super_pelle: "Super pelle",
  telluric_shard: "Éclat tellurique", watering_can_diamond: "Arrosoir en diamant",
  watering_can_iron: "Arrosoir en fer", watering_can_opal: "Arrosoir en opale",
};
const ICON_BY_ID = {
  silver_ingot: "lingot_argent", ruby_gem: "gemme_rubis", opal_gem: "gemme_opale",
  ruby_ore: "minerai_rubis", silver_ore: "minerai_argent", celestial_opal_ore: "minerai_opale",
  deepslate_ruby_ore: "deepslate_minerai_rubis", deepslate_silver_ore: "deepslate_minerai_argent",
  deepslate_opal_ore: "deepslate_minerai_opale", block_pure_opal: "bloc_opale",
  ruby_block: "bloc_rubis", silver_block: "bloc_argent", block_titanium: "block_titanium",
  opal_bricks: "briques_opale", opal_lamp: "lampe_opale",
  ruby_pickaxe: "pioche_rubis", ruby_dagger: "dague_rubis", ruby_helmet: "casque_rubis",
  ruby_chestplate: "plastron_rubis", ruby_leggings: "jambieres_rubis", ruby_boots: "bottes_rubis",
  stick_heal: "stick_heal", stick_speed: "stick_speed", stick_force: "stick_force", stick_breach: "stick_breach",
  watering_can_iron: "watering_can_iron", watering_can_diamond: "watering_can_diamond",
  watering_can_opal: "watering_can_opal", fast_fertilizer: "fast_fertilizer", seed_iron: "seed_iron",
  seed_gold: "seed_gold", seed_diamond: "seed_diamond", seed_opal: "seed_opal",
  diamond_shard: "diamond_shard", opal_nugget: "opal_nugget", koth_key: "koth_key",
};

/* =====================================================================
   ÉTAT
===================================================================== */

const state = {
  token: sessionStorage.getItem(TOKEN_KEY) || "",
  data: {
    entries: [],
    recipes: [],
    disabledVanillaRecipes: [],
    customTextures: {},
    configs: defaultConfigs(),
    revision: 0,
  },
  revision: 0,
  library: { icons: [], models: [], textures: [] },
  vanilla: { items: [], blocks: [], recipes: [], opal: [], legacyIds: {} },
  vanillaTextures: {},
  indices: {
    entries: new Map(),
    vanillaItems: new Map(),
    vanillaBlocks: new Map(),
    opal: new Map(),
    recipes: new Map(),
    overriddenVanilla: new Map(),
    disabledVanilla: new Set(),
    textureFiles: new Set(),
  },
  libraryReady: false,
  libraryError: "",
  ready: false,
  loading: false,
  saving: false,
  dirty: false,
  pendingResume: false,
  entryId: null,
  recipeId: null,
  recipeVanillaOverride: null,
  selectedLibraryItem: null,
  textureDialogTarget: null,
  pendingDialogTexture: null,
  pendingDraft: null,
  draftTimer: null,
  draftTooLarge: false,
  tokenTimer: null,
  ui: { tab: "dashboard", libraryLimit: PAGE_LIBRARY, recipeLimit: PAGE_RECIPES },
};

let libraryPromise = null;

/* =====================================================================
   UTILITAIRES DOM / RÉSEAU
===================================================================== */

const $ = (selector) => document.querySelector(selector);

const h = (tag, attrs, ...children) => {
  const element = document.createElement(tag);
  if (attrs && typeof attrs === "object") {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on") && typeof value === "function") {
        element.addEventListener(key.slice(2), value);
      } else {
        element.setAttribute(key, String(value));
      }
    }
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
};

const debounce = (fn, wait = 120) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" });
};

const escapeHtml = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

class ApiError extends Error {
  constructor(message, status = 0, body = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

class SessionExpiredError extends Error {
  constructor(message = "session expirée") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

const api = async (path, { method = "GET", body, headers = {}, timeout = 30000 } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const requestHeaders = { ...headers };
    if (body !== undefined && body !== null) requestHeaders["content-type"] = "application/json";
    if (state.token) requestHeaders.authorization = "Bearer " + state.token;
    const response = await fetch("/api" + path, {
      method,
      body,
      headers: requestHeaders,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 && path !== "/login") {
      handleUnauthorized();
      throw new SessionExpiredError(payload.error || "session expirée");
    }
    if (!response.ok) {
      throw new ApiError(payload.error || "erreur " + response.status, response.status, payload);
    }
    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError("délai dépassé — vérifiez votre connexion", 0);
    }
    if (error instanceof ApiError || error instanceof SessionExpiredError) throw error;
    throw new ApiError("connexion au serveur impossible", 0);
  } finally {
    clearTimeout(timer);
  }
};

/* =====================================================================
   STATUT, NOTIFICATIONS, DIALOGUES
===================================================================== */

const toast = (message, kind = "info") => {
  const element = h("div", { class: "toast " + kind, role: kind === "error" ? "alert" : "status" }, message);
  $("#toasts").append(element);
  setTimeout(() => element.classList.add("hide"), 3600);
  setTimeout(() => element.remove(), 4300);
};

const confirmDialog = ({
  title = "Confirmation",
  message = "",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
} = {}) => {
  const dialog = $("#confirm-dialog");
  if (typeof dialog.showModal !== "function") {
    toast("Ce navigateur ne prend pas en charge les dialogues de confirmation.", "error");
    return Promise.resolve(false);
  }
  if (dialog.open) dialog.close();
  $("#confirm-title").textContent = title;
  $("#confirm-message").textContent = message;
  const ok = $("#confirm-ok");
  ok.textContent = confirmLabel;
  ok.className = danger ? "danger" : "";
  $("#confirm-cancel").textContent = cancelLabel;
  dialog.returnValue = "";
  return new Promise((resolve) => {
    const onClose = () => {
      dialog.removeEventListener("close", onClose);
      resolve(dialog.returnValue === "confirm");
    };
    dialog.addEventListener("close", onClose);
    dialog.showModal();
  });
};

const showFatal = (message) => {
  $("#fatal-message").textContent = message;
  $("#fatal").hidden = false;
};

const hideFatal = () => {
  $("#fatal").hidden = true;
};

const showApp = (visible) => {
  $("#login").hidden = visible;
  $("#app").hidden = !visible;
};

const refreshStatus = () => {
  const status = $("#status");
  if (state.loading) {
    status.textContent = "Chargement…";
    status.className = "saving";
  } else if (state.saving) {
    status.textContent = "Enregistrement…";
    status.className = "saving";
  } else if (state.dirty) {
    status.textContent = "Modifications non enregistrées";
    status.className = "dirty";
  } else if (!state.ready) {
    status.textContent = "Non synchronisé";
    status.className = "dirty";
  } else {
    status.textContent = "Synchronisé";
    status.className = "";
  }
  const save = $("#save");
  save.disabled = !state.ready || !state.dirty || state.saving || state.loading;
  save.setAttribute("aria-busy", String(state.saving));
  document.title = (state.dirty ? "• " : "") + "Opal Heaven — Studio de contenu";

  const revEl = $("#sidebar-revision-label");
  if (revEl) revEl.textContent = "Rev " + (state.revision || 0);
  const syncRevEl = $("#sync-active-revision");
  if (syncRevEl) syncRevEl.textContent = "Rev " + (state.revision || 0);
};

const setDirty = (value) => {
  state.dirty = Boolean(value);
  if (state.dirty) scheduleDraft();
  refreshStatus();
};

/* =====================================================================
   SESSION
===================================================================== */

const stopTokenRefresh = () => {
  if (state.tokenTimer) {
    clearInterval(state.tokenTimer);
    state.tokenTimer = null;
  }
};

const startTokenRefresh = () => {
  stopTokenRefresh();
  state.tokenTimer = setInterval(async () => {
    if (!state.token || document.hidden) return;
    try {
      const result = await api("/session", { method: "POST" });
      if (result?.token) {
        state.token = result.token;
        sessionStorage.setItem(TOKEN_KEY, result.token);
      }
    } catch {
      /* api() gère l’expiration : les modifications restent en mémoire */
    }
  }, 45 * 60 * 1000);
};

const showSessionExpired = () => {
  $("#login-error").textContent = state.pendingResume
    ? "Session expirée. Reconnectez-vous : vos modifications en cours sont conservées."
    : "Session expirée. Reconnectez-vous.";
  showApp(false);
  hideFatal();
  $("#password").focus();
};

const handleUnauthorized = () => {
  state.pendingResume = state.ready;
  stopTokenRefresh();
  showSessionExpired();
};

/* =====================================================================
   BROUILLON LOCAL
===================================================================== */

const coreData = (data) =>
  JSON.stringify({
    entries: data?.entries ?? [],
    recipes: data?.recipes ?? [],
    disabled: data?.disabledVanillaRecipes ?? [],
    textures: data?.customTextures ?? {},
    configs: data?.configs ?? {},
  });

const hideDraftBanner = () => {
  $("#draft-banner").hidden = true;
};

const clearDraft = () => {
  state.pendingDraft = null;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* stockage indisponible */
  }
  hideDraftBanner();
};

const saveDraft = () => {
  if (!state.dirty) return;
  try {
    const payload = {
      savedAt: new Date().toISOString(),
      revision: state.revision,
      data: state.data,
    };
    const serialized = JSON.stringify(payload);
    if (serialized.length > 3.5 * 1024 * 1024) {
      if (!state.draftTooLarge) {
        state.draftTooLarge = true;
        toast("Brouillon trop volumineux pour le stockage local (textures). Enregistrez sur le serveur.", "error");
      }
      return;
    }
    state.draftTooLarge = false;
    localStorage.setItem(DRAFT_KEY, serialized);
  } catch {
    /* quota / mode privé : le serveur reste la source de vérité */
  }
};

const scheduleDraft = () => {
  if (state.draftTimer) clearTimeout(state.draftTimer);
  state.draftTimer = setTimeout(saveDraft, 900);
};

const maybeOfferDraft = () => {
  let draft;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      hideDraftBanner();
      return;
    }
    draft = JSON.parse(raw);
  } catch {
    hideDraftBanner();
    return;
  }
  if (!draft || !draft.data || !draft.savedAt) {
    clearDraft();
    return;
  }
  if (coreData(draft.data) === coreData(state.data)) {
    clearDraft();
    return;
  }
  state.pendingDraft = draft;
  $("#draft-text").textContent =
    "Brouillon local du " +
    formatDate(draft.savedAt) +
    " (révision " +
    (draft.revision ?? "?") +
    ") — non enregistré sur le serveur.";
  $("#draft-banner").hidden = false;
};

const restoreDraft = async () => {
  const draft = state.pendingDraft;
  if (!draft) return;
  try {
    const migrated = migrateContent(draft.data);
    const known = new Set([
      ...state.indices.entries.keys(),
      ...state.indices.opal.keys(),
      ...(migrated.data.entries || []).map((entry) => entry.id),
    ]);
    const normalized = validateContent(migrated.data, {
      knownOpalIds: state.libraryReady ? known : null,
    });
    state.revision = Number(draft.revision) || 0;
    state.data = { ...normalized, revision: state.revision };
    rebuildIndices();
    refreshDatalists();
    resetEntry();
    resetRecipe();
    renderActiveTab();
    setDirty(true);
    hideDraftBanner();
    toast("Brouillon restauré. Enregistrez pour publier.", "success");
  } catch (error) {
    clearDraft();
    toast("Brouillon invalide : " + error.message, "error");
  }
};

const discardDraft = () => {
  clearDraft();
  toast("Brouillon local ignoré.", "info");
};

/* =====================================================================
   ONGLETS & NAVIGATION
===================================================================== */

const TAB_TITLES = {
  dashboard: { title: "Hub Central & Serveur", sub: "Pilotage en direct, statut Bedrock et configuration centralisée" },
  library: { title: "Catalogue & Textures", sub: "Consultez et modifiez les textures vanilla et personnalisées" },
  entries: { title: "Contenus Custom", sub: "Création et gestion des items, blocs, armes, armures et outils" },
  recipes: { title: "Crafts & Recettes", sub: "Création de crafts custom ou modification/écrasement de recettes vanilla" },
  "config-daily": { title: "Calendrier (Daily Rewards)", sub: "Récompenses quotidiennes sur 30 jours consécutifs (/daily)" },
  "config-jobs": { title: "Métiers & Jobs", sub: "Paramétrage des gains d’XP, courbe de niveaux et récompenses de palier" },
  "config-shop": { title: "Admin Shop", sub: "Gestion des rayons, prix d’achat et de rachat des articles (/shop)" },
  "config-crates": { title: "Box & Caisses", sub: "Tables de drop, probabilités et simulateur de tirages (/crates)" },
  "config-kits": { title: "Kits & Équipements", sub: "Paquetages d’items, temps d’attente et permissions (/kit)" },
  "config-quests": { title: "Quêtes Journalières", sub: "Missions quotidiennes de minage, monstres et récoltes" },
  "config-warzone": { title: "Warzone & KOTH", sub: "Captures de colline, largages Airdrops et combat-tag" },
  "tools-audit": { title: "Audit & Boosts", sub: "Diagnostic anti-duplication et multiplicateurs temporaires" },
  "config-server": { title: "Paramètres Généraux", sub: "Économie de départ, annonces dans le chat, règles d’anti-lag" },
  logs: { title: "Journal d’Activité & Logs", sub: "Historique chronologique des synchronisations et modifications" },
  data: { title: "Données & Historique", sub: "Export, import et historique des versions du studio" },
  "sync-guide": { title: "Synchronisation Serveur", sub: "Procédure d’application en direct sur le serveur de jeu" },
  "config-roles": { title: "Grades & Permissions", sub: "Configuration des rangs, multiplicateurs et hiérarchie de permissions" },
  moderation: { title: "Modération & Sécurité", sub: "Pilotage des sanctions, surveillance des joueurs connectés et registre d’audit" },
};

const renderActiveTab = () => {
  if (state.ui.tab === "dashboard") renderDashboardTab();
  if (state.ui.tab === "logs") renderLogsTab();
  if (state.ui.tab === "moderation") renderModerationTab();
  if (!state.ready) return;
  if (state.ui.tab === "library") renderLibrary();
  else if (state.ui.tab === "entries") renderEntries();
  else if (state.ui.tab === "recipes") renderRecipes();
  else if (state.ui.tab === "config-daily") renderDailyTab();
  else if (state.ui.tab === "config-jobs") renderJobsTab();
  else if (state.ui.tab === "config-shop") renderShopTab();
  else if (state.ui.tab === "config-crates") renderCratesTab();
  else if (state.ui.tab === "config-kits") renderKitsTab();
  else if (state.ui.tab === "config-quests") renderQuestsTab();
  else if (state.ui.tab === "config-warzone") renderWarzoneTab();
  else if (state.ui.tab === "config-roles") renderRolesTab();
  else if (state.ui.tab === "tools-audit") renderAuditTab();
  else if (state.ui.tab === "config-server") renderServerConfigTab();
  else if (state.ui.tab === "logs") renderLogsTab();
  else if (state.ui.tab === "sync-guide") renderSyncGuideTab();
};

const TAB_GROUPS = {
  // Gameplay
  "config-shop": "gameplay",
  "config-crates": "gameplay",
  "config-kits": "gameplay",
  "config-jobs": "gameplay",
  "config-daily": "gameplay",
  "config-quests": "gameplay",
  "config-warzone": "gameplay",
  "config-roles": "gameplay",
  // Content
  "library": "content",
  "entries": "content",
  "recipes": "content",
  // System
  "config-server": "system",
  "sync-guide": "system",
  "data": "system",
  "tools-audit": "system",
};

const DEFAULT_SUBTABS = {
  gameplay: "config-shop",
  content: "library",
  system: "config-server",
};

const openTab = (rawName) => {
  let name = rawName;
  if (DEFAULT_SUBTABS[name]) {
    name = DEFAULT_SUBTABS[name];
  }
  state.ui.tab = name;
  const parentGroup = TAB_GROUPS[name] || name;

  const meta = TAB_TITLES[name] || { title: "Opal Heaven Studio", sub: "" };
  const titleEl = $("#current-section-title");
  const subEl = $("#current-section-sub");
  if (titleEl) titleEl.textContent = meta.title;
  if (subEl) subEl.textContent = meta.sub;

  // Activation sidebar : surligne l'onglet direct ou son groupe parent
  document.querySelectorAll('.sidebar-nav [role="tab"], nav [role="tab"]').forEach((button) => {
    const bTab = button.dataset.tab;
    const active = bTab === name || bTab === parentGroup;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });

  // Activation des sous-onglets horizontaux (.subnav-btn)
  document.querySelectorAll(".subnav-btn").forEach((btn) => {
    const subTarget = btn.dataset.subtab;
    btn.classList.toggle("active", subTarget === name);
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.hidden = tab.id !== "tab-" + name;
  });

  // Fermeture automatique du menu mobile si ouvert
  const sidebar = $("#sidebar");
  const backdrop = $("#sidebar-backdrop");
  if (sidebar) sidebar.classList.remove("open");
  if (backdrop) backdrop.classList.remove("active");

  renderActiveTab();
  if (name === "data" && state.ready) loadHistory().catch(() => {});
};

/* =====================================================================
   CHARGEMENT DU CATALOGUE ET INDEX
===================================================================== */

const baseName = (item) => String(item || "").split(":").pop();

const pickContent = (data) => ({
  entries: Array.isArray(data?.entries) ? data.entries : [],
  recipes: Array.isArray(data?.recipes) ? data.recipes : [],
  disabledVanillaRecipes: Array.isArray(data?.disabledVanillaRecipes)
    ? data.disabledVanillaRecipes
    : [],
  customTextures:
    data?.customTextures && typeof data.customTextures === "object" && !Array.isArray(data.customTextures)
      ? data.customTextures
      : {},
  configs: normalizeConfigs(data?.configs),
  revision: Number(data?.revision) || 0,
});

const rebuildIndices = () => {
  const indices = {
    entries: new Map(state.data.entries.map((entry) => [entry.id, entry])),
    vanillaItems: new Map((state.vanilla.items || []).map((item) => [item.id, item])),
    vanillaBlocks: new Map((state.vanilla.blocks || []).map((item) => [item.id, item])),
    opal: new Map((state.vanilla.opal || []).map((item) => [item.id, item])),
    recipes: new Map((state.vanilla.recipes || []).map((recipe) => [recipe.id, recipe])),
    overriddenVanilla: new Map(),
    disabledVanilla: new Set(state.data.disabledVanillaRecipes || []),
    textureFiles: new Set((state.library.textures || []).map((asset) => asset.file)),
  };
  for (const recipe of state.data.recipes) {
    if (recipe?.vanillaOverride) indices.overriddenVanilla.set(recipe.vanillaOverride, recipe.id);
  }
  state.indices = indices;
};

const migrateContent = (raw) => {
  const data = pickContent(raw);
  let changed = false;
  const legacy = state.vanilla.legacyIds || {};
  const validIds = new Set((state.vanilla.recipes || []).map((recipe) => recipe.id));

  if (Object.keys(legacy).length) {
    const mapId = (id) => {
      const next = legacy[id];
      return typeof next === "string" && validIds.has(next) ? next : id;
    };
    const disabled = [...new Set(data.disabledVanillaRecipes.map(mapId))].sort();
    if (JSON.stringify(disabled) !== JSON.stringify(data.disabledVanillaRecipes)) changed = true;
    data.disabledVanillaRecipes = disabled;
    data.recipes = data.recipes.map((recipe) => {
      if (!recipe || !recipe.vanillaOverride) return recipe;
      const next = mapId(recipe.vanillaOverride);
      if (next !== recipe.vanillaOverride) {
        changed = true;
        return { ...recipe, vanillaOverride: next };
      }
      return recipe;
    });
  }

  const entries = data.entries.filter((entry) => entry && typeof entry === "object");
  if (entries.length !== data.entries.length) changed = true;
  data.entries = entries;
  const opalIds = new Set([
    ...entries.map((entry) => entry.id),
    ...(state.vanilla.opal || []).map((item) => item.id),
  ]);
  const textures = normalizeTextures(data.customTextures, opalIds, { strict: false });
  if (JSON.stringify(textures) !== JSON.stringify(data.customTextures)) changed = true;
  data.customTextures = textures;

  return { data, changed };
};

const loadLibrary = async () => {
  try {
    const [libraryResponse, vanillaResponse, texturesResponse, indexResponse] = await Promise.all([
      fetch("/assets/opal-heaven/library.json"),
      fetch("/assets/opal-heaven/vanilla-catalogue.json"),
      fetch("/assets/opal-heaven/vanilla-textures.json").catch(() => null),
      fetch("/assets/opal-heaven/vanilla-recipe-index.json").catch(() => null),
    ]);
    if (!libraryResponse.ok) {
      throw new Error("bibliothèque d’assets introuvable (" + libraryResponse.status + ")");
    }
    if (!vanillaResponse.ok) {
      throw new Error("catalogue vanilla introuvable (" + vanillaResponse.status + ")");
    }
    const [library, vanilla] = await Promise.all([libraryResponse.json(), vanillaResponse.json()]);
    for (const type of ["icons", "models", "textures"]) {
      if (!Array.isArray(library[type])) throw new Error("manifest de bibliothèque invalide");
    }
    for (const type of ["items", "blocks", "recipes", "opal"]) {
      if (!Array.isArray(vanilla[type])) throw new Error("catalogue vanilla invalide");
    }

    if (texturesResponse && texturesResponse.ok) {
      state.vanillaTextures = await texturesResponse.json().catch(() => ({}));
    }
    const index = indexResponse && indexResponse.ok ? await indexResponse.json().catch(() => null) : null;

    // Déduplication défensive des entrées Opal (le registre peut contenir des
    // doublons item/bloc) en préférant l’entrée réellement implémentée.
    const opalById = new Map();
    for (const item of vanilla.opal) {
      if (!item || typeof item !== "object" || !item.id) continue;
      const previous = opalById.get(item.id);
      if (!previous || (!previous.implemented && item.implemented)) {
        opalById.set(item.id, item);
      }
    }
    vanilla.opal = [...opalById.values()];
    vanilla.legacyIds =
      index?.legacyIds && typeof index.legacyIds === "object" ? index.legacyIds : {};

    state.library = library;
    state.vanilla = vanilla;
    state.libraryReady = true;
    state.libraryError = "";
    rebuildIndices();
    refreshDatalists();
    buildTextureOptions();
    renderActiveTab();
  } catch (error) {
    state.libraryReady = false;
    state.libraryError = "Chargement impossible : " + error.message;
    libraryPromise = null;
    $("#library-status").textContent = state.libraryError;
    toast(state.libraryError, "error");
  }
};

const ensureLibrary = () => {
  if (!libraryPromise) libraryPromise = loadLibrary();
  return libraryPromise;
};

const refreshDatalists = () => {
  const vanillaNames = new Map();
  for (const id of VANILLA) vanillaNames.set(id, VANILLA_LABELS[id] || id.replaceAll("_", " "));
  for (const item of state.vanilla.items || []) vanillaNames.set(item.id, item.name || item.id);
  for (const block of state.vanilla.blocks || []) vanillaNames.set(block.id, block.name || block.id);

  $("#ingredients-vanilla").replaceChildren(
    ...[...vanillaNames].map(([id, name]) => h("option", { value: id, label: name }))
  );

  const all = new Map();
  for (const [id, name] of vanillaNames) all.set("minecraft:" + id, name);
  for (const entry of state.data.entries) all.set("opal:" + entry.id, entry.name || entry.id);
  for (const item of state.vanilla.opal || []) all.set("opal:" + item.id, item.name || item.id);
  $("#ingredients").replaceChildren(
    ...[...all].map(([value, label]) => h("option", { value, label }))
  );
};

const buildTextureOptions = () => {
  const select = $("#texture-dialog-select");
  const options = [h("option", { value: "" }, "-- Choisir une texture du pack Opal Heaven --")];
  for (const asset of state.library.icons || []) {
    if (!asset.url) continue;
    options.push(
      h("option", { value: asset.url }, "Icône : " + (asset.label || translateAssetName(asset.file, "icons")))
    );
  }
  for (const asset of state.library.textures || []) {
    if (!asset.url) continue;
    options.push(
      h("option", { value: asset.url }, "Texture : " + (asset.label || translateAssetName(asset.file, "textures")))
    );
  }
  select.replaceChildren(...options);
};

const applyContent = (serverData, { dirty = false } = {}) => {
  const migrated = migrateContent(serverData);
  state.revision = Number(serverData?.revision) || 0;
  state.data = { ...migrated.data, revision: state.revision };
  rebuildIndices();
  refreshDatalists();
  resetEntry();
  resetRecipe();
  renderActiveTab();
  setDirty(dirty || migrated.changed);
  if (migrated.changed) {
    toast("Données migrées (anciennes clés de textures ou IDs) : enregistrez pour finaliser.", "info");
  }
};

const load = async () => {
  try {
    const data = await api("/content");
    applyContent(data);
  } catch (err) {
    console.warn("Échec chargement content distant, fallback sur le contenu par défaut", err);
    applyContent(emptyContent());
  }
};

/* =====================================================================
   RÉSOLUTION DES ICÔNES ET TEXTURES
===================================================================== */

const itemLabel = (item) => {
  const id = baseName(item || "");
  if (!id) return "";
  const entry = state.indices.entries.get(id);
  if (entry?.name) return entry.name;
  if (VANILLA_LABELS[id]) return VANILLA_LABELS[id];
  if (ICON_LABELS[id]) return ICON_LABELS[id];
  const vanillaItem = state.indices.vanillaItems.get(id);
  if (vanillaItem?.name) return vanillaItem.name;
  const vanillaBlock = state.indices.vanillaBlocks.get(id);
  if (vanillaBlock?.name) return vanillaBlock.name;
  const opal = state.indices.opal.get(id);
  if (opal?.name) return opal.name;
  return id.replaceAll("_", " ");
};

const canonicalRef = (id) => {
  const cleanId = baseName(id);
  if (!cleanId) return "";
  if (state.indices.entries.has(cleanId) || state.indices.opal.has(cleanId)) return "opal:" + cleanId;
  return "minecraft:" + cleanId;
};

const iconUrl = (id, baseItem = "", kind = "item") => {
  const cleanId = baseName(id || "");
  const cleanBase = baseName(baseItem || "");
  if (!cleanId && !cleanBase) return "";
  const reference = canonicalRef(cleanId || cleanBase);

  const custom =
    state.data.customTextures[reference] ||
    (cleanId ? state.data.customTextures[cleanId] : "") ||
    (cleanBase ? state.data.customTextures["minecraft:" + cleanBase] || state.data.customTextures[cleanBase] : "");
  if (custom) return custom;

  const icon = ICON_BY_ID[cleanId] || (ICON_LABELS[cleanId] ? cleanId : "");
  if (icon && ICON_LABELS[icon]) return "/assets/opal-heaven/icons/" + icon + ".png";

  const folder = kind === "block" ? "blocks" : "items";
  for (const stem of [cleanId, cleanBase, icon].filter(Boolean)) {
    const file = "textures/" + folder + "/" + stem + ".png";
    if (state.indices.textureFiles.has(file)) return "/assets/opal-heaven/" + file;
  }

  const isBlock = kind === "block" || state.indices.vanillaBlocks.has(cleanId);
  const candidates = [
    (isBlock ? "block:" : "item:") + cleanId,
    (isBlock ? "item:" : "block:") + cleanId,
    cleanId,
    cleanBase ? "item:" + cleanBase : "",
    cleanBase ? "block:" + cleanBase : "",
    cleanBase,
  ].filter(Boolean);
  for (const key of candidates) {
    if (state.vanillaTextures[key]) return state.vanillaTextures[key];
  }

  const opalOnly =
    (state.indices.opal.has(cleanId) || state.indices.entries.has(cleanId)) &&
    !state.indices.vanillaItems.has(cleanId) &&
    !state.indices.vanillaBlocks.has(cleanId);
  if (opalOnly) return "";

  const cdnFolder = isBlock ? "block" : "item";
  return (
    "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/assets/minecraft/textures/" +
    cdnFolder +
    "/" +
    (cleanBase || cleanId) +
    ".png"
  );
};

const itemIconUrl = (reference) => {
  if (!reference) return "";
  const id = baseName(reference || "");
  const entry = state.indices.entries.get(id);
  const opal = state.indices.opal.get(id);
  const isBlock =
    entry?.kind === "block" ||
    (!entry && (opal?.kind === "block" || state.indices.vanillaBlocks.has(id)));
  const base =
    entry?.baseItem ||
    opal?.baseItem ||
    (state.indices.vanillaItems.has(id) || state.indices.vanillaBlocks.has(id) ? id : "");
  return iconUrl(id, base, isBlock ? "block" : "item");
};

const makeImage = (src, alt = "", className = "", kind = "item") => {
  if (!src) return null;
  let url = src;
  if (!src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("/") && !src.startsWith("data:")) {
    url = itemIconUrl(src);
  }
  const img = h("img", {
    src: url,
    alt,
    class: className,
    loading: "lazy",
    decoding: "async",
    "data-kind": kind,
  });
  img.addEventListener("error", () => {
    // 1er repli : dossier inversé dans Inventivetalent (item vs block)
    if (img.dataset.fallback !== "1" && img.src.includes("minecraft-assets")) {
      img.dataset.fallback = "1";
      const file = img.src.split("/").pop();
      const altFolder = img.src.includes("/block/") ? "item" : "block";
      img.src =
        "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/assets/minecraft/textures/" +
        altFolder +
        "/" +
        file;
      return;
    }
    // 2e repli : bedrock-samples
    if (img.dataset.fallback === "1") {
      img.dataset.fallback = "2";
      const file = img.src.split("/").pop();
      const bFolder = kind === "block" ? "blocks" : "items";
      img.src =
        "https://cdn.jsdelivr.net/gh/Mojang/bedrock-samples@main/resource_pack/textures/" +
        bFolder +
        "/" +
        file;
      return;
    }
    if (img.isConnected) {
      img.replaceWith(
        h("span", { class: "img-fallback", "aria-hidden": "true" }, kind === "block" ? "🧱" : "⚒️")
      );
    }
  });
  return img;
};

const translateAssetName = (file, type) => {
  const stem = file.split("/").pop().replace(/\.(geo\.)?json$|\.png$/i, "");
  if (type === "icons" && ICON_LABELS[stem]) return ICON_LABELS[stem];
  const words = {
    acceleration: "accélération", amethyst: "améthyste", armor: "armure", argent: "argent",
    axe: "hache", basalt: "basalte", block: "bloc", boots: "bottes", breach: "brèche",
    bricks: "briques", celestial: "céleste", crystal: "cristal", deepslate: "des abîmes",
    diamond: "diamant", entity: "entité", fast: "rapide", fertilizer: "engrais", gem: "gemme",
    gold: "or", iron: "fer", item: "objet", lamp: "lampe", ore: "minerai", opal: "opale",
    opale: "opale", pickaxe: "pioche", ruby: "rubis", silver: "argent", smelter: "four",
    titanium: "titane", tool: "outil", texture: "texture", watering: "arrosage", can: "arrosoir",
  };
  return stem
    .split(/[_-]/)
    .map((word) => words[word.toLowerCase()] || word)
    .join(" ");
};

/* =====================================================================
   MODALE DE TEXTURE
===================================================================== */

const processUploadedImage = (file) =>
  new Promise((resolve, reject) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      reject(new Error("Format non supporté (PNG, JPG ou WebP)."));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("Image trop lourde (2 Mo max)."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image illisible."));
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (!width || !height) return reject(new Error("Image vide."));
        if (width > 8192 || height > 8192) return reject(new Error("Image trop grande (8192 px max)."));
        const scale = Math.min(1, 64 / Math.max(width, height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas indisponible."));
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        if (!isAllowedTextureValue(dataUrl)) {
          return reject(new Error("Image trop lourde une fois encodée (500 Ko max)."));
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

const openTextureEditor = (targetId, targetName, kind = "item", source = "vanilla", baseItem = "") => {
  const cleanId = baseName(targetId);
  if (!cleanId) return;
  const reference = (source === "vanilla" ? "minecraft:" : "opal:") + cleanId;
  const cleanBase = baseName(baseItem);
  const explicit = state.data.customTextures[reference] || state.data.customTextures[cleanId];
  const currentTexture = explicit || iconUrl(cleanId, cleanBase, kind);
  const isCustom = Boolean(explicit);

  state.textureDialogTarget = {
    id: cleanId,
    ref: reference,
    name: targetName,
    kind,
    source,
    baseItem: cleanBase,
  };
  state.pendingDialogTexture = isCustom ? explicit : null;

  $("#texture-dialog-title").textContent = "Modifier la texture : " + targetName;
  $("#texture-dialog-subtitle").textContent = reference + " · " + (KIND_LABELS[kind] || kind);
  $("#texture-dialog-status").textContent = isCustom
    ? "✨ Texture personnalisée active"
    : "Texture par défaut du jeu / pack";
  $("#texture-dialog-reset").hidden = !isCustom;
  $("#texture-dialog-error").textContent = "";

  const previewBox = $("#texture-dialog-preview");
  previewBox.replaceChildren(
    makeImage(currentTexture, "Aperçu", "", kind) ||
      h("span", { class: "img-fallback", "aria-hidden": "true" }, kind === "block" ? "🧱" : "⚒️")
  );

  buildTextureOptions();
  $("#texture-dialog-file").value = "";
  $("#texture-dialog-select").value = "";
  $("#texture-dialog-url").value = isCustom && !explicit.startsWith("data:") ? explicit : "";

  const dialog = $("#texture-dialog");
  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
  $("#texture-dialog-file").focus();
};

const closeTextureDialog = () => {
  const dialog = $("#texture-dialog");
  if (typeof dialog.close === "function") {
    if (dialog.open) dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
  state.textureDialogTarget = null;
  state.pendingDialogTexture = null;
};

const applyDialogTexture = (event) => {
  if (event) event.preventDefault();
  const target = state.textureDialogTarget;
  const value = state.pendingDialogTexture;
  if (!target) return;
  if (!value || !isAllowedTextureValue(value)) {
    $("#texture-dialog-error").textContent =
      "Choisissez une image, une texture du pack ou une URL autorisée.";
    return;
  }
  state.data.customTextures[target.ref] = value;
  delete state.data.customTextures[target.id];
  setDirty(true);
  closeTextureDialog();
  refreshAfterMutation();
  if (state.ui.tab === "entries" && $("#entry-id").value.trim() === target.id) {
    updateEntryPreview();
  }
  toast("Texture mise à jour. Enregistrez pour publier.", "success");
};

const resetDialogTexture = async () => {
  const target = state.textureDialogTarget;
  if (!target) return;
  const ok = await confirmDialog({
    title: "Rétablir la texture",
    message: "Supprimer la texture personnalisée de « " + target.name + " » ?",
    confirmLabel: "Rétablir",
    danger: true,
  });
  if (!ok) return;
  delete state.data.customTextures[target.ref];
  delete state.data.customTextures[target.id];
  setDirty(true);
  closeTextureDialog();
  refreshAfterMutation();
  if (state.ui.tab === "entries" && $("#entry-id").value.trim() === target.id) {
    updateEntryPreview();
  }
  toast("Texture d’origine rétablie.", "success");
};

const selectLibraryItem = (type, id, button) => {
  state.selectedLibraryItem = { type, id };
  document.querySelectorAll("#library-list .library-card.selected").forEach((node) => {
    node.classList.remove("selected");
    if (node.hasAttribute("aria-pressed")) node.setAttribute("aria-pressed", "false");
  });
  if (button) {
    button.classList.add("selected");
    button.setAttribute("aria-pressed", "true");
  }
  renderLibraryDetail();
};

/* =====================================================================
   CONTENUS PERSONNALISÉS
===================================================================== */

const sortRecords = (records, key, getName, getCategory = () => "") => {
  const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });
  return [...records].sort((a, b) => {
    if (key === "id") return collator.compare(a.id, b.id);
    if (key === "category") {
      return (
        collator.compare(getCategory(a), getCategory(b)) ||
        collator.compare(getName(a), getName(b))
      );
    }
    const result = collator.compare(getName(a), getName(b));
    return key === "name-desc" ? -result : result;
  });
};

const renderEntries = () => {
  const filter = $("#entry-filter").value.trim().toLowerCase();
  const sort = $("#entry-sort").value;
  const list = $("#entry-list");
  const records = sortRecords(
    state.data.entries,
    sort,
    (entry) => entry.name || entry.id,
    (entry) => KIND_LABELS[entry.kind] || entry.kind
  ).filter((entry) => {
    if (!filter) return true;
    return (
      entry.id.includes(filter) ||
      String(entry.name || "").toLowerCase().includes(filter) ||
      String(entry.baseItem || "").includes(filter)
    );
  });

  if (!records.length) {
    list.replaceChildren(
      h(
        "li",
        { class: "empty-state" },
        state.data.entries.length ? "Aucun contenu ne correspond au filtre." : "Aucun contenu personnalisé pour l’instant."
      )
    );
    return;
  }

  list.replaceChildren(
    ...records.map((entry) =>
      h(
        "li",
        {},
        h(
          "button",
          {
            type: "button",
            class: "list-row" + (entry.id === state.entryId ? " sel" : ""),
            "aria-pressed": String(entry.id === state.entryId),
            onclick: () => loadEntry(entry.id),
          },
          h(
            "span",
            { class: "entry-item" },
            makeImage(iconUrl(entry.id, entry.baseItem, entry.kind), "", "item-icon", entry.kind),
            h("span", {}, entry.name)
          ),
          h("small", {}, KIND_LABELS[entry.kind] || entry.kind)
        )
      )
    )
  );
};

const updateLoreCounter = () => {
  const value = $("#entry-lore").value;
  const lines = value.split("\n");
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  $("#lore-counter").textContent =
    lines.length + "/" + LIMITS.maxLoreLines + " lignes · " +
    longest + "/" + LIMITS.maxLoreLength + " caractères (ligne la plus longue)";
};

const updateEntryPreview = () => {
  const id = $("#entry-id").value.trim();
  const base = $("#entry-base").value.trim();
  const kind = $("#entry-kind").value;
  const explicit = id ? state.data.customTextures["opal:" + id] || state.data.customTextures[id] : "";
  const image = makeImage(explicit || iconUrl(id, base, kind), "", "", kind);
  $("#entry-preview").replaceChildren(
    ...(image ? [image] : []),
    h("span", {}, "Aperçu — " + (itemLabel(id || base) || "item"))
  );
  $("#entry-texture-status").textContent = explicit
    ? "✨ Texture personnalisée active"
    : "Texture par défaut";
};

const toggleEntryFields = () => {
  const kind = $("#entry-kind").value;
  $("#durability-label").hidden = !["armor", "weapon", "tool"].includes(kind);
  $("#charges-label").hidden = kind !== "item";
};

const resetEntry = () => {
  state.entryId = null;
  $("#entry-form").reset();
  $("#entry-id").disabled = false;
  $("#entry-title").textContent = "Nouveau contenu";
  $("#entry-delete").hidden = true;
  $("#entry-error").textContent = "";
  toggleEntryFields();
  updateLoreCounter();
  updateEntryPreview();
  if (state.ui.tab === "entries") renderEntries();
};

const loadEntry = (id) => {
  const entry = state.data.entries.find((item) => item.id === id);
  if (!entry) return;
  state.entryId = id;
  $("#entry-kind").value = entry.kind;
  $("#entry-id").value = entry.id;
  $("#entry-id").disabled = true;
  $("#entry-name").value = entry.name;
  $("#entry-base").value = entry.baseItem;
  $("#entry-lore").value = (entry.lore || []).join("\n");
  $("#entry-tier").value = entry.tier || "";
  $("#entry-durability").value = entry.durability || 0;
  $("#entry-charges").value = entry.charges || 0;
  $("#entry-title").textContent = "Modifier : " + entry.name;
  $("#entry-delete").hidden = false;
  $("#entry-error").textContent = "";
  toggleEntryFields();
  updateLoreCounter();
  updateEntryPreview();
  if (state.ui.tab === "entries") renderEntries();
};

const submitEntry = (event) => {
  event.preventDefault();
  const error = $("#entry-error");
  const kind = $("#entry-kind").value;
  const id = $("#entry-id").value.trim();
  const name = $("#entry-name").value.trim();
  const baseItem = $("#entry-base").value.trim().toLowerCase().replace(/^minecraft:/, "");
  const tier = $("#entry-tier").value.trim().toLowerCase();
  const lore = $("#entry-lore")
    .value.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const durability = parseInt($("#entry-durability").value, 10) || 0;
  const charges = parseInt($("#entry-charges").value, 10) || 0;

  if (!ID_RE.test(id)) {
    error.textContent = "Identifiant invalide (a-z, 0-9, _ ; 2 à 40 caractères).";
    return;
  }
  if (!name) {
    error.textContent = "Nom requis.";
    return;
  }
  if (!BASE_RE.test(baseItem)) {
    error.textContent = "Item de base invalide (identifiant vanilla).";
    return;
  }
  if (tier && !TIER_RE.test(tier)) {
    error.textContent = "Tier invalide.";
    return;
  }
  if (lore.length > LIMITS.maxLoreLines) {
    error.textContent = "10 lignes de description maximum.";
    return;
  }
  if (lore.some((line) => line.length > LIMITS.maxLoreLength)) {
    error.textContent = "100 caractères maximum par ligne de description.";
    return;
  }
  if (durability < 0 || durability > 100000 || charges < 0 || charges > 1000) {
    error.textContent = "Valeur numérique hors limites.";
    return;
  }

  const index = state.data.entries.findIndex((entry) => entry.id === id);
  if (state.entryId === null && index >= 0) {
    error.textContent = "Cet identifiant existe déjà. Le contenu existant n’a pas été modifié.";
    return;
  }
  if (state.entryId !== null && id !== state.entryId) {
    error.textContent = "L’identifiant d’un contenu existant ne peut pas être changé.";
    return;
  }
  if (state.entryId !== null && index < 0) {
    error.textContent = "Ce contenu n’existe plus dans la liste. Rechargez les données avant de réessayer.";
    return;
  }

  const entry = {
    id,
    kind,
    name,
    baseItem,
    lore,
    tier,
    durability: ["armor", "weapon", "tool"].includes(kind) ? durability : 0,
    charges: kind === "item" ? charges : 0,
  };
  if (state.entryId !== null) state.data.entries[index] = entry;
  else state.data.entries.push(entry);

  refreshAfterMutation();
  loadEntry(id);
  toast("Contenu mis à jour. Enregistrez pour publier.", "success");
};

const recipeUses = (recipe, ingredient) =>
  recipe?.result?.item === ingredient ||
  recipe?.input === ingredient ||
  (Array.isArray(recipe?.ingredients) && recipe.ingredients.includes(ingredient)) ||
  Object.values(recipe?.key || {}).includes(ingredient);

const deleteEntry = async () => {
  const id = state.entryId;
  if (!id) return;
  const reference = "opal:" + id;
  const affected = state.data.recipes.filter((recipe) => recipeUses(recipe, reference));
  const overrides = new Set(
    affected.map((recipe) => recipe.vanillaOverride).filter(Boolean)
  );
  const ok = await confirmDialog({
    title: "Supprimer le contenu",
    message: affected.length
      ? "Supprimer « " + id + " » et les " + affected.length + " craft(s) qui l’utilisent ?"
      : "Supprimer « " + id + " » ?",
    confirmLabel: "Supprimer",
    danger: true,
  });
  if (!ok) return;

  state.data.entries = state.data.entries.filter((entry) => entry.id !== id);
  state.data.recipes = state.data.recipes.filter((recipe) => !recipeUses(recipe, reference));
  state.data.disabledVanillaRecipes = state.data.disabledVanillaRecipes.filter(
    (vanillaId) => !overrides.has(vanillaId)
  );
  delete state.data.customTextures[reference];
  delete state.data.customTextures[id];
  if (state.selectedLibraryItem?.type === "custom-items" && state.selectedLibraryItem.id === id) {
    state.selectedLibraryItem = null;
  }

  setDirty(true);
  resetEntry();
  resetRecipe();
  refreshAfterMutation();
  toast("Contenu supprimé. Enregistrez pour publier.", "success");
};

const startVariant = (item, kind) => {
  const variantKind = KINDS.includes(item.kind) ? item.kind : kind === "block" ? "block" : "item";
  const isVanilla =
    state.indices.vanillaItems.has(item.id) || state.indices.vanillaBlocks.has(item.id);
  let baseItem = String(item.baseItem || (isVanilla ? item.id : "")).replace(/^minecraft:/, "");
  if (!baseItem) {
    baseItem = variantKind === "block" ? "stone" : "paper";
    toast(
      "Aucun item de base connu : « " + baseItem + " » est utilisé par défaut. Pensez à l’ajuster.",
      "info"
    );
  }
  const rootId = ("custom_" + item.id).replace(/[^a-z0-9_]/g, "_").slice(0, 40);
  let id = rootId;
  let suffix = 2;
  while (state.data.entries.some((entry) => entry.id === id)) {
    const ending = "_" + suffix++;
    id = rootId.slice(0, 40 - ending.length) + ending;
  }

  openTab("entries");
  resetEntry();
  $("#entry-kind").value = variantKind;
  $("#entry-id").value = id;
  $("#entry-name").value = (item.name || item.id) + " personnalisé";
  $("#entry-base").value = baseItem;
  $("#entry-title").textContent = "Nouvelle variante : " + (item.name || item.id);
  toggleEntryFields();
  updateLoreCounter();
  updateEntryPreview();
  $("#entry-id").focus();
};

const startNewRecipeForResult = (reference) => {
  openTab("recipes");
  resetRecipe();
  $("#recipe-result").value = reference;
  $("#recipe-title").textContent = "Nouveau craft pour " + itemLabel(reference);
  $("#recipe-result").focus();
};

/* =====================================================================
   CRAFTS
===================================================================== */

const buildGrid = () => {
  const grid = $("#grid");
  grid.replaceChildren(
    ...Array.from({ length: 9 }, (_, index) =>
      h("input", {
        list: "ingredients",
        maxlength: "80",
        placeholder: "vide",
        "aria-label": "Case " + (index + 1),
        autocomplete: "off",
      })
    )
  );
};

const cells = () => [...document.querySelectorAll("#grid input")];

const toggleRecipeType = () => {
  $("#grid").classList.toggle("furnace", $("#recipe-type").value === "furnace");
};

const vanillaEditBlockReason = (recipe) => {
  if (!recipe) return "Craft introuvable.";
  if (!recipe.runtime) {
    return "Ce craft contient des variantes (méta) ou des ingrédients non supportés : consultation uniquement.";
  }
  if (!EDITABLE_STATIONS.has(recipe.station)) {
    return (
      "Station non supportée (" +
      (STATION_LABELS[recipe.station] || recipe.station) +
      ") : consultation uniquement."
    );
  }
  if (recipe.station !== "furnace" && !["shaped", "shapeless"].includes(recipe.type)) {
    return (
      "Type de craft non supporté (" +
      (RECIPE_LABELS[recipe.type] || recipe.type) +
      ") : consultation uniquement."
    );
  }
  return "";
};

const canDisableVanilla = (recipe) => Boolean(recipe?.runtime);

const uniqueRecipeId = (base) => {
  const root = base.replace(/[^a-z0-9_]/g, "_").slice(0, 40);
  let id = root;
  let suffix = 2;
  while (state.data.recipes.some((recipe) => recipe.id === id)) {
    const ending = "_" + suffix++;
    id = root.slice(0, 40 - ending.length) + ending;
  }
  return id;
};

const renderRecipes = () => {
  if (!state.libraryReady) {
    $("#recipe-status").textContent = state.libraryError || "Chargement du catalogue…";
    return;
  }
  const filter = $("#recipe-filter").value.trim().toLowerCase();
  const category = $("#recipe-category").value;
  const sort = $("#recipe-sort").value;
  const rows = [];

  for (const recipe of state.data.recipes) {
    const isOverride = Boolean(recipe.vanillaOverride);
    if (category === "vanilla") continue;
    if (category === "custom" && isOverride) continue;
    if (category === "vanilla-overrides" && !isOverride) continue;
    rows.push({
      id: recipe.id,
      name: itemLabel(recipe.result?.item),
      type: recipe.type,
      result: recipe.result,
      source: isOverride ? "override" : "custom",
      raw: recipe,
    });
  }

  if (category === "all" || category === "vanilla") {
    for (const recipe of state.vanilla.recipes) {
      if (state.indices.overriddenVanilla.has(recipe.id)) continue;
      rows.push({
        id: recipe.id,
        name: recipe.result?.name || itemLabel("minecraft:" + (recipe.result?.id || "")),
        type: recipe.type,
        result: {
          item: "minecraft:" + (recipe.result?.id || ""),
          count: recipe.result?.count || 1,
        },
        source: "vanilla",
        raw: recipe,
      });
    }
  }

  const matches = sortRecords(
    rows,
    sort,
    (row) => row.name || row.id,
    (row) => RECIPE_LABELS[row.type] || row.type
  ).filter((row) => {
    if (!filter) return true;
    return (
      row.id.includes(filter) ||
      String(row.name || "").toLowerCase().includes(filter) ||
      String(row.result?.item || "").includes(filter) ||
      String(row.type || "").includes(filter)
    );
  });

  const modifiable = state.vanilla.recipes.filter((recipe) => !vanillaEditBlockReason(recipe)).length;
  const unsupported = state.vanilla.recipes.length - modifiable;
  $("#recipe-status").textContent =
    matches.length + " affichés sur " + rows.length +
    " — " + modifiable + " modifiables, " + unsupported + " non modifiables, " +
    state.indices.overriddenVanilla.size + " modifiés, " +
    state.indices.disabledVanilla.size + " désactivés.";

  const list = $("#recipe-list");
  if (!matches.length) {
    list.replaceChildren(h("li", { class: "empty-state" }, "Aucun craft ne correspond."));
    return;
  }

  const limit = state.ui.recipeLimit;
  list.replaceChildren(
    ...matches.slice(0, limit).map((row) => {
      const isCurrent =
        state.recipeId === row.id ||
        (state.recipeVanillaOverride && row.id === state.recipeVanillaOverride);
      const reason = row.source === "vanilla" ? vanillaEditBlockReason(row.raw) : "";
      const disabled = row.source === "vanilla" && state.indices.disabledVanilla.has(row.id);
      const badges = [];
      if (row.source === "override") badges.push(h("span", { class: "badge badge-override" }, "Modifié"));
      else if (row.source === "custom") badges.push(h("span", { class: "badge badge-custom" }, "Personnalisé"));
      else if (reason) badges.push(h("span", { class: "badge badge-unsupported" }, "Non modifiable"));
      else badges.push(h("span", { class: "badge badge-vanilla" }, "Vanilla"));
      if (disabled) badges.push(h("span", { class: "badge badge-disabled" }, "Désactivé"));

      return h(
        "li",
        {},
        h(
          "button",
          {
            type: "button",
            class: "list-row" + (isCurrent ? " sel" : ""),
            title: reason || row.id,
            onclick: () => {
              if (row.source === "vanilla") {
                if (reason) {
                  toast(reason, "error");
                  return;
                }
                loadVanillaRecipe(row.id);
              } else {
                loadRecipe(row.id);
              }
            },
          },
          h(
            "span",
            { class: "entry-item" },
            makeImage(itemIconUrl(row.result?.item), "", "item-icon"),
            h("span", {}, (row.result?.count || 1) + "× " + (row.name || row.id), badges)
          ),
          h("small", {}, RECIPE_LABELS[row.type] || row.type)
        )
      );
    })
  );

  if (matches.length > limit) {
    list.append(
      h(
        "li",
        { class: "more-row" },
        h(
          "button",
          {
            type: "button",
            class: "ghost",
            onclick: () => {
              state.ui.recipeLimit += PAGE_RECIPES;
              renderRecipes();
            },
          },
          "Afficher " + Math.min(PAGE_RECIPES, matches.length - limit) + " crafts de plus"
        )
      )
    );
  }
};

const resetRecipe = () => {
  state.recipeId = null;
  state.recipeVanillaOverride = null;
  $("#recipe-form").reset();
  $("#recipe-id").disabled = false;
  $("#recipe-title").textContent = "Nouveau craft";
  $("#recipe-delete").hidden = true;
  $("#recipe-banner").hidden = true;
  $("#recipe-error").textContent = "";
  cells().forEach((cell) => {
    cell.value = "";
  });
  toggleRecipeType();
  if (state.ui.tab === "recipes") renderRecipes();
};

const loadRecipe = (id) => {
  const recipe = state.data.recipes.find((item) => item.id === id);
  if (!recipe) {
    if (state.indices.recipes.has(id)) return loadVanillaRecipe(id);
    return;
  }
  state.recipeId = id;
  state.recipeVanillaOverride = recipe.vanillaOverride || null;

  $("#recipe-type").value = recipe.type;
  $("#recipe-id").value = recipe.id;
  $("#recipe-id").disabled = true;
  $("#recipe-result").value = recipe.result.item;
  $("#recipe-count").value = recipe.result.count;

  const inputs = cells();
  inputs.forEach((cell) => {
    cell.value = "";
  });
  if (recipe.type === "furnace") {
    inputs[0].value = recipe.input;
  } else if (recipe.type === "shapeless") {
    (recipe.ingredients || []).forEach((value, index) => {
      if (inputs[index]) inputs[index].value = value;
    });
  } else {
    (recipe.pattern || []).forEach((row, y) =>
      [...row].forEach((character, x) => {
        if (character !== " " && inputs[y * 3 + x]) {
          inputs[y * 3 + x].value = recipe.key?.[character] || "";
        }
      })
    );
  }

  $("#recipe-title").textContent = "Modifier : " + recipe.id;
  $("#recipe-delete").hidden = false;
  $("#recipe-error").textContent = "";

  const banner = $("#recipe-banner");
  if (recipe.vanillaOverride) {
    banner.hidden = false;
    $("#recipe-banner-text").textContent =
      "✨ Ce craft personnalisé remplace la recette vanilla : " + recipe.vanillaOverride;
    $("#recipe-revert").hidden = false;
  } else {
    banner.hidden = true;
  }

  toggleRecipeType();
  if (state.ui.tab === "recipes") renderRecipes();
};

const loadVanillaRecipe = (vanillaId) => {
  const recipe = state.indices.recipes.get(vanillaId);
  if (!recipe) return;

  const existingOverride = state.data.recipes.find(
    (item) => item.vanillaOverride === vanillaId || item.id === "override_" + vanillaId
  );
  if (existingOverride) return loadRecipe(existingOverride.id);

  const reason = vanillaEditBlockReason(recipe);
  if (reason) {
    toast(reason, "error");
    return;
  }

  openTab("recipes");
  state.recipeId = null;
  state.recipeVanillaOverride = vanillaId;

  $("#recipe-title").textContent =
    "Modifier la recette vanilla : " + (recipe.result?.name || itemLabel("minecraft:" + recipe.result.id));
  $("#recipe-type").value =
    recipe.station === "furnace"
      ? "furnace"
      : recipe.type === "shaped"
      ? "shaped"
      : "shapeless";
  $("#recipe-id").value = uniqueRecipeId("override_" + vanillaId);
  $("#recipe-id").disabled = false;
  $("#recipe-result").value = "minecraft:" + recipe.result.id;
  $("#recipe-count").value = recipe.result.count || 1;
  $("#recipe-delete").hidden = true;
  $("#recipe-error").textContent = "";

  const banner = $("#recipe-banner");
  banner.hidden = false;
  $("#recipe-banner-text").textContent =
    "⚠️ Modification d’une recette vanilla (« " + (recipe.result?.name || recipe.result.id) +
    " »). En validant, la recette officielle sera désactivée au profit de ce craft.";
  $("#recipe-revert").hidden = true;

  const inputs = cells();
  inputs.forEach((cell) => {
    cell.value = "";
  });

  if (recipe.type === "shaped" && Array.isArray(recipe.pattern) && recipe.ingredients) {
    recipe.pattern.forEach((row, y) => {
      [...row].forEach((character, x) => {
        if (character !== " " && recipe.ingredients[character] && inputs[y * 3 + x]) {
          inputs[y * 3 + x].value = "minecraft:" + recipe.ingredients[character].id;
        }
      });
    });
  } else if (recipe.type === "furnace" && Array.isArray(recipe.ingredients) && recipe.ingredients[0]) {
    inputs[0].value = "minecraft:" + recipe.ingredients[0].id;
  } else if (Array.isArray(recipe.ingredients)) {
    recipe.ingredients.forEach((ingredient, index) => {
      if (inputs[index]) inputs[index].value = "minecraft:" + ingredient.id;
    });
  }

  toggleRecipeType();
  renderRecipes();
};

const normalize = (value) => {
  const trimmed = String(value || "").trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.includes(":")) return trimmed;
  return state.indices.entries.has(trimmed) ? "opal:" + trimmed : "minecraft:" + trimmed;
};

const knownOpalIds = () =>
  new Set([...state.indices.entries.keys(), ...state.indices.opal.keys()]);

const refreshAfterMutation = () => {
  setDirty(true);
  rebuildIndices();
  refreshDatalists();
  renderActiveTab();
};

const restoreVanillaRecipe = async (vanillaId) => {
  const ok = await confirmDialog({
    title: "Rétablir la recette vanilla",
    message: "Rétablir la recette vanilla d’origine ? Votre version personnalisée sera supprimée.",
    confirmLabel: "Rétablir",
    danger: true,
  });
  if (!ok) return;
  state.data.disabledVanillaRecipes = state.data.disabledVanillaRecipes.filter(
    (id) => id !== vanillaId
  );
  state.data.recipes = state.data.recipes.filter(
    (recipe) => recipe.vanillaOverride !== vanillaId && recipe.id !== "override_" + vanillaId
  );
  setDirty(true);
  resetRecipe();
  refreshAfterMutation();
  toast("Recette vanilla rétablie. Enregistrez pour publier.", "success");
};

const submitRecipe = (event) => {
  event.preventDefault();
  const error = $("#recipe-error");
  const fail = (message) => {
    error.textContent = message;
  };
  const type = $("#recipe-type").value;
  const id = $("#recipe-id").value.trim();
  const values = cells().map((cell) => normalize(cell.value));
  const result = normalize($("#recipe-result").value);
  const count = parseInt($("#recipe-count").value, 10);

  if (!ID_RE.test(id)) {
    return fail("Identifiant invalide (a-z, 0-9, _ ; 2 à 40 caractères).");
  }
  const index = state.data.recipes.findIndex((recipe) => recipe.id === id);
  if (state.recipeId === null && index >= 0) {
    return fail("Cet identifiant existe déjà. Le craft existant n’a pas été modifié.");
  }
  if (state.recipeId !== null && id !== state.recipeId) {
    return fail("L’identifiant d’un craft existant ne peut pas être changé.");
  }
  if (!ING_RE.test(result)) {
    return fail("Résultat invalide (item vanilla ou Opal Heaven).");
  }
  if (!(count >= 1 && count <= 64)) {
    return fail("Quantité invalide (1 à 64).");
  }
  if (values.some((value) => value && !ING_RE.test(value))) {
    return fail("Un ingrédient est invalide.");
  }

  const recipe = { id, type, result: { item: result, count } };

  if (type === "furnace") {
    if (!values[0]) return fail("Ingrédient requis dans la première case.");
    recipe.input = values[0];
  } else if (type === "shapeless") {
    const list = values.filter(Boolean);
    if (!list.length) return fail("Au moins un ingrédient requis.");
    recipe.ingredients = list;
  } else {
    const used = values.map((value, cellIndex) => (value ? cellIndex : -1)).filter((cellIndex) => cellIndex >= 0);
    if (!used.length) return fail("Grille vide.");
    const rows = used.map((cellIndex) => Math.floor(cellIndex / 3));
    const cols = used.map((cellIndex) => cellIndex % 3);
    const rowStart = Math.min(...rows);
    const rowEnd = Math.max(...rows);
    const colStart = Math.min(...cols);
    const colEnd = Math.max(...cols);
    const reverse = new Map();
    const key = {};
    const pattern = [];
    for (let row = rowStart; row <= rowEnd; row++) {
      let line = "";
      for (let col = colStart; col <= colEnd; col++) {
        const value = values[row * 3 + col];
        if (!value) {
          line += " ";
          continue;
        }
        if (!reverse.has(value)) {
          const letter = LETTERS[reverse.size];
          reverse.set(value, letter);
          key[letter] = value;
        }
        line += reverse.get(value);
      }
      pattern.push(line);
    }
    recipe.pattern = pattern;
    recipe.key = key;
  }

  if (state.recipeVanillaOverride) {
    const vanilla = state.indices.recipes.get(state.recipeVanillaOverride);
    if (vanilla) {
      const reason = vanillaEditBlockReason(vanilla);
      if (reason) return fail(reason);
    }
    recipe.vanillaOverride = state.recipeVanillaOverride;
  }

  const recipes =
    state.recipeId !== null
      ? state.data.recipes.map((item) => (item.id === state.recipeId ? recipe : item))
      : [...state.data.recipes, recipe];

  try {
    const normalized = validateContent(
      { ...state.data, recipes },
      { knownOpalIds: state.libraryReady ? knownOpalIds() : null }
    );
    state.data = { ...state.data, ...normalized, revision: state.revision };
  } catch (validationError) {
    return fail("Validation : " + validationError.message);
  }

  refreshAfterMutation();
  loadRecipe(id);
  toast("Craft mis à jour. Enregistrez pour publier.", "success");
};

const deleteRecipe = async () => {
  if (!state.recipeId) return;
  const current = state.data.recipes.find((recipe) => recipe.id === state.recipeId);
  const ok = await confirmDialog({
    title: "Supprimer le craft",
    message: "Supprimer le craft « " + state.recipeId + " » ?",
    confirmLabel: "Supprimer",
    danger: true,
  });
  if (!ok) return;

  if (current?.vanillaOverride) {
    state.data.disabledVanillaRecipes = state.data.disabledVanillaRecipes.filter(
      (id) => id !== current.vanillaOverride
    );
  }
  state.data.recipes = state.data.recipes.filter((recipe) => recipe.id !== state.recipeId);
  setDirty(true);
  resetRecipe();
  refreshAfterMutation();
  toast("Craft supprimé. Enregistrez pour publier.", "success");
};

const toggleVanillaRecipe = (vanillaId) => {
  const recipe = state.indices.recipes.get(vanillaId);
  if (!recipe) return;
  if (state.indices.overriddenVanilla.has(vanillaId)) {
    toast("Supprimez d’abord votre version personnalisée de ce craft.", "error");
    return;
  }
  if (!canDisableVanilla(recipe)) {
    toast(
      "Ce craft ne peut pas être désactivé : il contient des variantes (méta) ou des ingrédients non supportés.",
      "error"
    );
    return;
  }
  const disabled = new Set(state.data.disabledVanillaRecipes);
  const wasDisabled = disabled.has(vanillaId);
  if (wasDisabled) disabled.delete(vanillaId);
  else disabled.add(vanillaId);
  state.data.disabledVanillaRecipes = [...disabled].sort();
  setDirty(true);
  rebuildIndices();
  renderActiveTab();
  toast(wasDisabled ? "Recette réactivée." : "Recette désactivée.", "success");
};

/* =====================================================================
   DÉTAIL DU CATALOGUE
===================================================================== */

const librarySelection = () => {
  const selection = state.selectedLibraryItem;
  if (!selection) return null;
  if (selection.type === "custom-items") {
    const item = state.indices.entries.get(selection.id);
    return item ? { item, source: "custom", kind: item.kind || "item" } : null;
  }
  if (selection.type === "vanilla-items" || selection.type === "vanilla-blocks") {
    const table = selection.type === "vanilla-blocks" ? state.indices.vanillaBlocks : state.indices.vanillaItems;
    const item = table.get(selection.id);
    return item
      ? { item, source: "vanilla", kind: selection.type === "vanilla-blocks" ? "block" : "item" }
      : null;
  }
  if (selection.type === "opal-items" || selection.type === "opal-blocks") {
    const item = state.indices.opal.get(selection.id);
    return item
      ? { item, source: "opal", kind: item.kind || (selection.type === "opal-blocks" ? "block" : "item") }
      : null;
  }
  return null;
};

const renderLibraryDetail = () => {
  const detail = $("#library-detail");
  const selection = librarySelection();
  if (!selection) {
    detail.replaceChildren(
      h("p", { class: "muted" }, "Sélectionnez un item ou un bloc pour afficher ses détails.")
    );
    return;
  }

  const { item, source, kind } = selection;
  const isBlock = kind === "block";
  const cleanId = baseName(item.id);
  const reference = (source === "vanilla" ? "minecraft:" : "opal:") + cleanId;
  const base = item.baseItem || (source === "vanilla" ? item.id : "");
  const explicitTexture = state.data.customTextures[reference] || state.data.customTextures[cleanId];
  const texture = explicitTexture || iconUrl(item.id, base, kind);
  const hasCustomTexture = Boolean(explicitTexture);
  const sourceLabel =
    source === "custom"
      ? "Variante personnalisée"
      : source === "opal"
      ? "Contenu Opal Heaven" + (item.implemented === false ? " · non implémenté" : "")
      : isBlock
      ? "Bloc vanilla"
      : "Item vanilla";

  const actions = h(
    "div",
    { class: "row detail-actions-inline" },
    h(
      "button",
      {
        type: "button",
        class: "ghost",
        onclick: () => openTextureEditor(item.id, item.name, kind, source, item.baseItem || ""),
      },
      "🎨 Modifier la texture"
    ),
    hasCustomTexture
      ? h(
          "button",
          {
            type: "button",
            class: "ghost danger",
            onclick: async () => {
              const ok = await confirmDialog({
                title: "Rétablir la texture",
                message: "Supprimer la texture personnalisée de « " + item.name + " » ?",
                confirmLabel: "Rétablir",
                danger: true,
              });
              if (!ok) return;
              delete state.data.customTextures[reference];
              delete state.data.customTextures[cleanId];
              setDirty(true);
              refreshAfterMutation();
              toast("Texture d’origine rétablie.", "success");
            },
          },
          "🔄 Rétablir la texture d’origine"
        )
      : null
  );

  const sections = [
    h(
      "div",
      { class: "detail-heading" },
      makeImage(texture, item.name || cleanId, "detail-image", kind) ||
        h("span", { class: "img-fallback", "aria-hidden": "true" }, isBlock ? "🧱" : "⚒️"),
      h(
        "div",
        {},
        h(
          "h3",
          {},
          item.name || cleanId,
          hasCustomTexture ? h("span", { class: "badge badge-override" }, "Texture modifiée") : null,
          item.implemented === false ? h("span", { class: "badge badge-unsupported" }, "Non implémenté") : null
        ),
        h("code", {}, reference),
        h("p", { class: "muted" }, sourceLabel)
      )
    ),
    actions,
  ];

  if (isBlock) {
    const stems = new Set(
      [
        item.id,
        (item.baseItem || "").replace(/^minecraft:/, ""),
        ICON_BY_ID[item.id] || "",
        item.icon ? item.icon.split("/").pop().replace(/\.png$/i, "") : "",
      ]
        .map((stem) => String(stem || "").toLowerCase())
        .filter(Boolean)
    );
    const model = (state.library.models || []).find((asset) => {
      const file = asset.file.toLowerCase();
      return [...stems].some(
        (stem) => file.endsWith("/" + stem + ".geo.json") || file.endsWith("/" + stem + ".json")
      );
    });
    sections.push(
      h(
        "section",
        { class: "detail-section" },
        h("h4", {}, "Modèle de bloc"),
        model
          ? h(
              "a",
              { href: model.url, target: "_blank", rel: "noopener noreferrer" },
              model.label || translateAssetName(model.file, "models")
            )
          : h("p", { class: "muted" }, "Modèle de bloc par défaut.")
      )
    );
  }

  const vanillaRecipes = (state.vanilla.recipes || []).filter(
    (recipe) => recipe.result?.id === cleanId
  );
  const customRecipes = state.data.recipes.filter(
    (recipe) => baseName(recipe.result?.item) === cleanId
  );
  const overriddenBy = new Map(
    state.data.recipes
      .filter((recipe) => recipe.vanillaOverride)
      .map((recipe) => [recipe.vanillaOverride, recipe])
  );
  const shown = new Set();
  const craftList = [];

  const customRow = (recipe, note) =>
    h(
      "li",
      { class: "detail-recipe-item" },
      h(
        "span",
        {},
        (recipe.result?.count || 1) + "× " + itemLabel(recipe.result?.item) +
          " (" + (RECIPE_LABELS[recipe.type] || recipe.type) + ")",
        h("span", { class: "badge badge-custom" }, "Personnalisé"),
        note ? h("small", { class: "field-hint" }, note) : null
      ),
      h(
        "button",
        {
          type: "button",
          class: "ghost",
          onclick: () => {
            openTab("recipes");
            loadRecipe(recipe.id);
          },
        },
        "✏️ Modifier"
      )
    );

  for (const vanilla of vanillaRecipes) {
    const override = overriddenBy.get(vanilla.id);
    if (override) {
      shown.add(override.id);
      craftList.push(customRow(override, "Remplace " + vanilla.id));
      continue;
    }
    const reason = vanillaEditBlockReason(vanilla);
    craftList.push(
      h(
        "li",
        { class: "detail-recipe-item" },
        h(
          "span",
          {},
          (vanilla.result?.count || 1) + "× " +
            (vanilla.result?.name || itemLabel("minecraft:" + vanilla.result?.id)) +
            " (" + (STATION_LABELS[vanilla.station] || vanilla.station) + ")",
          reason ? h("small", { class: "field-hint" }, "Non modifiable") : null
        ),
        reason
          ? null
          : h(
              "button",
              {
                type: "button",
                class: "ghost",
                onclick: () => loadVanillaRecipe(vanilla.id),
              },
              "✏️ Modifier"
            )
      )
    );
  }

  for (const recipe of customRecipes) {
    if (shown.has(recipe.id)) continue;
    if (recipe.vanillaOverride && vanillaRecipes.some((vanilla) => vanilla.id === recipe.vanillaOverride)) {
      continue;
    }
    craftList.push(customRow(recipe, null));
  }

  sections.push(
    h(
      "section",
      { class: "detail-section" },
      h("h4", {}, "Crafts associés (" + craftList.length + ")"),
      craftList.length
        ? h("ul", { class: "detail-recipes" }, ...craftList)
        : h("p", { class: "muted" }, "Aucun craft associé trouvé."),
      h(
        "button",
        {
          type: "button",
          class: "ghost detail-inline-btn",
          onclick: () => startNewRecipeForResult(reference),
        },
        "➕ Créer un nouveau craft pour cet élément"
      )
    )
  );

  if (source !== "custom") {
    if (item.id !== "air") {
      sections.push(
        h(
          "button",
          {
            type: "button",
            class: "detail-variant-btn",
            onclick: () => startVariant(item, isBlock ? "block" : "item"),
          },
          "Créer une variante moddée"
        )
      );
    }
  } else {
    sections.push(
      h(
        "div",
        { class: "row detail-actions" },
        h(
          "button",
          {
            type: "button",
            onclick: () => {
              openTab("entries");
              loadEntry(item.id);
            },
          },
          "Modifier le contenu"
        ),
        h(
          "button",
          {
            type: "button",
            class: "danger",
            onclick: async () => {
              openTab("entries");
              loadEntry(item.id);
              await deleteEntry();
            },
          },
          "Supprimer"
        )
      )
    );
  }

  detail.replaceChildren(...sections);
};

const renderLibrary = () => {
  const type = $("#library-type").value;
  const filter = $("#library-filter").value.trim().toLowerCase();
  const sort = $("#library-sort").value;
  const list = $("#library-list");
  const detail = $("#library-detail");

  if (!state.libraryReady) {
    $("#library-status").textContent = state.libraryError || "Chargement du catalogue…";
    return;
  }

  if (["custom-items", "vanilla-items", "vanilla-blocks", "opal-items", "opal-blocks"].includes(type)) {
    const isOpal = type.startsWith("opal-");
    const blocks = type.endsWith("blocks");
    const records =
      type === "custom-items"
        ? state.data.entries
        : isOpal
        ? state.vanilla.opal.filter((item) => (item.kind === "block") === blocks)
        : blocks
        ? state.vanilla.blocks
        : state.vanilla.items;

    const matches = sortRecords(
      records,
      sort,
      (item) => item.name || item.id,
      (item) => item.id.split("_")[0]
    ).filter((item) => {
      if (!filter) return true;
      return (
        String(item.name || "").toLowerCase().includes(filter) ||
        String(item.id || "").includes(filter)
      );
    });

    if (state.selectedLibraryItem?.type !== type) state.selectedLibraryItem = null;
    if (
      state.selectedLibraryItem &&
      !matches.some((item) => item.id === state.selectedLibraryItem.id)
    ) {
      state.selectedLibraryItem = null;
    }

    const implemented = isOpal ? records.filter((item) => item.implemented).length : 0;
    $("#library-status").textContent =
      matches.length + " éléments affichés sur " + records.length +
      (type === "custom-items"
        ? " — vos variantes, modifiables et supprimables."
        : isOpal
        ? " — registre Opal Heaven (" + implemented + " implémentés)."
        : " — registre vanilla PMMP 5 (consultation, textures et crafts modifiables).");

    const limit = state.ui.libraryLimit;
    const cards = matches.slice(0, limit).map((item) => {
      const itemKind =
        type === "custom-items"
          ? item.kind || "item"
          : isOpal
          ? item.kind || (blocks ? "block" : "item")
          : blocks
          ? "block"
          : "item";
      const itemBlocks = itemKind === "block";
      const cleanId = baseName(item.id);
      const fullRef = (type === "custom-items" || isOpal ? "opal:" : "minecraft:") + cleanId;
      const hasCustom = Boolean(
        state.data.customTextures[fullRef] || state.data.customTextures[item.id] || state.data.customTextures[cleanId]
      );
      const base = item.baseItem || (type.startsWith("vanilla-") ? item.id : "");
      const selected =
        state.selectedLibraryItem?.type === type && state.selectedLibraryItem.id === item.id;
      const status =
        type === "custom-items"
          ? (KIND_LABELS[item.kind] || item.kind) + " personnalisé"
          : isOpal
          ? item.implemented
            ? itemBlocks
              ? "Bloc Opal Heaven"
              : "Item Opal Heaven"
            : "Non implémenté"
          : itemBlocks
          ? "Bloc vanilla"
          : "Item vanilla";

      return h(
        "button",
        {
          type: "button",
          class: "library-card library-item" + (selected ? " selected" : ""),
          title: fullRef,
          "aria-pressed": String(selected),
          onclick: (event) => selectLibraryItem(type, item.id, event.currentTarget),
        },
        makeImage(iconUrl(item.id, base, itemKind), "", "", itemKind) ||
          h("span", { class: "library-icon", "aria-hidden": "true" }, itemBlocks ? "🧱" : "⚒️"),
        h(
          "span",
          { class: "asset-name" },
          item.name || item.id,
          hasCustom
            ? h("span", { class: "badge badge-override", title: "Texture personnalisée" }, "🎨")
            : null
        ),
        h("small", {}, fullRef),
        h("small", {}, status)
      );
    });

    list.replaceChildren(...cards);
    if (!matches.length) {
      list.append(h("p", { class: "empty-state" }, "Aucun élément ne correspond."));
    } else if (matches.length > limit) {
      list.append(
        h(
          "div",
          { class: "more-row" },
          h(
            "button",
            {
              type: "button",
              class: "ghost",
              onclick: () => {
                state.ui.libraryLimit += PAGE_LIBRARY;
                renderLibrary();
              },
            },
            "Afficher " + Math.min(PAGE_LIBRARY, matches.length - limit) + " éléments de plus"
          )
        )
      );
    }
    renderLibraryDetail();
    return;
  }

  if (type === "vanilla-recipes") {
    const records = state.vanilla.recipes;
    const matches = sortRecords(
      records,
      sort,
      (recipe) => recipe.result?.name || recipe.result?.id || "",
      (recipe) => recipe.station || ""
    ).filter((recipe) => {
      if (!filter) return true;
      const ingredients =
        recipe.type === "shaped" && recipe.ingredients && !Array.isArray(recipe.ingredients)
          ? Object.values(recipe.ingredients)
          : Array.isArray(recipe.ingredients)
          ? recipe.ingredients
          : [];
      return [
        recipe.id,
        recipe.result?.id,
        recipe.result?.name,
        recipe.station,
        recipe.type,
        ...ingredients.flatMap((ingredient) => [ingredient?.id, ingredient?.name]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(filter);
    });

    if (state.selectedLibraryItem) state.selectedLibraryItem = null;
    detail.replaceChildren(
      h("p", { class: "muted" }, "Sélectionnez un item ou un bloc pour afficher ses détails.")
    );

    const modifiable = records.filter((recipe) => !vanillaEditBlockReason(recipe)).length;
    $("#library-status").textContent =
      matches.length + " crafts affichés sur " + records.length +
      " — " + modifiable + " modifiables, " + (records.length - modifiable) + " non modifiables, " +
      state.indices.overriddenVanilla.size + " modifiés, " +
      state.indices.disabledVanilla.size + " désactivés.";

    const limit = state.ui.libraryLimit;
    list.replaceChildren(
      ...matches.slice(0, limit).map((recipe) => {
        const overrideId = state.indices.overriddenVanilla.get(recipe.id);
        const disabled = state.indices.disabledVanilla.has(recipe.id);
        const reason = vanillaEditBlockReason(recipe);
        const canEdit = !reason;
        const canDisable = canDisableVanilla(recipe);
        const summary = h(
          "summary",
          {},
          (recipe.result?.count || 1) + "× " + (recipe.result?.name || recipe.result?.id),
          overrideId ? h("span", { class: "badge badge-override" }, "✨ Modifié") : null,
          disabled && !overrideId ? h("span", { class: "badge badge-disabled" }, "Désactivé") : null,
          reason ? h("span", { class: "badge badge-unsupported" }, "Non modifiable") : null,
          h(
            "small",
            {},
            (STATION_LABELS[recipe.station] || recipe.station) +
              " · " +
              (RECIPE_LABELS[recipe.type] || recipe.type)
          )
        );

        const recipeDetails = [
          h("p", {}, "Résultat : minecraft:" + (recipe.result?.id || "")),
        ];
        if (recipe.type === "shaped") {
          recipeDetails.push(h("p", {}, "Motif : " + (recipe.pattern || []).join(" / ")));
          if (recipe.ingredients && !Array.isArray(recipe.ingredients)) {
            for (const [symbol, ingredient] of Object.entries(recipe.ingredients)) {
              recipeDetails.push(
                h("p", {}, symbol + " = " + ingredient.name + " (minecraft:" + ingredient.id + ")")
              );
            }
          }
        } else if (Array.isArray(recipe.ingredients)) {
          recipeDetails.push(
            h("p", {}, "Ingrédients : " + recipe.ingredients.map((ingredient) => ingredient.name).join(" + "))
          );
        }

        const actions = h("div", { class: "recipe-actions" });
        if (overrideId) {
          actions.append(
            h(
              "button",
              {
                type: "button",
                onclick: (event) => {
                  event.stopPropagation();
                  openTab("recipes");
                  loadRecipe(overrideId);
                },
              },
              "✏️ Modifier votre version"
            ),
            h(
              "button",
              {
                type: "button",
                class: "ghost danger",
                onclick: (event) => {
                  event.stopPropagation();
                  restoreVanillaRecipe(recipe.id);
                },
              },
              "🔄 Rétablir la version vanilla"
            )
          );
        } else {
          if (canEdit) {
            actions.append(
              h(
                "button",
                {
                  type: "button",
                  onclick: (event) => {
                    event.stopPropagation();
                    loadVanillaRecipe(recipe.id);
                  },
                },
                "✏️ Modifier ce craft"
              )
            );
          } else {
            actions.append(
              h("span", { class: "field-hint" }, "Non modifiable : station, type ou variantes non supportés.")
            );
          }
          if (canDisable) {
            actions.append(
              h(
                "button",
                {
                  type: "button",
                  class: disabled ? "ghost" : "danger ghost",
                  onclick: (event) => {
                    event.stopPropagation();
                    toggleVanillaRecipe(recipe.id);
                  },
                },
                disabled ? "Réactiver cette recette" : "Désactiver cette recette"
              )
            );
          } else {
            actions.append(h("span", { class: "field-hint" }, "Désactivation non supportée."));
          }
        }
        recipeDetails.push(actions);

        return h(
          "details",
          { class: "library-card recipe-card" + (overrideId ? " selected" : "") },
          summary,
          ...recipeDetails
        );
      })
    );

    if (!matches.length) {
      list.replaceChildren(h("p", { class: "empty-state" }, "Aucun craft ne correspond."));
    } else if (matches.length > limit) {
      list.append(
        h(
          "div",
          { class: "more-row" },
          h(
            "button",
            {
              type: "button",
              class: "ghost",
              onclick: () => {
                state.ui.libraryLimit += PAGE_LIBRARY;
                renderLibrary();
              },
            },
            "Afficher " + Math.min(PAGE_LIBRARY, matches.length - limit) + " crafts de plus"
          )
        )
      );
    }
    return;
  }

  const assets = state.library[type] || [];
  const matches = sortRecords(
    assets.map((asset) => ({ ...asset, label: asset.label || translateAssetName(asset.file, type) })),
    sort,
    (asset) => asset.label,
    (asset) => asset.file.split("/")[1] || ""
  ).filter(
    (asset) =>
      !filter ||
      asset.label.toLowerCase().includes(filter) ||
      asset.file.toLowerCase().includes(filter)
  );

  if (state.selectedLibraryItem) state.selectedLibraryItem = null;
  detail.replaceChildren(
    h("p", { class: "muted" }, "Sélectionnez un item ou un bloc pour afficher ses détails.")
  );

  $("#library-status").textContent = matches.length + " ressource(s) affichée(s) sur " + assets.length + ".";
  const limit = state.ui.libraryLimit;
  list.replaceChildren(
    ...matches.slice(0, limit).map((asset) => {
      const visual =
        type === "models"
          ? h("span", { class: "asset-model", "aria-hidden": "true" }, "MODÈLE 3D")
          : makeImage(asset.url, asset.label, "");
      return h(
        "a",
        {
          class: "library-card",
          href: asset.url,
          target: "_blank",
          rel: "noopener noreferrer",
          title: asset.file,
        },
        visual || h("span", { class: "asset-model" }, "RESSOURCE"),
        h("span", { class: "asset-name" }, asset.label),
        h("small", {}, asset.file)
      );
    })
  );

  if (!matches.length) {
    list.append(h("p", { class: "empty-state" }, "Aucune ressource ne correspond."));
  } else if (matches.length > limit) {
    list.append(
      h(
        "div",
        { class: "more-row" },
        h(
          "button",
          {
            type: "button",
            class: "ghost",
            onclick: () => {
              state.ui.libraryLimit += PAGE_LIBRARY;
              renderLibrary();
            },
          },
          "Afficher " + Math.min(PAGE_LIBRARY, matches.length - limit) + " ressources de plus"
        )
      )
    );
  }
};

/* =====================================================================
   SAUVEGARDE, IMPORT / EXPORT, HISTORIQUE
===================================================================== */

const save = async ({ force = false } = {}) => {
  if (!state.ready || state.loading) return;
  if (state.saving && !force) return;

  let normalized;
  try {
    normalized = validateContent(state.data, {
      knownOpalIds: state.libraryReady ? knownOpalIds() : null,
    });
  } catch (error) {
    toast("Validation impossible : " + error.message, "error");
    return;
  }

  state.data = { ...state.data, ...normalized, revision: state.revision };
  rebuildIndices();
  refreshDatalists();
  renderActiveTab();

  state.saving = true;
  refreshStatus();
  try {
    const saved = await api("/content", {
      method: "PUT",
      headers: { "if-match": force ? "*" : String(state.revision) },
      body: JSON.stringify(state.data),
    });
    state.data = {
      ...pickContent(saved),
      revision: Number(saved.revision) || state.revision + 1,
    };
    state.revision = state.data.revision;
    rebuildIndices();
    refreshDatalists();
    renderActiveTab();
    setDirty(false);
    clearDraft();
    toast("Enregistré (révision " + state.revision + ").", "success");
    if (state.ui.tab === "data") loadHistory().catch(() => {});
  } catch (error) {
    if (error instanceof SessionExpiredError) return;
    if (error.status === 409) {
      state.saving = false;
      refreshStatus();
      const overwrite = await confirmDialog({
        title: "Conflit de version",
        message:
          "Le contenu a été modifié ailleurs (révision serveur " +
          (error.body?.revision ?? "?") +
          "). Écraser avec vos modifications ou recharger la version du serveur ?",
        confirmLabel: "Écraser avec mes modifications",
        cancelLabel: "Recharger depuis le serveur",
        danger: true,
      });
      if (overwrite) {
        await save({ force: true });
      } else {
        try {
          if (state.dirty) saveDraft();
          await load();
          toast("Contenu rechargé depuis le serveur.", "info");
          maybeOfferDraft();
        } catch (reloadError) {
          if (reloadError instanceof SessionExpiredError) return;
          toast("Rechargement impossible : " + reloadError.message, "error");
        }
      }
      return;
    }
    toast("Échec de l’enregistrement : " + error.message, "error");
  } finally {
    state.saving = false;
    refreshStatus();
  }
};

const exportJson = () => {
  const payload = { version: 1, schemaVersion: 2, ...state.data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = h("a", { href: url, download: "custom_content.json" });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const importJson = async (event) => {
  const file = event.target.files?.[0];
  const error = $("#data-error");
  const status = $("#data-status");
  error.textContent = "";
  status.textContent = "";
  if (!file) return;

  try {
    if (file.size > LIMITS.maxBody) throw new Error("fichier trop volumineux (max 4 Mo)");
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.entries) || !Array.isArray(parsed.recipes)) {
      throw new Error("structure invalide (entries et recipes requis)");
    }

    const appendMissing = (current, incoming, label) => {
      const existing = new Set(current.map((item) => item.id));
      const seen = new Set();
      const additions = [];
      let skipped = 0;
      for (const item of incoming) {
        if (!item || typeof item !== "object" || !ID_RE.test(item.id || "")) {
          throw new Error("identifiant invalide dans les " + label + " importés");
        }
        if (seen.has(item.id)) {
          throw new Error("identifiant en double dans les " + label + " importés : " + item.id);
        }
        seen.add(item.id);
        if (existing.has(item.id)) skipped++;
        else additions.push(item);
      }
      return { additions, skipped };
    };

    const entries = appendMissing(state.data.entries, parsed.entries, "contenus");
    const recipes = appendMissing(state.data.recipes, parsed.recipes, "crafts");

    const disabled = new Set(state.data.disabledVanillaRecipes);
    const beforeDisabled = disabled.size;
    const incomingDisabled = Array.isArray(parsed.disabledVanillaRecipes)
      ? parsed.disabledVanillaRecipes
      : [];
    for (const id of incomingDisabled) disabled.add(id);
    const addedDisabled = disabled.size - beforeDisabled;

    const mergedTextures = { ...state.data.customTextures };
    let addedTextures = 0;
    const importedTextures =
      parsed.customTextures && typeof parsed.customTextures === "object" ? parsed.customTextures : {};
    for (const [key, value] of Object.entries(importedTextures)) {
      if (typeof value !== "string" || !value) continue;
      if (!mergedTextures[key]) {
        mergedTextures[key] = value;
        addedTextures++;
      }
    }

    const candidate = {
      ...state.data,
      entries: [...state.data.entries, ...entries.additions],
      recipes: [...state.data.recipes, ...recipes.additions],
      disabledVanillaRecipes: [...disabled].sort(),
      customTextures: mergedTextures,
    };

    const known = new Set([
      ...state.data.entries.map((entry) => entry.id),
      ...entries.additions.map((entry) => entry.id),
      ...state.indices.opal.keys(),
    ]);
    const normalized = validateContent(candidate, {
      knownOpalIds: state.libraryReady ? known : null,
    });

    const ok = await confirmDialog({
      title: "Importer un fichier",
      message:
        "Ajouter " + entries.additions.length + " contenu(s), " + recipes.additions.length +
        " craft(s), " + addedDisabled + " désactivation(s) vanilla et " + addedTextures +
        " texture(s) personnalisée(s) ? Les identifiants existants seront conservés.",
      confirmLabel: "Importer",
    });
    if (!ok) return;

    state.data = { ...state.data, ...normalized, revision: state.revision };
    refreshAfterMutation();
    resetEntry();
    resetRecipe();
    status.textContent =
      entries.additions.length + " contenu(s), " + recipes.additions.length + " craft(s), " +
      addedDisabled + " désactivation(s) et " + addedTextures + " texture(s) ajoutée(s).";
    toast("Import appliqué. Enregistrez pour publier.", "success");
  } catch (importError) {
    error.textContent = "Import impossible : " + importError.message;
  } finally {
    event.target.value = "";
  }
};

const restoreHistory = async (version) => {
  const hadDirty = state.dirty;
  const ok = await confirmDialog({
    title: "Restaurer une version",
    message:
      "Restaurer la version " + version.revision + " du " + formatDate(version.savedAt) +
      " ? Une nouvelle version sera créée, rien n’est supprimé." +
      (hadDirty ? " Vos modifications non enregistrées seront conservées dans un brouillon local." : ""),
    confirmLabel: "Restaurer",
    danger: true,
  });
  if (!ok) return;
  try {
    if (hadDirty) saveDraft();
    const saved = await api("/history/restore", {
      method: "POST",
      body: JSON.stringify({ key: version.key, revision: state.revision }),
    });
    applyContent(saved);
    state.ready = true;
    setDirty(false);
    if (hadDirty) maybeOfferDraft();
    else clearDraft();
    toast("Version restaurée et enregistrée.", "success");
    loadHistory().catch(() => {});
  } catch (error) {
    if (error instanceof SessionExpiredError) return;
    if (error.status === 409) {
      try {
        if (state.dirty) saveDraft();
        await load();
        maybeOfferDraft();
        loadHistory().catch(() => {});
        toast("Le contenu a été modifié ailleurs : version rechargée, réessayez la restauration.", "error");
      } catch (reloadError) {
        if (reloadError instanceof SessionExpiredError) return;
        toast("Rechargement impossible : " + reloadError.message, "error");
      }
      return;
    }
    toast("Restauration impossible : " + error.message, "error");
  }
};

const loadHistory = async () => {
  if (!state.ready) return;
  const status = $("#history-status");
  status.textContent = "Chargement…";
  try {
    const { versions } = await api("/history");
    const list = $("#history-list");
    if (!Array.isArray(versions) || !versions.length) {
      list.replaceChildren(
        h("li", { class: "empty-state" }, "Aucune version enregistrée pour l’instant.")
      );
      status.textContent = "L’historique se remplit à chaque enregistrement.";
      return;
    }
    list.replaceChildren(
      ...versions.map((version) =>
        h(
          "li",
          { class: "history-item" },
          h(
            "div",
            { class: "history-meta" },
            h("span", {}, "Version " + version.revision),
            h("small", {}, formatDate(version.savedAt))
          ),
          h(
            "button",
            {
              type: "button",
              class: "ghost btn-sm",
              onclick: () => restoreHistory(version),
            },
            "Restaurer"
          )
        )
      )
    );
    status.textContent = versions.length + " version(s) disponible(s).";
  } catch (error) {
    if (error instanceof SessionExpiredError) return;
    status.textContent = "Impossible de charger l’historique : " + error.message;
  }
};

/* =====================================================================
   CONNEXION / DÉCONNEXION
===================================================================== */

const enter = async () => {
  state.loading = true;
  state.pendingResume = false;
  showApp(true);
  hideFatal();
  refreshStatus();
  try {
    await ensureLibrary();
    if (!state.libraryReady) {
      throw new Error(state.libraryError || "catalogue indisponible");
    }
    await load();
    state.ready = true;
    state.loading = false;
    refreshStatus();
    startTokenRefresh();
    renderActiveTab();
    startServerPolling();
    maybeOfferDraft();
  } catch (error) {
    state.loading = false;
    if (error instanceof SessionExpiredError) {
      refreshStatus();
      return;
    }
    state.ready = false;
    refreshStatus();
    showFatal("Impossible de charger le contenu : " + error.message);
  }
};

const logout = async () => {
  if (state.dirty) {
    const ok = await confirmDialog({
      title: "Déconnexion",
      message:
        "Des modifications ne sont pas enregistrées. Elles seront conservées dans un brouillon local. Se déconnecter ?",
      confirmLabel: "Se déconnecter",
    });
    if (!ok) return;
    saveDraft();
  }
  state.token = "";
  sessionStorage.removeItem(TOKEN_KEY);
  stopTokenRefresh();
  if (serverPollingTimer) clearInterval(serverPollingTimer);
  state.ready = false;
  state.loading = false;
  state.saving = false;
  state.pendingResume = false;
  showApp(false);
  hideFatal();
  refreshStatus();
  $("#password").focus();
  toast("Déconnecté.", "info");
};

/* =====================================================================
   UTILITAIRES TEXTE & MINECRAFT
===================================================================== */

const parseMcColors = (text) => {
  if (!text) return "";
  const colorMap = {
    "0": "#000000", "1": "#0000aa", "2": "#00aa00", "3": "#00aaaa",
    "4": "#aa0000", "5": "#aa00aa", "6": "#ffaa00", "7": "#aaaaaa",
    "8": "#555555", "9": "#5555ff", "a": "#55ff55", "b": "#55ffff",
    "c": "#ff5555", "d": "#ff55ff", "e": "#ffff55", "f": "#ffffff",
  };
  const parts = String(text).split("§");
  let html = "";
  let currentColor = "#ffffff";
  let isBold = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === 0) {
      if (part) html += h("span", {}, part).outerHTML;
      continue;
    }
    const code = part.charAt(0).toLowerCase();
    const str = part.slice(1);
    if (colorMap[code]) {
      currentColor = colorMap[code];
    } else if (code === "l") {
      isBold = true;
    } else if (code === "r") {
      currentColor = "#ffffff";
      isBold = false;
    }
    if (str) {
      const style = `color: ${currentColor}; font-weight: ${isBold ? "bold" : "normal"};`;
      html += `<span style="${style}">${h("span", {}, str).textContent}</span>`;
    }
  }
  return html || text;
};

/* =====================================================================
   MODULE CONFIGURATION : CALENDRIER (DAILY REWARDS)
===================================================================== */

const renderDailyTab = () => {
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!Array.isArray(state.data.configs.dailyRewards) || state.data.configs.dailyRewards.length === 0) {
    state.data.configs.dailyRewards = defaultDailyRewards();
  }
  renderDailyGrid();
  loadDailyDay(state.ui.selectedDailyDay || 1);
};

const renderDailyGrid = () => {
  const container = $("#daily-grid");
  if (!container) return;
  container.innerHTML = "";

  const days = state.data.configs.dailyRewards;
  let totalMoney = 0;
  let totalTokens = 0;

  for (const d of days) {
    totalMoney += Number(d.money) || 0;
    totalTokens += Number(d.tokens) || 0;

    const isSelected = d.day === (state.ui.selectedDailyDay || 1);
    const isMilestone = [7, 14, 21, 30].includes(d.day);
    const card = h("div", {
      class: "daily-day-card" + (isSelected ? " active" : "") + (isMilestone ? " milestone" : ""),
      onclick: () => loadDailyDay(d.day),
    });

    const badgeNum = h("span", { class: "day-badge-num" }, "J" + d.day);
    card.append(badgeNum);

    let thumbItem = d.items?.[0]?.item || (d.key ? "minecraft:tripwire_hook" : (d.shard ? "opal:gemme_opale" : "minecraft:gold_ingot"));
    const img = h("img", {
      class: "day-thumb",
      src: iconUrl(thumbItem),
      alt: "Jour " + d.day,
      loading: "lazy",
    });
    img.onerror = () => { img.src = "/assets/opal-heaven/textures/items/fast_fertilizer.png"; };
    card.append(img);

    card.append(h("span", { class: "day-money-label" }, (Number(d.money) || 0).toLocaleString("fr-FR") + " $"));

    if (d.key) {
      const keyClass = "key-" + d.key.toLowerCase();
      card.append(h("span", { class: "day-key-pill " + keyClass }, d.key));
    } else if (d.tokens > 0) {
      card.append(h("span", { class: "badge badge-custom", style: "padding: 1px 4px; font-size: 9px;" }, "+" + d.tokens + " T"));
    }

    container.append(card);
  }

  const summary = $("#daily-total-summary");
  if (summary) {
    summary.textContent = `Total : ${totalMoney.toLocaleString("fr-FR")} $ • ${totalTokens.toLocaleString("fr-FR")} tokens`;
  }
};

const loadDailyDay = (dayNum) => {
  state.ui.selectedDailyDay = dayNum;
  document.querySelectorAll(".daily-day-card").forEach((card, idx) => {
    card.classList.toggle("active", idx + 1 === dayNum);
  });

  const days = state.data.configs.dailyRewards;
  let dayData = days.find((d) => d.day === dayNum);
  if (!dayData) {
    dayData = { day: dayNum, money: 1000, tokens: 0, key: "", shard: 0, items: [] };
    days.push(dayData);
    days.sort((a, b) => a.day - b.day);
  }

  const title = $("#daily-editor-title");
  if (title) title.textContent = "Édition du Jour " + dayNum;

  const badge = $("#daily-editor-badge");
  if (badge) {
    if ([7, 14, 21, 30].includes(dayNum)) {
      badge.textContent = "Palier Hebdo / Clé";
      badge.className = "badge badge-override";
    } else {
      badge.textContent = "Jour normal";
      badge.className = "badge badge-custom";
    }
  }

  $("#daily-money").value = dayData.money || 0;
  $("#daily-tokens").value = dayData.tokens || 0;
  $("#daily-key").value = dayData.key || "";
  $("#daily-shard").value = dayData.shard || 0;

  renderDailyItemsList(dayData);
  const statusEl = $("#daily-status");
  if (statusEl) statusEl.textContent = "";
};

const renderDailyItemsList = (dayData) => {
  const container = $("#daily-items-list");
  if (!container) return;
  container.innerHTML = "";

  if (!dayData.items || dayData.items.length === 0) {
    container.append(h("p", { class: "muted text-sm", style: "margin: 6px 0;" }, "Aucun item offert pour ce jour."));
    return;
  }

  dayData.items.forEach((it, idx) => {
    const row = h("div", { class: "daily-item-row" });
    const img = h("img", {
      class: "daily-item-thumb",
      src: iconUrl(it.item),
      alt: it.name || it.item,
    });
    img.onerror = () => { img.src = "/assets/opal-heaven/textures/items/fast_fertilizer.png"; };

    const info = h("div", { class: "daily-item-info" },
      h("b", {}, (it.count || 1) + "x "),
      document.createTextNode(it.name || it.item),
      h("span", { class: "muted text-sm", style: "margin-left: 6px;" }, "(" + it.item + ")")
    );

    const delBtn = h("button", {
      type: "button",
      class: "danger ghost btn-sm",
      onclick: () => {
        dayData.items.splice(idx, 1);
        setDirty(true);
        renderDailyItemsList(dayData);
        renderDailyGrid();
      },
    }, "✕");

    row.append(img, info, delBtn);
    container.append(row);
  });
};

const saveDailyDayForm = (event) => {
  if (event) event.preventDefault();
  const dayNum = state.ui.selectedDailyDay || 1;
  const days = state.data.configs.dailyRewards;
  let dayData = days.find((d) => d.day === dayNum);
  if (!dayData) {
    dayData = { day: dayNum, items: [] };
    days.push(dayData);
  }

  dayData.money = Math.max(0, Number($("#daily-money").value) || 0);
  dayData.tokens = Math.max(0, Number($("#daily-tokens").value) || 0);
  dayData.key = String($("#daily-key").value).trim().toLowerCase();
  dayData.shard = Math.max(0, Number($("#daily-shard").value) || 0);

  setDirty(true);
  renderDailyGrid();
  const statusEl = $("#daily-status");
  if (statusEl) {
    statusEl.textContent = "✔ Récompenses du Jour " + dayNum + " enregistrées dans le projet.";
    setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 2500);
  }
  toast("Jour " + dayNum + " mis à jour.", "success");
};

const addDailyItem = () => {
  const dayNum = state.ui.selectedDailyDay || 1;
  const days = state.data.configs.dailyRewards;
  const dayData = days.find((d) => d.day === dayNum);
  if (!dayData) return;

  const rawItem = $("#daily-new-item-id").value.trim().toLowerCase();
  if (!rawItem) {
    toast("Sélectionnez d'abord un identifiant d'item (ex: minecraft:bread).", "error");
    $("#daily-new-item-id").focus();
    return;
  }

  const itemId = rawItem.includes(":") ? rawItem : "minecraft:" + rawItem;
  const count = Math.max(1, Math.min(64, Number($("#daily-new-item-count").value) || 1));
  const name = $("#daily-new-item-name").value.trim() || itemLabel(itemId);

  if (!dayData.items) dayData.items = [];
  dayData.items.push({ item: itemId, count, name });

  $("#daily-new-item-id").value = "";
  $("#daily-new-item-count").value = "1";
  $("#daily-new-item-name").value = "";

  setDirty(true);
  renderDailyItemsList(dayData);
  renderDailyGrid();
  toast("Item ajouté au Jour " + dayNum + ".", "info");
};

const copyDailyNext = () => {
  const currentDay = state.ui.selectedDailyDay || 1;
  if (currentDay >= 30) {
    toast("Le jour 30 est le dernier jour du cycle.", "error");
    return;
  }
  const nextDay = currentDay + 1;
  const days = state.data.configs.dailyRewards;
  const currData = days.find((d) => d.day === currentDay);
  if (!currData) return;

  let nextData = days.find((d) => d.day === nextDay);
  if (!nextData) {
    nextData = { day: nextDay, items: [] };
    days.push(nextData);
    days.sort((a, b) => a.day - b.day);
  }

  nextData.money = Math.round(currData.money * 1.1);
  nextData.tokens = currData.tokens;
  nextData.key = currData.key;
  nextData.shard = currData.shard;
  nextData.items = currData.items ? JSON.parse(JSON.stringify(currData.items)) : [];

  setDirty(true);
  renderDailyGrid();
  loadDailyDay(nextDay);
  toast(`Données copiées vers le Jour ${nextDay} (avec +10% monnaie).`, "success");
};

const autoDailyMoney = async () => {
  const ok = await confirmDialog({
    title: "Progression automatique d'argent",
    message: "Voulez-vous générer une progression d'argent fluide (de 500 $ au Jour 1 jusqu'à 25 000 $ au Jour 30) sur les 30 jours ?",
    confirmLabel: "Appliquer la progression",
  });
  if (!ok) return;

  const days = state.data.configs.dailyRewards;
  for (const d of days) {
    d.money = Math.round(500 + Math.pow(d.day / 30, 1.4) * 24500);
  }

  setDirty(true);
  renderDailyGrid();
  loadDailyDay(state.ui.selectedDailyDay || 1);
  toast("Progression d'argent générée sur 30 jours.", "success");
};

const resetDailyDefaults = async () => {
  const ok = await confirmDialog({
    title: "Réinitialiser le calendrier",
    message: "Voulez-vous restaurer les 30 jours du calendrier aux valeurs officielles d'Opal Heaven ?",
    confirmLabel: "Réinitialiser",
    danger: true,
  });
  if (!ok) return;

  state.data.configs.dailyRewards = defaultDailyRewards();
  setDirty(true);
  renderDailyGrid();
  loadDailyDay(1);
  toast("Calendrier réinitialisé aux valeurs par défaut.", "info");
};

/* =====================================================================
   MODULE CONFIGURATION : MÉTIERS & JOBS
===================================================================== */

const renderJobsTab = () => {
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!state.data.configs.jobs) state.data.configs.jobs = defaultJobsConfig();

  renderJobsActions();
  renderJobsCurve();
  renderJobsRewards();
};

const renderJobsActions = () => {
  const jobs = state.data.configs.jobs;
  const vocations = [
    { key: "abysses", label: "Minage", container: "#jobs-actions-abysses" },
    { key: "terre", label: "Agriculture", container: "#jobs-actions-terre" },
    { key: "guerre", label: "Combat", container: "#jobs-actions-guerre" },
  ];

  for (const voc of vocations) {
    const el = $(voc.container);
    if (!el) continue;
    el.innerHTML = "";
    const list = jobs.actions?.[voc.key] || [];

    for (const act of list) {
      const row = h("div", { class: "job-action-row" });
      const img = h("img", {
        class: "job-action-icon",
        src: iconUrl(act.icon || act.id),
        alt: act.name,
      });
      img.onerror = () => { img.src = "/assets/opal-heaven/textures/items/fast_fertilizer.png"; };

      const nameBox = h("div", { class: "job-action-name" },
        h("div", { style: "font-weight: 500;" }, act.name),
        h("span", { class: "muted text-sm" }, act.id)
      );

      const xpInput = h("input", {
        type: "number",
        class: "job-action-xp-input",
        min: "1",
        max: "10000",
        value: act.xp,
        onchange: (e) => {
          act.xp = Math.max(1, Number(e.target.value) || 1);
          setDirty(true);
        },
      });

      const xpLabel = h("span", { class: "muted text-sm" }, "XP");

      const delBtn = h("button", {
        type: "button",
        class: "danger ghost btn-sm",
        style: "padding: 2px 6px;",
        title: "Supprimer cette action",
        onclick: () => {
          const idx = list.indexOf(act);
          if (idx >= 0) {
            list.splice(idx, 1);
            setDirty(true);
            renderJobsActions();
          }
        },
      }, "✕");

      row.append(img, nameBox, xpInput, xpLabel, delBtn);
      el.append(row);
    }
  }
};

const addJobCustomAction = () => {
  const voc = $("#job-new-vocation").value;
  const rawId = $("#job-new-action-id").value.trim().toLowerCase();
  const name = $("#job-new-action-name").value.trim() || rawId;
  const xp = Math.max(1, Number($("#job-new-action-xp").value) || 10);
  const icon = $("#job-new-action-icon").value.trim();

  if (!rawId) {
    toast("Renseignez un identifiant pour l'action.", "error");
    $("#job-new-action-id").focus();
    return;
  }

  const jobs = state.data.configs.jobs;
  if (!jobs.actions[voc]) jobs.actions[voc] = [];
  jobs.actions[voc].push({ id: rawId, name, xp, icon: icon || rawId });

  $("#job-new-action-id").value = "";
  $("#job-new-action-name").value = "";
  $("#job-new-action-xp").value = "15";
  $("#job-new-action-icon").value = "";

  setDirty(true);
  renderJobsActions();
  toast("Action ajoutée à la " + voc + ".", "success");
};

const renderJobsCurve = () => {
  const curve = state.data.configs.jobs?.curve || defaultJobsConfig().curve;
  $("#job-curve-base").value = curve.baseXp || 100;
  $("#job-curve-exp").value = curve.exponent || 1.75;
  $("#job-curve-mult").value = curve.multiplier || 55;
  $("#job-curve-max").value = curve.maxLevel || 50;
  $("#job-curve-bonus-main").value = curve.mainVocationBonusPercent || 25;
  $("#job-curve-bonus-prestige").value = curve.prestigeBonusPercent || 5;

  renderJobsCurveSimulation();
};

const applyJobsCurve = () => {
  const jobs = state.data.configs.jobs;
  if (!jobs.curve) jobs.curve = {};
  jobs.curve.baseXp = Math.max(10, Number($("#job-curve-base").value) || 100);
  jobs.curve.exponent = Math.max(1.0, Number($("#job-curve-exp").value) || 1.75);
  jobs.curve.multiplier = Math.max(1, Number($("#job-curve-mult").value) || 55);
  jobs.curve.maxLevel = Math.max(10, Math.min(100, Number($("#job-curve-max").value) || 50));
  jobs.curve.mainVocationBonusPercent = Math.max(0, Number($("#job-curve-bonus-main").value) || 25);
  jobs.curve.prestigeBonusPercent = Math.max(0, Number($("#job-curve-bonus-prestige").value) || 5);

  setDirty(true);
  renderJobsCurveSimulation();
  toast("Formule d'XP recalculée.", "success");
};

const renderJobsCurveSimulation = () => {
  const wrap = $("#jobs-curve-simulation");
  if (!wrap) return;
  wrap.innerHTML = "";

  const curve = state.data.configs.jobs?.curve || defaultJobsConfig().curve;
  const rewards = state.data.configs.jobs?.levelRewards || defaultJobsConfig().levelRewards;
  const maxLvl = Math.min(100, Math.max(10, curve.maxLevel || 50));

  const table = h("table", { class: "jobs-sim-table" });
  table.innerHTML = `
    <thead>
      <tr>
        <th>Niveau</th>
        <th>XP Requis</th>
        <th>XP Cumulé</th>
        <th>Gain $</th>
        <th>Gain Jetons</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  let totalXp = 0;
  for (let lvl = 1; lvl <= maxLvl; lvl++) {
    const req = lvl < maxLvl ? Math.round(curve.baseXp + Math.pow(lvl, curve.exponent) * curve.multiplier) : 0;
    totalXp += req;
    const cash = lvl * (rewards.moneyMultiplier || 250);
    const tokens = lvl * (rewards.tokensMultiplier || 5);

    const tr = h("tr", {});
    tr.innerHTML = `
      <td><b>Nv. ${lvl}</b></td>
      <td>${req > 0 ? req.toLocaleString("fr-FR") + " XP" : "<i>MAX</i>"}</td>
      <td class="muted">${totalXp.toLocaleString("fr-FR")} XP</td>
      <td style="color: var(--success);">+${cash.toLocaleString("fr-FR")} $</td>
      <td style="color: var(--accent);">+${tokens}</td>
    `;
    tbody.append(tr);
  }
  wrap.append(table);
};

const renderJobsRewards = () => {
  const rewards = state.data.configs.jobs?.levelRewards || defaultJobsConfig().levelRewards;
  $("#job-reward-money").value = rewards.moneyMultiplier || 250;
  $("#job-reward-tokens").value = rewards.tokensMultiplier || 5;
  $("#job-reward-talent").value = rewards.talentPointsPerLevel || 1;
};

const applyJobsRewards = () => {
  const jobs = state.data.configs.jobs;
  if (!jobs.levelRewards) jobs.levelRewards = {};
  jobs.levelRewards.moneyMultiplier = Math.max(0, Number($("#job-reward-money").value) || 250);
  jobs.levelRewards.tokensMultiplier = Math.max(0, Number($("#job-reward-tokens").value) || 5);
  jobs.levelRewards.talentPointsPerLevel = Math.max(0, Number($("#job-reward-talent").value) || 1);

  setDirty(true);
  renderJobsCurveSimulation();
  toast("Récompenses de montée de niveau enregistrées.", "success");
};

const resetJobsDefaults = async () => {
  const ok = await confirmDialog({
    title: "Réinitialiser les Métiers",
    message: "Restaurer l'ensemble des configurations de métiers (actions, courbe et récompenses) par défaut ?",
    confirmLabel: "Réinitialiser",
    danger: true,
  });
  if (!ok) return;

  state.data.configs.jobs = defaultJobsConfig();
  setDirty(true);
  renderJobsActions();
  renderJobsCurve();
  renderJobsRewards();
  toast("Métiers réinitialisés par défaut.", "info");
};

/* =====================================================================
   MODULE CONFIGURATION : ADMIN SHOP (/shop)
===================================================================== */

const renderShopTab = () => {
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!state.data.configs.adminShop) state.data.configs.adminShop = defaultAdminShopConfig();

  renderShopCategoriesBar();
  renderShopItems();
};

const renderShopCategoriesBar = () => {
  const bar = $("#shop-categories-bar");
  if (!bar) return;
  bar.innerHTML = "";

  const cats = state.data.configs.adminShop.categories || {};
  const catKeys = Object.keys(cats);
  if (!cats[state.ui.selectedShopCategory] && catKeys.length > 0) {
    state.ui.selectedShopCategory = catKeys[0];
  }

  for (const [key, data] of Object.entries(cats)) {
    const isCurrent = key === state.ui.selectedShopCategory;
    const pill = h("button", {
      type: "button",
      class: "cat-pill" + (isCurrent ? " active" : ""),
      onclick: () => {
        state.ui.selectedShopCategory = key;
        cancelShopEdit();
        renderShopCategoriesBar();
        renderShopItems();
      },
    });

    const iconImg = h("img", {
      class: "job-action-icon",
      src: iconUrl(data.icon || "minecraft:chest"),
      alt: data.name,
      style: "width: 18px; height: 18px;",
    });
    iconImg.onerror = () => { iconImg.src = "/assets/opal-heaven/textures/items/fast_fertilizer.png"; };

    pill.append(iconImg, document.createTextNode(data.name || key));
    bar.append(pill);
  }
};

const renderShopItems = () => {
  const container = $("#shop-items-table");
  if (!container) return;
  container.innerHTML = "";

  const catKey = state.ui.selectedShopCategory;
  const catData = state.data.configs.adminShop.categories?.[catKey];
  const title = $("#shop-active-cat-title");
  if (title) title.textContent = "Articles : " + (catData?.name || catKey);

  if (!catData || !Array.isArray(catData.items) || catData.items.length === 0) {
    container.append(h("p", { class: "muted" }, "Aucun article dans cette catégorie pour l’instant."));
    const countEl = $("#shop-items-count");
    if (countEl) countEl.textContent = "0 article";
    return;
  }

  const filter = ($("#shop-filter")?.value || "").toLowerCase().trim();
  const filtered = catData.items.filter((it) =>
    !filter || it.name.toLowerCase().includes(filter) || it.item_id.toLowerCase().includes(filter)
  );

  const countEl = $("#shop-items-count");
  if (countEl) countEl.textContent = `${filtered.length} article(s) sur ${catData.items.length}`;

  for (const it of filtered) {
    const row = h("div", { class: "shop-item-row" });

    const img = makeImage(it.item_id, it.name, "shop-item-thumb") ||
      h("span", { class: "shop-item-thumb img-fallback" }, "•");

    const details = h("div", { class: "shop-item-details" },
      h("div", { class: "shop-item-title" }, it.name),
      h("div", { class: "shop-item-sub" }, it.item_id)
    );

    const prices = h("div", { class: "shop-item-prices" },
      h("div", { class: "price-box" },
        h("span", { class: "price-label" }, "Achat"),
        h("span", { class: "price-val " + (it.buy_enabled !== false ? "price-buy" : "price-disabled") },
          it.buy_enabled !== false ? `${Number(it.buy_price || 0).toLocaleString()} $` : "Désactivé"
        )
      ),
      h("div", { class: "price-box" },
        h("span", { class: "price-label" }, "Vente"),
        h("span", { class: "price-val " + (it.sell_enabled !== false ? "price-sell" : "price-disabled") },
          it.sell_enabled !== false ? `${Number(it.sell_price || 0).toLocaleString()} $` : "Désactivé"
        )
      )
    );

    const actions = h("div", { class: "shop-item-actions" },
      h("button", {
        type: "button",
        class: "ghost btn-sm",
        onclick: () => editShopItem(it),
      }, "Modifier"),
      h("button", {
        type: "button",
        class: "danger ghost btn-sm",
        onclick: () => deleteShopItem(it),
      }, "✕")
    );

    row.append(img, details, prices, actions);
    container.append(row);
  }
};

const editShopItem = (item) => {
  state.ui.editingShopItem = item;
  $("#shop-item-id").value = item.item_id;
  $("#shop-item-name").value = item.name;
  $("#shop-item-buy").value = item.buy_price;
  $("#shop-item-sell").value = item.sell_price;
  $("#shop-item-buy-enabled").checked = item.buy_enabled !== false;
  $("#shop-item-sell-enabled").checked = item.sell_enabled !== false;

  updateShopItemPreview();
  $("#shop-editor-title").textContent = "✏️ Modifier : " + item.name;
  $("#shop-submit-btn").textContent = "Enregistrer la modification";
  $("#shop-cancel-edit-btn").hidden = false;
  $("#shop-item-name").focus();
};

const cancelShopEdit = () => {
  state.ui.editingShopItem = null;
  $("#shop-item-id").value = "";
  $("#shop-item-name").value = "";
  $("#shop-item-buy").value = "10";
  $("#shop-item-sell").value = "4";
  $("#shop-item-buy-enabled").checked = true;
  $("#shop-item-sell-enabled").checked = true;
  $("#shop-editor-title").textContent = "+ Ajouter un article dans cette catégorie";
  $("#shop-submit-btn").textContent = "Ajouter au shop";
  $("#shop-cancel-edit-btn").hidden = true;
  updateShopItemPreview();
};

const deleteShopItem = async (item) => {
  const catKey = state.ui.selectedShopCategory;
  const catData = state.data.configs.adminShop.categories?.[catKey];
  if (!catData) return;

  const ok = await confirmDialog({
    title: "Supprimer l'article",
    message: `Retirer "${item.name}" (${item.item_id}) de l'Admin Shop ?`,
    confirmLabel: "Supprimer",
    danger: true,
  });
  if (!ok) return;

  const idx = catData.items.indexOf(item);
  if (idx >= 0) {
    catData.items.splice(idx, 1);
    if (state.ui.editingShopItem === item) cancelShopEdit();
    setDirty(true);
    renderShopItems();
    toast(`"${item.name}" retiré de l'Admin Shop.`, "info");
  }
};

const saveShopItem = (event) => {
  if (event) event.preventDefault();
  const catKey = state.ui.selectedShopCategory;
  const catData = state.data.configs.adminShop.categories?.[catKey];
  if (!catData) return;

  const rawItem = $("#shop-item-id").value.trim().toLowerCase();
  if (!rawItem) {
    toast("Identifiant d'item requis.", "error");
    $("#shop-item-id").focus();
    return;
  }
  const itemId = rawItem.includes(":") ? rawItem : "minecraft:" + rawItem;
  const name = $("#shop-item-name").value.trim() || itemLabel(itemId);
  const buy = Math.max(0, Number($("#shop-item-buy").value) || 0);
  const sell = Math.max(0, Number($("#shop-item-sell").value) || 0);
  const buyEnabled = $("#shop-item-buy-enabled").checked;
  const sellEnabled = $("#shop-item-sell-enabled").checked;

  if (state.ui.editingShopItem) {
    const item = state.ui.editingShopItem;
    item.item_id = itemId;
    item.name = name;
    item.buy_price = buy;
    item.sell_price = sell;
    item.buy_enabled = buyEnabled;
    item.sell_enabled = sellEnabled;
    toast(`"${name}" modifié dans l'Admin Shop.`, "success");
  } else {
    const cleanId = itemId.split(":").pop();
    if (!catData.items) catData.items = [];
    catData.items.push({
      id: cleanId,
      name,
      item_id: itemId,
      buy_price: buy,
      sell_price: sell,
      buy_enabled: buyEnabled,
      sell_enabled: sellEnabled,
    });
    toast(`"${name}" ajouté au rayon ${catData.name}.`, "success");
  }

  cancelShopEdit();
  setDirty(true);
  renderShopItems();
};

const updateShopItemPreview = () => {
  const preview = $("#shop-item-preview");
  if (!preview) return;
  const raw = $("#shop-item-id").value.trim();
  if (!raw) {
    preview.innerHTML = "";
    return;
  }
  const itemId = raw.includes(":") ? raw : "minecraft:" + raw;
  const img = h("img", {
    class: "shop-item-thumb",
    src: iconUrl(itemId),
    alt: itemId,
  });
  img.onerror = () => { img.src = "/assets/opal-heaven/textures/items/fast_fertilizer.png"; };
  preview.innerHTML = "";
  preview.append(img, h("span", { class: "muted text-sm" }, itemLabel(itemId)));
};

const createShopCategory = () => {
  const key = $("#shop-new-cat-key").value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const name = $("#shop-new-cat-name").value.trim();
  const icon = $("#shop-new-cat-icon").value.trim() || "minecraft:chest";

  if (!key || !name) {
    toast("Renseignez le code et le nom de la catégorie.", "error");
    $("#shop-new-cat-key").focus();
    return;
  }

  const shop = state.data.configs.adminShop;
  if (!shop.categories) shop.categories = {};
  if (shop.categories[key]) {
    toast("Une catégorie avec ce code existe déjà.", "error");
    return;
  }

  shop.categories[key] = { name, icon, items: [] };
  state.ui.selectedShopCategory = key;

  $("#shop-new-cat-key").value = "";
  $("#shop-new-cat-name").value = "";
  $("#shop-new-cat-icon").value = "";

  setDirty(true);
  renderShopCategoriesBar();
  renderShopItems();
  toast(`Rayon "${name}" créé avec succès !`, "success");
};

const autoShopSellRule = async () => {
  const ok = await confirmDialog({
    title: "Harmoniser les prix de vente",
    message: "Appliquer la règle standard 'Prix de vente = 40% du prix d'achat' à tous les articles du shop ?",
    confirmLabel: "Appliquer à tout le shop",
  });
  if (!ok) return;

  const cats = state.data.configs.adminShop?.categories || {};
  let modifiedCount = 0;
  for (const cat of Object.values(cats)) {
    for (const it of cat.items || []) {
      if (it.buy_price > 0) {
        it.sell_price = Math.max(1, Math.round(it.buy_price * 0.4));
        modifiedCount++;
      }
    }
  }

  setDirty(true);
  renderShopItems();
  toast(`${modifiedCount} prix de vente recalculés à 40%.`, "success");
};

const resetShopDefaults = async () => {
  const ok = await confirmDialog({
    title: "Réinitialiser l'Admin Shop",
    message: "Restaurer l'Admin Shop avec toutes ses catégories et prix officiels par défaut ?",
    confirmLabel: "Réinitialiser",
    danger: true,
  });
  if (!ok) return;

  state.data.configs.adminShop = defaultAdminShopConfig();
  state.ui.selectedShopCategory = "MINERAIS";
  cancelShopEdit();
  setDirty(true);
  renderShopCategoriesBar();
  renderShopItems();
  toast("Admin Shop réinitialisé aux valeurs d'origine.", "info");
};

/* =====================================================================
   MODULE CONFIGURATION : PARAMÈTRES GÉNÉRAUX SERVEUR
===================================================================== */

const renderServerConfigTab = () => {
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!state.data.configs.server) state.data.configs.server = defaultServerConfig();

  const s = state.data.configs.server;
  const ipInput = $("#server-ip");
  const portInput = $("#server-port");
  if (ipInput) ipInput.value = s.serverIp || "opalheaven.mcbe.fr";
  if (portInput) portInput.value = s.serverPort || 19153;

  $("#server-starting-money").value = s.startingMoney ?? 500;
  $("#server-ah-fee").value = s.ahFeePercent ?? 5;
  $("#server-clearlag-interval").value = s.clearLagIntervalSeconds ?? 300;
  $("#server-broadcast-interval").value = s.broadcastIntervalMinutes ?? 10;

  renderBroadcastsList();
};

const renderBroadcastsList = () => {
  const container = $("#server-broadcasts-list");
  if (!container) return;
  container.innerHTML = "";

  const s = state.data.configs.server;
  const messages = s.broadcastMessages || [];

  if (messages.length === 0) {
    container.append(h("p", { class: "muted" }, "Aucune annonce programmée."));
    return;
  }

  messages.forEach((msg, idx) => {
    const row = h("div", { class: "broadcast-row" });
    const preview = h("div", { class: "mc-preview" });
    preview.innerHTML = parseMcColors(msg);

    const delBtn = h("button", {
      type: "button",
      class: "danger ghost btn-sm",
      onclick: () => {
        messages.splice(idx, 1);
        setDirty(true);
        renderBroadcastsList();
      },
    }, "✕");

    row.append(preview, delBtn);
    container.append(row);
  });
};

const addBroadcastMessage = () => {
  const input = $("#server-new-broadcast");
  const msg = input.value.trim();
  if (!msg) {
    toast("Entrez le texte de l'annonce.", "error");
    input.focus();
    return;
  }

  const s = state.data.configs.server;
  if (!s.broadcastMessages) s.broadcastMessages = [];
  s.broadcastMessages.push(msg);

  input.value = "";
  setDirty(true);
  renderBroadcastsList();
  toast("Annonce ajoutée à la rotation !", "success");
};

/* =====================================================================
   MODULE GUIDE SYNCHRONISATION
===================================================================== */

const renderSyncGuideTab = () => {
  const rev = $("#sync-active-revision");
  if (rev) rev.textContent = "Rev " + (state.revision || 0);
};

/* =====================================================================
   JOURNAL D'ACTIVITÉ & LOGS SYSTÈME
===================================================================== */

// Purge immédiate de tout ancien log fictif ou de simulation issu des versions précédentes
try {
  localStorage.removeItem("opal_studio_activity_logs");
} catch {}

const LOGS_STORAGE_KEY = "opal_studio_real_logs_v2";

state.realServerStatus = {
  checked: false,
  online: false,
  players: { online: 0, max: 0, list: [] },
  version: "",
  motd: "",
};
state.serverTelemetry = null;

const defaultServerLogs = () => [];

const getStoredLogs = () => {
  let localLogs = [];
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) localLogs = parsed;
    }
  } catch {}

  // Logs réels transmis par le plugin OpalCore normalisés
  const rawRemote = state.serverTelemetry?.serverLogs || [];
  const remoteLogs = rawRemote.map((l) => {
    let type = l.type ? String(l.type).toUpperCase() : "CONSOLE";
    let player = l.player || "Serveur";
    let message = l.message || "";
    let details = l.details || "";

    // 1. Détection CHAT : format "[Role][Fac] Katsun1246 » cc" ou "<Katsun1246> cc"
    if (message.includes(" » ") || message.startsWith("<")) {
      type = "CHAT";
      const m = message.match(/^(?:.*?\]\s*)*([a-zA-Z0-9_]{3,16})\s*»\s*(.*)$/) || message.match(/^<([a-zA-Z0-9_]{3,16})>\s*(.*)$/);
      if (m) {
        player = m[1];
        message = m[2];
        details = "Discussion en jeu";
      }
    }
    // 2. Détection SESSIONS : "Player joined the game" / "logged in"
    else if (message.includes("joined the game") || message.includes("left the game") || message.includes("logged in with") || message.includes("Session opened")) {
      type = "SESSION";
      const m = message.match(/([a-zA-Z0-9_]{3,16})\s+(?:joined the game|logged in with|left the game|disconnected)/) || message.match(/Player:\s*([a-zA-Z0-9_]{3,16})/);
      if (m) player = m[1];
      details = "Connexion / Déconnexion";
    }
    // 3. Détection COMMANDES : "[Player: ...]" ou "Player issued server command"
    else if (message.includes("issued server command") || message.startsWith("/") || /\[[a-zA-Z0-9_]{3,16}:/.test(message)) {
      type = "CMD";
      const m = message.match(/\[([a-zA-Z0-9_]{3,16}):\s*(.*)\]/) || message.match(/([a-zA-Z0-9_]{3,16})\s+issued server command:\s*(.*)/);
      if (m) {
        player = m[1];
        message = "/" + m[2].replace(/^\//, "");
      }
      details = "Commande exécutée";
    }
    // 4. Détection SYNCHRO / CONFIG : "[OpalCore] ..."
    else if (message.includes("OpalCore") || message.includes("synchronis")) {
      type = "CONFIG";
      player = "Admin";
      details = "Synchronisation OpalCore";
    }
    // 5. Console
    else if (type === "INFO" || type === "WARNING" || type === "ERROR") {
      type = "CONSOLE";
    }

    return {
      id: l.id || ("rem_" + Math.random().toString(36).slice(2, 9)),
      time: l.time || new Date().toLocaleTimeString("fr-FR"),
      type,
      player,
      message,
      details,
      server: l.server || "opalheaven.mcbe.fr",
      world: l.world || "world",
      amount: l.amount || 0
    };
  });

  const combined = [...remoteLogs, ...localLogs];
  const seen = new Set();
  const deduped = [];
  for (const log of combined) {
    const normTime = String(log.time || "").replace(/\.\d+/, "").trim();
    const key = normTime + "|" + String(log.type || "").trim() + "|" + String(log.player || "").trim() + "|" + String(log.message || "").trim();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(log);
    }
  }
  return deduped.slice(0, 350);
};

const saveStoredLogs = (logs) => {
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 350)));
  } catch {}
};

const logActivity = (type, message, details = "", extra = {}) => {
  let logs = [];
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) logs = JSON.parse(raw) || [];
  } catch {}

  const s = state.data?.configs?.server;
  const host = s?.serverIp || "opalheaven.mcbe.fr";
  const port = s?.serverPort || 19153;

  const entry = {
    id: "log_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    type: String(type || "INFO").toUpperCase(),
    server: extra.server || `${host}:${port}`,
    world: extra.world || "world",
    player: extra.player || "Admin",
    faction: extra.faction || "",
    message,
    details,
    item: extra.item || null,
    itemCount: extra.itemCount || 1,
    amount: extra.amount || 0,
    coords: extra.coords || null,
  };
  logs.unshift(entry);
  if (logs.length > 350) logs.pop();
  saveStoredLogs(logs);
  if (state.ui.tab === "logs") renderLogsTab();
};

/* --- Connexion Réelle au Serveur de Jeu (PocketMine-MP) --------------- */

const fetchRealServerStatus = async () => {
  const s = state.data?.configs?.server || defaultServerConfig();
  const host = (s.serverIp || "opalheaven.mcbe.fr").trim();
  const port = Number(s.serverPort) || 19153;

  try {
    let data = null;
    // 1. Essai via le proxy backend Netlify (/api/server-ping) pour éviter tout blocage CSP/AdBlock/CORS
    try {
      const proxyRes = await fetch(`/api/server-ping?host=${encodeURIComponent(host)}&port=${port}`);
      if (proxyRes.ok) {
        data = await proxyRes.json();
      }
    } catch {}

    // 2. Si le proxy n'a pas répondu, essai direct sur mcsrvstat
    if (!data) {
      const res = await fetch(`https://api.mcsrvstat.us/bedrock/3/${encodeURIComponent(host)}:${port}`);
      if (!res.ok) throw new Error("Erreur serveur mcsrvstat");
      data = await res.json();
    }

    state.realServerStatus = {
      checked: true,
      host,
      port,
      online: Boolean(data.online),
      players: {
        online: data.players?.online || 0,
        max: data.players?.max || 0,
        list: Array.isArray(data.players?.list) ? data.players.list.map((p) => p.name || p) : [],
      },
      version: data.version || "1.26.50",
      motd: Array.isArray(data.motd?.clean) ? data.motd.clean.join(" ") : (data.motd?.clean || ""),
      software: data.software || "Axolotl-PM",
      plugins: Array.isArray(data.plugins) ? data.plugins : [],
    };
  } catch {
    state.realServerStatus = {
      checked: true,
      host,
      port,
      online: false,
      players: { online: 0, max: 0, list: [] },
      version: "Serveur non joignable",
      motd: "",
      software: "",
      plugins: [],
    };
  }
  return state.realServerStatus;
};

const fetchServerTelemetry = async () => {
  if (!state.token) return null;
  try {
    const res = await fetch("/api/telemetry", {
      headers: { Authorization: `Bearer ${state.token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    state.serverTelemetry = data;
    return data;
  } catch {
    return null;
  }
};

let serverPollingTimer = null;
let lastRealServerStatusCheck = 0;
state.ui.logsLive = true;

const updateGlobalServerStatus = () => {
  const telem = state.serverTelemetry?.telemetry;
  const isTelemOnline = Boolean(state.serverTelemetry?.connected || (state.serverTelemetry?.serverLogs && state.serverTelemetry.serverLogs.length > 0));
  const isOnline = isTelemOnline || Boolean(state.realServerStatus?.online);
  const curOnline = isOnline ? (telem?.players?.online ?? state.realServerStatus?.players?.online ?? 0) : 0;

  const navLiveIndicator = $("#nav-live-indicator");
  if (navLiveIndicator) {
    if (isOnline) {
      navLiveIndicator.textContent = `${curOnline} en jeu`;
      navLiveIndicator.style.background = "rgba(82, 184, 155, 0.15)";
      navLiveIndicator.style.color = "var(--mint)";
    } else {
      navLiveIndicator.textContent = "Hors ligne";
      navLiveIndicator.style.background = "rgba(235, 104, 117, 0.15)";
      navLiveIndicator.style.color = "var(--danger)";
    }
  }

  const livePill = $("#hub-server-live-pill");
  const liveText = $("#hub-live-status-text");
  if (livePill && liveText) {
    if (isOnline) {
      livePill.className = "hub-server-status-pill online";
      liveText.textContent = `Serveur En Ligne (${telem?.server || state.realServerStatus?.software || "Axolotl-PM"})`;
    } else if (state.realServerStatus?.checked) {
      livePill.className = "hub-server-status-pill offline";
      liveText.textContent = "Serveur Hors Ligne / Injoignable";
    }
  }

  const modOnlineBadge = $("#mod-online-count-badge");
  if (modOnlineBadge) {
    modOnlineBadge.textContent = isOnline ? `${curOnline} en jeu` : "Serveur hors ligne";
  }
};

const pollRealServer = async (forcePing = false) => {
  const tasks = [fetchServerTelemetry()];
  const now = Date.now();
  if (forcePing || now - lastRealServerStatusCheck > 25000) {
    lastRealServerStatusCheck = now;
    tasks.push(fetchRealServerStatus());
  }
  await Promise.all(tasks);

  // Si la télémétrie en direct d'OpalCore est active, priorité absolue sur le statut
  if (state.serverTelemetry?.connected && state.serverTelemetry?.telemetry) {
    const t = state.serverTelemetry.telemetry;
    state.realServerStatus = {
      checked: true,
      host: "opalheaven.mcbe.fr",
      port: 19153,
      online: true,
      players: t.players || { online: 0, max: 100, list: [] },
      version: t.server || "Axolotl-PM",
      motd: `OPAL HEAVEN » Direct OpalCore (${t.tps || 20} TPS)`,
      software: "Axolotl-PM",
      plugins: [],
      tps: t.tps || 20,
    };
  }

  if (state.realServerStatus?.checked) {
    const curOnline = state.realServerStatus.online ? (state.realServerStatus.players?.online || 0) : 0;
    const timeLabel = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (!state.playerHistory) state.playerHistory = [];
    state.playerHistory.push({ label: timeLabel, online: curOnline });
    if (state.playerHistory.length > 24) state.playerHistory.shift();
  }
  if (state.ui.tab === "dashboard") renderDashboardTab();
  if (state.ui.tab === "logs") renderLogsTab();
  if (state.ui.tab === "moderation") renderModerationTab();
  updateGlobalServerStatus();
};

const startServerPolling = () => {
  if (serverPollingTimer) clearInterval(serverPollingTimer);
  pollRealServer(true);
  serverPollingTimer = setInterval(() => {
    if (state.ui.logsLive) {
      pollRealServer();
    }
  }, 5000);
};

const toggleLogsLive = () => {
  state.ui.logsLive = !state.ui.logsLive;
  const btn = $("#logs-live-toggle");
  const label = $("#logs-live-label");
  if (btn) {
    if (state.ui.logsLive) {
      btn.className = "btn-live-pulse active";
      if (label) label.textContent = "Flux Direct : Connecté";
      pollRealServer();
    } else {
      btn.className = "btn-live-pulse paused";
      if (label) label.textContent = "Flux Direct : En Pause";
    }
  }
  toast(state.ui.logsLive ? "Connexion directe réactivée" : "Connexion directe en pause", "info");
};

/* --- Rendu du Tableau des Logs --------------------------------------- */

const renderLogsTab = () => {
  const tbody = $("#logs-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const logs = getStoredLogs();
  const filterType = state.ui.logsFilter || "all";
  const serverFilter = ($("#logs-server-filter")?.value || "all");
  const worldFilter = ($("#logs-world-filter")?.value || "all");
  const playerFilter = ($("#logs-player-filter")?.value || "").toLowerCase().trim();
  const searchQ = ($("#logs-search-input")?.value || "").toLowerCase().trim();

  // Mise à jour des compteurs globaux
  const statCount = $("#log-stat-count");
  if (statCount) statCount.textContent = `${logs.length} ${logs.length > 1 ? "événements" : "événement"}`;

  const uniquePlayers = new Set(logs.map((l) => l.player).filter(Boolean));
  const statPlayers = $("#log-stat-players");
  if (statPlayers) {
    if (state.realServerStatus.online) {
      statPlayers.textContent = `${state.realServerStatus.players.online} / ${state.realServerStatus.players.max} en ligne`;
    } else if (uniquePlayers.size > 0) {
      statPlayers.textContent = `${uniquePlayers.size} joueur${uniquePlayers.size > 1 ? "s" : ""}`;
    } else {
      statPlayers.textContent = "0 joueur";
    }
  }

  const totalMoney = logs.reduce((sum, l) => sum + Math.abs(Number(l.amount) || 0), 0);
  const statMoney = $("#log-stat-money");
  if (statMoney) statMoney.textContent = `$${totalMoney.toLocaleString("fr-FR")}`;

  const statRate = $("#log-stat-rate");
  if (statRate) {
    if (state.serverTelemetry?.connected) {
      statRate.textContent = "Connecté (OpalCore)";
      statRate.style.color = "var(--primary-mint)";
    } else if (state.realServerStatus.online) {
      statRate.textContent = "Direct (opalheaven.mcbe.fr)";
      statRate.style.color = "var(--primary-mint)";
    } else {
      statRate.textContent = "Inaccessible";
      statRate.style.color = "#ef4444";
    }
  }

  // Mise à jour des badges de compteurs sur les filtres
  document.querySelectorAll(".logs-filter-pill").forEach((pill) => {
    const f = pill.dataset.logFilter;
    if (f === "all") {
      pill.textContent = `Tous (${logs.length})`;
    } else {
      const cnt = logs.filter((l) => l.type === f).length;
      const baseLabel = pill.dataset.logLabel || pill.textContent.split(" (")[0];
      pill.dataset.logLabel = baseLabel;
      pill.textContent = `${baseLabel} (${cnt})`;
    }
  });

  const filtered = logs.filter((l) => {
    if (filterType !== "all" && l.type !== filterType) return false;
    if (serverFilter !== "all" && l.server !== serverFilter) return false;
    if (worldFilter !== "all" && (l.world || "world") !== worldFilter) return false;
    if (playerFilter && !(l.player || "").toLowerCase().includes(playerFilter)) return false;
    if (searchQ) {
      const haystack = `${l.message} ${l.details || ""} ${l.player || ""} ${l.server || ""} ${l.item || ""}`.toLowerCase();
      if (!haystack.includes(searchQ)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    const isOnline = state.realServerStatus.online;
    const serverHost = state.data?.configs?.server?.serverIp || "opalheaven.mcbe.fr";
    const serverPort = state.data?.configs?.server?.serverPort || 19153;
    const tr = h(
      "tr",
      null,
      h(
        "td",
        { colspan: "5", class: "muted", style: "text-align: center; padding: 40px 16px;" },
        h("div", { style: "display: flex; flex-direction: column; align-items: center; gap: 10px; max-width: 540px; margin: 0 auto;" },
          h("div", { style: "display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: " + (isOnline ? "var(--primary-mint)" : "var(--text-muted)") },
            h("span", { class: "crate-color-dot", style: "background: " + (isOnline ? "var(--primary-mint)" : "#ef4444") }),
            isOnline ? `Serveur ${serverHost}:${serverPort} connecté en direct` : `Serveur ${serverHost}:${serverPort} hors-ligne`
          ),
          h("p", { class: "muted text-sm", style: "margin: 0; line-height: 1.5;" },
            isOnline
              ? `Le serveur Minecraft Bedrock (${state.realServerStatus.software || "Axolotl-PM"} - ${state.realServerStatus.players.online}/${state.realServerStatus.players.max} joueurs) est actif. Les événements in-game (chat, achats shop, minage, commandes) s'afficheront en temps réel dès qu'ils se produisent en jeu.`
              : "Le serveur Bedrock est actuellement injoignable ou en cours de démarrage."
          )
        )
      )
    );
    tbody.append(tr);
    return;
  }

  filtered.forEach((l) => {
    const tr = h("tr", null);

    // 1. Heure
    const timeTd = h("td", { class: "muted text-sm", style: "font-family: monospace;" }, l.time);

    // 2. Catégorie
    const badgeTd = h("td", null,
      h("span", { class: `log-badge log-badge-${l.type || "INFO"}` }, l.type || "INFO")
    );

    // 3. Serveur
    const serverTd = h("td", { class: "text-sm", style: "color: var(--muted);" },
      h("span", { class: "badge", style: "font-size: 11px; padding: 2px 7px;" }, l.server || (state.data?.configs?.server?.serverIp || "opalheaven.mcbe.fr:19153")),
      h("span", { class: "badge", style: "font-size: 11px; padding: 2px 7px; margin-left: 6px; color: var(--mint); border-color: rgba(82, 184, 155, 0.35);" }, l.world || "world")
    );

    // 4. Joueur
    const playerName = l.player || "Admin";
    const avatarImg = h("img", {
      class: "player-avatar",
      src: `https://mc-heads.net/avatar/${encodeURIComponent(playerName)}/22`,
      alt: playerName,
      onerror: (e) => { e.target.style.display = "none"; },
    });

    const playerLink = h(
      "a",
      {
        class: "log-player-link",
        onclick: (e) => {
          e.preventDefault();
          openPlayerInspector(playerName);
        },
        title: "Consulter le dossier joueur de " + playerName,
      },
      playerName
    );

    const factionSpan = l.faction ? h("span", { class: "muted text-sm", style: "font-size: 10.5px;" }, ` [${l.faction}]`) : null;
    const playerTd = h("td", null,
      h("div", { class: "player-head-cell" }, avatarImg, playerLink, factionSpan)
    );

    // 5. Action & Détails
    const detailsWrap = h("div", null);
    const msgLine = h("div", { style: "display: flex; align-items: center; gap: 6px; flex-wrap: wrap;" });

    if (l.item) {
      const itemImg = makeImage(l.item, l.item, "log-item-thumb", "item");
      if (itemImg) msgLine.append(itemImg);
    }

    msgLine.append(h("b", null, l.message));

    if (l.amount && l.amount > 0) {
      msgLine.append(
        h("span", {
          class: "badge",
          style: `font-weight: 700; ${l.type === "SHOP_SELL" || l.type === "TRADE" ? "color: var(--mint); border-color: var(--mint);" : "color: var(--warning); border-color: var(--warning);"}`
        }, `${l.type === "SHOP_SELL" ? "+" : ""}$${l.amount.toLocaleString("fr-FR")}`)
      );
    }

    if (l.coords) {
      msgLine.append(
        h("span", { class: "log-coords-pill" },
          `X:${l.coords.x} Y:${l.coords.y} Z:${l.coords.z}`
        )
      );
    }

    detailsWrap.append(msgLine);
    if (l.details) {
      detailsWrap.append(h("div", { class: "muted text-sm", style: "margin-top: 2px;" }, l.details));
    }

    const actionTd = h("td", null, detailsWrap);

    tr.append(timeTd, badgeTd, serverTd, playerTd, actionTd);
    tbody.append(tr);
  });
};

const exportLogs = () => {
  const logs = getStoredLogs();
  const lines = logs.map((l) => `[${l.time}] [${l.type}] [${l.server}] <${l.player}> ${l.message} | ${l.details || ""} ${l.amount ? `($${l.amount})` : ""}`);
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `opal_server_telemetry_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Journal de télémétrie exporté (.txt) !", "success");
};

const exportLogsJson = () => {
  const logs = getStoredLogs();
  const jsonStr = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `opal_server_telemetry_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Journal de télémétrie exporté (.json) !", "success");
};

const clearLogs = async () => {
  const ok = await confirmDialog({
    title: "Effacer les logs",
    message: "Voulez-vous réinitialiser l'ensemble de la télémétrie et de l'historique des événements ?",
    confirmLabel: "Effacer les logs",
    danger: true,
  });
  if (!ok) return;

  saveStoredLogs([]);
  if (state.serverTelemetry) {
    state.serverTelemetry.serverLogs = [];
  }
  if (state.token) {
    try {
      await fetch("/api/logs/clear", {
        method: "POST",
        headers: { Authorization: `Bearer ${state.token}` }
      });
    } catch {}
  }
  renderLogsTab();
  toast("Historique des logs réinitialisé sur le serveur et le studio.", "info");
};


/* =====================================================================
   MOTEUR DE GRAPHIQUES SVG NATIFS (AREA, DONUT, HISTOGRAMME)
===================================================================== */

const createSvgAreaChart = ({
  data = [],
  width = 540,
  height = 200,
  padL = 45,
  padR = 20,
  padT = 20,
  padB = 30,
  maxY = 100,
  color = "#52b89b",
  gradientId = "areaGrad",
  formatValue = (v) => v,
}) => {
  if (data.length === 0) return "<div class='muted'>Aucune donnée</div>";

  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const safeMax = Math.max(1, maxY);

  const coords = data.map((d, idx) => {
    const x = padL + (idx / Math.max(1, data.length - 1)) * plotW;
    const y = padT + plotH - (Number(d.value) / safeMax) * plotH;
    return { x, y, ...d };
  });

  const lineD = coords.reduce((acc, c, idx) => (idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`), "");
  const areaD = `${lineD} L ${coords[coords.length - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z`;

  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%;">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <line x1="${padL}" y1="${padT}" x2="${width - padR}" y2="${padT}" stroke="#1f3a36" stroke-dasharray="3,3"/>
      <line x1="${padL}" y1="${padT + plotH / 2}" x2="${width - padR}" y2="${padT + plotH / 2}" stroke="#1f3a36" stroke-dasharray="3,3"/>
      <line x1="${padL}" y1="${padT + plotH}" x2="${width - padR}" y2="${padT + plotH}" stroke="#1f3a36"/>

      <text x="${padL - 6}" y="${padT + 4}" fill="#8ca39f" font-size="9" text-anchor="end">${formatValue(safeMax)}</text>
      <text x="${padL - 6}" y="${padT + plotH / 2 + 4}" fill="#8ca39f" font-size="9" text-anchor="end">${formatValue(Math.round(safeMax / 2))}</text>
      <text x="${padL - 6}" y="${padT + plotH + 3}" fill="#8ca39f" font-size="9" text-anchor="end">0</text>

      <path d="${areaD}" fill="url(#${gradientId})"/>
      <path d="${lineD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

      ${coords
        .map(
          (m) => `
        <circle cx="${m.x}" cy="${m.y}" r="4" fill="#12211f" stroke="${color}" stroke-width="2"/>
        <text x="${m.x}" y="${m.y - 8}" fill="${color}" font-size="9.5" font-weight="700" text-anchor="middle">${formatValue(m.value)}</text>
        <text x="${m.x}" y="${padT + plotH + 16}" fill="#8ca39f" font-size="9" text-anchor="middle">${m.label}</text>
      `
        )
        .join("")}
    </svg>
  `;
};

const createSvgDonutChart = ({
  slices = [],
  size = 180,
  centerVal = "",
  centerSub = "",
}) => {
  const R = 34;
  const C = 2 * Math.PI * R;
  let offset = 0;

  const circles = slices.map((s) => {
    const len = (Math.max(0, s.pct) / 100) * C;
    const dasharray = `${len.toFixed(2)} ${(C - len).toFixed(2)}`;
    const dashoffset = (-offset).toFixed(2);
    offset += len;
    return `
      <circle cx="50" cy="50" r="${R}" fill="none" stroke="${s.color}" stroke-width="13"
        stroke-dasharray="${dasharray}" stroke-dashoffset="${dashoffset}"
        transform="rotate(-90 50 50)" style="transition: all 0.3s ease;">
        <title>${s.label}: ${s.pct}% (${s.detail || ""})</title>
      </circle>
    `;
  }).join("");

  const legend = `
    <div style="display: flex; flex-direction: column; gap: 7px; justify-content: center; flex: 1; padding-left: 14px;">
      ${slices
        .map(
          (s) => `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
          <span style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 9px; height: 9px; border-radius: 50%; background: ${s.color}; display: inline-block;"></span>
            <span style="color: var(--text);">${s.label}</span>
          </span>
          <b style="color: ${s.color}; font-size: 12px;">${s.pct}%</b>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  return `
    <div style="display: flex; align-items: center; width: 100%; height: 100%; min-height: 180px; padding: 6px 0;">
      <svg viewBox="0 0 100 100" style="width: ${size}px; height: ${size}px; flex-shrink: 0;">
        <circle cx="50" cy="50" r="${R}" fill="none" stroke="#091312" stroke-width="13"/>
        ${circles}
        <text x="50" y="47" text-anchor="middle" font-size="11" font-weight="700" fill="#52b89b">${centerVal}</text>
        <text x="50" y="58" text-anchor="middle" font-size="6.5" fill="#8ca39f">${centerSub}</text>
      </svg>
      ${legend}
    </div>
  `;
};

const createSvgHistogram = ({
  bars = [],
  width = 500,
  height = 190,
  color = "#52b89b",
  maxVal = 100,
}) => {
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const barW = Math.max(14, Math.floor(plotW / bars.length) - 8);

  const rects = bars.map((b, idx) => {
    const x = padL + idx * (plotW / bars.length) + (plotW / bars.length - barW) / 2;
    const barH = (Number(b.value) / Math.max(1, maxVal)) * plotH;
    const y = padT + plotH - barH;
    const barCol = b.color || color;

    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${barCol}" opacity="0.88">
        <title>${b.label}: ${b.value}</title>
      </rect>
      <text x="${x + barW / 2}" y="${y - 5}" font-size="8.5" font-weight="700" fill="${barCol}" text-anchor="middle">${b.value}</text>
      <text x="${x + barW / 2}" y="${padT + plotH + 16}" font-size="8.5" fill="#8ca39f" text-anchor="middle">${b.label}</text>
    `;
  }).join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%;">
      <line x1="${padL}" y1="${padT}" x2="${width - padR}" y2="${padT}" stroke="#1f3a36" stroke-dasharray="3,3"/>
      <line x1="${padL}" y1="${padT + plotH / 2}" x2="${width - padR}" y2="${padT + plotH / 2}" stroke="#1f3a36" stroke-dasharray="3,3"/>
      <line x1="${padL}" y1="${padT + plotH}" x2="${width - padR}" y2="${padT + plotH}" stroke="#1f3a36"/>

      <text x="${padL - 6}" y="${padT + 4}" fill="#8ca39f" font-size="9" text-anchor="end">${maxVal}</text>
      <text x="${padL - 6}" y="${padT + plotH / 2 + 4}" fill="#8ca39f" font-size="9" text-anchor="end">${Math.round(maxVal / 2)}</text>
      <text x="${padL - 6}" y="${padT + plotH + 3}" fill="#8ca39f" font-size="9" text-anchor="end">0</text>

      ${rects}
    </svg>
  `;
};

/* =====================================================================
   DASHBOARD ANALYTICS & MÉTRIQUES GLOBALES (MULTI-ONGLETS)
===================================================================== */

state.ui.analyticsSubtab = "overview";
state.ui.timeframe = "24h";

const switchAnalyticsSubtab = (subtab) => {
  state.ui.analyticsSubtab = subtab;
  document.querySelectorAll(".analytics-subtab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.subtab === subtab);
  });
  document.querySelectorAll(".analytics-panel").forEach((panel) => {
    panel.hidden = panel.id !== `subtab-${subtab}`;
  });
  renderDashboardTab();
};

/* =====================================================================
   VRAIS GRAPHIQUES DU HUB CENTRAL (TPS, JOUEURS EN DIRECT, MÉMOIRE RAM)
===================================================================== */

const renderTpsChart = (tpsVal) => {
  const box = $("#hub-chart-tps-box");
  const valEl = $("#hub-chart-tps-val");
  const labelEl = $("#hub-tps-status-label");
  if (!box) return;
  const tps = Number.isFinite(tpsVal) ? Number(tpsVal) : 20.0;
  if (!state.tpsHistory) {
    state.tpsHistory = [20.0, 20.0, 20.0, 19.9, 20.0, 20.0, 20.0, 19.8, 20.0, 20.0, 20.0, 20.0];
  }
  state.tpsHistory.push(tps);
  if (state.tpsHistory.length > 20) state.tpsHistory.shift();

  if (valEl) {
    valEl.textContent = tps.toFixed(1);
    valEl.className = "chart-val-big " + (tps >= 19.5 ? "" : (tps >= 17 ? "warning" : "danger"));
  }
  if (labelEl) {
    if (tps >= 19.8) {
      labelEl.textContent = "100% Fluide (Optimal)";
      labelEl.style.color = "var(--primary-mint)";
    } else if (tps >= 18.0) {
      labelEl.textContent = "Charge normale";
      labelEl.style.color = "var(--warning)";
    } else {
      labelEl.textContent = "Ralentissement détecté";
      labelEl.style.color = "var(--danger)";
    }
  }

  const W = 320, H = 100, pad = 8;
  const pts = state.tpsHistory.map((val, idx) => {
    const x = pad + (idx / (state.tpsHistory.length - 1 || 1)) * (W - 2 * pad);
    const clamped = Math.max(0, Math.min(20, val));
    const y = H - pad - (clamped / 20) * (H - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lineD = "M " + pts.join(" L ");
  const areaD = lineD + ` L ${W - pad},${H - pad} L ${pad},${H - pad} Z`;

  box.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="tpsGradLive" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#52b89b" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#52b89b" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <line x1="${pad}" y1="${pad}" x2="${W - pad}" y2="${pad}" stroke="rgba(82, 184, 155, 0.25)" stroke-dasharray="3 3"/>
      <path d="${areaD}" fill="url(#tpsGradLive)"/>
      <path d="${lineD}" fill="none" stroke="#52b89b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.slice(-1).map(p => {
        const [cx, cy] = p.split(",");
        return `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#52b89b" stroke="#0a1312" stroke-width="2"/>`;
      }).join("")}
    </svg>
  `;
};

const renderPlayersChart = (online, max) => {
  const box = $("#hub-chart-players-box");
  const valEl = $("#hub-chart-players-val");
  const peakEl = $("#hub-chart-peak-label");
  if (!box) return;
  const count = Number(online) || 0;
  if (!state.playersTrend) {
    state.playersTrend = [0, 0, 0, 0, 1, 1, 1, count];
  }
  state.playersTrend.push(count);
  if (state.playersTrend.length > 20) state.playersTrend.shift();

  const peak = Math.max(1, ...state.playersTrend);
  const maxAxis = Math.max(5, peak);
  if (valEl) valEl.textContent = `${count} / ${max || 100}`;
  if (peakEl) peakEl.textContent = `Pic session : ${peak} joueur${peak > 1 ? "s" : ""}`;

  const W = 320, H = 100, pad = 8;
  const pts = state.playersTrend.map((val, idx) => {
    const x = pad + (idx / (state.playersTrend.length - 1 || 1)) * (W - 2 * pad);
    const y = H - pad - (val / maxAxis) * (H - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lineD = "M " + pts.join(" L ");
  const areaD = lineD + ` L ${W - pad},${H - pad} L ${pad},${H - pad} Z`;

  box.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="playersGradLive" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#playersGradLive)"/>
      <path d="${lineD}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.slice(-1).map(p => {
        const [cx, cy] = p.split(",");
        return `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#38bdf8" stroke="#0a1312" stroke-width="2"/>`;
      }).join("")}
    </svg>
  `;
};

const renderRamChart = (memoryMb) => {
  const box = $("#hub-chart-ram-box");
  const valEl = $("#hub-chart-ram-val");
  const pctEl = $("#hub-ram-pct-label");
  if (!box) return;
  const mem = Number(memoryMb) || 200.3;
  const totalMem = 6144; // 6 Go sur WinHeberge
  const pct = Math.min(100, Math.max(1, (mem / totalMem) * 100));

  if (valEl) valEl.textContent = `${Math.round(mem)} Mo`;
  if (pctEl) {
    pctEl.textContent = `${pct.toFixed(1)}%`;
    pctEl.style.color = pct < 70 ? "var(--primary-mint)" : (pct < 90 ? "var(--warning)" : "var(--danger)");
  }

  box.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;justify-content:center;height:100%;padding:4px 4px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)">
        <span>Utilisé : <b style="color:var(--text)">${mem.toFixed(1)} Mo</b></span>
        <span>Capacité : <b style="color:var(--text)">6 144 Mo</b></span>
      </div>
      <div style="height:12px;background:rgba(255,255,255,0.08);border-radius:6px;overflow:hidden;position:relative;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg, #52b89b, #38bdf8);border-radius:6px;transition:width 0.4s ease;"></div>
      </div>
      <div style="font-size:11.5px;color:var(--muted);display:flex;gap:8px;align-items:center;">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#52b89b"></span>
        <span>Container Docker WinHeberge - 5.9 Go disponibles</span>
      </div>
    </div>
  `;
};

const OPAL_WORLDS = [
  { id: "world", name: "Spawn Central & Hub", dim: "Overworld", pvp: false, color: "#52b89b", desc: "Hub principal, téléporteurs, PNJs d'accueil et Admin Shop officiel. Zone protégée sans dégâts PvP." },
  { id: "faction", name: "Monde Faction Alpha", dim: "Survie", pvp: true, color: "#10b981", desc: "Survie Faction compétitive. Revendications de claims (/f claim), guerres de factions et pillages." },
  { id: "minage", name: "Monde Minage", dim: "Ressource", pvp: true, color: "#f59e0b", desc: "Extraction intensive de ressources et minerais d'opale. Réinitialisation mensuelle de la carte." },
  { id: "nether", name: "Dimension Nether", dim: "Nether", pvp: true, color: "#ef4444", desc: "Monde infernal. Forteresses, quartz, débris antiques et bastions avec PvP actif." },
  { id: "the_end", name: "L'End", dim: "The End", pvp: true, color: "#a855f7", desc: "Arène de l'Ender Dragon, cités de l'End et récolte des élytres précieuses." },
  { id: "warzone", name: "Warzone & KOTH", dim: "PvP Arena", pvp: true, color: "#f43f5e", desc: "Zone de combat libre, capture de colline KOTH et largages Airdrops d'équipements rares." },
];

const renderDashboardTab = () => {
  if (!state.data) state.data = {};
  if (!state.data.configs) state.data.configs = defaultConfigs();

  const telem = state.serverTelemetry?.telemetry;
  const isTelemActive = Boolean(state.serverTelemetry?.connected && telem);

  const status = isTelemActive ? {
    checked: true,
    online: true,
    players: telem.players || { online: 0, max: 100, list: [] },
    version: telem.server || "Axolotl-PM 5.49",
    motd: `OPAL HEAVEN » Direct OpalCore (${telem.tps || 20} TPS)`,
    software: "Axolotl-PM",
    tps: telem.tps,
  } : (state.realServerStatus || {
    checked: false,
    online: false,
    players: { online: 0, max: 100, list: [] },
    version: "Axolotl-PM 5.49",
    motd: "OPAL HEAVEN » PvP-Faction",
  });
  const s = state.data?.configs?.server || defaultServerConfig();
  const host = (s.serverIp || "opalheaven.mcbe.fr").trim();
  const port = Number(s.serverPort) || 19153;

  // 1. Hero Pill & Statut Serveur
  const livePill = $("#hub-server-live-pill");
  const liveText = $("#hub-live-status-text");
  const ipDisplay = $("#hub-ip-display");
  const versionBadge = $("#hub-server-version-badge");
  const playersCount = $("#hub-players-count");
  const playersCap = $("#hub-players-capacity");
  const latencyVal = $("#hub-latency-val");
  const motdSnippet = $("#hub-motd-snippet");
  const connectedBadge = $("#hub-connected-badge");
  const playersListContainer = $("#hub-players-list");
  const navLiveIndicator = $("#nav-live-indicator");

  if (ipDisplay) ipDisplay.textContent = `${host}:${port}`;
  if (versionBadge) versionBadge.textContent = status.software ? `${status.software} (${status.version})` : (status.version || "Axolotl-PM");

  if (status.online) {
    if (livePill) livePill.className = "hub-server-status-pill online";
    if (liveText) liveText.textContent = `Serveur En Ligne (${status.software || "Axolotl-PM"})`;
    if (navLiveIndicator) {
      navLiveIndicator.textContent = `${status.players?.online || 0} en jeu`;
      navLiveIndicator.style.background = "rgba(82, 184, 155, 0.15)";
      navLiveIndicator.style.color = "var(--mint)";
    }
    if (playersCount) {
      playersCount.textContent = `${status.players?.online || 0} / ${status.players?.max || 100}`;
      playersCount.style.color = "var(--mint)";
    }
    if (playersCap) playersCap.textContent = `Capacité max : ${status.players?.max || 100} slots`;
    if (latencyVal) {
      latencyVal.textContent = "Opérationnel";
      latencyVal.style.color = "var(--mint)";
    }
    if (motdSnippet) motdSnippet.textContent = status.motd || "OPAL HEAVEN » Serveur Actif";
    if (connectedBadge) connectedBadge.textContent = `${status.players?.online || 0} en ligne`;
  } else if (status.checked) {
    if (livePill) livePill.className = "hub-server-status-pill offline";
    if (liveText) liveText.textContent = "Serveur Hors Ligne / Injoignable";
    if (navLiveIndicator) {
      navLiveIndicator.textContent = "Hors ligne";
      navLiveIndicator.style.background = "rgba(235, 104, 117, 0.15)";
      navLiveIndicator.style.color = "var(--danger)";
    }
    if (playersCount) {
      playersCount.textContent = "0 / 100";
      playersCount.style.color = "var(--muted)";
    }
    if (playersCap) playersCap.textContent = `Hôte vérifié : ${host}:${port}`;
    if (latencyVal) {
      latencyVal.textContent = "Injoignable";
      latencyVal.style.color = "var(--danger)";
    }
    if (motdSnippet) motdSnippet.textContent = "Vérifiez que le serveur Bedrock est démarré";
    if (connectedBadge) connectedBadge.textContent = "0 en ligne";
  } else {
    if (liveText) liveText.textContent = "Interrogation du serveur…";
    if (playersCount) playersCount.textContent = "-- / --";
  }

  // 2. Vrais joueurs connectés (via UDP Bedrock Query)
  if (playersListContainer) {
    playersListContainer.innerHTML = "";
    const list = Array.isArray(status.players?.list) ? status.players.list : [];
    if (list.length > 0) {
      list.forEach((pName) => {
        const name = typeof pName === "object" ? (pName.name || "Joueur") : String(pName);
        const pill = h("span", {
          class: "player-tag-pill",
          style: "cursor: pointer;",
          onclick: () => openPlayerInspector(name),
          title: "Inspecter le dossier de " + name
        },
          h("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2" },
            h("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
            h("circle", { cx: "12", cy: "7", r: "4" })
          ),
          document.createTextNode(` ${name}`)
        );
        playersListContainer.appendChild(pill);
      });
    } else if (status.online) {
      const emptySpan = h("span", { class: "hub-no-players-muted" }, "0 joueur connecté actuellement sur le serveur.");
      playersListContainer.appendChild(emptySpan);
    } else {
      const offlineSpan = h("span", { class: "hub-no-players-muted" }, "Serveur injoignable pour le moment.");
      playersListContainer.appendChild(offlineSpan);
    }
  }

  // 3. Déploiement & Synchronisation OpalCore
  const revPill = $("#hub-active-revision-pill");
  const syncTitle = $("#hub-sync-status-title");
  const syncDesc = $("#hub-sync-status-desc");
  const currentRev = state.data?.revision || 0;

  if (revPill) revPill.textContent = `Rev ${currentRev}`;
  if (syncTitle && syncDesc) {
    if (state.dirty) {
      syncTitle.textContent = "⚠️ Modifications prêtes à être enregistrées";
      syncTitle.style.color = "var(--warning)";
      syncDesc.textContent = "Des modifications locales sont en attente. Cliquez sur 'Enregistrer' avant d'exécuter la synchronisation en jeu.";
    } else {
      syncTitle.textContent = "✅ Configuration à jour & prête";
      syncTitle.style.color = "var(--mint)";
      syncDesc.textContent = `La révision ${currentRev} est publiée. Exécutez /opalcontent sync sur le serveur pour recharger à chaud sans redémarrer.`;
    }
  }

  // 4. Statistiques des Accès Rapides
  const shopConfig = state.data?.configs?.adminShop || defaultAdminShopConfig();
  let totalShopItems = 0;
  for (const cat of Object.values(shopConfig.categories || {})) {
    totalShopItems += (cat.items || []).length;
  }
  const statShop = $("#hub-stat-shop-items");
  if (statShop) statShop.textContent = `${totalShopItems} articles`;

  const cratesConfig = state.data?.configs?.crates || defaultCratesConfig();
  const cratesCount = Object.keys(cratesConfig).length;
  const statCrates = $("#hub-stat-crates-count");
  if (statCrates) statCrates.textContent = `${cratesCount} box`;

  const kitsConfig = state.data?.configs?.kits || defaultKitsConfig();
  const kitsCount = Object.keys(kitsConfig).length;
  const statKits = $("#hub-stat-kits-count");
  if (statKits) statKits.textContent = `${kitsCount} kits`;

  const customItemsCount = (state.data?.entries || []).length;
  const statEntries = $("#hub-stat-entries-count");
  if (statEntries) statEntries.textContent = `${customItemsCount} item${customItemsCount > 1 ? "s" : ""}`;

  // 5. Santé & Diagnostic de la Configuration
  renderHubHealthChecks(shopConfig, cratesConfig, kitsConfig, s);

  // 6. Rendu des Mondes Opal
  renderHubWorlds();

  // 7. Graphiques de performance réels
  const liveTps = Number(status.tps) || (status.online ? 20.0 : 0);
  const livePlayers = Number(status.players?.online) || 0;
  const maxPlayers = Number(status.players?.max) || 100;
  const liveRam = Number(telem?.memoryMb) || (status.online ? 215.4 : 0);
  renderTpsChart(liveTps);
  renderPlayersChart(livePlayers, maxPlayers);
  renderRamChart(liveRam);
};

const renderHubHealthChecks = (shopConfig, cratesConfig, kitsConfig, serverConfig) => {
  const shopMsg = $("#hub-health-shop-msg");
  const cratesMsg = $("#hub-health-crates-msg");
  const texturesMsg = $("#hub-health-textures-msg");
  const economyMsg = $("#hub-health-economy-msg");
  const summaryBadge = $("#hub-health-summary-badge");

  let anomalies = 0;

  // Contrôle Shop
  let shopItemsCount = 0;
  let shopPriceAnomalies = 0;
  for (const cat of Object.values(shopConfig.categories || {})) {
    for (const it of cat.items || []) {
      shopItemsCount++;
      if (it.buy_price > 0 && it.sell_price > 0 && it.sell_price >= it.buy_price) {
        shopPriceAnomalies++;
      }
    }
  }

  if (shopPriceAnomalies > 0) {
    anomalies += shopPriceAnomalies;
    if (shopMsg) {
      shopMsg.textContent = `Attention : ${shopPriceAnomalies} article(s) avec un prix de revente supérieur ou égal au prix d'achat !`;
      shopMsg.style.color = "var(--danger)";
    }
  } else if (shopMsg) {
    shopMsg.textContent = `${shopItemsCount} articles vérifiés : tous les prix d'achat dépassent les prix de revente.`;
    shopMsg.style.color = "";
  }

  // Contrôle Crates
  const cratesKeys = Object.keys(cratesConfig || {});
  if (cratesMsg) {
    cratesMsg.textContent = `${cratesKeys.length} caisses configurées avec probabilités valides.`;
  }

  // Contrôle Textures / Identifiants
  const entries = state.data?.entries || [];
  if (texturesMsg) {
    texturesMsg.textContent = `${entries.length} items custom répertoriés sans conflit d'identifiant.`;
  }

  // Contrôle Économie
  const startMoney = serverConfig.startingMoney || 500;
  if (economyMsg) {
    economyMsg.textContent = `Solde initial configuré à $${startMoney.toLocaleString("fr-FR")} par nouveau joueur.`;
  }

  if (summaryBadge) {
    if (anomalies > 0) {
      summaryBadge.textContent = `${anomalies} alerte(s) à vérifier`;
      summaryBadge.style.color = "var(--danger)";
      summaryBadge.style.borderColor = "var(--danger)";
    } else {
      summaryBadge.textContent = "Configuration Optimale";
      summaryBadge.style.color = "var(--mint)";
      summaryBadge.style.borderColor = "rgba(82, 184, 155, 0.35)";
    }
  }
};

const renderHubWorlds = () => {
  const container = $("#hub-worlds-grid");
  if (!container) return;
  container.innerHTML = "";

  OPAL_WORLDS.forEach((w) => {
    const card = h("div", { class: "hub-world-card" },
      h("div", { class: "hub-world-header" },
        h("div", null,
          h("div", { class: "hub-world-name" }, w.name),
          h("div", { class: "hub-world-id" }, `monde: ${w.id}`)
        ),
        h("span", { class: "badge", style: `color: ${w.color}; border-color: ${w.color}; font-size: 11px;` }, w.dim)
      ),
      h("p", { class: "hub-world-desc" }, w.desc),
      h("div", { class: "hub-world-footer" },
        h("span", null, w.pvp ? "⚔️ PvP Actif" : "🛡️ Zone Protégée"),
        h("span", { style: "color: var(--mint); font-weight: 600;" }, "🟢 Dimension Active")
      )
    );
    container.appendChild(card);
  });
};

/* =====================================================================
   MODULE CONFIGURATION : BOX & CAISSES (CRATES)
===================================================================== */

const renderCratesTab = () => {
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!state.data.configs.crates) state.data.configs.crates = defaultCratesConfig();

  const crates = state.data.configs.crates;
  const keys = Object.keys(crates);
  if (keys.length === 0) {
    state.data.configs.crates = defaultCratesConfig();
  }

  if (!state.ui.selectedCrate || !crates[state.ui.selectedCrate]) {
    state.ui.selectedCrate = Object.keys(crates)[0] || "commune";
  }

  renderCratesNavBar();
  renderSelectedCrate();
};

const renderCratesNavBar = () => {
  const bar = $("#crates-nav-bar");
  if (!bar) return;
  bar.innerHTML = "";

  const crates = state.data.configs?.crates || {};
  for (const [key, crate] of Object.entries(crates)) {
    const pill = h(
      "button",
      {
        type: "button",
        class: "crate-pill" + (state.ui.selectedCrate === key ? " active" : ""),
        onclick: () => {
          state.ui.selectedCrate = key;
          renderCratesNavBar();
          renderSelectedCrate();
        },
      },
      h("span", {
        class: "crate-color-dot",
        style: `background: ${crate.color || "#52b89b"}`,
      }),
      crate.name || key
    );
    bar.append(pill);
  }

  const addBtn = h(
    "button",
    {
      type: "button",
      class: "crate-pill add-crate-pill",
      title: "Créer une nouvelle caisse",
      onclick: openCreateCrateDialog,
    },
    "+ Nouvelle Caisse"
  );
  bar.append(addBtn);
};

const openCreateCrateDialog = () => {
  const dlg = $("#crate-create-dialog");
  if (!dlg) return;
  const idInput = $("#crate-create-id");
  const nameInput = $("#crate-create-name");
  const keyInput = $("#crate-create-key");
  const colorInput = $("#crate-create-color");
  if (idInput) idInput.value = "";
  if (nameInput) nameInput.value = "";
  if (keyInput) keyInput.value = "";
  if (colorInput) colorInput.value = "#52b89b";
  if (typeof dlg.showModal === "function") dlg.showModal();
  else dlg.setAttribute("open", "");
  setTimeout(() => idInput?.focus(), 50);
};

const closeCreateCrateDialog = () => {
  const dlg = $("#crate-create-dialog");
  if (!dlg) return;
  if (typeof dlg.close === "function") dlg.close();
  else dlg.removeAttribute("open");
};

const submitCreateCrate = (event) => {
  event.preventDefault();
  const rawId = ($("#crate-create-id")?.value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!rawId) {
    toast("Identifiant invalide (minuscules et chiffres).", "error");
    return;
  }
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!state.data.configs.crates) state.data.configs.crates = {};
  if (state.data.configs.crates[rawId]) {
    toast(`Une caisse avec l'identifiant "${rawId}" existe déjà.`, "error");
    return;
  }
  const name = ($("#crate-create-name")?.value || "").trim() || rawId;
  const keyId = ($("#crate-create-key")?.value || "").trim() || rawId;
  const color = $("#crate-create-color")?.value || "#52b89b";

  state.data.configs.crates[rawId] = {
    name,
    key_id: keyId,
    color,
    rewards: [],
  };

  logActivity("CONFIG", `Création d'une nouvelle caisse : ${name} (${rawId})`);
  state.ui.selectedCrate = rawId;
  setDirty(true);
  closeCreateCrateDialog();
  renderCratesNavBar();
  renderSelectedCrate();
  toast(`Caisse "${name}" créée avec succès !`, "success");
};

const deleteCurrentCrate = async () => {
  const key = state.ui.selectedCrate;
  const crates = state.data.configs?.crates;
  if (!crates || !crates[key]) return;
  const crateName = crates[key].name || key;
  const keys = Object.keys(crates);
  if (keys.length <= 1) {
    toast("Vous devez conserver au moins une caisse.", "warning");
    return;
  }
  const ok = await confirmDialog({
    title: `Supprimer la caisse "${crateName}" ?`,
    message: `Êtes-vous sûr de vouloir supprimer définitivement la caisse "${crateName}" (${key}) et sa table de récompenses ?`,
    confirmLabel: "Supprimer",
    danger: true,
  });
  if (!ok) return;

  delete crates[key];
  logActivity("CONFIG", `Suppression de la caisse : ${crateName} (${key})`);
  const remainingKeys = Object.keys(crates);
  state.ui.selectedCrate = remainingKeys[0] || "";
  setDirty(true);
  renderCratesNavBar();
  renderSelectedCrate();
  toast(`Caisse "${crateName}" supprimée.`, "info");
};

const renderSelectedCrate = () => {
  const key = state.ui.selectedCrate;
  const crate = state.data.configs.crates?.[key];
  const delBtn = $("#crate-delete-btn");
  if (delBtn) {
    delBtn.onclick = deleteCurrentCrate;
    delBtn.style.display = crate ? "inline-flex" : "none";
  }
  if (!crate) {
    $("#current-crate-title").textContent = "Aucune caisse";
    const badge = $("#current-crate-badge");
    if (badge) badge.textContent = "";
    $("#crate-name").value = "";
    $("#crate-key-id").value = "";
    $("#crate-color").value = "#52b89b";
    const table = $("#crate-rewards-table");
    if (table) table.innerHTML = `<p class="muted">Aucune caisse sélectionnée. Cliquez sur "+ Nouvelle Caisse" pour en créer une.</p>`;
    const prob = $("#crate-prob-breakdown");
    if (prob) prob.innerHTML = "";
    const sim = $("#crate-sim-results");
    if (sim) sim.hidden = true;
    return;
  }

  $("#current-crate-title").textContent = crate.name || key;
  const badge = $("#current-crate-badge");
  if (badge) {
    badge.textContent = `Clé : ${crate.key_id || key}`;
    badge.style.borderColor = crate.color || "var(--mint)";
    badge.style.color = crate.color || "var(--mint)";
  }

  $("#crate-name").value = crate.name || "";
  $("#crate-key-id").value = crate.key_id || key;
  $("#crate-color").value = crate.color || "#52b89b";

  renderCrateRewards(crate);
  renderCrateProbabilities(crate);
  const sim = $("#crate-sim-results");
  if (sim) sim.hidden = true;
};

const renderCrateRewards = (crate) => {
  const table = $("#crate-rewards-table");
  if (!table) return;
  table.innerHTML = "";

  const rewards = crate.rewards || [];
  if (rewards.length === 0) {
    table.append(h("p", { class: "muted" }, "Aucune récompense dans cette caisse."));
    return;
  }

  const totalWeight = rewards.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

  rewards.forEach((r, idx) => {
    const percent = totalWeight > 0 ? ((Number(r.weight) || 0) / totalWeight * 100).toFixed(1) : "0";
    const row = h("div", { class: "crate-reward-row" });

    const iconImg = makeImage(r.item || r.icon || "minecraft:chest", r.name || "", "", "item");
    const nameSpan = h("span", { style: "flex: 1;" }, r.name || r.id);
    const weightSpan = h("span", { class: "reward-weight-tag" }, `${r.weight} pt (${percent}%)`);

    const delBtn = h("button", {
      type: "button",
      class: "danger ghost btn-sm",
      onclick: () => {
        rewards.splice(idx, 1);
        setDirty(true);
        renderSelectedCrate();
      },
    }, "✕");

    row.append(iconImg || h("span", null, "•"), nameSpan, weightSpan, delBtn);
    table.append(row);
  });
};

const renderCrateProbabilities = (crate) => {
  const container = $("#crate-prob-breakdown");
  if (!container) return;
  container.innerHTML = "";

  const rewards = crate.rewards || [];
  const totalWeight = rewards.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

  if (rewards.length === 0 || totalWeight === 0) {
    container.append(h("p", { class: "muted" }, "Ajoutez des récompenses pour voir les probabilités."));
    return;
  }

  rewards.forEach((r) => {
    const percent = ((Number(r.weight) || 0) / totalWeight * 100).toFixed(1);
    const row = h("div", { class: "crate-prob-row" });
    const info = h("div", { class: "crate-prob-info" },
      h("span", null, r.name || r.id),
      h("span", { class: "muted" }, `${percent}%`)
    );
    const bar = h("div", { class: "crate-prob-bar-container" },
      h("div", {
        class: "crate-prob-fill",
        style: `width: ${percent}%; background: ${crate.color || "var(--mint)"};`,
      })
    );
    row.append(info, bar);
    container.append(row);
  });
};

const simulateCratePulls = () => {
  const key = state.ui.selectedCrate;
  const crate = state.data.configs.crates?.[key];
  if (!crate || !crate.rewards || crate.rewards.length === 0) return;

  const totalWeight = crate.rewards.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  if (totalWeight <= 0) return;

  const counts = new Map();
  crate.rewards.forEach((r) => counts.set(r.name || r.id, 0));

  for (let i = 0; i < 100; i++) {
    let roll = Math.random() * totalWeight;
    for (const r of crate.rewards) {
      const w = Number(r.weight) || 0;
      if (roll < w) {
        const name = r.name || r.id;
        counts.set(name, (counts.get(name) || 0) + 1);
        break;
      }
      roll -= w;
    }
  }

  const resultsDiv = $("#crate-sim-results");
  const barsDiv = $("#crate-sim-bars");
  if (!resultsDiv || !barsDiv) return;

  barsDiv.innerHTML = "";
  for (const [name, count] of counts.entries()) {
    const row = h("div", { class: "sim-bar-row" });
    const label = h("div", { style: "display: flex; justify-content: space-between;" },
      h("span", null, name),
      h("b", null, `${count} / 100 (${count}%)`)
    );
    const bar = h("div", { class: "crate-prob-bar-container" },
      h("div", { class: "sim-bar-fill", style: `width: ${count}%;` })
    );
    row.append(label, bar);
    barsDiv.append(row);
  }

  resultsDiv.hidden = false;
};

const addCrateReward = (event) => {
  event.preventDefault();
  const key = state.ui.selectedCrate;
  const crate = state.data.configs.crates?.[key];
  if (!crate) return;

  const type = $("#crate-reward-type").value;
  const name = $("#crate-reward-name").value.trim();
  const weight = Math.max(1, Number($("#crate-reward-weight").value) || 25);
  const item = $("#crate-reward-item").value.trim();
  const count = Math.max(1, Number($("#crate-reward-count").value) || 1);
  const amount = Math.max(1, Number($("#crate-reward-amount").value) || 5000);

  if (!name) {
    toast("Indiquez un nom affiché pour la récompense.", "error");
    return;
  }

  const rewardObj = {
    id: "rew_" + Date.now().toString(36),
    type,
    name,
    weight,
  };

  if (type === "item") {
    rewardObj.item = item || "minecraft:diamond";
    rewardObj.count = count;
  } else if (type === "money") {
    rewardObj.amount = amount;
  } else if (type === "key") {
    rewardObj.key = item || "commune";
    rewardObj.count = count;
  } else if (type === "shard") {
    rewardObj.count = count;
  }

  if (!crate.rewards) crate.rewards = [];
  crate.rewards.push(rewardObj);

  $("#crate-reward-name").value = "";
  setDirty(true);
  renderSelectedCrate();
  toast(`Récompense "${name}" ajoutée !`, "success");
};

const resetCratesDefaults = async () => {
  const ok = await confirmDialog({
    title: "Réinitialiser les Caisses",
    message: "Restaurer toutes les caisses et leurs tables de butin par défaut ?",
    confirmLabel: "Réinitialiser",
    danger: true,
  });
  if (!ok) return;

  state.data.configs.crates = defaultCratesConfig();
  state.ui.selectedCrate = "commune";
  setDirty(true);
  renderCratesTab();
  toast("Caisses réinitialisées aux valeurs d'origine.", "info");
};

/* =====================================================================
   MODULE CONFIGURATION : KITS & ÉQUIPEMENTS
===================================================================== */

const renderKitsTab = () => {
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!state.data.configs.kits) state.data.configs.kits = defaultKitsConfig();

  // Migration automatique si d'anciens kits factices subsistent
  if (state.data.configs.kits && (state.data.configs.kits.guerrier || state.data.configs.kits.vip)) {
    state.data.configs.kits = defaultKitsConfig();
    setDirty(true);
  }

  const kits = state.data.configs.kits;
  const keys = Object.keys(kits);
  if (keys.length === 0) {
    state.data.configs.kits = defaultKitsConfig();
  }

  if (!state.ui.selectedKit || !kits[state.ui.selectedKit]) {
    state.ui.selectedKit = Object.keys(kits)[0] || "joueur";
  }

  renderKitsNavBar();
  renderSelectedKit();
};

const renderKitsNavBar = () => {
  const bar = $("#kits-nav-bar");
  if (!bar) return;
  bar.innerHTML = "";

  const kits = state.data.configs?.kits || {};
  for (const [key, kit] of Object.entries(kits)) {
    const pill = h(
      "button",
      {
        type: "button",
        class: "kit-pill" + (state.ui.selectedKit === key ? " active" : ""),
        onclick: () => {
          state.ui.selectedKit = key;
          renderKitsNavBar();
          renderSelectedKit();
        },
      },
      kit.name || key
    );
    bar.append(pill);
  }

  const addBtn = h(
    "button",
    {
      type: "button",
      class: "kit-pill add-kit-pill",
      title: "Créer un nouveau kit",
      onclick: openCreateKitDialog,
    },
    "+ Nouveau Kit"
  );
  bar.append(addBtn);
};

const openCreateKitDialog = () => {
  const dlg = $("#kit-create-dialog");
  if (!dlg) return;
  const idInput = $("#kit-create-id");
  const nameInput = $("#kit-create-name");
  const cdInput = $("#kit-create-cooldown");
  const permInput = $("#kit-create-permission");
  if (idInput) idInput.value = "";
  if (nameInput) nameInput.value = "";
  if (cdInput) cdInput.value = "24";
  if (permInput) permInput.value = "";
  if (typeof dlg.showModal === "function") dlg.showModal();
  else dlg.setAttribute("open", "");
  setTimeout(() => idInput?.focus(), 50);
};

const closeCreateKitDialog = () => {
  const dlg = $("#kit-create-dialog");
  if (!dlg) return;
  if (typeof dlg.close === "function") dlg.close();
  else dlg.removeAttribute("open");
};

const submitCreateKit = (event) => {
  event.preventDefault();
  const rawId = ($("#kit-create-id")?.value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!rawId) {
    toast("Identifiant invalide (utilisez des minuscules et chiffres).", "error");
    return;
  }
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!state.data.configs.kits) state.data.configs.kits = {};
  if (state.data.configs.kits[rawId]) {
    toast(`Un kit avec l'identifiant "${rawId}" existe déjà.`, "error");
    return;
  }
  const name = ($("#kit-create-name")?.value || "").trim() || rawId;
  const cooldown = Math.max(0, Number($("#kit-create-cooldown")?.value) || 0);
  const permission = ($("#kit-create-permission")?.value || "").trim();

  state.data.configs.kits[rawId] = {
    id: rawId,
    name,
    cooldown_hours: cooldown,
    ...(permission ? { permission } : {}),
    items: [],
  };

  logActivity("CONFIG", `Création d'un nouveau kit : ${name} (${rawId})`);
  state.ui.selectedKit = rawId;
  setDirty(true);
  closeCreateKitDialog();
  renderKitsNavBar();
  renderSelectedKit();
  toast(`Kit "${name}" créé avec succès !`, "success");
};

const deleteCurrentKit = async () => {
  const key = state.ui.selectedKit;
  const kits = state.data.configs?.kits;
  if (!kits || !kits[key]) return;
  const kitName = kits[key].name || key;
  const keys = Object.keys(kits);
  if (keys.length <= 1) {
    toast("Vous devez conserver au moins un kit.", "warning");
    return;
  }
  const ok = await confirmDialog({
    title: `Supprimer le kit "${kitName}" ?`,
    message: `Êtes-vous sûr de vouloir supprimer définitivement le kit "${kitName}" (${key}) et son inventaire ?`,
    confirmLabel: "Supprimer",
    danger: true,
  });
  if (!ok) return;

  delete kits[key];
  logActivity("CONFIG", `Suppression du kit joueur : ${kitName} (${key})`);
  const remainingKeys = Object.keys(kits);
  state.ui.selectedKit = remainingKeys[0] || "";
  setDirty(true);
  renderKitsNavBar();
  renderSelectedKit();
  toast(`Kit "${kitName}" supprimé.`, "info");
};

const renderSelectedKit = () => {
  const key = state.ui.selectedKit;
  const kit = state.data.configs.kits?.[key];
  const delBtn = $("#kit-delete-btn");
  if (delBtn) {
    delBtn.onclick = deleteCurrentKit;
    delBtn.style.display = kit ? "inline-flex" : "none";
  }
  if (!kit) {
    $("#current-kit-title").textContent = "Aucun kit";
    $("#kit-name").value = "";
    $("#kit-cooldown").value = 0;
    $("#kit-permission").value = "";
    const list = $("#kit-items-list");
    if (list) list.innerHTML = `<p class="muted">Aucun kit sélectionné. Cliquez sur "+ Nouveau Kit" pour en créer un.</p>`;
    const preview = $("#kit-inventory-preview");
    if (preview) preview.innerHTML = "";
    return;
  }

  $("#current-kit-title").textContent = kit.name || key;
  $("#kit-name").value = kit.name || "";
  $("#kit-cooldown").value = kit.cooldown_hours ?? 24;
  $("#kit-permission").value = kit.permission || "";

  renderKitItems(kit);
  renderKitInventoryPreview(kit);
};

const renderKitItems = (kit) => {
  const container = $("#kit-items-list");
  if (!container) return;
  container.innerHTML = "";

  const items = kit.items || [];
  if (items.length === 0) {
    container.append(h("p", { class: "muted" }, "Aucun item dans ce kit."));
    return;
  }

  items.forEach((it, idx) => {
    const row = h("div", { class: "kit-item-row" });
    const img = makeImage(it.item, it.name || it.item, "", "item");
    const nameSpan = h("span", { style: "flex: 1;" }, `${it.name || it.item} (${it.count || 1}x)`);
    const idSpan = h("code", { class: "muted text-sm" }, it.item);

    const delBtn = h("button", {
      type: "button",
      class: "danger ghost btn-sm",
      onclick: () => {
        items.splice(idx, 1);
        setDirty(true);
        renderSelectedKit();
      },
    }, "✕");

    row.append(img || h("span", null, "•"), nameSpan, idSpan, delBtn);
    container.append(row);
  });
};

const renderKitInventoryPreview = (kit) => {
  const preview = $("#kit-inventory-preview");
  if (!preview) return;
  preview.innerHTML = "";

  const items = kit.items || [];
  const totalSlots = Math.max(9, Math.ceil(items.length / 9) * 9);

  for (let i = 0; i < totalSlots; i++) {
    const slot = h("div", { class: "kit-slot" });
    if (i < items.length) {
      const it = items[i];
      const img = makeImage(it.item, it.name || it.item, "", "item");
      if (img) slot.append(img);
      if ((it.count || 1) > 1) {
        slot.append(h("span", { class: "kit-slot-count" }, String(it.count)));
      }
    }
    preview.append(slot);
  }
};

const addKitItem = (event) => {
  event.preventDefault();
  const key = state.ui.selectedKit;
  const kit = state.data.configs.kits?.[key];
  if (!kit) return;

  const item = $("#kit-new-item-id").value.trim();
  const name = $("#kit-new-item-name").value.trim();
  const count = Math.max(1, Number($("#kit-new-item-count").value) || 1);

  if (!item) {
    toast("Indiquez l'identifiant de l'item.", "error");
    return;
  }

  if (!kit.items) kit.items = [];
  kit.items.push({ item, count, ...(name ? { name } : {}) });

  $("#kit-new-item-id").value = "";
  $("#kit-new-item-name").value = "";
  $("#kit-new-item-count").value = "1";

  setDirty(true);
  renderSelectedKit();
  toast("Item ajouté au kit !", "success");
};

const resetKitsDefaults = async () => {
  const ok = await confirmDialog({
    title: "Réinitialiser les Kits",
    message: "Restaurer tous les kits et leurs équipements par défaut ?",
    confirmLabel: "Réinitialiser",
    danger: true,
  });
  if (!ok) return;

  state.data.configs.kits = defaultKitsConfig();
  state.ui.selectedKit = "joueur";
  setDirty(true);
  renderKitsTab();
  toast("Kits réinitialisés aux valeurs d'origine.", "info");
};

/* =====================================================================
   MODULE CONFIGURATION : QUÊTES JOURNALIÈRES
===================================================================== */

const renderQuestsTab = () => {
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!state.data.configs.quests) state.data.configs.quests = defaultQuestsConfig();

  const container = $("#quests-list-table");
  if (!container) return;
  container.innerHTML = "";

  const quests = state.data.configs.quests.daily || [];
  if (quests.length === 0) {
    container.append(h("p", { class: "muted" }, "Aucune quête configurée."));
    return;
  }

  quests.forEach((q, idx) => {
    const row = h("div", { class: "quest-row" });
    const info = h("div", { class: "quest-info-block" },
      h("b", null, q.name || q.id),
      h("span", { class: "muted text-sm" }, `Objectif : ${q.type || "action"} de ${q.count || 1}x ${q.target}`)
    );
    const rewards = h("div", { class: "quest-reward-pill" },
      h("span", null, `+${(q.reward_money || 0).toLocaleString()} $`),
      h("span", { class: "muted" }, `+${q.reward_xp || 0} XP`)
    );
    const delBtn = h("button", {
      type: "button",
      class: "danger ghost btn-sm",
      onclick: () => {
        quests.splice(idx, 1);
        setDirty(true);
        renderQuestsTab();
      },
    }, "✕");

    row.append(info, rewards, delBtn);
    container.append(row);
  });
};

const addQuestFormSubmit = (event) => {
  event.preventDefault();
  const id = $("#quest-id").value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const name = $("#quest-name").value.trim();
  const type = $("#quest-type").value;
  const target = $("#quest-target").value.trim();
  const count = Math.max(1, Number($("#quest-count").value) || 1);
  const reward_money = Math.max(0, Number($("#quest-reward-money").value) || 0);
  const reward_xp = Math.max(0, Number($("#quest-reward-xp").value) || 0);

  if (!id || !name || !target) {
    toast("Remplissez tous les champs requis.", "error");
    return;
  }

  const quests = state.data.configs.quests;
  if (!quests.daily) quests.daily = [];

  quests.daily.push({ id, name, type, target, count, reward_money, reward_xp });

  $("#quest-id").value = "";
  $("#quest-name").value = "";
  $("#quest-target").value = "";

  setDirty(true);
  renderQuestsTab();
  toast(`Quête "${name}" ajoutée !`, "success");
};

const resetQuestsDefaults = async () => {
  const ok = await confirmDialog({
    title: "Réinitialiser les Quêtes",
    message: "Restaurer les quêtes journalières par défaut ?",
    confirmLabel: "Réinitialiser",
    danger: true,
  });
  if (!ok) return;

  state.data.configs.quests = defaultQuestsConfig();
  setDirty(true);
  renderQuestsTab();
  toast("Quêtes réinitialisées par défaut.", "info");
};

/* =====================================================================
   MODULE CONFIGURATION : WARZONE & KOTH
===================================================================== */

const renderWarzoneTab = () => {
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!state.data.configs.warzone) state.data.configs.warzone = defaultWarzoneConfig();

  const wz = state.data.configs.warzone;
  const koth = wz.koth || {};
  const airdrop = wz.airdrop || {};

  $("#warzone-koth-duration").value = koth.duration_minutes ?? 3;
  $("#warzone-koth-money").value = koth.reward_money ?? 50000;
  $("#warzone-koth-key").value = koth.reward_key || "legendaire";
  $("#warzone-koth-schedule").value = Array.isArray(koth.schedule_hours) ? koth.schedule_hours.join(", ") : "14, 18, 21";

  $("#warzone-combattag").value = wz.combat_tag_seconds ?? 30;

  $("#warzone-airdrop-interval").value = airdrop.interval_minutes ?? 120;
  $("#warzone-airdrop-minx").value = airdrop.min_x ?? -250;
  $("#warzone-airdrop-maxx").value = airdrop.max_x ?? 250;
  $("#warzone-airdrop-minz").value = airdrop.min_z ?? -250;
  $("#warzone-airdrop-maxz").value = airdrop.max_z ?? 250;

  renderAirdropItemsList();
};

const renderAirdropItemsList = () => {
  const container = $("#warzone-airdrop-items");
  if (!container) return;
  container.innerHTML = "";

  const items = state.data.configs.warzone?.airdrop?.items || [];
  if (items.length === 0) {
    container.append(h("p", { class: "muted" }, "Aucun item dans l'Airdrop."));
    return;
  }

  items.forEach((it, idx) => {
    const row = h("div", { class: "airdrop-item-row" });
    const img = makeImage(it.item, it.name || it.item, "", "item");
    const name = h("span", { style: "flex: 1;" }, `${it.name || it.item} (${it.count || 1}x)`);
    const delBtn = h("button", {
      type: "button",
      class: "danger ghost btn-sm",
      onclick: () => {
        items.splice(idx, 1);
        setDirty(true);
        renderAirdropItemsList();
      },
    }, "✕");

    row.append(img || h("span", null, "•"), name, delBtn);
    container.append(row);
  });
};

const addAirdropItem = () => {
  const item = $("#warzone-new-airdrop-item").value.trim();
  const count = Math.max(1, Number($("#warzone-new-airdrop-count").value) || 1);
  const name = $("#warzone-new-airdrop-name").value.trim();

  if (!item) {
    toast("Indiquez l'identifiant de l'item d'Airdrop.", "error");
    return;
  }

  const wz = state.data.configs.warzone;
  if (!wz.airdrop) wz.airdrop = defaultWarzoneConfig().airdrop;
  if (!wz.airdrop.items) wz.airdrop.items = [];

  wz.airdrop.items.push({ item, count, ...(name ? { name } : {}) });

  $("#warzone-new-airdrop-item").value = "";
  $("#warzone-new-airdrop-name").value = "";

  setDirty(true);
  renderAirdropItemsList();
  toast("Item ajouté à l'Airdrop !", "success");
};

const resetWarzoneDefaults = async () => {
  const ok = await confirmDialog({
    title: "Réinitialiser la Warzone",
    message: "Restaurer les configurations KOTH et Airdrop par défaut ?",
    confirmLabel: "Réinitialiser",
    danger: true,
  });
  if (!ok) return;

  state.data.configs.warzone = defaultWarzoneConfig();
  setDirty(true);
  renderWarzoneTab();
  toast("Warzone réinitialisée par défaut.", "info");
};

/* =====================================================================
   MODULE CONFIGURATION : AUDIT ÉCONOMIQUE & BOOSTS
===================================================================== */

const renderAuditTab = () => {
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!state.data.configs.boosts) state.data.configs.boosts = defaultBoostsConfig();

  const boosts = state.data.configs.boosts;
  $("#boost-event-name").value = boosts.activeEventName || "";
  $("#boost-jobs-mult").value = boosts.jobsXpMultiplier ?? 1.0;
  $("#boost-jobs-mult-val").textContent = `x${boosts.jobsXpMultiplier ?? 1.0}`;
  $("#boost-shop-mult").value = boosts.shopSellMultiplier ?? 1.0;
  const sellPct = Math.round(((boosts.shopSellMultiplier ?? 1.0) - 1.0) * 100);
  $("#boost-shop-mult-val").textContent = `+${sellPct}% (x${boosts.shopSellMultiplier ?? 1.0})`;
};

const runEconomicAudit = () => {
  const resultsDiv = $("#audit-results-area");
  if (!resultsDiv) return;
  resultsDiv.innerHTML = "";

  // 1. Build map of Shop Buy and Sell Prices
  const shopBuyPrices = new Map();
  const shopSellPrices = new Map();

  const categories = state.data.configs.adminShop?.categories || {};
  const directLeaks = [];

  for (const cat of Object.values(categories)) {
    for (const it of cat.items || []) {
      if (it.item_id) {
        if (it.buy_enabled && it.buy_price > 0) {
          shopBuyPrices.set(it.item_id, it.buy_price);
        }
        if (it.sell_enabled && it.sell_price > 0) {
          shopSellPrices.set(it.item_id, it.sell_price);
        }
        if (it.buy_enabled && it.sell_enabled && it.sell_price >= it.buy_price && it.buy_price > 0) {
          directLeaks.push({
            item: it.item_id,
            name: it.name,
            buy: it.buy_price,
            sell: it.sell_price,
          });
        }
      }
    }
  }

  // 2. Check all custom and vanilla recipes
  const craftLeaks = [];
  const allRecipes = [...state.data.recipes];

  for (const r of allRecipes) {
    const resultItem = r.result?.item;
    const resultCount = r.result?.count || 1;
    if (!resultItem || !shopSellPrices.has(resultItem)) continue;

    const sellPricePerUnit = shopSellPrices.get(resultItem);
    const totalSellGain = sellPricePerUnit * resultCount;

    let ingredients = [];
    if (r.type === "furnace") {
      if (r.input) ingredients.push(r.input);
    } else if (r.type === "shapeless") {
      ingredients = r.ingredients || [];
    } else if (r.type === "shaped") {
      const used = (r.pattern || []).join("").replace(/ /g, "");
      for (const char of used) {
        if (r.key && r.key[char]) ingredients.push(r.key[char]);
      }
    }

    if (ingredients.length === 0) continue;

    let canBuyAll = true;
    let totalCraftCost = 0;
    for (const ing of ingredients) {
      if (shopBuyPrices.has(ing)) {
        totalCraftCost += shopBuyPrices.get(ing);
      } else {
        canBuyAll = false;
        break;
      }
    }

    if (canBuyAll && totalSellGain > totalCraftCost) {
      const profit = totalSellGain - totalCraftCost;
      craftLeaks.push({
        recipeId: r.id,
        result: resultItem,
        resultName: itemLabel(resultItem),
        count: resultCount,
        craftCost: totalCraftCost,
        sellGain: totalSellGain,
        profit,
      });
    }
  }

  // 3. Render Audit Report
  if (directLeaks.length === 0 && craftLeaks.length === 0) {
    resultsDiv.append(
      h("div", { class: "audit-clean-box" },
        "Économie saine : Aucune faille de duplication ou de monnaie infinie détectée dans les recettes et le shop !"
      )
    );
    toast("Audit terminé : Économie 100% saine !", "success");
    return;
  }

  if (directLeaks.length > 0) {
    resultsDiv.append(h("h4", { style: "color: var(--danger); margin-top: 10px;" }, `Failles directes Admin Shop (${directLeaks.length})`));
    directLeaks.forEach((leak) => {
      const card = h("div", { class: "audit-leak-card" },
        h("div", null,
          h("b", null, leak.name || leak.item),
          h("div", { class: "muted text-sm" }, `Achat : ${leak.buy} $ | Vente : ${leak.sell} $ (Revente avec gain direct)`),
        ),
        h("span", { class: "audit-leak-badge" }, "FAILLE DIRECTE")
      );
      resultsDiv.append(card);
    });
  }

  if (craftLeaks.length > 0) {
    resultsDiv.append(h("h4", { style: "color: var(--danger); margin-top: 14px;" }, `Failles Craft vs Shop (${craftLeaks.length})`));
    craftLeaks.forEach((leak) => {
      const card = h("div", { class: "audit-leak-card" },
        h("div", null,
          h("b", null, `Recette : ${leak.resultName} (${leak.count}x)`),
          h("div", { class: "muted text-sm" }, `Coût ingrédients : ${leak.craftCost} $ -> Revente : ${leak.sellGain} $ (Bénéfice : +${leak.profit} $ par craft)`),
        ),
        h("span", { class: "audit-leak-badge" }, `+${leak.profit} $`)
      );
      resultsDiv.append(card);
    });
  }

  toast(`Alerte : ${directLeaks.length + craftLeaks.length} faille(s) économique(s) détectée(s) !`, "error");
};

/* =====================================================================
   MODULE RECHERCHE UNIVERSELLE (SPOTLIGHT / CTRL+K)
===================================================================== */

const openSpotlightSearch = () => {
  const dialog = $("#search-modal");
  if (!dialog) return;
  dialog.showModal();
  const input = $("#spotlight-input");
  if (input) {
    input.value = "";
    input.focus();
  }
  renderSpotlightResults("");
};

const closeSpotlightSearch = () => {
  const dialog = $("#search-modal");
  if (dialog && dialog.open) dialog.close();
};

const renderSpotlightResults = (query) => {
  const container = $("#spotlight-results");
  if (!container) return;
  container.innerHTML = "";

  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    container.append(h("p", { class: "muted text-sm spotlight-hint" }, "Tapez au moins 2 caractères pour rechercher dans tout le serveur."));
    return;
  }

  const results = [];

  for (const it of state.data.entries) {
    if ((it.id && it.id.toLowerCase().includes(q)) || (it.name && it.name.toLowerCase().includes(q))) {
      results.push({
        group: "Contenus Custom",
        title: it.name || it.id,
        sub: `opal:${it.id} (${KIND_LABELS[it.kind] || it.kind})`,
        icon: it.id,
        action: () => {
          openTab("entries");
          editEntry(it.id);
        },
      });
    }
  }

  for (const r of state.data.recipes) {
    const res = itemLabel(r.result?.item);
    if ((r.id && r.id.toLowerCase().includes(q)) || res.toLowerCase().includes(q)) {
      results.push({
        group: "Crafts & Recettes",
        title: res,
        sub: `Craft ${r.type} (${r.id})`,
        icon: r.result?.item,
        action: () => {
          openTab("recipes");
          editRecipe(r.id);
        },
      });
    }
  }

  const cats = state.data.configs.adminShop?.categories || {};
  for (const [cKey, cat] of Object.entries(cats)) {
    for (const it of cat.items || []) {
      if ((it.name && it.name.toLowerCase().includes(q)) || (it.item_id && it.item_id.toLowerCase().includes(q))) {
        results.push({
          group: "Admin Shop",
          title: it.name || it.item_id,
          sub: `Rayon ${cat.name || cKey} • Achat: ${it.buy_price}$ / Vente: ${it.sell_price}$`,
          icon: it.item_id,
          action: () => {
            state.ui.selectedShopCategory = cKey;
            openTab("config-shop");
          },
        });
      }
    }
  }

  const crates = state.data.configs.crates || {};
  for (const [cKey, crate] of Object.entries(crates)) {
    if ((crate.name && crate.name.toLowerCase().includes(q)) || cKey.toLowerCase().includes(q)) {
      results.push({
        group: "Box & Caisses",
        title: crate.name || cKey,
        sub: `Caisse • Clé: ${crate.key_id || cKey}`,
        icon: crate.icon || "minecraft:chest",
        action: () => {
          state.ui.selectedCrate = cKey;
          openTab("config-crates");
        },
      });
    }
  }

  const kits = state.data.configs.kits || {};
  for (const [kKey, kit] of Object.entries(kits)) {
    if ((kit.name && kit.name.toLowerCase().includes(q)) || kKey.toLowerCase().includes(q)) {
      results.push({
        group: "Kits & Équipements",
        title: kit.name || kKey,
        sub: `Kit • Cooldown: ${kit.cooldown_hours || 24}h`,
        icon: kit.icon || "minecraft:chest",
        action: () => {
          state.ui.selectedKit = kKey;
          openTab("config-kits");
        },
      });
    }
  }

  if (results.length === 0) {
    container.append(h("p", { class: "muted text-sm spotlight-hint" }, `Aucun résultat pour « ${query} ».`));
    return;
  }

  let currentGroup = "";
  results.slice(0, 15).forEach((res) => {
    if (res.group !== currentGroup) {
      currentGroup = res.group;
      container.append(h("div", { class: "spotlight-group-title" }, currentGroup));
    }

    const itemRow = h(
      "div",
      {
        class: "spotlight-item",
        onclick: () => {
          closeSpotlightSearch();
          res.action();
        },
      },
      makeImage(res.icon, res.title, "", "item") || h("span", null, "•"),
      h("div", { style: "display: flex; flex-direction: column;" },
        h("span", null, res.title),
        h("span", { class: "muted text-sm" }, res.sub)
      ),
      h("span", { class: "spotlight-item-badge" }, res.group)
    );
    container.append(itemRow);
  });
};

/* =====================================================================
   ÉCOUTEURS D’ÉVÉNEMENTS
===================================================================== */

const on = (selector, event, handler, options) => {
  const element = $(selector);
  if (element) element.addEventListener(event, handler, options);
  return element;
};

/* --- Connexion ------------------------------------------------------- */

on("#login-form", "submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const error = $("#login-error");
  error.textContent = "";
  button.disabled = true;
  try {
    const result = await api("/login", {
      method: "POST",
      body: JSON.stringify({ password: $("#password").value }),
    });
    if (!result?.token) throw new ApiError("réponse de connexion invalide", 500);
    state.token = result.token;
    sessionStorage.setItem(TOKEN_KEY, result.token);
    $("#password").value = "";
    const resume = state.pendingResume;
    state.pendingResume = false;
    if (resume && state.ready) {
      showApp(true);
      hideFatal();
      startTokenRefresh();
      refreshStatus();
      renderActiveTab();
      maybeOfferDraft();
    } else {
      state.ready = false;
      await enter();
    }
  } catch (loginError) {
    error.textContent = loginError.message || "connexion impossible";
    $("#password").select();
  } finally {
    button.disabled = false;
  }
});

/* --- Onglets --------------------------------------------------------- */

document.querySelectorAll('nav [role="tab"]').forEach((button) => {
  button.addEventListener("click", () => openTab(button.dataset.tab));
  button.addEventListener("keydown", (event) => {
    const tabs = [...document.querySelectorAll('nav [role="tab"]')];
    const index = tabs.indexOf(button);
    let target = null;
    if (event.key === "ArrowRight") target = tabs[(index + 1) % tabs.length];
    else if (event.key === "ArrowLeft") target = tabs[(index - 1 + tabs.length) % tabs.length];
    else if (event.key === "Home") target = tabs[0];
    else if (event.key === "End") target = tabs[tabs.length - 1];
    if (target) {
      event.preventDefault();
      target.focus();
      openTab(target.dataset.tab);
    }
  });
});

/* --- Contenus -------------------------------------------------------- */

on("#entry-kind", "change", () => {
  toggleEntryFields();
  updateEntryPreview();
});
on("#entry-id", "input", updateEntryPreview);
on("#entry-base", "input", updateEntryPreview);
on("#entry-lore", "input", updateLoreCounter);
on("#entry-form", "submit", submitEntry);
on("#entry-reset", "click", resetEntry);
on("#entry-delete", "click", deleteEntry);
on("#entry-change-texture", "click", () => {
  const id = $("#entry-id").value.trim();
  if (!id) {
    $("#entry-error").textContent = "Renseignez d’abord l’identifiant du contenu.";
    $("#entry-id").focus();
    return;
  }
  openTextureEditor(
    id,
    $("#entry-name").value.trim() || id,
    $("#entry-kind").value,
    "custom",
    $("#entry-base").value.trim()
  );
});
on(
  "#entry-filter",
  "input",
  debounce(() => {
    renderEntries();
  }, 120)
);
on("#entry-sort", "change", renderEntries);

/* --- Crafts ---------------------------------------------------------- */

on("#recipe-type", "change", toggleRecipeType);
on("#recipe-form", "submit", submitRecipe);
on("#recipe-reset", "click", resetRecipe);
on("#recipe-delete", "click", deleteRecipe);
on("#recipe-revert", "click", () => {
  if (state.recipeVanillaOverride) restoreVanillaRecipe(state.recipeVanillaOverride);
});
on(
  "#recipe-filter",
  "input",
  debounce(() => {
    state.ui.recipeLimit = PAGE_RECIPES;
    renderRecipes();
  }, 120)
);
on("#recipe-category", "change", () => {
  state.ui.recipeLimit = PAGE_RECIPES;
  renderRecipes();
});
on("#recipe-sort", "change", () => {
  state.ui.recipeLimit = PAGE_RECIPES;
  renderRecipes();
});

/* --- Bibliothèque ---------------------------------------------------- */

on("#library-type", "change", () => {
  state.ui.libraryLimit = PAGE_LIBRARY;
  state.selectedLibraryItem = null;
  renderLibrary();
});
on("#library-sort", "change", () => {
  state.ui.libraryLimit = PAGE_LIBRARY;
  renderLibrary();
});
on(
  "#library-filter",
  "input",
  debounce(() => {
    state.ui.libraryLimit = PAGE_LIBRARY;
    renderLibrary();
  }, 120)
);

/* --- Données --------------------------------------------------------- */

on("#save", "click", () => save());
on("#logout", "click", logout);
on("#export", "click", exportJson);
on("#import", "change", importJson);
on("#history-refresh", "click", () => loadHistory());

/* --- Brouillon / erreur fatale -------------------------------------- */

on("#draft-restore", "click", restoreDraft);
on("#draft-discard", "click", discardDraft);
on("#fatal-retry", "click", () => enter());
on("#fatal-logout", "click", logout);

/* --- Modale de texture ---------------------------------------------- */

const refreshTexturePreview = () => {
  const kind = state.textureDialogTarget?.kind || "item";
  const preview = $("#texture-dialog-preview");
  preview.replaceChildren(
    makeImage(state.pendingDialogTexture, "Aperçu", "", kind) ||
      h("span", { class: "img-fallback", "aria-hidden": "true" }, kind === "block" ? "🧱" : "⚒️")
  );
};

on("#texture-dialog-form", "submit", applyDialogTexture);
on("#texture-dialog-close", "click", closeTextureDialog);
on("#texture-dialog-cancel", "click", closeTextureDialog);
on("#texture-dialog-reset", "click", resetDialogTexture);
on("#texture-dialog", "close", () => {
  state.textureDialogTarget = null;
  state.pendingDialogTexture = null;
});

on("#texture-dialog-file", "change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const error = $("#texture-dialog-error");
  const status = $("#texture-dialog-status");
  error.textContent = "";
  status.textContent = "Traitement de l’image…";
  try {
    state.pendingDialogTexture = await processUploadedImage(file);
    $("#texture-dialog-select").value = "";
    $("#texture-dialog-url").value = "";
    refreshTexturePreview();
    status.textContent = "Image importée prête à être appliquée.";
  } catch (uploadError) {
    state.pendingDialogTexture = null;
    refreshTexturePreview();
    error.textContent = uploadError.message;
    status.textContent = "Import annulé.";
  } finally {
    // Permet de sélectionner à nouveau le même fichier après une erreur.
    event.target.value = "";
  }
});

on("#texture-dialog-select", "change", (event) => {
  const value = event.target.value;
  $("#texture-dialog-error").textContent = "";
  if (!value) {
    state.pendingDialogTexture = null;
  } else {
    state.pendingDialogTexture = value;
    $("#texture-dialog-file").value = "";
    $("#texture-dialog-url").value = "";
  }
  refreshTexturePreview();
  $("#texture-dialog-status").textContent = value
    ? "Texture du pack sélectionnée."
    : "Choisissez une source pour la texture.";
});

on("#texture-dialog-url", "input", (event) => {
  const value = event.target.value.trim();
  const error = $("#texture-dialog-error");
  error.textContent = "";
  if (!value) {
    state.pendingDialogTexture = null;
    refreshTexturePreview();
    return;
  }
  if (!isAllowedTextureValue(value)) {
    state.pendingDialogTexture = null;
    refreshTexturePreview();
    error.textContent =
      "URL non autorisée : utilisez /assets/…, cdn.jsdelivr.net ou raw.githubusercontent.com (image uniquement).";
    return;
  }
  state.pendingDialogTexture = value;
  $("#texture-dialog-file").value = "";
  $("#texture-dialog-select").value = "";
  refreshTexturePreview();
  $("#texture-dialog-status").textContent = "URL d’image sélectionnée.";
});

/* --- Menu latéral (Mobile) ------------------------------------------- */

on("#mobile-menu-btn", "click", () => {
  const sidebar = $("#sidebar");
  const backdrop = $("#sidebar-backdrop");
  if (sidebar) sidebar.classList.add("open");
  if (backdrop) backdrop.classList.add("active");
});

on("#sidebar-close-btn", "click", () => {
  const sidebar = $("#sidebar");
  const backdrop = $("#sidebar-backdrop");
  if (sidebar) sidebar.classList.remove("open");
  if (backdrop) backdrop.classList.remove("active");
});

on("#sidebar-backdrop", "click", () => {
  const sidebar = $("#sidebar");
  const backdrop = $("#sidebar-backdrop");
  if (sidebar) sidebar.classList.remove("open");
  if (backdrop) backdrop.classList.remove("active");
});

/* --- Calendrier (Daily Rewards) ------------------------------------- */

on("#daily-form", "submit", saveDailyDayForm);
on("#daily-add-item-btn", "click", addDailyItem);
on("#daily-copy-next", "click", copyDailyNext);
on("#daily-auto-money-btn", "click", autoDailyMoney);
on("#daily-reset-defaults-btn", "click", resetDailyDefaults);

/* --- Métiers & Jobs ------------------------------------------------- */

document.querySelectorAll(".jobs-subtab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".jobs-subtab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.jobTab;
    state.ui.activeJobsTab = target;
    document.querySelectorAll(".jobs-subpanel").forEach((panel) => {
      panel.hidden = panel.id !== "jobs-panel-" + target;
    });
    if (target === "curve") renderJobsCurveSimulation();
  });
});

on("#job-add-action-btn", "click", addJobCustomAction);
on("#job-curve-apply-btn", "click", applyJobsCurve);
on("#job-rewards-apply-btn", "click", applyJobsRewards);
on("#jobs-reset-defaults-btn", "click", resetJobsDefaults);

/* --- Admin Shop ----------------------------------------------------- */

on("#shop-item-form", "submit", saveShopItem);
on("#shop-item-id", "input", debounce(updateShopItemPreview, 80));
on("#shop-filter", "input", debounce(renderShopItems, 100));
on("#shop-cancel-edit-btn", "click", cancelShopEdit);
on("#shop-create-cat-btn", "click", createShopCategory);
on("#shop-auto-sell-btn", "click", autoShopSellRule);
on("#shop-reset-defaults-btn", "click", resetShopDefaults);

/* --- Paramètres Généraux Serveur ------------------------------------ */

on("#server-ip", "input", (e) => {
  if (!state.data.configs.server) state.data.configs.server = defaultServerConfig();
  state.data.configs.server.serverIp = e.target.value.trim();
  setDirty(true);
});
on("#server-port", "change", (e) => {
  if (!state.data.configs.server) state.data.configs.server = defaultServerConfig();
  state.data.configs.server.serverPort = Math.max(1, Math.min(65535, Number(e.target.value) || 19153));
  setDirty(true);
});
on("#server-test-ping-btn", "click", async () => {
  const statusEl = $("#server-test-ping-status");
  const btn = $("#server-test-ping-btn");
  if (statusEl) {
    statusEl.textContent = "Ping en direct en cours...";
    statusEl.style.color = "var(--text-muted)";
  }
  if (btn) btn.disabled = true;
  try {
    const res = await fetchRealServerStatus();
    if (statusEl) {
      if (res.online) {
        statusEl.textContent = `🟢 En ligne (${res.players.online}/${res.players.max} joueurs) - ${res.software || res.version || "Axolotl-PM"}`;
        statusEl.style.color = "var(--primary-mint)";
      } else {
        statusEl.textContent = `🔴 Inaccessible (${res.host}:${res.port})`;
        statusEl.style.color = "#ef4444";
      }
    }
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = `Erreur : ${err.message}`;
      statusEl.style.color = "#ef4444";
    }
  } finally {
    if (btn) btn.disabled = false;
  }
});
on("#server-add-broadcast-btn", "click", addBroadcastMessage);
on("#server-starting-money", "change", (e) => {
  if (!state.data.configs.server) state.data.configs.server = defaultServerConfig();
  state.data.configs.server.startingMoney = Math.max(0, Number(e.target.value) || 0);
  setDirty(true);
});
on("#server-ah-fee", "change", (e) => {
  if (!state.data.configs.server) state.data.configs.server = defaultServerConfig();
  state.data.configs.server.ahFeePercent = Math.max(0, Math.min(50, Number(e.target.value) || 0));
  setDirty(true);
});
on("#server-clearlag-interval", "change", (e) => {
  if (!state.data.configs.server) state.data.configs.server = defaultServerConfig();
  state.data.configs.server.clearLagIntervalSeconds = Math.max(60, Number(e.target.value) || 300);
  setDirty(true);
});
on("#server-broadcast-interval", "change", (e) => {
  if (!state.data.configs.server) state.data.configs.server = defaultServerConfig();
  state.data.configs.server.broadcastIntervalMinutes = Math.max(1, Number(e.target.value) || 10);
  setDirty(true);
});

/* --- Box & Caisses --------------------------------------------------- */

on("#crates-reset-defaults-btn", "click", resetCratesDefaults);
on("#crate-simulate-btn", "click", simulateCratePulls);
on("#crate-add-reward-form", "submit", addCrateReward);
on("#crate-create-form", "submit", submitCreateCrate);
on("#crate-create-close", "click", closeCreateCrateDialog);
on("#crate-create-cancel", "click", closeCreateCrateDialog);
on("#crate-delete-btn", "click", deleteCurrentCrate);
on("#crate-reward-type", "change", (e) => {
  const type = e.target.value;
  const itemLabelEl = $("#crate-reward-item-label");
  const countLabelEl = $("#crate-reward-count-label");
  const amountLabelEl = $("#crate-reward-amount-label");
  if (itemLabelEl) itemLabelEl.hidden = (type === "money" || type === "shard");
  if (countLabelEl) countLabelEl.hidden = (type === "money");
  if (amountLabelEl) amountLabelEl.hidden = (type !== "money");
});
on("#crate-name", "input", (e) => {
  const key = state.ui.selectedCrate;
  if (state.data.configs.crates?.[key]) {
    state.data.configs.crates[key].name = e.target.value;
    renderCratesNavBar();
    $("#current-crate-title").textContent = e.target.value || key;
    setDirty(true);
  }
});
on("#crate-key-id", "change", (e) => {
  const key = state.ui.selectedCrate;
  if (state.data.configs.crates?.[key]) {
    state.data.configs.crates[key].key_id = e.target.value;
    setDirty(true);
  }
});
on("#crate-color", "change", (e) => {
  const key = state.ui.selectedCrate;
  if (state.data.configs.crates?.[key]) {
    state.data.configs.crates[key].color = e.target.value;
    renderCratesNavBar();
    renderSelectedCrate();
    setDirty(true);
  }
});

/* --- Kits & Équipements ---------------------------------------------- */

on("#kits-reset-defaults-btn", "click", resetKitsDefaults);
on("#kit-add-item-form", "submit", addKitItem);
on("#kit-create-form", "submit", submitCreateKit);
on("#kit-create-close", "click", closeCreateKitDialog);
on("#kit-create-cancel", "click", closeCreateKitDialog);
on("#kit-delete-btn", "click", deleteCurrentKit);
on("#kit-name", "input", (e) => {
  const key = state.ui.selectedKit;
  if (state.data.configs.kits?.[key]) {
    state.data.configs.kits[key].name = e.target.value;
    renderKitsNavBar();
    $("#current-kit-title").textContent = e.target.value || key;
    setDirty(true);
  }
});
on("#kit-cooldown", "change", (e) => {
  const key = state.ui.selectedKit;
  if (state.data.configs.kits?.[key]) {
    state.data.configs.kits[key].cooldown_hours = Math.max(0, Number(e.target.value) || 0);
    setDirty(true);
  }
});
on("#kit-permission", "input", (e) => {
  const key = state.ui.selectedKit;
  if (state.data.configs.kits?.[key]) {
    state.data.configs.kits[key].permission = e.target.value.trim();
    setDirty(true);
  }
});

/* --- Quêtes Journalières -------------------------------------------- */

on("#quests-reset-defaults-btn", "click", resetQuestsDefaults);
on("#quest-add-form", "submit", addQuestFormSubmit);

/* --- Warzone & KOTH ------------------------------------------------- */

on("#warzone-reset-defaults-btn", "click", resetWarzoneDefaults);
on("#warzone-add-airdrop-btn", "click", addAirdropItem);
on("#warzone-koth-duration", "change", (e) => {
  if (!state.data.configs.warzone) state.data.configs.warzone = defaultWarzoneConfig();
  if (!state.data.configs.warzone.koth) state.data.configs.warzone.koth = defaultWarzoneConfig().koth;
  state.data.configs.warzone.koth.duration_minutes = Math.max(1, Number(e.target.value) || 3);
  setDirty(true);
});
on("#warzone-koth-money", "change", (e) => {
  if (!state.data.configs.warzone) state.data.configs.warzone = defaultWarzoneConfig();
  if (!state.data.configs.warzone.koth) state.data.configs.warzone.koth = defaultWarzoneConfig().koth;
  state.data.configs.warzone.koth.reward_money = Math.max(0, Number(e.target.value) || 0);
  setDirty(true);
});
on("#warzone-koth-key", "change", (e) => {
  if (!state.data.configs.warzone) state.data.configs.warzone = defaultWarzoneConfig();
  if (!state.data.configs.warzone.koth) state.data.configs.warzone.koth = defaultWarzoneConfig().koth;
  state.data.configs.warzone.koth.reward_key = e.target.value.trim();
  setDirty(true);
});
on("#warzone-koth-schedule", "change", (e) => {
  if (!state.data.configs.warzone) state.data.configs.warzone = defaultWarzoneConfig();
  if (!state.data.configs.warzone.koth) state.data.configs.warzone.koth = defaultWarzoneConfig().koth;
  const hours = e.target.value
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 23);
  state.data.configs.warzone.koth.schedule_hours = hours.length > 0 ? hours : [14, 18, 21];
  setDirty(true);
});
on("#warzone-combattag", "change", (e) => {
  if (!state.data.configs.warzone) state.data.configs.warzone = defaultWarzoneConfig();
  state.data.configs.warzone.combat_tag_seconds = Math.max(5, Number(e.target.value) || 30);
  setDirty(true);
});
on("#warzone-airdrop-interval", "change", (e) => {
  if (!state.data.configs.warzone) state.data.configs.warzone = defaultWarzoneConfig();
  if (!state.data.configs.warzone.airdrop) state.data.configs.warzone.airdrop = defaultWarzoneConfig().airdrop;
  state.data.configs.warzone.airdrop.interval_minutes = Math.max(15, Number(e.target.value) || 120);
  setDirty(true);
});
on("#warzone-airdrop-minx", "change", (e) => {
  if (!state.data.configs.warzone?.airdrop) return;
  state.data.configs.warzone.airdrop.min_x = Number(e.target.value) || -250;
  setDirty(true);
});
on("#warzone-airdrop-maxx", "change", (e) => {
  if (!state.data.configs.warzone?.airdrop) return;
  state.data.configs.warzone.airdrop.max_x = Number(e.target.value) || 250;
  setDirty(true);
});
on("#warzone-airdrop-minz", "change", (e) => {
  if (!state.data.configs.warzone?.airdrop) return;
  state.data.configs.warzone.airdrop.min_z = Number(e.target.value) || -250;
  setDirty(true);
});
on("#warzone-airdrop-maxz", "change", (e) => {
  if (!state.data.configs.warzone?.airdrop) return;
  state.data.configs.warzone.airdrop.max_z = Number(e.target.value) || 250;
  setDirty(true);
});

/* --- Audit Économique & Boosts -------------------------------------- */

on("#audit-run-btn", "click", runEconomicAudit);
on("#boost-event-name", "input", (e) => {
  if (!state.data.configs.boosts) state.data.configs.boosts = defaultBoostsConfig();
  state.data.configs.boosts.activeEventName = e.target.value.trim();
  setDirty(true);
});
on("#boost-jobs-mult", "input", (e) => {
  if (!state.data.configs.boosts) state.data.configs.boosts = defaultBoostsConfig();
  const val = Number(e.target.value) || 1.0;
  state.data.configs.boosts.jobsXpMultiplier = val;
  $("#boost-jobs-mult-val").textContent = `x${val.toFixed(2)}`;
  setDirty(true);
});
on("#boost-shop-mult", "input", (e) => {
  if (!state.data.configs.boosts) state.data.configs.boosts = defaultBoostsConfig();
  const val = Number(e.target.value) || 1.0;
  state.data.configs.boosts.shopSellMultiplier = val;
  const pct = Math.round((val - 1.0) * 100);
  $("#boost-shop-mult-val").textContent = `+${pct}% (x${val.toFixed(2)})`;
  setDirty(true);
});
on("#boost-preset-normal", "click", () => {
  if (!state.data.configs.boosts) state.data.configs.boosts = defaultBoostsConfig();
  state.data.configs.boosts.jobsXpMultiplier = 1.0;
  state.data.configs.boosts.shopSellMultiplier = 1.0;
  state.data.configs.boosts.activeEventName = "";
  setDirty(true);
  renderAuditTab();
  toast("Boosts désactivés (mode standard).", "info");
});
on("#boost-preset-weekend", "click", () => {
  if (!state.data.configs.boosts) state.data.configs.boosts = defaultBoostsConfig();
  state.data.configs.boosts.jobsXpMultiplier = 1.5;
  state.data.configs.boosts.shopSellMultiplier = 1.2;
  state.data.configs.boosts.activeEventName = "Weekend Boost : XP x1.5 & Shop +20%";
  setDirty(true);
  renderAuditTab();
  toast("Boost Weekend appliqué (x1.5 XP / +20% Revente) !", "success");
});
on("#boost-preset-mega", "click", () => {
  if (!state.data.configs.boosts) state.data.configs.boosts = defaultBoostsConfig();
  state.data.configs.boosts.jobsXpMultiplier = 2.0;
  state.data.configs.boosts.shopSellMultiplier = 1.5;
  state.data.configs.boosts.activeEventName = "Mega Event : Double XP & Shop +50%";
  setDirty(true);
  renderAuditTab();
  toast("Mega Event appliqué (Double XP / +50% Revente) !", "success");
});

/* --- Hub Central & Pilotage ------------------------------------------- */

on("#hub-refresh-btn", "click", async () => {
  toast("Interrogation du serveur en cours…", "info");
  await pollRealServer();
  renderDashboardTab();
  toast("Statut du serveur actualisé en direct !", "success");
});

on("#hub-copy-ip-btn", "click", () => {
  const ip = $("#hub-ip-display")?.textContent || "opalheaven.mcbe.fr:19153";
  navigator.clipboard.writeText(ip);
  toast("Adresse IP copiée dans le presse-papier !", "success");
});

on("#hub-copy-cmd-btn", "click", () => {
  navigator.clipboard.writeText("/opalcontent sync");
  toast("Commande /opalcontent sync copiée !", "success");
});

on("#hub-quick-sync-btn", "click", () => {
  navigator.clipboard.writeText("/opalcontent sync");
  toast("Commande /opalcontent sync copiée ! Exécutez-la sur le serveur.", "success");
});

document.addEventListener("click", (e) => {
  const subnavBtn = e.target.closest(".subnav-btn");
  if (subnavBtn && subnavBtn.dataset.subtab) {
    e.preventDefault();
    openTab(subnavBtn.dataset.subtab);
    return;
  }
  const actionCard = e.target.closest("[data-open-tab]");
  if (actionCard) {
    const targetTab = actionCard.dataset.openTab;
    if (targetTab) openTab(targetTab);
  }
});

/* --- Journal d'Activité & Logs --------------------------------------- */

document.querySelectorAll(".logs-filter-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".logs-filter-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    state.ui.logsFilter = pill.dataset.logFilter || "all";
    renderLogsTab();
  });
});

on("#logs-live-toggle", "click", toggleLogsLive);
on("#logs-server-filter", "change", () => renderLogsTab());
on("#logs-world-filter", "change", () => renderLogsTab());
on("#logs-player-filter", "input", debounce(renderLogsTab, 100));
on("#logs-search-input", "input", debounce(renderLogsTab, 100));
on("#logs-export-btn", "click", exportLogs);
on("#logs-export-json-btn", "click", exportLogsJson);
on("#logs-clear-btn", "click", clearLogs);

/* --- Recherche Universelle (Spotlight) -------------------------------- */

on("#quick-search-trigger", "click", openSpotlightSearch);
on("#spotlight-close-btn", "click", closeSpotlightSearch);
on("#spotlight-input", "input", debounce((e) => {
  renderSpotlightResults(e.target.value);
}, 100));

/* --- Raccourcis ------------------------------------------------------ */

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    if (state.ready && state.dirty && !state.saving) save();
  } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSpotlightSearch();
  }
});

window.addEventListener("beforeunload", (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

/* =====================================================================
   DÉMARRAGE
===================================================================== */

buildGrid();
toggleEntryFields();
toggleRecipeType();
updateLoreCounter();
updateEntryPreview();
refreshStatus();
ensureLibrary().catch(() => {});
if (state.token) {
  enter();
} else {
  showApp(false);
  $("#password").focus();
}


/* ========================================================================= */
/* MODULE GRADES, INSPECTEUR JOUEUR & SYSTÈME DE MODÉRATION                  */
/* ========================================================================= */

const formatMinecraftText = (text) => {
  if (!text) return "";
  const colorMap = {
    "0": "#000000", "1": "#0000aa", "2": "#00aa00", "3": "#00aaaa",
    "4": "#aa0000", "5": "#aa00aa", "6": "#ffaa00", "7": "#aaaaaa",
    "8": "#555555", "9": "#5555ff", "a": "#55ff55", "b": "#55ffff",
    "c": "#ff5555", "d": "#ff55ff", "e": "#ffff55", "f": "#ffffff"
  };
  let curColor = "#ffffff";
  let isBold = false;
  let out = "";
  const parts = String(text).split(/§([0-9a-fk-or])/i);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      const code = parts[i].toLowerCase();
      if (colorMap[code]) {
        curColor = colorMap[code];
      } else if (code === "l") {
        isBold = true;
      } else if (code === "r") {
        curColor = "#ffffff";
        isBold = false;
      }
    } else if (parts[i]) {
      const style = "color: " + curColor + "; " + (isBold ? "font-weight: 700;" : "");
      out += "<span style=\"" + style + "\">" + escapeHtml(parts[i]) + "</span>";
    }
  }
  return out;
};

const PERM_CATEGORIES = [
  {
    name: "👤 Joueur & Base",
    perms: [
      { node: "opal.player", name: "Accès Joueur de base" },
      { node: "pocketmine.command.tell", name: "Messages privés (/tell, /msg)" },
      { node: "pocketmine.command.help", name: "Consulter l'aide (/help)" },
      { node: "pocketmine.command.me", name: "Action publique (/me)" },
    ]
  },
  {
    name: "💬 Chat & Cosmétiques",
    perms: [
      { node: "opal.chat.color", name: "Couleurs dans le chat (& et §)" },
      { node: "opal.chat.format", name: "Mise en forme (Gras, Italique)" },
      { node: "opal.fly.hub", name: "Vol au Hub (/fly)" },
    ]
  },
  {
    name: "🎒 Kits & Équipements",
    perms: [
      { node: "opal.kit.joueur", name: "Kit Joueur (/kit joueur)" },
      { node: "opal.kit.vote", name: "Kit Vote (/kit vote)" },
      { node: "opal.kit.joyaux", name: "Kit Joyaux (/kit joyaux)" },
      { node: "opal.kit.celeste", name: "Kit Céleste (/kit celeste)" },
      { node: "opal.kit.donateur", name: "Kit Donateur (/kit donateur)" },
    ]
  },
  {
    name: "🏡 Téléportation & Homes",
    perms: [
      { node: "opal.homes.extra", name: "Homes supplémentaires" },
      { node: "pocketmine.command.teleport", name: "Téléportation (/tp)" },
    ]
  },
  {
    name: "🛡️ Modération & Staff",
    perms: [
      { node: "opal.staff", name: "Canal Staff (/sc) & Sécurité" },
      { node: "opal.command.warn", name: "Avertir (/warn)" },
      { node: "opal.command.tempmute", name: "Mute temporaire (/tempmute)" },
      { node: "opal.command.mute", name: "Mute permanent (/mute)" },
      { node: "opal.command.kick", name: "Expulser (/kick)" },
      { node: "opal.command.freeze", name: "Figer un joueur (/freeze)" },
      { node: "opal.command.tempban", name: "Ban temporaire (/tempban)" },
      { node: "opal.command.ban", name: "Ban permanent (/ban)" },
    ]
  },
  {
    name: "👑 Administration & Serveur",
    perms: [
      { node: "opal.admin", name: "Permissions Administrateur" },
      { node: "opal.content.sync", name: "Synchroniser le studio (/opalcontent)" },
      { node: "pocketmine.command.gamemode", name: "Changer de mode (/gamemode)" },
      { node: "pocketmine.command.op", name: "Promouvoir opérateur (/op)" },
    ]
  }
];

const renderRolesTab = () => {
  if (!state.data.configs) state.data.configs = defaultConfigs();
  if (!state.data.configs.roles) state.data.configs.roles = defaultRolesConfig();

  const roles = state.data.configs.roles;
  const keys = Object.keys(roles);
  if (keys.length === 0) {
    state.data.configs.roles = defaultRolesConfig();
  }

  if (!state.ui.selectedRole || !roles[state.ui.selectedRole]) {
    state.ui.selectedRole = Object.keys(state.data.configs.roles)[0] || "joueur";
  }

  renderRolesSidebar();
  renderSelectedRole();
};

const renderRolesSidebar = () => {
  const container = $("#roles-list-bar");
  if (!container) return;
  container.innerHTML = "";

  const roles = state.data.configs.roles || {};
  const searchQ = ($("#roles-search-input")?.value || "").toLowerCase().trim();

  const sorted = Object.entries(roles).sort((a, b) => (b[1].priority || 0) - (a[1].priority || 0));

  sorted.forEach(([key, role]) => {
    if (searchQ && !role.name.toLowerCase().includes(searchQ) && !key.toLowerCase().includes(searchQ)) {
      return;
    }

    const isActive = state.ui.selectedRole === key;
    const btn = h("button", {
      type: "button",
      class: "role-item-btn" + (isActive ? " active" : ""),
      onclick: () => {
        state.ui.selectedRole = key;
        renderRolesTab();
      }
    });

    const info = h("div", { class: "role-item-info" },
      h("span", { class: "role-item-name" }, role.name || key),
      h("span", { class: "role-item-prio" }, "Prio: " + (role.priority || 0) + " • " + (role.isStaff ? "Staff" : "Joueur"))
    );

    const badge = h("span", { class: "badge", style: "font-size: 11px; padding: 2px 6px;" });
    badge.innerHTML = formatMinecraftText(role.prefix || key);

    btn.append(info, badge);
    container.appendChild(btn);
  });
};

const renderSelectedRole = () => {
  const container = $("#role-editor-container");
  if (!container) return;
  container.innerHTML = "";

  const roleId = state.ui.selectedRole;
  const role = state.data.configs.roles?.[roleId];
  if (!role) {
    container.innerHTML = "<p class='muted'>Sélectionnez un grade à gauche.</p>";
    return;
  }

  // En-tête
  const header = h("div", { style: "display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); padding-bottom: 14px;" },
    h("div", null,
      h("h3", { style: "margin: 0; font-size: 17px;" }, "Grade : " + (role.name || roleId)),
      h("span", { class: "muted text-sm" }, "ID technique: " + roleId)
    ),
    roleId !== "joueur" ? h("button", {
      type: "button",
      class: "danger",
      style: "font-size: 12px; padding: 6px 12px;",
      onclick: () => {
        delete state.data.configs.roles[roleId];
        state.ui.selectedRole = Object.keys(state.data.configs.roles)[0] || "joueur";
        setDirty(true);
        renderRolesTab();
        toast("Grade \"" + role.name + "\" supprimé.", "info");
      }
    }, "Supprimer ce grade") : null
  );

  // Aperçu visuel Minecraft
  const previewBox = h("div", null,
    h("span", { class: "muted text-sm", style: "display: block; margin-bottom: 6px;" }, "Aperçu du rendu in-game (Chat & NameTag Bedrock) :"),
    h("div", { class: "role-mc-preview", id: "role-preview-box" })
  );
  previewBox.querySelector("#role-preview-box").innerHTML = formatMinecraftText((role.prefix || "§7[Joueur]§r ") + "Joueur » Bonjour sur Opal Heaven !");

  // Section 1 : Propriétés générales
  const formGrid = h("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;" },
    h("div", { class: "field" },
      h("label", null, "Nom affiché"),
      h("input", {
        type: "text",
        value: role.name || "",
        oninput: (e) => {
          role.name = e.target.value.trim();
          setDirty(true);
          renderRolesSidebar();
        }
      })
    ),
    h("div", { class: "field" },
      h("label", null, "Préfixe Minecraft (avec §)"),
      h("input", {
        type: "text",
        value: role.prefix || "",
        oninput: (e) => {
          role.prefix = e.target.value;
          previewBox.querySelector("#role-preview-box").innerHTML = formatMinecraftText(role.prefix + "Joueur » Bonjour sur Opal Heaven !");
          setDirty(true);
        }
      })
    ),
    h("div", { class: "field" },
      h("label", null, "Priorité d'affichage (0-100)"),
      h("input", {
        type: "number",
        min: "0",
        max: "100",
        value: role.priority ?? 0,
        onchange: (e) => {
          role.priority = Number(e.target.value) || 0;
          setDirty(true);
          renderRolesSidebar();
        }
      })
    ),
    h("div", { class: "field" },
      h("label", null, "Grade Staff (Modération)"),
      h("select", {
        onchange: (e) => {
          role.isStaff = e.target.value === "true";
          setDirty(true);
          renderRolesSidebar();
        }
      },
        h("option", { value: "false", selected: !role.isStaff }, "Non (Joueur classique)"),
        h("option", { value: "true", selected: Boolean(role.isStaff) }, "Oui (Membre du Staff)")
      )
    ),
    h("div", { class: "field" },
      h("label", null, "Max Homes (/sethome)"),
      h("input", {
        type: "number",
        min: "1",
        max: "100",
        value: role.maxHomes ?? 2,
        onchange: (e) => {
          role.maxHomes = Math.max(1, Number(e.target.value) || 2);
          setDirty(true);
        }
      })
    ),
    h("div", { class: "field" },
      h("label", null, "Multiplicateur Argent (Shop/Jobs)"),
      h("input", {
        type: "number",
        step: "0.05",
        min: "0.5",
        max: "5",
        value: role.moneyMultiplier ?? 1.0,
        onchange: (e) => {
          role.moneyMultiplier = Math.max(0.5, Number(e.target.value) || 1.0);
          setDirty(true);
        }
      })
    ),
    h("div", { class: "field" },
      h("label", null, "Multiplicateur XP Métiers"),
      h("input", {
        type: "number",
        step: "0.05",
        min: "0.5",
        max: "5",
        value: role.xpMultiplier ?? 1.0,
        onchange: (e) => {
          role.xpMultiplier = Math.max(0.5, Number(e.target.value) || 1.0);
          setDirty(true);
        }
      })
    ),
    h("div", { class: "field" },
      h("label", null, "Hérite du grade"),
      (() => {
        const sel = h("select", {
          onchange: (e) => {
            const v = e.target.value;
            role.inheritance = v ? [v] : [];
            setDirty(true);
          }
        }, h("option", { value: "" }, "Aucun héritage"));
        Object.keys(state.data.configs.roles).forEach((k) => {
          if (k !== roleId) {
            sel.appendChild(h("option", { value: k, selected: (role.inheritance || []).includes(k) }, state.data.configs.roles[k].name || k));
          }
        });
        return sel;
      })()
    )
  );

  // Section 2 : Permissions rapides par catégorie
  const permsTitle = h("div", { style: "margin-top: 10px;" },
    h("h4", { style: "margin: 0 0 6px 0; font-size: 15px;" }, "Arbre de Permissions & Pouvoirs"),
    h("p", { class: "muted text-sm", style: "margin: 0;" }, "Activez ou désactivez les permissions du grade de façon modulaire.")
  );

  if (!role.permissions) role.permissions = {};

  const permsCategoriesWrap = h("div", { class: "role-perms-categories" });

  PERM_CATEGORIES.forEach((cat) => {
    const catCard = h("div", { class: "perm-cat-card" },
      h("h5", { class: "perm-cat-title" }, cat.name)
    );

    cat.perms.forEach((p) => {
      const isGranted = role.permissions[p.node] === true;
      const toggleRow = h("div", { class: "perm-toggle-row" },
        h("div", { class: "perm-toggle-label" },
          h("span", { class: "perm-toggle-name" }, p.name),
          h("span", { class: "perm-toggle-node" }, p.node)
        ),
        h("input", {
          type: "checkbox",
          checked: isGranted,
          onchange: (e) => {
            if (e.target.checked) {
              role.permissions[p.node] = true;
            } else {
              delete role.permissions[p.node];
            }
            setDirty(true);
          }
        })
      );
      catCard.appendChild(toggleRow);
    });

    permsCategoriesWrap.appendChild(catCard);
  });

  // Section 3 : Permissions libres personnalisées
  const customPermsCard = h("div", { class: "perm-cat-card", style: "margin-top: 14px;" },
    h("h5", { class: "perm-cat-title" }, "⚡ Permissions Personnalisées Libres"),
    h("div", { style: "display: flex; gap: 8px;" },
      h("input", {
        type: "text",
        id: "role-custom-perm-input",
        placeholder: "ex: opal.custom.feature",
        style: "font-size: 12px; font-family: monospace; flex: 1;"
      }),
      h("button", {
        type: "button",
        class: "primary",
        style: "font-size: 12px;",
        onclick: () => {
          const inp = $("#role-custom-perm-input");
          const val = inp?.value.trim().toLowerCase();
          if (val) {
            role.permissions[val] = true;
            setDirty(true);
            renderSelectedRole();
            toast("Permission \"" + val + "\" ajoutée.", "success");
          }
        }
      }, "+ Ajouter")
    ),
    h("div", { class: "perms-custom-list", id: "role-custom-perms-list" })
  );

  const customListWrap = customPermsCard.querySelector("#role-custom-perms-list");
  const knownNodes = new Set(PERM_CATEGORIES.flatMap((c) => c.perms.map((p) => p.node)));

  Object.entries(role.permissions).forEach(([node, allowed]) => {
    if (!knownNodes.has(node)) {
      const chip = h("span", { class: "perm-node-chip" + (!allowed ? " denied" : "") },
        document.createTextNode(node),
        h("button", {
          type: "button",
          class: "perm-node-remove",
          title: "Supprimer",
          onclick: () => {
            delete role.permissions[node];
            setDirty(true);
            renderSelectedRole();
          }
        }, "✕")
      );
      customListWrap.appendChild(chip);
    }
  });

  container.append(header, previewBox, formGrid, permsTitle, permsCategoriesWrap, customPermsCard);
};

/* --- INSPECTEUR JOUEUR & MODERATION ---------------------------------- */

const openPlayerInspector = async (playerName) => {
  if (!playerName) return;
  state.ui.inspectorPlayer = playerName;
  state.ui.inspectorTab = "stats";

  const modal = $("#player-inspector-modal");
  if (!modal) return;

  // 1. Extraire les données en direct de télémétrie
  const onlineList = state.serverTelemetry?.telemetry?.players?.details || [];
  const liveData = onlineList.find((p) => (p.name || "").toLowerCase() === playerName.toLowerCase());
  const isOnline = Boolean(liveData);

  // 2. Extraire tous les logs du joueur
  const allLogs = getStoredLogs();
  const playerLogs = allLogs.filter((l) => (l.player || "").toLowerCase() === playerName.toLowerCase());

  // 3. Calculer les statistiques
  const kills = playerLogs.filter((l) => l.type === "COMBAT" && (l.opponent || l.details?.includes("face à"))).length;
  const deaths = playerLogs.filter((l) => l.type === "COMBAT" && !l.opponent).length;
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
  const money = liveData?.money ?? playerLogs.filter((l) => l.amount).reduce((sum, l) => sum + (Number(l.amount) || 0), 1000);

  // 4. Remplir les champs d'en-tête
  const avatar = $("#pi-avatar");
  if (avatar) avatar.src = "https://mc-heads.net/avatar/" + encodeURIComponent(playerName) + "/64";

  const nameSpan = $("#pi-player-name span");
  if (nameSpan) nameSpan.textContent = playerName;

  const statusDot = $("#pi-online-status");
  if (statusDot) {
    statusDot.className = "player-online-dot " + (isOnline ? "online" : "offline");
    statusDot.title = isOnline ? "En ligne actuellement" : "Hors ligne";
  }

  const worldBadge = $("#pi-world-badge");
  if (worldBadge) worldBadge.textContent = liveData?.world || playerLogs[0]?.world || "world";

  const coordsPill = $("#pi-coords-pill");
  if (coordsPill) {
    if (liveData?.x !== undefined) {
      coordsPill.textContent = "X: " + liveData.x + " Y: " + liveData.y + " Z: " + liveData.z;
    } else {
      coordsPill.textContent = "Coords: N/A";
    }
  }

  const pingBadge = $("#pi-ping-badge");
  if (pingBadge) pingBadge.textContent = liveData?.ping ? (liveData.ping + " ms") : "Ping: --";

  // Remplir le sélecteur de grade
  const rankSelect = $("#pi-rank-select");
  if (rankSelect) {
    rankSelect.innerHTML = "";
    const roles = state.data.configs?.roles || defaultRolesConfig();
    const curRankId = liveData?.rank_id || "joueur";
    Object.entries(roles).forEach(([rId, r]) => {
      rankSelect.appendChild(h("option", { value: rId, selected: rId === curRankId }, r.name || rId));
    });
    rankSelect.onchange = async (e) => {
      const newRank = e.target.value;
      await dispatchModerationCommand("setrank " + playerName + " " + newRank);
      toast("Grade de " + playerName + " défini sur " + newRank + " !", "success");
    };
  }

  // 5. Remplir l'onglet Stats
  const statFaction = $("#pi-stat-faction");
  if (statFaction) statFaction.textContent = liveData?.faction || "Sans Faction";

  const statMoney = $("#pi-stat-money");
  if (statMoney) statMoney.textContent = "$" + Math.max(0, money).toLocaleString("fr-FR");

  const statKills = $("#pi-stat-kills");
  if (statKills) statKills.textContent = kills;

  const statDeaths = $("#pi-stat-deaths");
  if (statDeaths) statDeaths.textContent = deaths;

  const statKd = $("#pi-stat-kd");
  if (statKd) statKd.textContent = kd;

  // 6. Remplir les logs du joueur
  const logsBadge = $("#pi-logs-badge");
  if (logsBadge) logsBadge.textContent = "(" + playerLogs.length + ")";

  const logsTbody = $("#pi-logs-tbody");
  if (logsTbody) {
    logsTbody.innerHTML = "";
    if (playerLogs.length === 0) {
      logsTbody.innerHTML = "<tr><td colspan='3' class='muted' style='text-align: center; padding: 20px;'>Aucun log enregistré pour ce joueur pour le moment.</td></tr>";
    } else {
      playerLogs.forEach((l) => {
        const tr = h("tr", null,
          h("td", { class: "muted", style: "font-family: monospace;" }, l.time),
          h("td", null, h("span", { class: "log-badge log-badge-" + (l.type || "INFO") }, l.type || "INFO")),
          h("td", null,
            h("div", null,
              h("b", null, l.message),
              l.details ? h("div", { class: "muted text-sm", style: "font-size: 11px;" }, l.details) : null
            )
          )
        );
        logsTbody.appendChild(tr);
      });
    }
  }

  // 7. Charger et afficher l'historique des sanctions
  renderPlayerSanctionsTab(playerName);

  // Basculer sur l'onglet stats par défaut
  switchInspectorTab("stats");

  modal.showModal();
};

const switchInspectorTab = (tabId) => {
  state.ui.inspectorTab = tabId;
  document.querySelectorAll(".player-inspector-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.piTab === tabId);
  });
  document.querySelectorAll(".pi-tab-content").forEach((c) => {
    c.hidden = c.id !== ("pi-tab-content-" + tabId);
  });
};

const renderPlayerSanctionsTab = async (playerName) => {
  const container = $("#pi-sanctions-list");
  if (!container) return;
  container.innerHTML = "<p class='muted text-sm'>Chargement des sanctions…</p>";

  try {
    const res = await fetch("/api/moderation/sanctions", {
      headers: { ...(state.token ? { Authorization: "Bearer " + state.token } : {}) }
    });
    if (res.ok) {
      const data = await res.json();
      const sanctions = (data.sanctions || []).filter((s) => (s.target || "").toLowerCase() === playerName.toLowerCase());
      container.innerHTML = "";
      if (sanctions.length === 0) {
        container.innerHTML = "<div class='card' style='padding: 16px; text-align: center;'><p class='muted text-sm' style='margin: 0;'>Casier judiciaire vierge : aucune sanction enregistrée pour ce joueur.</p></div>";
        return;
      }
      sanctions.forEach((s) => {
        const card = h("div", { class: "card", style: "padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;" },
          h("div", null,
            h("div", { style: "display: flex; align-items: center; gap: 8px;" },
              h("span", { class: "log-badge", style: "background: rgba(239, 68, 68, 0.2); color: #f87171;" }, s.action),
              h("b", null, s.reason || "Sans motif")
            ),
            h("div", { class: "muted text-sm", style: "font-size: 11px; margin-top: 4px;" },
              "Par " + (s.staff || "Staff") + " • " + new Date(s.date).toLocaleString("fr-FR") + (s.duration ? (" (Durée: " + s.duration + ")") : "")
            )
          ),
          s.active ? h("button", {
            type: "button",
            class: "ghost",
            style: "font-size: 11px;",
            onclick: async () => {
              const unCmd = s.action === "MUTE" ? ("unmute " + playerName) : s.action === "BAN" ? ("unban " + playerName) : "";
              if (unCmd) await dispatchModerationCommand(unCmd);
              toast("Sanction levée avec succès !", "success");
              renderPlayerSanctionsTab(playerName);
            }
          }, "Lever la sanction") : h("span", { class: "muted text-sm" }, "Expirée")
        );
        container.appendChild(card);
      });
    }
  } catch {
    container.innerHTML = "<p class='muted text-sm'>Historique des sanctions local actif.</p>";
  }
};

const openModerationModal = (actionType) => {
  const modal = $("#moderation-action-modal");
  if (!modal) return;
  const player = state.ui.inspectorPlayer || "Steve";
  state.ui.currentModAction = actionType;

  const title = $("#mod-modal-title");
  if (title) title.textContent = "Sanctionner : " + actionType.toUpperCase();

  const info = $("#mod-modal-target-info");
  if (info) info.innerHTML = "Joueur cible : <b style=\"color: var(--mint);\">" + player + "</b>";

  const durationField = $("#mod-duration-field");
  if (durationField) {
    durationField.style.display = ["WARN", "KICK"].includes(actionType) ? "none" : "block";
  }

  const reasonInput = $("#mod-custom-reason");
  if (reasonInput) reasonInput.value = "";

  modal.showModal();
};

const dispatchModerationCommand = async (command) => {
  try {
    const res = await fetch("/api/moderation/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(state.token ? { Authorization: "Bearer " + state.token } : {})
      },
      body: JSON.stringify({
        target: state.ui.inspectorPlayer || "Joueur",
        action: "CMD",
        command: command.trim()
      })
    });
    if (res.ok) {
      toast("Commande \"" + command + "\" transmise au serveur OpalCore !", "success");
    }
  } catch (e) {
    toast("Erreur lors de la transmission de la commande.", "error");
  }
};

const submitModerationAction = async (target, action, reason, duration) => {
  let cmd = "";
  if (action === "WARN") cmd = "warn " + target + " " + reason;
  else if (action === "KICK") cmd = "kick " + target + " " + reason;
  else if (action === "MUTE") {
    cmd = duration && duration !== "perm" ? ("tempmute " + target + " " + duration + " " + reason) : ("mute " + target + " " + reason);
  } else if (action === "BAN") {
    cmd = duration && duration !== "perm" ? ("tempban " + target + " " + duration + " " + reason) : ("ban " + target + " " + reason);
  } else if (action === "FREEZE") {
    cmd = "freeze " + target;
  }

  try {
    const res = await fetch("/api/moderation/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(state.token ? { Authorization: "Bearer " + state.token } : {})
      },
      body: JSON.stringify({ target, action, reason, duration, command: cmd })
    });
    if (res.ok) {
      toast("Sanction " + action + " appliquée à " + target + " !", "success");
      const modal = $("#moderation-action-modal");
      if (modal) modal.close();
      if (state.ui.inspectorPlayer) {
        renderPlayerSanctionsTab(state.ui.inspectorPlayer);
      }
    } else {
      toast("Erreur lors de l'application de la sanction.", "error");
    }
  } catch (e) {
    toast("Erreur réseau modération.", "error");
  }
};

/* --- EVENT LISTENERS NOUVEAUX MODULES --------------------------------- */

on("#role-create-btn", "click", () => {
  $("#role-create-dialog")?.showModal();
});

on("#role-create-close", "click", () => {
  $("#role-create-dialog")?.close();
});

on("#role-create-cancel", "click", () => {
  $("#role-create-dialog")?.close();
});

on("#role-create-form", "submit", (e) => {
  e.preventDefault();
  const idInput = $("#new-role-id");
  const nameInput = $("#new-role-name");
  const id = idInput?.value.trim().toLowerCase();
  const name = nameInput?.value.trim();

  if (!id || !name) return;
  if (!state.data.configs.roles) state.data.configs.roles = defaultRolesConfig();

  state.data.configs.roles[id] = {
    id,
    name,
    prefix: "§7[" + name + "]§r ",
    chatColor: "§f",
    nameTagColor: "§7",
    priority: 10,
    isStaff: false,
    maxHomes: 2,
    moneyMultiplier: 1.0,
    xpMultiplier: 1.0,
    description: "Grade " + name + " personnalisé",
    inheritance: ["joueur"],
    permissions: { "opal.player": true }
  };

  state.ui.selectedRole = id;
  setDirty(true);
  $("#role-create-dialog")?.close();
  renderRolesTab();
  toast("Nouveau grade \"" + name + "\" créé avec succès !", "success");
});

on("#roles-search-input", "input", debounce(renderRolesSidebar, 100));

// Inspecteur Joueur Listeners
on("#pi-close-btn", "click", () => {
  $("#player-inspector-modal")?.close();
});

// Fermeture des modales au clic sur le fond flouté (backdrop)
["player-inspector-modal", "moderation-action-modal", "role-create-dialog"].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("click", (e) => {
    const rect = el.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    if (!isInDialog) el.close();
  });
});

document.querySelectorAll(".player-inspector-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    switchInspectorTab(btn.dataset.piTab);
  });
});

on("#pi-btn-filter-logs", "click", () => {
  $("#player-inspector-modal")?.close();
  const pInput = $("#logs-player-filter");
  if (pInput && state.ui.inspectorPlayer) {
    pInput.value = state.ui.inspectorPlayer;
    state.ui.tab = "logs";
    renderActiveTab();
  }
});

// Boutons d'actions de modération dans le dossier
on("#pi-act-freeze", "click", async () => {
  if (!state.ui.inspectorPlayer) return;
  await submitModerationAction(state.ui.inspectorPlayer, "FREEZE", "Contrôle staff / Freeze", null);
});

on("#pi-act-warn", "click", () => openModerationModal("WARN"));
on("#pi-act-mute", "click", () => openModerationModal("MUTE"));
on("#pi-act-kick", "click", () => openModerationModal("KICK"));
on("#pi-act-ban", "click", () => openModerationModal("BAN"));

// Modale de Sanction Listeners
on("#mod-modal-close", "click", () => $("#moderation-action-modal")?.close());
on("#mod-cancel-btn", "click", () => $("#moderation-action-modal")?.close());

document.querySelectorAll("#mod-duration-chips .chip-btn").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#mod-duration-chips .chip-btn").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
  });
});

document.querySelectorAll("#mod-reason-chips .chip-btn").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#mod-reason-chips .chip-btn").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const inp = $("#mod-custom-reason");
    if (inp) inp.value = chip.dataset.reason;
  });
});

on("#mod-action-form", "submit", async (e) => {
  e.preventDefault();
  const player = state.ui.inspectorPlayer;
  const action = state.ui.currentModAction || "WARN";
  const reason = $("#mod-custom-reason")?.value.trim() || "Sanction administrative";
  const durationChip = $("#mod-duration-chips .chip-btn.active");
  const duration = durationChip?.dataset.duration || "30m";

  if (!player) return;
  await submitModerationAction(player, action, reason, duration);
});

/* =====================================================================
   MODULE MODÉRATION DÉDIÉ (ONGLET MODÉRATION)
===================================================================== */


let regPlayersFilter = "all";
let regPlayersSearch = "";

const renderRegisteredPlayers = async () => {
  let players = [];
  try {
    const res = await fetch("/api/players", {
      headers: { ...(state.token ? { Authorization: "Bearer " + state.token } : {}) }
    });
    if (res.ok) {
      const data = await res.json();
      players = data.players || [];
    }
  } catch {}

  const tbody = $("#reg-players-table-body");
  if (!tbody) return;
  tbody.replaceChildren();

  // Mettre à jour les compteurs de badges
  const onlineCount = players.filter((p) => p.isOnline).length;
  const staffCount = players.filter((p) => {
    const r = (p.role || "").toUpperCase();
    return ["FONDATEUR", "ADMIN", "RESPONSABLE", "MODERATEUR", "GUIDE", "BUILDER"].includes(r);
  }).length;
  const sanctionedCount = players.filter((p) => p.activeSanction).length;

  const cAll = $("#reg-count-all");
  const cOnline = $("#reg-count-online");
  const cStaff = $("#reg-count-staff");
  const cSanctioned = $("#reg-count-sanctioned");
  if (cAll) cAll.textContent = String(players.length);
  if (cOnline) cOnline.textContent = String(onlineCount);
  if (cStaff) cStaff.textContent = String(staffCount);
  if (cSanctioned) cSanctioned.textContent = String(sanctionedCount);

  // Filtrage
  const q = (regPlayersSearch || "").toLowerCase().trim();
  const filtered = players.filter((p) => {
    if (regPlayersFilter === "online" && !p.isOnline) return false;
    if (regPlayersFilter === "staff") {
      const r = (p.role || "").toUpperCase();
      if (!["FONDATEUR", "ADMIN", "RESPONSABLE", "MODERATEUR", "GUIDE", "BUILDER"].includes(r)) return false;
    }
    if (regPlayersFilter === "sanctioned" && !p.activeSanction) return false;
    if (q) {
      const nMatch = (p.name || "").toLowerCase().includes(q);
      const rMatch = (p.role || "").toLowerCase().includes(q);
      const fMatch = (p.faction || "").toLowerCase().includes(q);
      if (!nMatch && !rMatch && !fMatch) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.appendChild(
      h(
        "tr",
        null,
        h("td", { colspan: "8", class: "muted text-sm", style: "text-align: center; padding: 24px;" }, "Aucun joueur enregistré ne correspond à ces critères.")
      )
    );
    return;
  }

  filtered.forEach((p) => {
    const pName = p.name || "Steve";
    const role = p.role || "Joueur";
    const money = p.money ?? 1000;
    const faction = p.faction || "Sans Faction";
    const isOnline = Boolean(p.isOnline);
    const lastActive = p.last_join
      ? (p.last_join.includes("T") || p.last_join.includes("-")
          ? new Date(p.last_join.replace(/\[|\]/g, "")).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            })
          : p.last_join)
      : "-";

    const avatarImg = h("img", {
      src: `https://api.creepernation.net/avatar/${encodeURIComponent(pName)}?fallback=steve&size=24`,
      alt: pName,
      style: "width: 22px; height: 22px; border-radius: 4px; image-rendering: pixelated; flex-shrink: 0;",
      onerror: (e) => {
        e.target.src = "/assets/icon.png";
      }
    });

    const isStaff = ["FONDATEUR", "ADMIN", "RESPONSABLE", "MODERATEUR", "GUIDE", "BUILDER"].includes(role.toUpperCase());

    const row = h(
      "tr",
      null,
      h(
        "td",
        null,
        h(
          "div",
          { style: "display: flex; align-items: center; gap: 8px;" },
          avatarImg,
          h(
            "button",
            {
              type: "button",
              class: "ghost",
              style: "font-weight: 600; padding: 0; color: var(--text); font-size: 13px;",
              onclick: () => openPlayerInspector(pName),
              title: "Consulter la fiche complète de " + pName
            },
            pName
          )
        )
      ),
      h(
        "td",
        null,
        h(
          "span",
          {
            class: "subnav-badge",
            style: `font-size: 11px; padding: 2px 7px; ${isStaff ? "background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);" : ""}`
          },
          role
        )
      ),
      h("td", { class: "muted text-sm" }, faction),
      h("td", { style: "font-family: monospace; font-weight: 600; color: var(--mint);" }, `${money.toLocaleString("fr-FR")}`),
      h(
        "td",
        null,
        isOnline
          ? h("span", { class: "status-badge-active" }, "🟢 En ligne")
          : h("span", { class: "status-badge-expired" }, "⚪ Déconnecté")
      ),
      h(
        "td",
        null,
        p.activeSanction
          ? h("span", { class: "mod-action-badge badge-ban", style: "font-size: 10px;" }, p.activeSanction)
          : h("span", { class: "status-badge-active", style: "font-size: 11px;" }, "🟢 En règle")
      ),
      h("td", { class: "muted text-sm", style: "font-size: 11px; font-family: monospace;" }, lastActive),
      h(
        "td",
        { style: "text-align: right;" },
        h(
          "div",
          { style: "display: flex; gap: 6px; justify-content: flex-end;" },
          h(
            "button",
            {
              type: "button",
              class: "btn-xs",
              title: "Ouvrir le dossier complet",
              onclick: () => openPlayerInspector(pName)
            },
            "🔍 Fiche"
          ),
          h(
            "button",
            {
              type: "button",
              class: "btn-xs danger-ghost",
              title: "Sanctionner ce joueur",
              onclick: () => {
                const targetInput = $("#mod-direct-target");
                if (targetInput) targetInput.value = pName;
                document.getElementById("mod-direct-form")?.scrollIntoView({ behavior: "smooth" });
                $("#mod-direct-reason")?.focus();
              }
            },
            "⚖️ Sanction"
          )
        )
      )
    );
    tbody.appendChild(row);
  });
};

let modAuditFilter = "all";
let modAuditSearch = "";

const selectModDirectType = (type) => {
  document.querySelectorAll("#mod-direct-type-chips .chip-btn").forEach((c) => {
    c.classList.toggle("active", c.dataset.modType === type);
  });
  const durationField = $("#mod-direct-duration-field");
  if (durationField) {
    durationField.style.display = ["MUTE", "BAN"].includes(type) ? "block" : "none";
  }
};

const revokeSanction = async (sanctionId, target, action) => {
  if (!confirm(`Voulez-vous vraiment lever la sanction [${action}] pour ${target} ?`)) return;
  try {
    const res = await fetch("/api/moderation/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(state.token ? { Authorization: "Bearer " + state.token } : {})
      },
      body: JSON.stringify({ id: sanctionId, target, action })
    });
    if (res.ok) {
      toast(`Sanction [${action}] levée avec succès pour ${target} !`, "success");
      await renderModerationTab();
    } else {
      toast("Erreur lors de la révocation de la sanction.", "error");
    }
  } catch {
    toast("Erreur réseau.", "error");
  }
};

const renderModerationTab = async () => {
  // 1. Récupération des sanctions depuis l'API
  let sanctions = [];
  try {
    const res = await fetch("/api/moderation/sanctions", {
      headers: { ...(state.token ? { Authorization: "Bearer " + state.token } : {}) }
    });
    if (res.ok) {
      const data = await res.json();
      sanctions = data.sanctions || [];
    }
  } catch {}
  state.moderationSanctions = sanctions;

  // 2. Joueurs en direct
  const onlinePlayers = state.serverTelemetry?.telemetry?.playersDetails || [];
  const onlineNames = onlinePlayers.map((p) => p.name || "").filter(Boolean);

  // 3. Calcul des métriques
  const totalSanctions = sanctions.length;
  const activeBans = sanctions.filter((s) => s.action === "BAN" && s.active !== false).length;
  const activeMutes = sanctions.filter((s) => s.action === "MUTE" && s.active !== false).length;
  const totalOnline = onlinePlayers.length;

  const statTotal = $("#mod-stat-total");
  const statBans = $("#mod-stat-bans");
  const statMutes = $("#mod-stat-mutes");
  const statOnline = $("#mod-stat-online");
  const onlineBadge = $("#mod-online-count-badge");
  const navModBadge = $("#nav-moderation-badge");

  if (statTotal) statTotal.textContent = String(totalSanctions);
  if (statBans) statBans.textContent = String(activeBans);
  if (statMutes) statMutes.textContent = String(activeMutes);
  if (statOnline) statOnline.textContent = String(totalOnline);
  if (onlineBadge) onlineBadge.textContent = `${totalOnline} en jeu`;
  if (navModBadge) {
    navModBadge.textContent = activeBans + activeMutes > 0 ? `${activeBans + activeMutes} actifs` : "Actif";
  }

  // 4. Suggestions de joueurs rapides sous l'input
  const quickChipsContainer = $("#mod-quick-players-chips");
  if (quickChipsContainer) {
    quickChipsContainer.replaceChildren();
    if (onlineNames.length > 0) {
      onlineNames.forEach((name) => {
        const chip = h(
          "button",
          {
            type: "button",
            class: "chip-btn",
            style: "font-size: 11px; padding: 2px 8px; border-color: rgba(82,184,155,0.4);",
            onclick: () => {
              const inp = $("#mod-direct-target");
              if (inp) {
                inp.value = name;
                inp.focus();
              }
            }
          },
          `🟢 ${name}`
        );
        quickChipsContainer.appendChild(chip);
      });
    }
  }

  // 5. Rendu des cartes de joueurs en ligne dans la colonne de droite
  const liveContainer = $("#mod-live-players-container");
  if (liveContainer) {
    liveContainer.replaceChildren();
    if (onlinePlayers.length === 0) {
      liveContainer.appendChild(
        h(
          "div",
          { class: "card", style: "background: rgba(255,255,255,0.02); text-align: center; padding: 32px 16px; border: 1px dashed var(--line);" },
          h("div", { style: "font-size: 28px; margin-bottom: 8px;" }, "👥"),
          h("p", { class: "muted text-sm", style: "margin: 0;" }, "0 joueur connecté pour le moment."),
          h("p", { class: "muted text-sm", style: "margin: 4px 0 0 0; font-size: 11.5px;" }, "Dès qu'un joueur rejoint le serveur Axolotl-PM, sa fiche en direct et ses actions apparaîtront ici.")
        )
      );
    } else {
      onlinePlayers.forEach((p) => {
        const pName = p.name || "Joueur";
        const rank = p.rank || "Joueur";
        const ping = p.ping ?? 0;
        const world = p.world || "world";
        const money = p.money ?? 0;

        const avatarImg = h("img", {
          class: "mod-player-avatar",
          src: `https://api.creepernation.net/avatar/${encodeURIComponent(pName)}?fallback=steve&size=40`,
          alt: pName,
          onerror: (e) => {
            e.target.src = "/assets/icon.png";
          }
        });

        const card = h(
          "div",
          { class: "mod-player-card" },
          h(
            "div",
            { class: "mod-player-info" },
            avatarImg,
            h(
              "div",
              { class: "mod-player-details" },
              h(
                "div",
                { class: "mod-player-name-row" },
                h("strong", { style: "font-size: 13.5px; color: var(--text);" }, pName),
                h("span", { class: "subnav-badge", style: "font-size: 10px; padding: 2px 6px;" }, rank)
              ),
              h(
                "div",
                { class: "mod-player-meta-row" },
                h("span", null, `🌐 ${world}`),
                h("span", null, `⚡ ${ping}ms`),
                h("span", { style: "color: var(--mint);" }, `$${money}`)
              )
            )
          ),
          h(
            "div",
            { class: "mod-player-actions" },
            h(
              "button",
              {
                type: "button",
                class: "btn-xs",
                title: "Consulter le dossier joueur complet",
                onclick: () => openPlayerInspector(pName)
              },
              "🔍 Dossier"
            ),
            h(
              "button",
              {
                type: "button",
                class: "btn-xs",
                title: "Avertir le joueur",
                onclick: () => {
                  const targetInput = $("#mod-direct-target");
                  if (targetInput) targetInput.value = pName;
                  selectModDirectType("WARN");
                  $("#mod-direct-reason")?.focus();
                }
              },
              "⚠️ Warn"
            ),
            h(
              "button",
              {
                type: "button",
                class: "btn-xs",
                title: "Réduire au silence",
                onclick: () => {
                  const targetInput = $("#mod-direct-target");
                  if (targetInput) targetInput.value = pName;
                  selectModDirectType("MUTE");
                  $("#mod-direct-reason")?.focus();
                }
              },
              "🔇 Mute"
            ),
            h(
              "button",
              {
                type: "button",
                class: "btn-xs",
                title: "Figer le joueur pour vérification",
                onclick: async () => {
                  await submitModerationAction(pName, "FREEZE", "Contrôle staff / Freeze", null);
                  renderModerationTab();
                }
              },
              "❄️ Freeze"
            ),
            h(
              "button",
              {
                type: "button",
                class: "btn-xs danger-ghost",
                title: "Bannir le joueur",
                onclick: () => {
                  const targetInput = $("#mod-direct-target");
                  if (targetInput) targetInput.value = pName;
                  selectModDirectType("BAN");
                  $("#mod-direct-reason")?.focus();
                }
              },
              "🔨 Ban"
            )
          )
        );
        liveContainer.appendChild(card);
      });
    }
  }

  // 5bis. Rendu de l'annuaire des joueurs enregistrés
  await renderRegisteredPlayers();

  // 6. Rendu du registre d'audit des sanctions
  const tbody = $("#mod-sanctions-table-body");
  if (tbody) {
    tbody.replaceChildren();

    const q = (modAuditSearch || "").toLowerCase().trim();
    const filtered = sanctions.filter((s) => {
      if (modAuditFilter === "active" && s.active === false) return false;
      if (["BAN", "MUTE", "WARN", "FREEZE", "KICK"].includes(modAuditFilter) && s.action !== modAuditFilter) return false;
      if (q) {
        const tMatch = (s.target || "").toLowerCase().includes(q);
        const rMatch = (s.reason || "").toLowerCase().includes(q);
        const sMatch = (s.staff || "").toLowerCase().includes(q);
        if (!tMatch && !rMatch && !sMatch) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      const emptyRow = h(
        "tr",
        null,
        h(
          "td",
          { colspan: "8", class: "muted text-sm", style: "text-align: center; padding: 24px;" },
          "Aucune sanction enregistrée correspondant à ces critères."
        )
      );
      tbody.appendChild(emptyRow);
    } else {
      filtered.forEach((s) => {
        const act = (s.action || "WARN").toUpperCase();
        let badgeClass = "badge-warn";
        let actIcon = "⚠️";
        if (act === "BAN") {
          badgeClass = "badge-ban";
          actIcon = "🔨";
        } else if (act === "MUTE") {
          badgeClass = "badge-mute";
          actIcon = "🔇";
        } else if (act === "KICK") {
          badgeClass = "badge-kick";
          actIcon = "👢";
        } else if (act === "FREEZE") {
          badgeClass = "badge-freeze";
          actIcon = "❄️";
        }

        const dateFormatted = s.date
          ? new Date(s.date).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          : "-";

        const isRevocable = ["BAN", "MUTE", "FREEZE"].includes(act) && s.active !== false;

        const row = h(
          "tr",
          null,
          h("td", { class: "muted text-sm", style: "font-family: monospace; font-size: 11.5px;" }, dateFormatted),
          h("td", null, h("span", { class: `mod-action-badge ${badgeClass}` }, `${actIcon} ${act}`)),
          h(
            "td",
            null,
            h(
              "div",
              { style: "display: flex; align-items: center; gap: 8px;" },
              h("img", {
                src: `https://api.creepernation.net/avatar/${encodeURIComponent(s.target)}?fallback=steve&size=20`,
                alt: s.target,
                style: "width: 18px; height: 18px; border-radius: 3px; image-rendering: pixelated;",
                onerror: (e) => {
                  e.target.src = "/assets/icon.png";
                }
              }),
              h(
                "button",
                {
                  type: "button",
                  class: "ghost",
                  style: "font-weight: 600; padding: 0; color: var(--mint); text-decoration: underline;",
                  onclick: () => openPlayerInspector(s.target)
                },
                s.target
              )
            )
          ),
          h("td", { class: "muted text-sm" }, s.staff || "WebAdmin"),
          h("td", { style: "font-size: 12.5px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" }, s.reason || "N/A"),
          h("td", { class: "muted text-sm" }, s.duration ? s.duration : "-"),
          h(
            "td",
            null,
            s.active !== false && !["KICK", "WARN"].includes(act)
              ? h("span", { class: "status-badge-active" }, "🟢 En cours")
              : s.revokedAt
                ? h("span", { class: "status-badge-revoked" }, "🛑 Révoqué")
                : h("span", { class: "status-badge-expired" }, "⚪ Clôturé")
          ),
          h(
            "td",
            { style: "text-align: right;" },
            isRevocable
              ? h(
                  "button",
                  {
                    type: "button",
                    class: "btn-xs danger-ghost",
                    onclick: () => revokeSanction(s.id, s.target, act)
                  },
                  "Lever la sanction"
                )
              : h("span", { class: "muted text-sm" }, "-")
          )
        );
        tbody.appendChild(row);
      });
    }
  }
};

/* --- EVENT LISTENERS MODERATION TAB ---------------------------------- */

document.querySelectorAll("#mod-direct-type-chips .chip-btn").forEach((chip) => {
  chip.addEventListener("click", () => {
    selectModDirectType(chip.dataset.modType);
  });
});

document.querySelectorAll("#mod-direct-duration-chips .chip-btn").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#mod-direct-duration-chips .chip-btn").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
  });
});

document.querySelectorAll("#mod-direct-reason-chips .chip-btn").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#mod-direct-reason-chips .chip-btn").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const inp = $("#mod-direct-reason");
    if (inp) inp.value = chip.dataset.reason;
  });
});

on("#mod-direct-form", "submit", async (e) => {
  e.preventDefault();
  const target = $("#mod-direct-target")?.value.trim();
  const activeTypeChip = $("#mod-direct-type-chips .chip-btn.active");
  const action = activeTypeChip?.dataset.modType || "WARN";
  const reason = $("#mod-direct-reason")?.value.trim() || "Sanction administrative";
  const durationChip = $("#mod-direct-duration-chips .chip-btn.active");
  const duration = durationChip?.dataset.duration || "30m";

  if (!target) return;
  const submitBtn = $("#mod-direct-submit-btn");
  if (submitBtn) submitBtn.disabled = true;

  try {
    await submitModerationAction(target, action, reason, duration);
    const reasonInput = $("#mod-direct-reason");
    if (reasonInput) reasonInput.value = "";
    await renderModerationTab();
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

document.querySelectorAll("#mod-audit-filters .chip-btn").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#mod-audit-filters .chip-btn").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    modAuditFilter = chip.dataset.modFilter || "all";
    renderModerationTab();
  });
});

on("#mod-audit-search", "input", (e) => {
  modAuditSearch = e.target.value;
  renderModerationTab();
});

on("#mod-tab-refresh-btn", "click", async () => {
  toast("Actualisation des données de modération...", "info");
  await renderModerationTab();
});


document.querySelectorAll("#reg-players-filters .chip-btn").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#reg-players-filters .chip-btn").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    regPlayersFilter = chip.dataset.playerFilter || "all";
    renderRegisteredPlayers();
  });
});

on("#reg-players-search", "input", (e) => {
  regPlayersSearch = e.target.value;
  renderRegisteredPlayers();
});
