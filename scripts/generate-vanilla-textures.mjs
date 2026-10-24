import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1");

async function run() {
  console.log("Lecture du catalogue vanilla...");
  const cataloguePath = path.join(projectRoot, "public/assets/opal-heaven/vanilla-catalogue.json");
  const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));

  console.log("Téléchargement de l'arborescence Bedrock (Mojang)...");
  const bedrockTreeRes = await fetch("https://api.github.com/repos/Mojang/bedrock-samples/git/trees/main?recursive=1");
  const bedrockTree = (await bedrockTreeRes.json()).tree || [];
  const bedrockPaths = new Set(bedrockTree.map((t) => t.path));

  console.log("Téléchargement des définitions Bedrock item_texture & terrain_texture...");
  const itemTexData = JSON.parse(strip(await (await fetch("https://cdn.jsdelivr.net/gh/Mojang/bedrock-samples@main/resource_pack/textures/item_texture.json")).text())).texture_data || {};
  const terrainTexData = JSON.parse(strip(await (await fetch("https://cdn.jsdelivr.net/gh/Mojang/bedrock-samples@main/resource_pack/textures/terrain_texture.json")).text())).texture_data || {};

  console.log("Téléchargement de l'arborescence Java (Inventivetalent 1.20.1)...");
  const javaTreeRes = await fetch("https://api.github.com/repos/InventivetalentDev/minecraft-assets/git/trees/1.20.1?recursive=1");
  const javaTree = (await javaTreeRes.json()).tree || [];
  const javaPaths = new Set(javaTree.map((t) => t.path));

  function getBedrock(rel) {
    if (!rel) return null;
    let p = rel.startsWith("textures/") ? "resource_pack/" + rel : rel;
    if (!p.endsWith(".png")) p += ".png";
    if (bedrockPaths.has(p)) return "https://cdn.jsdelivr.net/gh/Mojang/bedrock-samples@main/" + p;
    return null;
  }

  function getJava(type, id) {
    const p1 = "assets/minecraft/textures/" + type + "/" + id + ".png";
    if (javaPaths.has(p1)) return "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/" + p1;
    const other = type === "item" ? "block" : "item";
    const p2 = "assets/minecraft/textures/" + other + "/" + id + ".png";
    if (javaPaths.has(p2)) return "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.1/" + p2;
    return null;
  }

  function rawDirect(id, type) {
    if (type === "item") {
      if (itemTexData[id]) {
        const entry = itemTexData[id].textures;
        const p = Array.isArray(entry) ? entry[0] : (typeof entry === "string" ? entry : entry?.path);
        const b = getBedrock(p);
        if (b) return b;
      }
      return getBedrock("textures/items/" + id) || getJava("item", id) || getBedrock("textures/blocks/" + id);
    } else {
      if (terrainTexData[id]) {
        const entry = terrainTexData[id].textures;
        const p = Array.isArray(entry) ? entry[0] : (typeof entry === "string" ? entry : entry?.path);
        const b = getBedrock(p);
        if (b) return b;
      }
      return getBedrock("textures/blocks/" + id) || getJava("block", id) || getBedrock("textures/items/" + id);
    }
  }

  const textureMap = {};

  const knownAliases = {
    air: "",
    diamond_block: "diamond_block",
    iron_block: "iron_block",
    gold_block: "gold_block",
    netherite_block: "netherite_block",
    emerald_block: "emerald_block",
    lapis_block: "lapis_block",
    redstone_block: "redstone_block",
    copper_block: "copper_block",
    coal_block: "coal_block",
    amethyst: "amethyst_block",
    amethyst_block: "amethyst_block",
    totem: "totem",
    totem_of_undying: "totem",
    grass_block: "grass_carried",
    grass: "grass_carried",
    potato: "potato",
    baked_potato: "potato_baked",
    golden_apple: "apple_golden",
    enchanted_golden_apple: "apple_golden",
    bow: "bow_standby",
    book: "book_normal",
    writable_book: "book_writable",
    written_book: "book_written",
    enchanted_book: "book_enchanted",
    banner: "banner_blank",
    bone_meal: "dye_powder_white",
    turtle_helmet: "turtle_shell_piece",
    bed: "bed_red",
    carpet: "carpet_white",
    deepslate_brick_slab: "deepslate_bricks",
    deepslate_brick_stairs: "deepslate_bricks",
    deepslate_brick_wall: "deepslate_bricks",
    deepslate_tile_slab: "deepslate_tiles",
    deepslate_tile_stairs: "deepslate_tiles",
    deepslate_tile_wall: "deepslate_tiles",
    deepslate_lapis_lazuli_ore: "deepslate_lapis_ore",
    chiseled_quartz: "chiseled_quartz_block",
    blue_torch: "soul_torch",
    daylight_sensor: "daylight_detector",
    beetroots: "beetroot",
    cake_with_candle: "cake",
    cake_with_dyed_candle: "cake",
    candle: "candle_white",
    dyed_candle: "candle_white",
    concrete: "concrete_white",
    concrete_powder: "concrete_powder_white",
    hardened_clay: "terracotta",
    stained_clay: "terracotta",
    stained_glass: "glass_white",
    stained_glass_pane: "glass_white",
    wool: "wool_white",
    all_sided_mushroom_stem: "mushroom_stem",
    brown_mushroom_block: "mushroom_block_skin_brown",
    red_mushroom_block: "mushroom_block_skin_red",
  };

  const setEntry = (key, url) => {
    if (!url) return;
    textureMap[key] = url;
    const bare = key.replace(/^(item|block):/, "");
    if (!textureMap[bare]) textureMap[bare] = url;
  };

  // Traiter les items
  for (const item of catalogue.items) {
    const id = item.id;
    if (knownAliases[id] !== undefined) {
      if (knownAliases[id] === "") continue;
      const t = rawDirect(knownAliases[id], "item") || rawDirect(knownAliases[id], "block");
      if (t) { setEntry("item:" + id, t); continue; }
    }
    let t = rawDirect(id, "item");
    if (!t) {
      const candidates = [
        id.replace(/_boat$/, ""),
        "boat_" + id.replace(/_boat$/, ""),
        id.replace(/_sign$/, ""),
        "sign_" + id.replace(/_sign$/, ""),
        id.replace(/_hanging_sign$/, ""),
        id.replace(/_spawn_egg$/, ""),
        id.replace(/^raw_/, ""),
        id.replace(/^cooked_/, ""),
        id.replace(/_smithing_template$/, ""),
        id.replace(/_ingot$/, ""),
      ];
      for (const c of candidates) {
        t = rawDirect(c, "item") || rawDirect(c, "block");
        if (t) break;
      }
    }
    if (t) setEntry("item:" + id, t);
  }

  // Traiter les blocks
  for (const block of catalogue.blocks) {
    const id = block.id;
    if (knownAliases[id] !== undefined) {
      if (knownAliases[id] === "") continue;
      const t = rawDirect(knownAliases[id], "block") || rawDirect(knownAliases[id], "item");
      if (t) { setEntry("block:" + id, t); continue; }
    }
    let t = rawDirect(id, "block");
    if (!t) {
      const candidates = [
        id + "_block",
        id.replace(/_(slab|stairs|wall|fence|fence_gate|button|pressure_plate|door|trapdoor)$/, ""),
        id.replace(/_(slab|stairs|wall|fence|fence_gate|button|pressure_plate|door|trapdoor)$/, "_planks"),
        id.replace(/_(slab|stairs|wall|fence|fence_gate|button|pressure_plate|door|trapdoor)$/, "_block"),
        id.replace(/_(ceiling_center_hanging_sign|ceiling_edges_hanging_sign|wall_hanging_sign|wall_sign|hanging_sign|sign)$/, "_planks"),
        id.replace(/_wood$/, "_log"),
        id.replace(/_wood$/, "_log_side"),
        id.replace(/_log$/, "_log_side"),
        id.replace(/_stem$/, "_stem_side"),
        id.replace(/_hyphae$/, "_hyphae_side"),
        id + "_side",
        id + "_top",
        id + "_front",
        id.replace(/^infested_/, ""),
        id.replace(/^chiseled_/, ""),
        id.replace(/^cracked_/, ""),
        id.replace(/^mossy_/, ""),
      ];
      for (const c of candidates) {
        t = rawDirect(c, "block") || rawDirect(c, "item");
        if (t) break;
      }
    }
    if (t) setEntry("block:" + id, t);
  }

  // Traiter manuellement les minerais et blocs courants
  const minerals = ["diamond", "iron", "gold", "netherite", "emerald", "lapis", "redstone", "copper", "coal"];
  for (const m of minerals) {
    const bName = m + "_block";
    const bTex = getBedrock("textures/blocks/" + bName) || getJava("block", bName);
    if (bTex) {
      setEntry("block:" + bName, bTex);
      setEntry(bName, bTex);
    }
  }

  // Synonymes et alias explicites
  const explicitSynonyms = {
    totem_of_undying: "totem",
    totem: "totem",
    grass_block: "grass",
    grass: "grass",
  };
  for (const [alias, target] of Object.entries(explicitSynonyms)) {
    const tex = textureMap[target] || textureMap["item:" + target] || textureMap["block:" + target];
    if (tex) {
      setEntry(alias, tex);
      setEntry("item:" + alias, tex);
      setEntry("block:" + alias, tex);
    }
  }

  const outPath = path.join(projectRoot, "public/assets/opal-heaven/vanilla-textures.json");
  fs.writeFileSync(outPath, JSON.stringify(textureMap, null, 2), "utf8");
  console.log("Fichier généré :", outPath, "avec", Object.keys(textureMap).length, "entrées.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
