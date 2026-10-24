import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASE_RE,
  KINDS,
  VANILLA_RECIPE_ID,
} from "../public/lib/schema.mjs";
import { recipeFingerprint, recipeKind } from "./lib/recipe-id.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "public", "assets", "opal-heaven");
const publicRoot = path.join(root, "public");

const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const check = (condition, message) => {
  if (!condition) fail(message);
};

const readJson = async (file, label) => {
  try {
    return JSON.parse(await readFile(path.join(assets, file), "utf8"));
  } catch (error) {
    fail(label + " illisible : " + error.message);
    return null;
  }
};

const localAssetPath = (url) => {
  if (typeof url !== "string" || !url.startsWith("/assets/")) return null;
  return path.join(publicRoot, decodeURIComponent(url.replace(/^\//, "")));
};

const checkLocalAsset = (url, label) => {
  const file = localAssetPath(url);
  if (file && !existsSync(file)) fail(label + " : fichier absent " + url);
};

const catalogue = await readJson("vanilla-catalogue.json", "vanilla-catalogue.json");
const index = await readJson("vanilla-recipe-index.json", "vanilla-recipe-index.json");
const library = await readJson("library.json", "library.json");
const manifest = await readJson("manifest.json", "manifest.json");

if (catalogue) {
  check(catalogue.version === 1, "vanilla-catalogue.json : version attendue 1");
  for (const type of ["items", "blocks", "recipes", "opal"]) {
    check(Array.isArray(catalogue[type]), "vanilla-catalogue.json : tableau " + type + " manquant");
  }

  for (const type of ["items", "blocks"]) {
    const registryIds = new Set();
    for (const item of catalogue[type] || []) {
      if (!BASE_RE.test(String(item.id || ""))) fail(type + " : identifiant invalide " + item.id);
      if (!item.name) fail(type + " : nom manquant pour " + item.id);
      if (registryIds.has(item.id)) fail(type + " : identifiant dupliqué " + item.id);
      registryIds.add(item.id);
    }
  }

  const recipeIds = new Set();
  for (const recipe of catalogue.recipes || []) {
    if (!VANILLA_RECIPE_ID.test(String(recipe.id || ""))) {
      fail("recette : identifiant non désactivable " + recipe.id);
    }
    if (recipeIds.has(recipe.id)) fail("recette : identifiant dupliqué " + recipe.id);
    recipeIds.add(recipe.id);
    if (!["shaped", "shapeless", "brewing", "smithing"].includes(recipe.type)) {
      fail("recette " + recipe.id + " : type inconnu " + recipe.type);
    }
    if (!recipe.station) fail("recette " + recipe.id + " : station manquante");
    if (!recipe.name) fail("recette " + recipe.id + " : nom manquant");
    if (!recipe.result || !BASE_RE.test(String(recipe.result.id || ""))) {
      fail("recette " + recipe.id + " : résultat invalide");
    }
    if (!Number.isInteger(recipe.result?.count) || recipe.result.count < 1 || recipe.result.count > 64) {
      fail("recette " + recipe.id + " : quantité de résultat invalide");
    }
    if (!/^[a-f0-9]{16}$/.test(String(recipe.fingerprint || ""))) {
      fail("recette " + recipe.id + " : empreinte absente ou invalide");
    } else {
      const expected = recipeFingerprint(recipe, recipeKind(recipe));
      if (expected !== recipe.fingerprint) {
        fail("recette " + recipe.id + " : empreinte incohérente (attendu " + expected + ")");
      }
    }
    if (recipe.runtime) {
      if (recipe.supported === false) {
        fail("recette " + recipe.id + " : runtime présent mais supported=false");
      }
      if (!Number.isInteger(recipe.runtime.index) || recipe.runtime.index < 0) {
        fail("recette " + recipe.id + " : index runtime invalide");
      }
      if (typeof recipe.runtime.manager !== "string" || !recipe.runtime.manager) {
        fail("recette " + recipe.id + " : manager runtime invalide");
      }
    } else if (recipe.supported !== false) {
      fail("recette " + recipe.id + " : sans runtime mais sans supported=false");
    }
    if (recipe.type === "shaped") {
      if (!Array.isArray(recipe.pattern) || !recipe.pattern.length) {
        fail("recette " + recipe.id + " : motif manquant");
      }
      if (!recipe.ingredients || typeof recipe.ingredients !== "object") {
        fail("recette " + recipe.id + " : légende manquante");
      }
    } else if (!Array.isArray(recipe.ingredients)) {
      fail("recette " + recipe.id + " : ingrédients manquants");
    }
  }

  const opalIds = new Set();
  for (const entry of catalogue.opal || []) {
    if (!BASE_RE.test(String(entry.id || ""))) fail("opal : identifiant invalide " + entry.id);
    if (opalIds.has(entry.id)) fail("opal : identifiant dupliqué " + entry.id);
    opalIds.add(entry.id);
    if (!entry.name) fail("opal " + entry.id + " : nom manquant");
    if (!KINDS.includes(entry.kind)) fail("opal " + entry.id + " : type inconnu " + entry.kind);
    if (entry.baseItem && !BASE_RE.test(String(entry.baseItem).replace(/^minecraft:/, ""))) {
      fail("opal " + entry.id + " : item de base invalide");
    }
    if (entry.implemented && !entry.icon) {
      fail("opal " + entry.id + " : contenu implémenté sans icône");
    }
    if (entry.icon) checkLocalAsset(entry.icon, "opal " + entry.id);
  }
}

if (catalogue && index) {
  check(index.version === 1, "vanilla-recipe-index.json : version attendue 1");
  check(Array.isArray(index.recipes), "vanilla-recipe-index.json : tableau recipes manquant");
  const byId = new Map((catalogue.recipes || []).map((recipe) => [recipe.id, recipe]));
  const indexed = new Set();
  for (const entry of index.recipes) {
    const recipe = byId.get(entry.id);
    if (!recipe) {
      fail("index : recette inconnue " + entry.id);
      continue;
    }
    indexed.add(entry.id);
    if (!recipe.runtime) fail("index : recette sans runtime dans le catalogue " + entry.id);
    if (recipe.runtime?.manager !== entry.manager || recipe.runtime?.index !== entry.index) {
      fail("index : runtime incohérent pour " + entry.id);
    }
    if (!entry.fingerprint) {
      fail("index : empreinte manquante pour " + entry.id);
    } else if (entry.fingerprint !== recipe.fingerprint) {
      fail("index : empreinte incohérente pour " + entry.id);
    }
  }
  for (const recipe of catalogue.recipes || []) {
    if (recipe.runtime && !indexed.has(recipe.id)) {
      fail("index : recette runtime absente " + recipe.id);
    }
  }

  const counts = {};
  for (const entry of index.recipes) {
    counts[entry.manager] = (counts[entry.manager] || 0) + 1;
  }
  const declared = index.counts || {};
  for (const [manager, count] of Object.entries(counts)) {
    if (declared[manager] !== count) {
      fail("index : compte " + manager + " = " + count + " mais déclaré " + declared[manager]);
    }
  }
  for (const manager of Object.keys(declared)) {
    if (!counts[manager]) fail("index : manager déclaré sans recette " + manager);
  }
  if (Object.keys(index.legacyIds || {}).some((id) => !VANILLA_RECIPE_ID.test(id))) {
    warn("index : certaines clés legacyIds ne suivent pas le format attendu");
  }
}

if (library) {
  for (const type of ["icons", "models", "textures"]) {
    check(Array.isArray(library[type]), "library.json : tableau " + type + " manquant");
    const files = new Set();
    for (const asset of library[type] || []) {
      if (!asset.file) fail("library.json : fichier manquant dans " + type);
      if (files.has(asset.file)) fail("library.json : doublon " + asset.file);
      files.add(asset.file);
      checkLocalAsset(asset.url, "library " + asset.file);
    }
  }
}

if (manifest) {
  check(manifest.format_version === 2, "manifest.json : format_version attendu 2");
  check(Array.isArray(manifest.header?.version), "manifest.json : version header manquante");
  check(Array.isArray(manifest.modules), "manifest.json : modules manquants");
  const described = String(manifest.header?.description || "").match(/v(\d+)\.(\d+)\.(\d+)/);
  if (described) {
    const expected = described.slice(1).map(Number);
    if (JSON.stringify(manifest.header.version) !== JSON.stringify(expected)) {
      fail(
        "manifest.json : version " +
          JSON.stringify(manifest.header.version) +
          " incohérente avec la description v" +
          expected.join(".")
      );
    }
    for (const module of manifest.modules || []) {
      if (JSON.stringify(module.version) !== JSON.stringify(expected)) {
        fail("manifest.json : version de module incohérente avec la description");
      }
    }
  }
  check(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(String(manifest.header?.uuid || "")),
    "manifest.json : UUID header invalide"
  );
}

const readLang = async (file) => {
  try {
    const text = await readFile(path.join(assets, "texts", file), "utf8");
    const entries = new Map();
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim() || line.trim().startsWith("#")) continue;
      const indexOf = line.indexOf("=");
      if (indexOf < 1) {
        fail("texts/" + file + " : ligne invalide");
        continue;
      }
      entries.set(line.slice(0, indexOf), line.slice(indexOf + 1));
    }
    return entries;
  } catch (error) {
    fail("texts/" + file + " illisible : " + error.message);
    return new Map();
  }
};

const french = await readLang("fr_FR.lang");
const english = await readLang("en_US.lang");
for (const [key, value] of french) {
  if (!english.has(key)) fail("texts/en_US.lang : clé manquante " + key);
  if (!value.trim()) fail("texts/fr_FR.lang : valeur vide pour " + key);
}
for (const key of english.keys()) {
  if (!french.has(key)) fail("texts/fr_FR.lang : clé manquante " + key);
}
if (french.size && JSON.stringify([...french]) === JSON.stringify([...english])) {
  warn("texts/en_US.lang semble être une copie du fichier français");
}

for (const message of warnings) console.warn("Avertissement : " + message);
if (errors.length) {
  console.error("\n" + errors.length + " erreur(s) :");
  for (const message of errors) console.error(" - " + message);
  process.exit(1);
}
console.log(
  "Données valides : " +
    (catalogue?.recipes?.length || 0) +
    " recettes, " +
    (catalogue?.opal?.length || 0) +
    " entrées Opal, " +
    (library?.icons?.length || 0) +
    " icônes, " +
    (library?.models?.length || 0) +
    " modèles, " +
    (library?.textures?.length || 0) +
    " textures."
);
