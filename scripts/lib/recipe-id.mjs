import { createHash } from "node:crypto";

const KINDS = new Set(["shaped", "shapeless", "brewing", "brewing_container", "smithing"]);

const cleanRef = (value) => String(value || "").replace(/^minecraft:/, "").trim();

const canonicalObject = (value) => {
  if (Array.isArray(value)) return value.map(canonicalObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalObject(value[key])])
  );
};

const canonicalIngredient = (ingredient) => {
  if (!ingredient || typeof ingredient !== "object") return null;
  if (typeof ingredient.tag === "string" && ingredient.tag) {
    return { tag: cleanRef(ingredient.tag) };
  }
  const result = { id: cleanRef(ingredient.id) };
  if (Number.isInteger(ingredient.meta)) result.meta = ingredient.meta;
  return result;
};

const canonicalStack = (stack) => {
  if (!stack || typeof stack !== "object") return null;
  const result = { id: cleanRef(stack.id) };
  if (Number.isInteger(stack.meta)) result.meta = stack.meta;
  if (Number.isInteger(stack.count)) result.count = stack.count;
  return result;
};

const canonicalIngredients = (ingredients) => {
  if (Array.isArray(ingredients)) return ingredients.map(canonicalIngredient);
  if (!ingredients || typeof ingredients !== "object") return null;
  return Object.fromEntries(
    Object.keys(ingredients)
      .sort()
      .map((key) => [key, canonicalIngredient(ingredients[key])])
  );
};

/**
 * Détermine la famille utilisée dans l'identifiant d'une recette.
 * `brewing_container` partage le type `brewing` avec les potions : l'ancien
 * préfixe positionnel reste donc la seule information disponible.
 */
export const recipeKind = (recipe, fallback = "") => {
  if (KINDS.has(fallback)) return fallback;
  if (KINDS.has(recipe?.kindHint)) return recipe.kindHint;
  if (recipe?.type === "smithing") return "smithing";
  if (recipe?.type === "brewing") {
    return String(recipe.id || "").startsWith("vanilla_brewing_container_")
      ? "brewing_container"
      : "brewing";
  }
  if (recipe?.type === "shapeless") return "shapeless";
  return "shaped";
};

/**
 * Empreinte stable du contenu d'une recette. Les noms traduits, l'ordre des
 * clés et les index runtime sont volontairement ignorés : seul le contenu
 * fonctionnel compte.
 */
export const recipeFingerprint = (recipe, kind = recipeKind(recipe)) => {
  const canonical = {
    version: 1,
    kind: KINDS.has(kind) ? kind : recipeKind(recipe),
    station: String(recipe?.station || ""),
    type: String(recipe?.type || ""),
    pattern: Array.isArray(recipe?.pattern) ? recipe.pattern.slice() : null,
    ingredients: canonicalIngredients(recipe?.ingredients),
    result: canonicalStack(recipe?.result),
  };
  return createHash("sha256")
    .update(JSON.stringify(canonicalObject(canonical)))
    .digest("hex")
    .slice(0, 16);
};

/**
 * Identifiant déterministe pour une nouvelle recette. Le suffixe optionnel
 * permet de distinguer deux recettes strictement identiques.
 */
export const stableRecipeId = (recipe, kind = recipeKind(recipe), suffix = 0) => {
  const fingerprint = recipeFingerprint(recipe, kind);
  if (!suffix) return "vanilla_" + kind + "_" + fingerprint.slice(0, 12);
  return "vanilla_" + kind + "_" + fingerprint.slice(0, 10) + String(suffix).padStart(2, "0");
};

export const isStableRecipeId = (id) =>
  /^vanilla_(shaped|shapeless|brewing|brewing_container|smithing)_[a-f0-9]{12}$/.test(String(id || ""));

/**
 * Regroupe des identifiants existants par empreinte. La liste triée permet de
 * réattribuer les identifiants historiques dans un ordre reproductible.
 */
export const groupRecipeIds = (recipes) => {
  const groups = new Map();
  for (const recipe of recipes || []) {
    if (!recipe || typeof recipe !== "object" || !recipe.id) continue;
    const kind = recipeKind(recipe, recipe.kindHint);
    const fingerprint =
      typeof recipe.fingerprint === "string" && /^[a-f0-9]{16}$/.test(recipe.fingerprint)
        ? recipe.fingerprint
        : recipeFingerprint(recipe, kind);
    const ids = groups.get(fingerprint) || [];
    if (!ids.includes(recipe.id)) ids.push(recipe.id);
    groups.set(fingerprint, ids);
  }
  for (const ids of groups.values()) ids.sort();
  return groups;
};

export const mergeRecipeIdGroups = (...groups) => {
  const merged = new Map();
  for (const group of groups) {
    for (const [fingerprint, ids] of group || []) {
      const current = merged.get(fingerprint) || [];
      for (const id of ids) if (!current.includes(id)) current.push(id);
      current.sort();
      merged.set(fingerprint, current);
    }
  }
  return merged;
};

/**
 * Réattribue les identifiants de toutes les recettes :
 * - réutilise un identifiant historique si son empreinte existe déjà ;
 * - sinon génère un identifiant stable dérivé du contenu.
 * Le résultat est identique quel que soit l'ordre des recettes à contenu égal.
 */
export const assignRecipeIds = (recipes, previousGroups = new Map()) => {
  const used = new Set();
  const legacyIds = {};
  for (const recipe of recipes) {
    const kind = recipeKind(recipe, recipe.kindHint);
    const fingerprint = recipeFingerprint(recipe, kind);
    recipe.fingerprint = fingerprint;
    const candidates = previousGroups.get(fingerprint) || [];
    const previousId = candidates.find((id) => !used.has(id));
    let id = previousId;
    if (!id) {
      let suffix = 0;
      do {
        id = stableRecipeId(recipe, kind, suffix);
        suffix++;
      } while (used.has(id));
    }
    used.add(id);
    recipe.id = id;
    if (previousId && previousId !== id) legacyIds[previousId] = id;
  }
  return { legacyIds };
};
