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

  return {
    version: 1,
    schemaVersion: 2,
    entries,
    recipes,
    disabledVanillaRecipes: [...disabled].sort(),
    customTextures,
  };
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
