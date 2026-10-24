import {
  BASE_RE,
  ID_RE,
  ING_RE,
  KINDS,
  LIMITS,
  TIER_RE,
  isAllowedTextureValue,
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
  ui: { tab: "library", libraryLimit: PAGE_LIBRARY, recipeLimit: PAGE_RECIPES },
};

let libraryPromise = null;

/* =====================================================================
   UTILITAIRES DOM / RÉSEAU
===================================================================== */

const $ = (selector) => document.querySelector(selector);

const h = (tag, attrs = {}, ...children) => {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) continue;
    if (key === "class") element.className = value;
    else if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2), value);
    } else {
      element.setAttribute(key, String(value));
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
   ONGLETS
===================================================================== */

const renderActiveTab = () => {
  if (!state.ready) return;
  if (state.ui.tab === "library") renderLibrary();
  else if (state.ui.tab === "entries") renderEntries();
  else if (state.ui.tab === "recipes") renderRecipes();
};

const openTab = (name) => {
  state.ui.tab = name;
  document.querySelectorAll("nav [role=tab]").forEach((button) => {
    const active = button.dataset.tab === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.hidden = tab.id !== "tab-" + name;
  });
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
  const data = await api("/content");
  applyContent(data);
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

  const cdnFolder = isBlock ? "blocks" : "items";
  return (
    "https://cdn.jsdelivr.net/gh/Mojang/bedrock-samples@main/resource_pack/textures/" +
    cdnFolder +
    "/" +
    (cleanBase || cleanId) +
    ".png"
  );
};

const itemIconUrl = (reference) => {
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
  const img = h("img", {
    src,
    alt,
    class: className,
    loading: "lazy",
    decoding: "async",
    "data-kind": kind,
  });
  img.addEventListener("error", () => {
    if (img.dataset.fallback !== "1" && img.src.includes("Mojang/bedrock-samples")) {
      img.dataset.fallback = "1";
      const file = img.src.split("/").pop();
      const folder = img.src.includes("/blocks/") ? "block" : "item";
      img.src =
        "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/assets/minecraft/textures/" +
        folder +
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

/* --- Raccourcis ------------------------------------------------------ */

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    if (state.ready && state.dirty && !state.saving) save();
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
