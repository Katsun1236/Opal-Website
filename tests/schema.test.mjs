import test from "node:test";
import assert from "node:assert/strict";
import {
  LIMITS,
  VANILLA_RECIPE_ID,
  ValidationError,
  emptyContent,
  isAllowedTextureValue,
  normalizeTextures,
  validateContent,
} from "../public/lib/schema.mjs";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lzE1WQAAAABJRU5ErkJggg==";
const WEBP = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEALmk0mk0iIiIiIgBoSygABc6zbAAA";
const CDN = "https://cdn.jsdelivr.net/gh/example/repo@main/textures/item.png";

const entry = (overrides = {}) => ({
  id: "opal_sword",
  kind: "weapon",
  name: "Épée d’opale",
  baseItem: "diamond_sword",
  lore: ["Une lame céleste"],
  tier: "divin",
  durability: 2048,
  charges: 0,
  ...overrides,
});

const shaped = (overrides = {}) => ({
  id: "sword_custom",
  type: "shaped",
  result: { item: "opal:opal_sword", count: 1 },
  pattern: ["A"],
  key: { A: "minecraft:diamond" },
  ...overrides,
});

const baseContent = (overrides = {}) => ({
  entries: [entry()],
  recipes: [shaped()],
  disabledVanillaRecipes: [],
  customTextures: {},
  ...overrides,
});

test("emptyContent est un document valide et vide", () => {
  const content = emptyContent();
  assert.equal(content.version, 1);
  assert.equal(content.schemaVersion, 2);
  assert.deepEqual(validateContent(content), {
    version: 1,
    schemaVersion: 2,
    entries: [],
    recipes: [],
    disabledVanillaRecipes: [],
    customTextures: {},
  });
});

test("valide un contenu complet et normalise les champs", () => {
  const result = validateContent(
    baseContent({
      entries: [
        entry({
          name: "  Épée\u0000 d’opale  ",
          baseItem: "minecraft:diamond_sword",
          lore: ["  ligne 1  ", "", "ligne 2"],
          durability: "42",
          charges: 3,
        }),
      ],
      customTextures: {
        "opal:opal_sword": PNG,
        diamond: CDN,
      },
    }),
    { knownOpalIds: new Set(["opal_sword"]) }
  );
  assert.equal(result.entries[0].name, "Épée d’opale");
  assert.equal(result.entries[0].baseItem, "diamond_sword");
  assert.deepEqual(result.entries[0].lore, ["ligne 1", "ligne 2"]);
  assert.equal(result.entries[0].durability, 42);
  assert.equal(result.entries[0].charges, 3);
  assert.equal(result.customTextures["opal:opal_sword"], PNG);
  assert.equal(result.customTextures["minecraft:diamond"], CDN);
  assert.equal(result.recipes[0].vanillaOverride, undefined);
});

test("ignore les clés inconnues et la révision", () => {
  const result = validateContent({
    ...baseContent(),
    revision: 12,
    updatedAt: "hier",
    inconnu: true,
  });
  assert.equal(result.revision, undefined);
  assert.equal(result.updatedAt, undefined);
  assert.equal(result.inconnu, undefined);
});

test("rejette les structures et identifiants invalides", () => {
  assert.throws(() => validateContent(null), ValidationError);
  assert.throws(() => validateContent({}), ValidationError);
  assert.throws(() => validateContent({ entries: [], recipes: {} }), ValidationError);
  assert.throws(
    () => validateContent(baseContent({ entries: [entry(), entry()] })),
    /identifiant en double/
  );
  assert.throws(
    () => validateContent(baseContent({ entries: [entry({ id: "A" })] })),
    /identifiant invalide/
  );
  assert.throws(
    () => validateContent(baseContent({ entries: [entry({ kind: "inconnu" })] })),
    /type invalide/
  );
  assert.throws(
    () => validateContent(baseContent({ entries: [entry({ name: "   " })] })),
    /nom manquant/
  );
  assert.throws(
    () => validateContent(baseContent({ entries: [entry({ baseItem: "minecraft:bad id" })] })),
    /item de base invalide/
  );
  assert.throws(
    () => validateContent(baseContent({ entries: [entry({ durability: -1 })] })),
    /durabilité/
  );
  assert.throws(
    () => validateContent(baseContent({ entries: [entry({ charges: 1001 })] })),
    /charges/
  );
});

test("tronque le lore aux limites du schéma", () => {
  const lore = Array.from({ length: LIMITS.maxLoreLines + 5 }, (_, index) =>
    String(index).padEnd(LIMITS.maxLoreLength + 10, "x")
  );
  const result = validateContent(baseContent({ entries: [entry({ lore })] }));
  assert.equal(result.entries[0].lore.length, LIMITS.maxLoreLines);
  assert.equal(result.entries[0].lore[0].length, LIMITS.maxLoreLength);
});

test("vérifie les références opal: lorsque le catalogue est connu", () => {
  const known = new Set(["opal_sword"]);
  assert.doesNotThrow(() => validateContent(baseContent(), { knownOpalIds: known }));
  assert.throws(
    () =>
      validateContent(
        baseContent({ recipes: [shaped({ key: { A: "opal:inconnu" } })] }),
        { knownOpalIds: known }
      ),
    /ingrédient inconnu/
  );
  assert.throws(
    () =>
      validateContent(
        baseContent({
          recipes: [shaped({ result: { item: "opal:inconnu", count: 1 } })],
        }),
        { knownOpalIds: known }
      ),
    /ingrédient inconnu/
  );
  assert.doesNotThrow(() =>
    validateContent(baseContent({ recipes: [shaped({ key: { A: "opal:inconnu" } })] }))
  );
});

test("valide les trois types de crafts et les IDs vanilla stables", () => {
  const furnace = {
    id: "furnace_custom",
    type: "furnace",
    input: "minecraft:raw_iron",
    result: { item: "minecraft:iron_ingot", count: 1 },
  };
  const shapeless = {
    id: "shapeless_custom",
    type: "shapeless",
    ingredients: ["minecraft:diamond", "opal:opal_sword"],
    result: { item: "minecraft:diamond_block", count: 1 },
  };
  assert.doesNotThrow(() =>
    validateContent(
      baseContent({
        recipes: [shaped(), furnace, shapeless],
        disabledVanillaRecipes: ["vanilla_smithing_01"],
      }),
      { knownOpalIds: new Set(["opal_sword"]) }
    )
  );

  for (const id of [
    "vanilla_shaped_0001",
    "vanilla_shapeless_9999",
    "vanilla_brewing_01",
    "vanilla_brewing_container_01",
    "vanilla_smithing_01",
    "vanilla_shaped_a1b2c3d4e5f6",
    "vanilla_smithing_0123456789ab",
  ]) {
    assert.equal(VANILLA_RECIPE_ID.test(id), true, id);
  }
  for (const id of ["vanilla_smithing_bad", "custom_0001", "vanilla_shaped_abc", "vanilla_shaped_00001"]) {
    assert.equal(VANILLA_RECIPE_ID.test(id), false, id);
  }
});

test("rejette un override invalide et ajoute automatiquement la désactivation", () => {
  assert.throws(
    () =>
      validateContent(
        baseContent({
          recipes: [shaped({ vanillaOverride: "vanilla_smithing_bad" })],
        })
      ),
    /recette vanilla remplacée invalide/
  );

  const result = validateContent(
    baseContent({
      recipes: [shaped({ vanillaOverride: "vanilla_shaped_0001" })],
      disabledVanillaRecipes: ["vanilla_shapeless_0002"],
    })
  );
  assert.deepEqual(result.disabledVanillaRecipes, [
    "vanilla_shaped_0001",
    "vanilla_shapeless_0002",
  ]);
});

test("rejette deux overrides pour une même recette vanilla", () => {
  assert.throws(
    () =>
      validateContent(
        baseContent({
          recipes: [
            shaped({ id: "premier", vanillaOverride: "vanilla_shaped_0001" }),
            shaped({ id: "second", vanillaOverride: "vanilla_shaped_0001" }),
          ],
        })
      ),
    /deux crafts remplacent/
  );
});

test("valide les valeurs de texture autorisées", () => {
  for (const value of [
    PNG,
    WEBP,
    CDN,
    "https://raw.githubusercontent.com/example/repo/main/texture.png",
    "/assets/opal-heaven/icons/gemme_opale.png",
    "/assets/opal-heaven/textures/blocks/bloc_opale.png?v=2",
  ]) {
    assert.equal(isAllowedTextureValue(value), true, value);
  }
  for (const value of [
    "",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "javascript:alert(1)",
    "http://cdn.jsdelivr.net/x.png",
    "https://example.com/x.png",
    "/assets/../secret.png",
    "/assets//x.png",
    "x".repeat(LIMITS.maxTextureLength + 1),
    42,
    null,
  ]) {
    assert.equal(isAllowedTextureValue(value), false, String(value));
  }
});

test("normalise et migre les clés de textures", () => {
  const entries = new Set(["opal_sword"]);
  const result = normalizeTextures(
    {
      "opal:opal_sword": PNG,
      opal_sword: PNG,
      diamond: CDN,
      "minecraft:diamond": CDN,
      emerald: CDN,
    },
    entries
  );
  assert.deepEqual(result, {
    "opal:opal_sword": PNG,
    "minecraft:diamond": CDN,
    "minecraft:emerald": CDN,
  });

  assert.throws(
    () => normalizeTextures({ "minecraft:__proto__": PNG }, entries),
    /interdite/
  );
  assert.throws(() => normalizeTextures({ "pas une clé": PNG }, entries), /invalide/);
  assert.deepEqual(normalizeTextures({ "pas une clé": PNG }, entries, { strict: false }), {});
});

test("normalise les clés nues vers opal quand l’entrée existe", () => {
  const result = normalizeTextures(
    { opal_sword: PNG, unknown_item: CDN },
    new Set(["opal_sword"])
  );
  assert.equal(result["opal:opal_sword"], PNG);
  assert.equal(result["minecraft:unknown_item"], CDN);
});

test("applique les limites de taille", () => {
  const tooManyEntries = Array.from({ length: LIMITS.maxEntries + 1 }, (_, index) =>
    entry({ id: "entry_" + index })
  );
  assert.throws(() => validateContent(baseContent({ entries: tooManyEntries })), /trop d'éléments/);
});

test("valide et normalise les configurations serveur", () => {
  const result = validateContent(
    baseContent({
      configs: {
        dailyRewards: [
          { day: 1, money: 750, tokens: 10, key: "commune", items: [{ item: "minecraft:bread", count: 16 }] },
        ],
        jobs: {
          curve: { maxLevel: 60, baseXp: 120 },
          actions: {
            abysses: [{ id: "ore_opal", name: "Opale", xp: 100 }],
          },
        },
        adminShop: {
          categories: {
            MINERAIS: {
              name: "Minerais",
              items: [{ id: "diamond", name: "Diamant", item_id: "minecraft:diamond", buy_price: 150, sell_price: 60 }],
            },
          },
        },
      },
    })
  );
  assert.ok(result.configs);
  assert.equal(result.configs.dailyRewards[0].money, 750);
  assert.equal(result.configs.jobs.curve.maxLevel, 60);
  assert.equal(result.configs.jobs.actions.abysses[0].xp, 100);
  assert.equal(result.configs.adminShop.categories.MINERAIS.items[0].buy_price, 150);
});
