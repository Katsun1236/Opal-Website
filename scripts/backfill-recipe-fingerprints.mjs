import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assignRecipeIds,
  groupRecipeIds,
  mergeRecipeIdGroups,
} from "./lib/recipe-id.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cataloguePath = path.join(root, "public", "assets", "opal-heaven", "vanilla-catalogue.json");
const indexPath = path.join(root, "public", "assets", "opal-heaven", "vanilla-recipe-index.json");

const catalogue = JSON.parse(await readFile(cataloguePath, "utf8"));
const index = JSON.parse(await readFile(indexPath, "utf8"));

const previousGroups = mergeRecipeIdGroups(
  groupRecipeIds(catalogue.recipes),
  groupRecipeIds(index.recipes)
);
const { legacyIds } = assignRecipeIds(catalogue.recipes, previousGroups);

const byId = new Map(catalogue.recipes.map((recipe) => [recipe.id, recipe]));
let missing = 0;
index.recipes = index.recipes.map((entry) => {
  const recipe = byId.get(entry.id);
  if (!recipe) {
    missing++;
    return { ...entry, fingerprint: entry.fingerprint || "" };
  }
  return { ...entry, fingerprint: recipe.fingerprint };
});
index.legacyIds = { ...(index.legacyIds || {}), ...legacyIds };

await writeFile(cataloguePath, JSON.stringify(catalogue), "utf8");
await writeFile(indexPath, JSON.stringify(index), "utf8");

console.log(
  JSON.stringify({
    recipes: catalogue.recipes.length,
    indexEntries: index.recipes.length,
    missingIndexRecipes: missing,
    duplicateFingerprints:
      catalogue.recipes.length - new Set(catalogue.recipes.map((recipe) => recipe.fingerprint)).size,
    legacyIds: Object.keys(index.legacyIds).length,
  })
);
