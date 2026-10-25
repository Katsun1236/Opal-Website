/**
 * Schéma de validation partagé entre le front (public/app.js) et la fonction
 * Netlify (netlify/functions/api.mjs).
 *
 * Toute règle métier sur le contenu doit vivre ici : c'est ce qui évite la
 * dérive qui avait conduit à des IDs de recettes smithing rejetés par le
 * serveur alors que le client les acceptait.
 */

export const LIMITS = {
  maxEntries: 500,
  maxRecipes: 1000,
  maxDisabledVanillaRecipes: 5000,
  maxTextures: 500,
  maxTextureLength: 500000,
  maxBody: 4194304,
  maxLoreLines: 10,
  maxLoreLength: 100,
};

export const ID_RE = /^[a-z0-9_]{2,40}$/;
export const BASE_RE = /^[a-z0-9_]{2,64}$/;
export const TIER_RE = /^[a-z0-9_]{1,20}$/;
export const ING_RE = /^(minecraft:[a-z0-9_]{2,64}|opal:[a-z0-9_]{2,40})$/;
export const KINDS = ["item", "block", "armor", "weapon", "tool"];
export const TYPES = ["shaped", "shapeless", "furnace"];
// Les anciens identifiants positionnels (`_0001`) restent valides pour ne pas
// casser le contenu déjà publié. Les nouvelles recettes utilisent un hash
// stable de 12 caractères hexadécimaux.
export const VANILLA_RECIPE_ID =
  /^vanilla_(shaped|shapeless|brewing|brewing_container|smithing)_(?:\d{2,4}|[a-f0-9]{12})$/;
export const TEXTURE_REF = /^(minecraft|opal):[a-z0-9_]{2,64}$/;
export const TEXTURE_BARE = /^[a-z0-9_]{2,64}$/;
export const HISTORY_KEY_RE = /^history\/\d{10,16}-r\d+$/;

const TEXTURE_VALUE_PATTERNS = [
  /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
  /^\/assets\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*(?:\?[A-Za-z0-9._=&%-]*)?$/,
  /^https:\/\/cdn\.jsdelivr\.net\/[A-Za-z0-9._/@%-]+$/,
  /^https:\/\/raw\.githubusercontent\.com\/[A-Za-z0-9._/@%-]+$/,
];

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const FORBIDDEN_TEXTURE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const clean = (value, max) =>
  typeof value === "string" ? value.replace(CONTROL_CHARS, "").trim().slice(0, max) : "";

const asInt = (value, min, max, label) => {
  const number = value === undefined || value === null || value === "" ? 0 : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new ValidationError(label + " invalide");
  }
  return number;
};

export const isAllowedTextureValue = (value) => {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.length > LIMITS.maxTextureLength) return false;
  if (value.includes("..")) return false;
  return TEXTURE_VALUE_PATTERNS.some((pattern) => pattern.test(value));
};

/**
 * Normalise les clés de textures vers `minecraft:<id>` / `opal:<id>`.
 * Les anciennes clés nues sont conservées une dernière fois puis migrées.
 */
export const normalizeTextures = (raw, entryIds, { strict = true } = {}) => {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) {
    if (strict) throw new ValidationError("textures personnalisées invalides");
    return {};
  }

  const result = Object.create(null);
  const bare = [];

  for (const [rawKey, value] of Object.entries(raw)) {
    const key = String(rawKey);
    if (!isAllowedTextureValue(value)) {
      if (strict) throw new ValidationError("texture invalide pour " + key);
      continue;
    }
    if (TEXTURE_REF.test(key)) {
      const id = key.slice(key.indexOf(":") + 1);
      if (FORBIDDEN_TEXTURE_KEYS.has(id)) {
        if (strict) throw new ValidationError("référence de texture interdite : " + key);
        continue;
      }
      if (result[key] === undefined) result[key] = value;
      continue;
    }
    if (TEXTURE_BARE.test(key) && !FORBIDDEN_TEXTURE_KEYS.has(key)) {
      bare.push([key, value]);
      continue;
    }
    if (strict) throw new ValidationError("référence de texture invalide : " + key);
  }

  for (const [key, value] of bare) {
    const target = entryIds.has(key) ? "opal:" + key : "minecraft:" + key;
    // Clé nue identique à la clé canonique déjà présente : doublon de
    // l'ancien format (le front écrivait trois clés pour une texture).
    if (result[target] === value) continue;
    if (result[target] === undefined) result[target] = value;
  }

  const entries = Object.entries(result);
  if (entries.length > LIMITS.maxTextures) {
    if (strict) throw new ValidationError("limite de " + LIMITS.maxTextures + " textures personnalisées dépassée");
    return Object.fromEntries(entries.slice(0, LIMITS.maxTextures));
  }
  return { ...result };
};

/**
 * Valide et normalise un document de contenu.
 * @param {unknown} data
 * @param {{ strict?: boolean, knownOpalIds?: Set<string> | null }} options
 *   `knownOpalIds` permet au client de vérifier les références `opal:` contre
 *   les entrées personnalisées + le catalogue Opal Heaven. Le serveur ne
 *   dispose pas du catalogue et se contente donc de valider le format.
 * @returns {object} document canonique (sans revision/updatedAt)
 */
export const validateContent = (data, { strict = true, knownOpalIds = null } = {}) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ValidationError("structure invalide");
  }
  if (!Array.isArray(data.entries) || !Array.isArray(data.recipes)) {
    throw new ValidationError("structure invalide");
  }
  if (data.entries.length > LIMITS.maxEntries || data.recipes.length > LIMITS.maxRecipes) {
    throw new ValidationError("trop d'éléments");
  }

  const entryIds = new Set();
  const entries = data.entries.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new ValidationError("contenu invalide");
    }
    const id = String(entry.id ?? "");
    if (!ID_RE.test(id)) {
      throw new ValidationError("identifiant invalide : " + clean(id, 40));
    }
    if (entryIds.has(id)) {
      throw new ValidationError("identifiant en double : " + id);
    }
    entryIds.add(id);
    if (!KINDS.includes(entry.kind)) {
      throw new ValidationError("type invalide pour " + id);
    }
    const baseItem = String(entry.baseItem ?? "").replace(/^minecraft:/, "").toLowerCase();
    if (!BASE_RE.test(baseItem)) {
      throw new ValidationError("item de base invalide pour " + id);
    }
    const name = clean(entry.name, 80);
    if (!name) throw new ValidationError("nom manquant pour " + id);
    const tier = entry.tier ? clean(entry.tier, 20).toLowerCase() : "";
    if (tier && !TIER_RE.test(tier)) {
      throw new ValidationError("tier invalide pour " + id);
    }
    const lore = Array.isArray(entry.lore)
      ? entry.lore
          .slice(0, LIMITS.maxLoreLines)
          .map((line) => clean(line, LIMITS.maxLoreLength))
          .filter(Boolean)
      : [];
    return {
      id,
      kind: entry.kind,
      name,
      baseItem,
      lore,
      tier,
      durability: asInt(entry.durability, 0, 100000, "durabilité de " + id),
      charges: asInt(entry.charges, 0, 1000, "charges de " + id),
    };
  });

  const assertRef = (reference, label) => {
    if (typeof reference !== "string" || !ING_RE.test(reference)) {
      throw new ValidationError("ingrédient invalide pour " + label);
    }
    if (reference.startsWith("opal:")) {
      const referenced = reference.slice(5);
      if (knownOpalIds && !knownOpalIds.has(referenced)) {
        throw new ValidationError("ingrédient inconnu (" + reference + ") pour " + label);
      }
    }
  };

  const recipeIds = new Set();
  const overrides = new Map();
  const recipes = data.recipes.map((recipe) => {
    if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) {
      throw new ValidationError("craft invalide");
    }
    const id = String(recipe.id ?? "");
    if (!ID_RE.test(id)) {
      throw new ValidationError("identifiant de craft invalide : " + clean(id, 40));
    }
    if (recipeIds.has(id)) {
      throw new ValidationError("identifiant de craft en double : " + id);
    }
    if (!TYPES.includes(recipe.type)) {
      throw new ValidationError("type de craft invalide pour " + id);
    }
    if (!recipe.result || typeof recipe.result !== "object") {
      throw new ValidationError("résultat invalide pour " + id);
    }
    assertRef(recipe.result.item, id);
    const count = asInt(recipe.result.count, 1, 64, "quantité de " + id);
    const out = { id, type: recipe.type, result: { item: recipe.result.item, count } };

    if (recipe.type === "furnace") {
      assertRef(recipe.input, id);
      out.input = recipe.input;
    } else if (recipe.type === "shapeless") {
      if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length < 1 || recipe.ingredients.length > 9) {
        throw new ValidationError("ingrédients invalides pour " + id);
      }
      recipe.ingredients.forEach((ingredient) => assertRef(ingredient, id));
      out.ingredients = recipe.ingredients.slice();
    } else {
      if (!Array.isArray(recipe.pattern) || recipe.pattern.length < 1 || recipe.pattern.length > 3) {
        throw new ValidationError("forme invalide pour " + id);
      }
      const width = typeof recipe.pattern[0] === "string" ? recipe.pattern[0].length : 0;
      if (width < 1 || width > 3) {
        throw new ValidationError("forme invalide pour " + id);
      }
      if (!recipe.pattern.every((row) => typeof row === "string" && row.length === width && /^[A-I ]+$/.test(row))) {
        throw new ValidationError("forme invalide pour " + id);
      }
      if (!recipe.key || typeof recipe.key !== "object" || Array.isArray(recipe.key)) {
        throw new ValidationError("légende invalide pour " + id);
      }
      const used = new Set(recipe.pattern.join("").replace(/ /g, ""));
      if (used.size === 0) throw new ValidationError("craft vide : " + id);
      const key = {};
      for (const letter of used) {
        assertRef(recipe.key[letter], id);
        key[letter] = recipe.key[letter];
      }
      out.pattern = recipe.pattern.slice();
      out.key = key;
    }

    if (recipe.vanillaOverride !== undefined && recipe.vanillaOverride !== null && recipe.vanillaOverride !== "") {
      if (typeof recipe.vanillaOverride !== "string" || !VANILLA_RECIPE_ID.test(recipe.vanillaOverride)) {
        throw new ValidationError("recette vanilla remplacée invalide pour " + id);
      }
      if (overrides.has(recipe.vanillaOverride)) {
        throw new ValidationError(
          "deux crafts remplacent la même recette vanilla : " + recipe.vanillaOverride
        );
      }
      overrides.set(recipe.vanillaOverride, id);
      out.vanillaOverride = recipe.vanillaOverride;
    }

    recipeIds.add(id);
    return out;
  });

  const rawDisabled = data.disabledVanillaRecipes ?? [];
  if (!Array.isArray(rawDisabled) || rawDisabled.length > LIMITS.maxDisabledVanillaRecipes) {
    throw new ValidationError("liste de recettes vanilla désactivées invalide");
  }
  const disabled = new Set();
  for (const id of rawDisabled) {
    if (typeof id !== "string" || !VANILLA_RECIPE_ID.test(id)) {
      throw new ValidationError("recette vanilla désactivée invalide : " + clean(String(id), 40));
    }
    disabled.add(id);
  }
  // Cohérence : une recette remplacée doit aussi être désactivée.
  for (const vanillaId of overrides.keys()) disabled.add(vanillaId);

  const textureOpalIds = new Set([...entryIds, ...(knownOpalIds || [])]);
  const customTextures = normalizeTextures(data.customTextures ?? {}, textureOpalIds, { strict });

  const result = {
    version: 1,
    schemaVersion: 2,
    entries,
    recipes,
    disabledVanillaRecipes: [...disabled].sort(),
    customTextures,
  };

  if (data.configs !== undefined && data.configs !== null) {
    result.configs = normalizeConfigs(data.configs, { strict });
  }

  return result;
};

export const defaultDailyRewards = () => {
  const days = [];
  const milestones = {
    7: { key: "commune", tokens: 50 },
    14: { key: "rare", tokens: 100 },
    21: { key: "epique", tokens: 150 },
    30: { key: "legendaire", tokens: 250, shard: 5 },
  };
  for (let d = 1; d <= 30; d++) {
    const money = d <= 5 ? d * 500 : d <= 15 ? 2500 + (d - 5) * 650 : 9000 + (d - 15) * 800;
    const tokens = milestones[d]?.tokens || (d % 3 === 0 ? d * 5 : 0);
    const key = milestones[d]?.key || "";
    const items = [];
    if (d === 1) items.push({ item: "minecraft:bread", count: 32, name: "Pain frais" });
    else if (d === 2) items.push({ item: "minecraft:iron_ingot", count: 8, name: "Lingot de fer" });
    else if (d === 4) items.push({ item: "minecraft:gold_ingot", count: 4, name: "Lingot d'or" });
    else if (d === 5) items.push({ item: "opal:gemme_opale", count: 1, name: "Tesson d'opale" });
    else if (d === 6) items.push({ item: "minecraft:experience_bottle", count: 8, name: "Bouteille d'expérience" });
    else if (d === 8) items.push({ item: "minecraft:cooked_beef", count: 16, name: "Steak cuit" });
    else if (d === 9) items.push({ item: "minecraft:redstone", count: 16, name: "Poudre de redstone" });
    else if (d === 11) items.push({ item: "minecraft:iron_ingot", count: 16, name: "Lingot de fer" });
    else if (d === 15) items.push({ item: "opal:gemme_opale", count: 3, name: "Tessons d'opale" });
    else if (d === 16) items.push({ item: "minecraft:golden_apple", count: 1, name: "Pomme dorée" });
    else if (d === 18) items.push({ item: "minecraft:diamond", count: 4, name: "Diamant pur" });
    else if (d === 20) items.push({ item: "opal:gemme_rubis", count: 2, name: "Gemme de rubis" });
    else if (d === 25) items.push({ item: "minecraft:netherite_ingot", count: 1, name: "Lingot de Netherite" });
    else if (d === 30) items.push({ item: "opal:gemme_opale", count: 5, name: "Opales Célestes" });

    days.push({
      day: d,
      money: Math.round(money),
      tokens,
      key,
      shard: milestones[d]?.shard || 0,
      items,
    });
  }
  return days;
};

export const defaultJobsConfig = () => ({
  curve: {
    baseXp: 100,
    exponent: 1.75,
    multiplier: 55,
    maxLevel: 50,
    mainVocationBonusPercent: 25,
    prestigeBonusPercent: 5,
  },
  levelRewards: {
    moneyMultiplier: 250,
    tokensMultiplier: 5,
    talentPointsPerLevel: 1,
  },
  actions: {
    abysses: [
      { id: "ore_opal", name: "Minerai d'Opale Céleste", xp: 60, icon: "opal:gemme_opale" },
      { id: "ore_silver", name: "Minerai d'Argent", xp: 45, icon: "opal:silver_ingot" },
      { id: "ore_ruby", name: "Minerai de Rubis", xp: 25, icon: "opal:gemme_rubis" },
      { id: "ore_diamond", name: "Minerai de Diamant / Netherite", xp: 20, icon: "minecraft:diamond" },
      { id: "ore_emerald", name: "Minerai d'Émeraude", xp: 20, icon: "minecraft:emerald" },
      { id: "ore_gold", name: "Minerai d'Or", xp: 10, icon: "minecraft:gold_ingot" },
      { id: "ore_redstone", name: "Minerai de Redstone", xp: 10, icon: "minecraft:redstone" },
      { id: "ore_lapis", name: "Minerai de Lapis-lazuli", xp: 10, icon: "minecraft:lapis_lazuli" },
      { id: "ore_iron", name: "Minerai de Fer", xp: 5, icon: "minecraft:iron_ingot" },
      { id: "ore_coal", name: "Minerai de Charbon", xp: 5, icon: "minecraft:coal" },
      { id: "ore_copper", name: "Minerai de Cuivre", xp: 5, icon: "minecraft:copper_ingot" },
      { id: "stone", name: "Roche / Pierre naturelle", xp: 1, icon: "minecraft:cobblestone" },
    ],
    terre: [
      { id: "crop_mature", name: "Récolte mûre (Blé, Carottes, Patates, Verrue)", xp: 5, icon: "minecraft:wheat" },
      { id: "crop_block", name: "Cultures en bloc (Melon, Citrouille, Canne)", xp: 4, icon: "minecraft:melon_slice" },
      { id: "seed_plant", name: "Semis & Plantations", xp: 2, icon: "minecraft:wheat_seeds" },
    ],
    guerre: [
      { id: "mob_hostile", name: "Élimination de monstre hostile", xp: 15, icon: "minecraft:bone" },
      { id: "boss_kill", name: "Élimination de Boss / Gardien de Warzone", xp: 100, icon: "minecraft:nether_star" },
      { id: "player_kill", name: "Élimination de joueur (PvP)", xp: 50, icon: "minecraft:diamond_sword" },
    ],
  },
});

export const defaultAdminShopConfig = () => ({
  categories: {
    MINERAIS: {
      name: "Minerais & Métaux",
      icon: "minecraft:diamond",
      items: [
        { id: "cobblestone", name: "Pierre Taillée (Cobble)", item_id: "minecraft:cobblestone", buy_price: 3, sell_price: 1, buy_enabled: true, sell_enabled: true },
        { id: "stone", name: "Roche Naturelle", item_id: "minecraft:stone", buy_price: 3, sell_price: 1, buy_enabled: true, sell_enabled: true },
        { id: "coal", name: "Charbon", item_id: "minecraft:coal", buy_price: 10, sell_price: 4, buy_enabled: true, sell_enabled: true },
        { id: "raw_copper", name: "Cuivre Brut", item_id: "minecraft:raw_copper", buy_price: 8, sell_price: 3, buy_enabled: true, sell_enabled: true },
        { id: "raw_iron", name: "Fer Brut", item_id: "minecraft:raw_iron", buy_price: 20, sell_price: 8, buy_enabled: true, sell_enabled: true },
        { id: "iron_ingot", name: "Lingot de Fer", item_id: "minecraft:iron_ingot", buy_price: 28, sell_price: 12, buy_enabled: true, sell_enabled: true },
        { id: "raw_gold", name: "Or Brut", item_id: "minecraft:raw_gold", buy_price: 30, sell_price: 12, buy_enabled: true, sell_enabled: true },
        { id: "gold_ingot", name: "Lingot d'Or", item_id: "minecraft:gold_ingot", buy_price: 45, sell_price: 18, buy_enabled: true, sell_enabled: true },
        { id: "diamond", name: "Diamant Pur", item_id: "minecraft:diamond", buy_price: 120, sell_price: 50, buy_enabled: true, sell_enabled: true },
        { id: "emerald", name: "Émeraude", item_id: "minecraft:emerald", buy_price: 100, sell_price: 40, buy_enabled: true, sell_enabled: true },
        { id: "lapis_lazuli", name: "Lapis-lazuli", item_id: "minecraft:lapis_lazuli", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "redstone", name: "Poudre de Redstone", item_id: "minecraft:redstone", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "netherite_ingot", name: "Lingot de Netherite", item_id: "minecraft:netherite_ingot", buy_price: 800, sell_price: 300, buy_enabled: true, sell_enabled: true },
        { id: "obsidian", name: "Obsidienne", item_id: "minecraft:obsidian", buy_price: 50, sell_price: 15, buy_enabled: true, sell_enabled: true },
      ],
    },
    AGRICULTURE: {
      name: "Agriculture & Récoltes",
      icon: "minecraft:wheat",
      items: [
        { id: "wheat", name: "Blé Doré", item_id: "minecraft:wheat", buy_price: 8, sell_price: 3, buy_enabled: true, sell_enabled: true },
        { id: "wheat_seeds", name: "Graines de Blé", item_id: "minecraft:wheat_seeds", buy_price: 4, sell_price: 1, buy_enabled: true, sell_enabled: true },
        { id: "carrot", name: "Carotte", item_id: "minecraft:carrot", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "potato", name: "Pomme de Terre", item_id: "minecraft:potato", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "beetroot", name: "Betterave", item_id: "minecraft:beetroot", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "melon_slice", name: "Tranche de Pastèque", item_id: "minecraft:melon_slice", buy_price: 3, sell_price: 1, buy_enabled: true, sell_enabled: true },
        { id: "pumpkin", name: "Citrouille", item_id: "minecraft:pumpkin", buy_price: 10, sell_price: 4, buy_enabled: true, sell_enabled: true },
        { id: "sugar_cane", name: "Canne à Sucre", item_id: "minecraft:sugar_cane", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "apple", name: "Pomme", item_id: "minecraft:apple", buy_price: 15, sell_price: 5, buy_enabled: true, sell_enabled: true },
        { id: "golden_apple", name: "Pomme Dorée", item_id: "minecraft:golden_apple", buy_price: 350, sell_price: 100, buy_enabled: true, sell_enabled: true },
        { id: "nether_wart", name: "Verrue du Nether", item_id: "minecraft:nether_wart", buy_price: 25, sell_price: 8, buy_enabled: true, sell_enabled: true },
      ],
    },
    BOIS_BLOCS: {
      name: "Bois & Blocs",
      icon: "minecraft:oak_log",
      items: [
        { id: "oak_log", name: "Bûche de Chêne", item_id: "minecraft:oak_log", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "birch_log", name: "Bûche de Bouleau", item_id: "minecraft:birch_log", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "spruce_log", name: "Bûche de Sapin", item_id: "minecraft:spruce_log", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "jungle_log", name: "Bûche d'Acajou", item_id: "minecraft:jungle_log", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "acacia_log", name: "Bûche d'Acacia", item_id: "minecraft:acacia_log", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "dark_oak_log", name: "Bûche de Chêne Noir", item_id: "minecraft:dark_oak_log", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "cherry_log", name: "Bûche de Cerisier", item_id: "minecraft:cherry_log", buy_price: 8, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "mangrove_log", name: "Bûche de Palétuvier", item_id: "minecraft:mangrove_log", buy_price: 8, sell_price: 2, buy_enabled: true, sell_enabled: true },
      ],
    },
    MOBS: {
      name: "Butins de Monstres",
      icon: "minecraft:bone",
      items: [
        { id: "rotten_flesh", name: "Chair Putréfiée", item_id: "minecraft:rotten_flesh", buy_price: 4, sell_price: 1, buy_enabled: true, sell_enabled: true },
        { id: "bone", name: "Os", item_id: "minecraft:bone", buy_price: 6, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "gunpowder", name: "Poudre à Canon", item_id: "minecraft:gunpowder", buy_price: 15, sell_price: 5, buy_enabled: true, sell_enabled: true },
        { id: "string", name: "Ficelle", item_id: "minecraft:string", buy_price: 5, sell_price: 2, buy_enabled: true, sell_enabled: true },
        { id: "spider_eye", name: "Œil d'Araignée", item_id: "minecraft:spider_eye", buy_price: 8, sell_price: 3, buy_enabled: true, sell_enabled: true },
        { id: "ender_pearl", name: "Perle de l'Ender", item_id: "minecraft:ender_pearl", buy_price: 80, sell_price: 25, buy_enabled: true, sell_enabled: true },
        { id: "blaze_rod", name: "Bâton de Blaze", item_id: "minecraft:blaze_rod", buy_price: 50, sell_price: 18, buy_enabled: true, sell_enabled: true },
        { id: "slime_ball", name: "Boule de Slime", item_id: "minecraft:slime_ball", buy_price: 25, sell_price: 8, buy_enabled: true, sell_enabled: true },
      ],
    },
  },
});

export const defaultServerConfig = () => ({
  startingMoney: 500,
  ahFeePercent: 5,
  clearLagIntervalSeconds: 300,
  broadcastIntervalMinutes: 10,
  broadcastMessages: [
    "§l§6Opal Heaven §r§7• Rejoignez notre Discord officiel : §ediscord.gg/opalheaven",
    "§l§6Opal Heaven §r§7• Consultez le §e/shop §7ou visitez l'Admin Shop au Spawn !",
    "§l§6Opal Heaven §r§7• N'oubliez pas de réclamer votre récompense quotidienne avec le §e/daily §7!",
    "§l§6Opal Heaven §r§7• Choisissez votre voie de métier avec §e/jobs §7pour débloquer talents et bonus !",
  ],
});

export const defaultConfigs = () => ({
  dailyRewards: defaultDailyRewards(),
  jobs: defaultJobsConfig(),
  adminShop: defaultAdminShopConfig(),
  server: defaultServerConfig(),
});

export const normalizeConfigs = (raw, { strict = true } = {}) => {
  if (raw === undefined || raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return defaultConfigs();
  }

  const out = defaultConfigs();

  // 1. Daily Rewards
  if (Array.isArray(raw.dailyRewards)) {
    const validDays = [];
    for (const d of raw.dailyRewards) {
      if (!d || typeof d !== "object") continue;
      const dayNum = Number(d.day);
      if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 30) continue;
      const items = Array.isArray(d.items)
        ? d.items
            .filter((it) => it && typeof it === "object" && typeof it.item === "string")
            .map((it) => ({
              item: String(it.item).trim(),
              count: Math.max(1, Math.min(64, Number(it.count) || 1)),
              name: String(it.name || "").trim().slice(0, 60),
            }))
        : [];
      validDays.push({
        day: dayNum,
        money: Math.max(0, Math.min(10000000, Number(d.money) || 0)),
        tokens: Math.max(0, Math.min(1000000, Number(d.tokens) || 0)),
        key: String(d.key || "").trim().toLowerCase(),
        shard: Math.max(0, Math.min(1000, Number(d.shard) || 0)),
        items,
      });
    }
    if (validDays.length > 0) {
      validDays.sort((a, b) => a.day - b.day);
      out.dailyRewards = validDays;
    }
  }

  // 2. Jobs
  if (raw.jobs && typeof raw.jobs === "object") {
    if (raw.jobs.curve && typeof raw.jobs.curve === "object") {
      out.jobs.curve = {
        baseXp: Math.max(10, Math.min(10000, Number(raw.jobs.curve.baseXp) || 100)),
        exponent: Math.max(1.0, Math.min(3.0, Number(raw.jobs.curve.exponent) || 1.75)),
        multiplier: Math.max(1, Math.min(1000, Number(raw.jobs.curve.multiplier) || 55)),
        maxLevel: Math.max(10, Math.min(100, Number(raw.jobs.curve.maxLevel) || 50)),
        mainVocationBonusPercent: Math.max(0, Math.min(200, Number(raw.jobs.curve.mainVocationBonusPercent) || 25)),
        prestigeBonusPercent: Math.max(0, Math.min(50, Number(raw.jobs.curve.prestigeBonusPercent) || 5)),
      };
    }
    if (raw.jobs.levelRewards && typeof raw.jobs.levelRewards === "object") {
      out.jobs.levelRewards = {
        moneyMultiplier: Math.max(0, Math.min(100000, Number(raw.jobs.levelRewards.moneyMultiplier) || 250)),
        tokensMultiplier: Math.max(0, Math.min(1000, Number(raw.jobs.levelRewards.tokensMultiplier) || 5)),
        talentPointsPerLevel: Math.max(0, Math.min(10, Number(raw.jobs.levelRewards.talentPointsPerLevel) || 1)),
      };
    }
    if (raw.jobs.actions && typeof raw.jobs.actions === "object") {
      for (const voc of ["abysses", "terre", "guerre"]) {
        if (Array.isArray(raw.jobs.actions[voc])) {
          out.jobs.actions[voc] = raw.jobs.actions[voc]
            .filter((a) => a && typeof a === "object" && typeof a.id === "string")
            .map((a) => ({
              id: String(a.id).trim().slice(0, 40),
              name: String(a.name || a.id).trim().slice(0, 80),
              xp: Math.max(1, Math.min(10000, Number(a.xp) || 1)),
              icon: String(a.icon || "").trim(),
            }));
        }
      }
    }
  }

  // 3. Admin Shop
  if (raw.adminShop && typeof raw.adminShop === "object" && raw.adminShop.categories) {
    const cats = {};
    for (const [catKey, catVal] of Object.entries(raw.adminShop.categories)) {
      if (!catVal || typeof catVal !== "object") continue;
      const safeKey = String(catKey).toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 32);
      const items = Array.isArray(catVal.items)
        ? catVal.items
            .filter((it) => it && typeof it === "object" && typeof it.item_id === "string")
            .map((it) => ({
              id: String(it.id || it.item_id.split(":").pop()).trim().slice(0, 40),
              name: String(it.name || it.item_id).trim().slice(0, 80),
              item_id: String(it.item_id).trim().toLowerCase(),
              buy_price: Math.max(0, Math.min(10000000, Number(it.buy_price) || 0)),
              sell_price: Math.max(0, Math.min(10000000, Number(it.sell_price) || 0)),
              buy_enabled: it.buy_enabled !== false,
              sell_enabled: it.sell_enabled !== false,
            }))
        : [];
      cats[safeKey] = {
        name: String(catVal.name || safeKey).trim().slice(0, 50),
        icon: String(catVal.icon || "minecraft:chest").trim(),
        items,
      };
    }
    if (Object.keys(cats).length > 0) {
      out.adminShop = { categories: cats };
    }
  }

  // 4. Server General
  if (raw.server && typeof raw.server === "object") {
    out.server = {
      startingMoney: Math.max(0, Math.min(1000000, Number(raw.server.startingMoney) || 500)),
      ahFeePercent: Math.max(0, Math.min(50, Number(raw.server.ahFeePercent) || 5)),
      clearLagIntervalSeconds: Math.max(60, Math.min(3600, Number(raw.server.clearLagIntervalSeconds) || 300)),
      broadcastIntervalMinutes: Math.max(1, Math.min(120, Number(raw.server.broadcastIntervalMinutes) || 10)),
      broadcastMessages: Array.isArray(raw.server.broadcastMessages)
        ? raw.server.broadcastMessages.map((m) => String(m).slice(0, 200)).filter(Boolean)
        : out.server.broadcastMessages,
    };
  }

  return out;
};

export const emptyContent = () => ({
  version: 1,
  schemaVersion: 2,
  revision: 0,
  updatedAt: null,
  entries: [],
  recipes: [],
  disabledVanillaRecipes: [],
  customTextures: {},
});
