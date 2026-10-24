import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VANILLA_RECIPE_ID } from "../public/lib/schema.mjs";
import {
  assignRecipeIds,
  groupRecipeIds,
  isStableRecipeId,
  recipeFingerprint,
  recipeKind,
  stableRecipeId,
} from "../scripts/lib/recipe-id.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "public", "assets", "opal-heaven");
const readJson = async (file) => JSON.parse(await readFile(path.join(assets, file), "utf8"));

const catalogue = await readJson("vanilla-catalogue.json");
const index = await readJson("vanilla-recipe-index.json");
const library = await readJson("library.json");
const manifest = await readJson("manifest.json");

test("le catalogue contient des recettes uniques et valides", () => {
  assert.ok(catalogue.recipes.length > 3000);
  const ids = new Set();
  for (const recipe of catalogue.recipes) {
    assert.match(recipe.id, VANILLA_RECIPE_ID, recipe.id);
    assert.equal(ids.has(recipe.id), false, "identifiant dupliqué : " + recipe.id);
    ids.add(recipe.id);
  }
  assert.equal(ids.size, catalogue.recipes.length);
});

test("chaque recette possède une empreinte stable et cohérente", () => {
  for (const recipe of catalogue.recipes) {
    assert.match(recipe.fingerprint, /^[a-f0-9]{16}$/, recipe.id);
    assert.equal(recipe.fingerprint, recipeFingerprint(recipe, recipeKind(recipe)), recipe.id);
  }
});

test("l’empreinte ignore les noms traduits et l’ordre des clés", () => {
  const shaped = catalogue.recipes.find(
    (recipe) => recipe.type === "shaped" && Object.keys(recipe.ingredients || {}).length > 1
  );
  assert.ok(shaped);
  const copy = JSON.parse(JSON.stringify(shaped));
  copy.name = "Nom totalement différent";
  copy.ingredients = Object.fromEntries(Object.entries(copy.ingredients).reverse());
  copy.result.name = "Autre nom";
  assert.equal(recipeFingerprint(copy, "shaped"), shaped.fingerprint);
});

test("les identifiants existants sont réutilisés après réordonnancement", () => {
  const previousGroups = groupRecipeIds(catalogue.recipes);
  const shuffled = JSON.parse(JSON.stringify(catalogue.recipes)).reverse();
  assignRecipeIds(shuffled, previousGroups);
  assert.deepEqual(
    new Set(shuffled.map((recipe) => recipe.id)),
    new Set(catalogue.recipes.map((recipe) => recipe.id))
  );
});

test("une nouvelle recette reçoit un identifiant déterministe", () => {
  const recipe = {
    station: "table_de_craft",
    type: "shaped",
    pattern: ["AA", "AA"],
    ingredients: { A: { id: "minecraft:diamond", meta: 0 } },
    result: { id: "minecraft:diamond_block", count: 1 },
  };
  const { legacyIds } = assignRecipeIds([recipe], new Map());
  assert.deepEqual(legacyIds, {});
  assert.match(recipe.id, VANILLA_RECIPE_ID);
  assert.equal(isStableRecipeId(recipe.id), true);
  assert.equal(recipe.id, stableRecipeId(recipe, "shaped"));
  assert.equal(recipeFingerprint(recipe, "shaped"), recipe.fingerprint);

  const second = JSON.parse(JSON.stringify(recipe));
  delete second.id;
  delete second.fingerprint;
  assignRecipeIds([second], groupRecipeIds([recipe]));
  assert.equal(second.id, recipe.id);

  const another = JSON.parse(JSON.stringify(recipe));
  another.result.count = 2;
  delete another.id;
  delete another.fingerprint;
  assignRecipeIds([another], new Map());
  assert.notEqual(another.id, recipe.id);
});

test("une nouvelle recette d’alchimie de contenant garde son préfixe", () => {
  const recipe = {
    station: "brewing_stand",
    type: "brewing",
    kindHint: "brewing_container",
    ingredients: [{ id: "minecraft:glass_bottle" }, { id: "minecraft:blaze_powder" }],
    result: { id: "minecraft:potion", count: 1, meta: 1 },
  };
  assignRecipeIds([recipe], new Map());
  assert.match(recipe.id, /^vanilla_brewing_container_[a-f0-9]{12}$/);
  delete recipe.kindHint;
  assert.equal(recipeKind(recipe), "brewing_container");
});

test("deux recettes identiques reçoivent deux identifiants distincts", () => {
  const recipe = {
    station: "table_de_craft",
    type: "shapeless",
    ingredients: [{ id: "minecraft:diamond" }],
    result: { id: "minecraft:diamond_block", count: 1 },
  };
  const recipes = [
    JSON.parse(JSON.stringify(recipe)),
    JSON.parse(JSON.stringify(recipe)),
  ];
  assignRecipeIds(recipes, new Map());
  assert.equal(recipes[0].fingerprint, recipes[1].fingerprint);
  assert.notEqual(recipes[0].id, recipes[1].id);
  assert.equal(isStableRecipeId(recipes[0].id), true);
  assert.equal(isStableRecipeId(recipes[1].id), true);
});

test("l’index runtime est complet et cohérent avec le catalogue", () => {
  const byId = new Map(catalogue.recipes.map((recipe) => [recipe.id, recipe]));
  const indexed = new Set();
  for (const entry of index.recipes) {
    const recipe = byId.get(entry.id);
    assert.ok(recipe, "recette d’index inconnue : " + entry.id);
    assert.ok(recipe.runtime, "recette d’index sans runtime : " + entry.id);
    assert.equal(entry.manager, recipe.runtime.manager);
    assert.equal(entry.index, recipe.runtime.index);
    assert.equal(entry.station, recipe.station);
    assert.equal(entry.fingerprint, recipe.fingerprint);
    assert.equal(indexed.has(entry.id), false);
    indexed.add(entry.id);
  }
  for (const recipe of catalogue.recipes) {
    assert.equal(Boolean(recipe.runtime), indexed.has(recipe.id), recipe.id);
  }
  for (const [manager, count] of Object.entries(index.counts)) {
    assert.equal(
      index.recipes.filter((entry) => entry.manager === manager).length,
      count,
      manager
    );
  }
});

test("les entrées Opal sont uniques et les icônes existent", () => {
  const ids = new Set();
  for (const entry of catalogue.opal) {
    assert.equal(ids.has(entry.id), false, "entrée Opal dupliquée : " + entry.id);
    ids.add(entry.id);
    if (entry.icon) {
      const file = path.join(root, "public", entry.icon.replace(/^\//, ""));
      assert.equal(existsSync(file), true, "icône absente : " + entry.icon);
    }
    if (entry.implemented) assert.ok(entry.icon, "icône manquante : " + entry.id);
  }
});

test("la bibliothèque référence des fichiers présents", () => {
  for (const type of ["icons", "models", "textures"]) {
    assert.ok(library[type].length > 0);
    for (const asset of library[type]) {
      const file = path.join(root, "public", asset.url.replace(/^\//, ""));
      assert.equal(existsSync(file), true, "asset absent : " + asset.url);
    }
  }
});

test("le manifeste et les traductions sont cohérents", () => {
  assert.equal(manifest.format_version, 2);
  assert.deepEqual(manifest.header.version, [1, 5, 0]);
  for (const module of manifest.modules) {
    assert.deepEqual(module.version, manifest.header.version);
  }
  assert.match(manifest.header.description, /v1\.5\.0/);
});

test("les fichiers de langue ont les mêmes clés", async () => {
  const fr = await readFile(path.join(assets, "texts", "fr_FR.lang"), "utf8");
  const en = await readFile(path.join(assets, "texts", "en_US.lang"), "utf8");
  const keys = (text) =>
    text
      .split(/\r?\n/)
      .filter((line) => line.includes("="))
      .map((line) => line.slice(0, line.indexOf("=")))
      .sort();
  assert.deepEqual(keys(en), keys(fr));
  assert.notEqual(en, fr);
});
