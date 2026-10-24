import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assignRecipeIds, groupRecipeIds, mergeRecipeIdGroups } from "./lib/recipe-id.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const pmmpRoot = process.argv[2];
const opalRoot = process.argv[3];

if (!pmmpRoot) {
  throw new Error("Usage: node scripts/generate-vanilla-catalogue.mjs <chemin-vers-pmmp_src>");
}

const words = {
  acacia: "acacia", activator: "activateur", ancient: "ancien", andesite: "andésite",
  anvil: "enclume", apple: "pomme", armor: "armure", arrow: "flèche", axe: "hache",
  azalea: "azalée", baked: "cuit", bamboo: "bambou", banner: "bannière", barrel: "baril",
  basalt: "basalte", bat: "chauve-souris", beacon: "balise", bed: "lit", bee: "abeille",
  beef: "bœuf", beetroot: "betterave", bell: "cloche", birch: "bouleau", black: "noir",
  blackstone: "pierre noire", blast: "haut-fourneau", blaze: "Blaze", blue: "bleu",
  boat: "bateau", bone: "os", book: "livre", bookshelf: "bibliothèque", border: "bordure",
  bottle: "bouteille", bow: "arc", bowl: "bol", brain: "cerveau", bread: "pain",
  brewing: "alchimie", brick: "brique", bricks: "briques", brown: "marron", brush: "pinceau",
  bubble: "bulles", bucket: "seau", budding: "en pousse", bush: "buisson", button: "bouton",
  cactus: "cactus", cake: "gâteau", calcite: "calcite", campfire: "feu de camp",
  candle: "bougie", carpet: "tapis", carrot: "carotte", cartography: "cartographie",
  carved: "sculpté", cauldron: "chaudron", cave: "caverne", chain: "chaîne",
  chainmail: "cotte de mailles", charcoal: "charbon de bois", cherry: "cerisier",
  chest: "coffre", chiseled: "ciselé", chiseled_bookshelf: "bibliothèque sculptée",
  chorus: "chorus", clay: "argile", clock: "horloge", coal: "charbon", coarse: "grossière",
  cobbled: "taillé", cobblestone: "pierre taillée", cocoa: "cacao", color: "couleur",
  colored: "coloré", compass: "boussole", concrete: "béton", conduit: "conduit",
  copper: "cuivre", coral: "corail", cracked: "fissuré", crafting: "fabrication",
  creaking: "grinçant", crimson: "carmin", crying: "sanglotant", cut: "taillé",
  cyan: "cyan", dark: "sombre", dark_oak: "chêne noir", daylight: "lumière du jour",
  dead: "mort", decorated: "décoré", deepslate: "ardoise des abîmes", detector: "détecteur",
  diamond: "diamant", diorite: "diorite", dirt: "terre", dispenser: "distributeur",
  door: "porte", dragon: "dragon", dried: "séché", dropper: "dropper", dune: "dune",
  dye: "teinture", egg: "œuf", elytra: "élytres", emerald: "émeraude", enchanting: "enchantement",
  end: "End", ender: "Ender", enderman: "Enderman", endermite: "Endermite", endstone: "pierre de l’End",
  exposed: "exposé", eye: "œil", feather: "plume", fence: "barrière", fence_gate: "portillon",
  fermented: "fermenté", fern: "fougère", fire: "feu", firework: "feu d’artifice",
  fish: "poisson", fishing: "pêche", fletching: "fabrication de flèches", flint: "silex",
  flowering: "fleuri", flower: "fleur", furnace: "four", glass: "verre", glass_pane: "vitre",
  glistering: "miroitant", glowstone: "pierre lumineuse", glow_berries: "baies lumineuses",
  gold: "or", golden: "doré", granite: "granite", grass: "herbe", gravel: "gravier",
  gray: "gris", green: "vert", grindstone: "meule", hanging: "suspendu", hardened: "durci",
  hay: "foin", heavy: "lourd", helmet: "casque", hoe: "houe", honey: "miel",
  honeycomb: "rayon de miel", hopper: "entonnoir", horn: "corne", horse: "cheval",
  husk: "zombie momifié", ice: "glace", infested: "infesté", ink: "encre",
  iron: "fer", item: "objet", jack: "lanterne", jungle: "jungle", ladder: "échelle",
  lantern: "lanterne", lapis: "lapis-lazuli", large: "grand", lava: "lave",
  leaf: "feuille", leaves: "feuilles", leather: "cuir", lectern: "lutrin", lever: "levier",
  light: "clair", lightning: "foudre", lilac: "lilas", lily: "nénuphar", lime: "vert clair",
  lingering: "persistante", log: "bûche", loom: "métier à tisser", magenta: "magenta",
  magma: "magma", mangrove: "palétuvier", map: "carte", melon: "pastèque", moss: "mousse",
  mossy: "moussu", mud: "boue", mushroom: "champignon", mutton: "mouton", name: "nom",
  nautilus: "nautile", nether: "Nether", netherite: "Netherite", nether_brick: "brique du Nether",
  nether_wart: "verrue du Nether", note: "note", oak: "chêne", observer: "observateur",
  obsidian: "obsidienne", orange: "orange", oxidized: "oxydé", packed: "compacté",
  pale: "pâle", pale_oak: "chêne pâle", paper: "papier", pearlescent: "nacré",
  peony: "pivoine", phantom: "phantom", pink: "rose", piston: "piston", planks: "planches",
  polished: "poli", poppy: "coquelicot", porkchop: "côtelette de porc", potatoes: "pommes de terre",
  potato: "pomme de terre", powder: "poudre", powered: "électrique", prismarine: "prismarine",
  prismarine_bricks: "briques de prismarine", prismarine_crystals: "cristaux de prismarine",
  prismarine_shard: "éclat de prismarine", purple: "violet", purpur: "purpur",
  quartz: "quartz", rabbit: "lapin", rail: "rail", raw: "brut", red: "rouge",
  redstone: "redstone", reinforced: "renforcé", repeating: "répétition", resin: "résine",
  respawn: "réapparition", rotten: "pourri", saddle: "selle", sandstone: "grès",
  sapling: "pousse", scaffolding: "échafaudage", sculk: "sculk", sea: "mer",
  seagrass: "herbe marine", shears: "cisailles", shield: "bouclier", shroomlight: "champilampe",
  shulker: "shulker", sign: "panneau", slab: "dalle", slime: "slime", smithing: "forge",
  smoker: "fumoir", smooth: "lisse", snout: "groin", snow: "neige", soul: "âme",
  soul_sand: "sable des âmes", soul_soil: "terre des âmes", spawn: "apparition",
  spider: "araignée", splash: "à lancer", spore: "spore", spruce: "épicéa",
  spyglass: "longue-vue", stained: "teinté", stairs: "escalier", stick: "bâton",
  sticky: "collant", stone: "pierre", stonecutter: "taille-pierre", stone_bricks: "briques de pierre",
  stripped: "écorcé", sugar: "sucre", suspicious: "suspect", sword: "épée",
  tnt: "TNT", torch: "torche", trapped: "piégé", trial: "épreuve", tripwire: "fil déclencheur",
  tube: "tube", tuff: "tuf", turtle: "tortue", twisting: "tortueux", unpowered: "désactivé",
  verdant: "verdoyant", warped: "biscornu", warped_fungus: "champignon biscornu",
  warped_wart: "verrue biscornue", waxed: "ciré", weathered: "patiné", weeping: "pleureur",
  wet: "mouillé", wheat: "blé", white: "blanc", wild: "sauvage", wind: "vent",
  witch: "sorcière", wooden: "en bois", wool: "laine", writable: "modifiable",
  yellow: "jaune", zombie: "zombie", zombified: "zombifié", banner_pattern: "motif de bannière",
  chestplate: "plastron", leggings: "jambières", boots: "bottes", pickaxe: "pioche",
  shovel: "pelle", ingot: "lingot", nugget: "pépite", block: "bloc", ore: "minerai",
  amethyst: "améthyste", shard: "éclat", emerald_block: "bloc d’émeraude",
  sugar_cane: "canne à sucre", sweet: "sucré", berry: "baie", berries: "baies",
  golden: "doré", enchanted: "enchanté", enchanted_golden_apple: "pomme dorée enchantée",
  cooked: "cuit", raw: "cru", bucket: "seau", minecart: "wagonnet", red_mushroom: "champignon rouge",
};

Object.assign(words, {
  acetate: "acétate", actinium: "actinium", air: "air", all: "tout", allium: "allium", aluminium: "aluminium",
  aluminum: "aluminium", americium: "américium", ammonia: "ammoniaque", anchor: "ancre", and: "et",
  antimony: "antimoine", argon: "argon", arsenic: "arsenic", astatine: "astate", azure: "azur",
  bale: "botte", barium: "baryum", bars: "barreaux", beans: "graines", bedrock: "roche mère",
  beetroots: "betteraves", benzene: "benzène", berkelium: "berkélium", beryllium: "béryllium",
  big: "grand", bismuth: "bismuth", bleach: "eau de Javel", blocks: "blocs", blossom: "floraison", barrier: "barrière",
  bluet: "bleuet", bohrium: "bohrium", bomb: "bombe", boron: "bore", box: "boîte",
  breath: "souffle", bromide: "bromure", bromine: "brome", bulb: "ampoule", cadmium: "cadmium",
  calcium: "calcium", californium: "californium", cap: "casquette", carbon: "carbone",
  carrots: "carottes", cat: "chat", ceiling: "plafond", center: "centre", cerium: "cérium",
  cesium: "césium", charge: "charge", chemical: "chimique", chicken: "poulet", chirp: "gazouillis",
  chloride: "chlorure", chlorine: "chlore", chromium: "chrome", cinnabar: "cinabre",
  clownfish: "poisson-clown", clump: "amas", cluster: "grappe", coast: "côte", cobalt: "cobalt",
  cobweb: "toile d’araignée", comparator: "comparateur", compound: "composé", constructor: "constructeur",
  continuous: "continu", cookie: "biscuit", copernicium: "copernicium", core: "noyau",
  cornflower: "bleuet", cream: "crème", creator: "créateur", crop: "culture", crude: "brut",
  crystals: "cristaux", crystal: "cristal", curium: "curium", cycling: "cyclique", daisy: "marguerite",
  dandelion: "pissenlit",   darmstadtium: "darmstadtium", debris: "débris", disc: "disque",
  double: "double", dripleaf: "feuille tombante", dubnium: "dubnium", dust: "poudre",
  dyed: "teint", dysprosium: "dysprosium", echo: "écho", edges: "bords", einsteinium: "einsteinium",
  element: "élément", erbium: "erbium", europium: "europium", experience: "expérience",
  fake: "faux", fan: "éventail", far: "lointain", farmland: "terre labourée", fermium: "fermium",
  flerovium: "flérovium", flesh: "chair", fluoride: "fluorure", fluorine: "fluor",
  foot: "pied", fragment: "fragment", frame: "cadre", francium: "francium",
  froglight: "lumière de grenouille", frosted: "givré", fruit: "fruit", fungus: "champignon",
  gadolinium: "gadolinium", gallium: "gallium", gate: "portillon", germanium: "germanium",
  ghast: "Ghast", gilded: "doré", glazed: "émaillé", glow: "lumineux", glowing: "lumineux",
  glue: "colle", goat: "chèvre", grate: "grille", gunpowder: "poudre à canon",
  hafnium: "hafnium", hassium: "hassium", head: "tête", heart: "cœur", heat: "chaleur",
  helium: "hélium", hide: "peau", holmium: "holmium", hook: "crochet", host: "hôte",
  hydride: "hydrure", hydrogen: "hydrogène", hydroxide: "hydroxyde", hyphae: "hyphes",
  hypochlorite: "hypochlorite", indium: "indium", info: "information", invisible: "invisible",
  iodide: "iodure", iodine: "iode", iridium: "iridium", jukebox: "juke-box", kelp: "varech",
  krypton: "krypton", lab: "laboratoire", lamp: "lampe", lanthanum: "lanthane", latex: "latex",
  lawrencium: "lawrencium", layer: "couche", lazuli: "lazuli", lead: "plomb", legacy: "ancien",
  lichen: "lichen", lit: "allumé", lithium: "lithium", livermorium: "livermorium",
  luminol: "luminol", lutetium: "lutécium", magnesium: "magnésium", mall: "centre commercial",
  manganese: "manganèse", material: "matériau", meal: "farine", medicine: "médicament",
  meitnerium: "meitnérium", mellohi: "mellohi", membrane: "membrane", mendelevium: "mendélévium",
  mercuric: "mercurique", mercury: "mercure", milk: "lait", mob: "créature", molybdenum: "molybdène",
  monster: "monstre", mosaic: "mosaïque", moscovium: "moscovium", muddy: "boueux", music: "musique",
  mycelium: "mycélium", neodymium: "néodyme", neon: "néon", neptunium: "neptunium",
  netherrack: "roche du Nether", nickel: "nickel", nihonium: "nihonium", niobium: "niobium",
  nitrate: "nitrate", nitrogen: "azote", nobelium: "nobélium", nylium: "nylium",
  oganesson: "oganesson", of: "de", oil: "huile", ominous: "menaçant", orchid: "orchidée", osmium: "osmium", otherside: "otherside",
  oxeye: "marguerite", oxide: "oxyde", oxygen: "oxygène", pad: "coussin", painting: "tableau",
  palladium: "palladium", pane: "vitre", pants: "pantalon", path: "chemin", pearl: "perle",
  peroxide: "peroxyde", petals: "pétales", phosphorus: "phosphore", pickle: "cornichon",
  pie: "tarte", pigstep: "pigstep", pillar: "pilier", pitcher: "pichet", plant: "plante",
  plate: "plaque", platinum: "platine", plutonium: "plutonium", pod: "cosse", podzol: "podzol",
  poisonous: "toxique", polonium: "polonium", polyethylene: "polyéthylène", popped: "éclaté",
  portal: "portail", pot: "pot", potion: "potion", potassium: "potassium", potent: "puissant", praseodymium: "praséodyme",
  precipice: "précipice", pressure: "pression", promethium: "prométhium", protactinium: "protactinium",
  pufferfish: "poisson-globe", pumpkin: "citrouille", radium: "radium", radon: "radon",
  raiser: "élévateur", reactor: "réacteur", record: "disque", recovery: "récupération",
  reducer: "réducteur", relic: "relique", repeater: "répéteur", reserved6: "réservé",
  rhenium: "rhénium", rhodium: "rhodium", rib: "côte", rocket: "fusée", rod: "bâton",
  roentgenium: "roentgenium", roots: "racines", rose: "rose", rubbish: "déchets",
  rubidium: "rubidium", ruthenium: "ruthénium", rutherfordium: "rutherfordium", sac: "sac",
  salmon: "saumon", salt: "sel", salts: "sels", samarium: "samarium", sand: "sable",
  scandium: "scandium", scrap: "fragment", scute: "écaille", seaborgium: "seaborgium",
  seeds: "graines", selenium: "sélénium", sensor: "capteur", sentry: "sentinelle", shaper: "façonneur",
  shell: "coquille", sided: "face", silence: "silence", silicon: "silicium", silver: "argent",
  slimeball: "boule de slime", small: "petit", snowball: "boule de neige", soap: "savon",
  sodium: "sodium", soil: "terre", soup: "soupe", spawner: "générateur", spire: "flèche",
  sponge: "éponge", sprouts: "pousses", squid: "calmar", stal: "stal", stand: "support",
  star: "étoile", steak: "steak", steel: "acier", stem: "tige", stew: "ragoût",
  strad: "strad", string: "ficelle", strontium: "strontium", structure: "structure",
  sugarcane: "canne à sucre", sulfur: "soufre", sulphate: "sulfate", sulphide: "sulfure",
  sunflower: "tournesol", sweet: "sucré", table: "table", tag: "étiquette", tall: "grand",
  tallgrass: "herbes hautes", tantalum: "tantale", tear: "larme", technetium: "technétium",
  tellurium: "tellure", template: "modèle", tennessine: "tennessine", terbium: "terbium",
  terracotta: "terre cuite", thallium: "thallium", thorium: "thorium", thulium: "thulium",
  tide: "marée", tile: "carreau", tiles: "carreaux", tin: "étain", tinted: "teinté",
  titanium: "titane", torchflower: "fleur torche", totem: "totem", trident: "trident",
  trim: "ornement", trioxide: "trioxyde", tulip: "tulipe", tungsten: "tungstène", tunic: "tunique",
  the: "la", trapdoor: "trappe", underwater: "sous-marin", update: "mise à jour", update2: "mise à jour", upgrade: "amélioration",
  uranium: "uranium", valley: "vallée", vanadium: "vanadium", vex: "Vex", villager: "villageois",
  vines: "lianes", void: "vide", wait: "wait", wall: "mur", ward: "ward", wart: "verrue",
  water: "eau", wayfinder: "éclaireur", weighted: "pondéré", wire: "fil", with: "avec",
  wither: "Wither", wood: "bois", written: "écrit", xenon: "xénon", ytterbium: "ytterbium",
  yttrium: "yttrium", zero: "zéro", zinc: "zinc", zirconium: "zirconium",
});

const frenchName = (id) => {
  const value = id.replace(/^minecraft:/, "").toLowerCase();
  const exactNames = {
    baked_potato: "Pomme de terre cuite", beetroot_seeds: "Graines de betterave",
    beetroot_soup: "Soupe de betterave", blaze_powder: "Poudre de Blaze", blaze_rod: "Bâton de Blaze",
    bone_meal: "Farine d’os", chorus_fruit: "Fruit de chorus", clownfish: "Poisson-clown",
    cooked_chicken: "Poulet cuit", cooked_fish: "Poisson cuit", cooked_mutton: "Mouton cuit",
    cooked_porkchop: "Côtelette de porc cuite", cooked_rabbit: "Lapin cuit", cooked_salmon: "Saumon cuit",
    dragon_breath: "Souffle du dragon", dried_kelp: "Varech séché", echo_shard: "Éclat d’écho",
    enchanted_book: "Livre enchanté", enchanted_golden_apple: "Pomme dorée enchantée",
    end_crystal: "Cristal de l’End", ender_pearl: "Perle de l’Ender", experience_bottle: "Fiole d’expérience",
    fermented_spider_eye: "Œil d’araignée fermenté", fire_charge: "Boule de feu",
    firework_rocket: "Fusée de feu d’artifice", fishing_rod: "Canne à pêche", ghast_tear: "Larme de Ghast",
    glass_bottle: "Fiole", glistering_melon: "Pastèque scintillante", glowstone_dust: "Poudre de pierre lumineuse",
    glow_berries: "Baies lumineuses", glow_ink_sac: "Poche d’encre lumineuse", goat_horn: "Corne de chèvre",
    golden_apple: "Pomme dorée", golden_carrot: "Carotte dorée", gunpowder: "Poudre à canon",
    heart_of_the_sea: "Cœur de la mer", honey_bottle: "Fiole de miel", honeycomb: "Rayon de miel",
    iron_ingot: "Lingot de fer", iron_nugget: "Pépite de fer", magma_cream: "Crème de magma",
    nether_star: "Étoile du Nether", nether_wart: "Verrue du Nether", oak_boat: "Bateau en chêne",
    paper: "Papier", rabbit_foot: "Patte de lapin", rabbit_hide: "Peau de lapin",
    rotten_flesh: "Chair putréfiée", slime_ball: "Boule de slime", snowball: "Boule de neige",
    splash_potion: "Potion à lancer", lingering_potion: "Potion persistante",
    sugar_cane: "Canne à sucre", turtle_helmet: "Carapace de tortue", water_bucket: "Seau d’eau",
    wheat_seeds: "Graines de blé", writable_book: "Livre et plume", written_book: "Livre écrit",
  };
  if (exactNames[value]) return exactNames[value];
  if (value.startsWith("chemical_")) {
    return "Produit chimique : " + value.slice("chemical_".length).split("_").map((token) => words[token] || token).join(" ");
  }
  const materialNames = {
    diamond: "diamant", iron: "fer", golden: "or", gold: "or", netherite: "Netherite",
    stone: "pierre", wooden: "bois", wood: "bois", leather: "cuir", chainmail: "cotte de mailles",
    copper: "cuivre", turtle: "tortue", carved: "citrouille sculptée",
  };
  const colors = {
    white: "blanche", orange: "orange", magenta: "magenta", light_blue: "bleu clair",
    yellow: "jaune", lime: "vert clair", pink: "rose", gray: "grise", light_gray: "gris clair",
    cyan: "cyan", purple: "violet", blue: "bleue", brown: "marron", green: "verte",
    red: "rouge", black: "noire",
  };
  const material = Object.keys(materialNames).find((name) => value.startsWith(name + "_"));
  const materialSuffixes = {
    sword: "Épée", pickaxe: "Pioche", axe: "Hache", shovel: "Pelle", hoe: "Houe",
    helmet: "Casque", chestplate: "Plastron", leggings: "Jambières", boots: "Bottes",
    ingot: "Lingot", nugget: "Pépite", shard: "Éclat", dust: "Poudre",
  };
  for (const [suffix, noun] of Object.entries(materialSuffixes)) {
    if (value.endsWith("_" + suffix) && material) {
      const resource = materialNames[material];
      if (suffix === "ingot") return noun + (resource === "or" ? " d’or" : " de " + resource);
      if (suffix === "nugget") return noun + (resource === "or" ? " d’or" : " de " + resource);
      if (suffix === "shard" || suffix === "dust") return noun + (resource === "or" ? " d’or" : " de " + resource);
      const description = ["gold", "golden"].includes(material) ? "en or" :
        ["wooden", "wood"].includes(material) ? "en bois" : "en " + resource;
      return noun + " " + description;
    }
  }
  const ore = value.match(/^(deepslate_)?(.+)_ore$/);
  if (ore) {
    const materialName = materialNames[ore[2]] || frenchName(ore[2]);
    return "Minerai de " + materialName + (ore[1] ? " des abîmes" : "");
  }
  const colored = value.match(/^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_(wool|bed|banner|carpet|concrete|concrete_powder|terracotta|stained_glass|stained_glass_pane|shulker_box)$/);
  if (colored) {
    const nouns = {
      wool: "Laine", bed: "Lit", banner: "Bannière", carpet: "Tapis",
      concrete: "Béton", concrete_powder: "Béton en poudre", terracotta: "Terre cuite",
      stained_glass: "Verre teinté", stained_glass_pane: "Vitre teintée", shulker_box: "Boîte de Shulker",
    };
    return nouns[colored[2]] + " " + colors[colored[1]];
  }
  if (value.startsWith("splash_") && value.endsWith("_potion")) {
    return "Potion à lancer";
  }
  if (value.startsWith("lingering_") && value.endsWith("_potion")) {
    return "Potion persistante";
  }
  const potion = value.match(/^(.+)_potion$/);
  if (potion) return "Potion " + frenchName(potion[1]).toLowerCase();

  const woodTypes = {
    oak: "chêne", birch: "bouleau", spruce: "épicéa", jungle: "jungle",
    acacia: "acacia", dark_oak: "chêne noir", mangrove: "palétuvier",
    cherry: "cerisier", bamboo: "bambou", crimson: "carmin", warped: "biscornu",
    pale_oak: "chêne pâle",
  };
  for (const [wood, frenchWood] of Object.entries(woodTypes)) {
    if (!value.startsWith(wood + "_")) continue;
    const part = value.slice(wood.length + 1);
    const woodForms = {
      planks: "Planches de ", log: "Bûche de ", wood: "Bois de ", stripped_log: "Bûche écorcée de ",
      stripped_wood: "Bois écorcé de ", leaves: "Feuilles de ", sapling: "Pousse de ",
      stairs: "Escaliers en ", slab: "Dalle en ", fence: "Barrière en ", fence_gate: "Portillon en ",
      door: "Porte en ", trapdoor: "Trappe en ", sign: "Panneau en ", hanging_sign: "Panneau suspendu en ",
      boat: "Bateau en ", chest_boat: "Bateau avec coffre en ", button: "Bouton en ",
      pressure_plate: "Plaque de pression en ", wall_sign: "Panneau mural en ",
      wall_hanging_sign: "Panneau mural suspendu en ", standing_sign: "Panneau en ",
      ceiling_center_hanging_sign: "Panneau suspendu en ", ceiling_edges_hanging_sign: "Panneau suspendu en ",
    };
    const form = Object.keys(woodForms).sort((a, b) => b.length - a.length).find((suffix) => part === suffix || part.endsWith("_" + suffix));
    if (form) {
      const prefix = part === form ? "" : part.slice(0, -(form.length + 1)).split("_").map((word) => words[word] || word).join(" ") + " ";
      return prefix + woodForms[form] + frenchWood;
    }
  }

  const tokens = value.split("_");
  const translated = tokens.map((token) => words[token] || token);
  if (["sword", "pickaxe", "axe", "shovel", "hoe"].includes(tokens.at(-1)) && tokens.length > 1) {
    const noun = translated.pop();
    const resource = translated.join(" ");
    return noun.charAt(0).toLocaleUpperCase("fr") + noun.slice(1) + " en " + resource;
  }
  return translated.join(" ").replace(/^./u, (letter) => letter.toLocaleUpperCase("fr"));
};

const read = (relativePath) => readFile(path.join(pmmpRoot, relativePath), "utf8");
const registryIds = async (relativePath) => {
  const source = await read(relativePath);
  return [...source.matchAll(/public static function ([A-Z][A-Z0-9_]*)\(\) :/g)]
    .map((match) => match[1].toLowerCase())
    .filter((id) => id !== "getall")
    .map((id) => ({ id, name: frenchName(id) }));
};

const itemName = (value) => {
  const id = typeof value === "string" ? value : value?.name;
  return typeof id === "string" ? id.replace(/^minecraft:/, "") : "";
};

const ingredientData = (value) => {
  if (typeof value?.tag === "string") {
    const tag = value.tag.replace(/^minecraft:/, "");
    return { id: "tag_" + tag.replace(/[^a-z0-9_]/g, "_"), name: "Groupe : " + frenchName(tag), tag: value.tag };
  }
  const id = itemName(value);
  const meta = typeof value === "object" && Number.isInteger(value?.meta) ? value.meta : null;
  return id ? { id, name: frenchName(id) + (meta === null ? "" : " (variante " + meta + ")"), ...(meta === null ? {} : { meta }) } : null;
};

const outputData = (value) => {
  const id = itemName(value);
  const count = typeof value === "object" && Number.isInteger(value?.count) ? value.count : 1;
  const meta = typeof value === "object" && Number.isInteger(value?.meta) ? value.meta : null;
  return id ? { id, name: frenchName(id) + (meta === null ? "" : " (variante " + meta + ")"), count, ...(meta === null ? {} : { meta }) } : null;
};

const recipeDirectory = path.join(pmmpRoot, "vendor", "axolotl-pm", "bedrock-data", "recipes");
const vanillaItems = await registryIds("generated/item/VanillaItems.php");
const vanillaBlocks = await registryIds("generated/block/VanillaBlocks.php");
const knownRuntimeIds = new Set([...vanillaItems, ...vanillaBlocks].map((item) => item.id));
const canDeserializeIngredient = (value) => {
  if (typeof value?.tag === "string") return true;
  const id = itemName(value);
  return Boolean(id && (value?.meta === 32767 || knownRuntimeIds.has(id)));
};
const canDeserializeStack = (value) => {
  const id = itemName(value);
  return Boolean(id && knownRuntimeIds.has(id));
};
const shaped = JSON.parse(await readFile(path.join(recipeDirectory, "shaped_crafting.json"), "utf8"));
const shapeless = JSON.parse(await readFile(path.join(recipeDirectory, "shapeless_crafting.json"), "utf8"));
const potionType = JSON.parse(await readFile(path.join(recipeDirectory, "potion_type.json"), "utf8"));
const potionContainerChange = JSON.parse(await readFile(path.join(recipeDirectory, "potion_container_change.json"), "utf8"));
const smithing = JSON.parse(await readFile(path.join(recipeDirectory, "smithing.json"), "utf8"));
const recipes = [];
const recipeIndex = [];
const furnaceIndexes = new Map();
let craftingIndex = 0;

const shapedRecipes = [];
for (const recipe of shaped) {
  if (recipe.block !== "crafting_table" || !recipe.shape || !recipe.input || !Array.isArray(recipe.output)) continue;
  const result = outputData(recipe.output?.[0]);
  if (!result) continue;
  const ingredients = Object.fromEntries(Object.entries(recipe.input)
    .map(([key, value]) => [key, ingredientData(value)])
    .filter(([, ingredient]) => ingredient));
  shapedRecipes.push({
    name: "Fabrication : " + result.name,
    station: "table_de_craft",
    type: "shaped",
    pattern: recipe.shape,
    ingredients,
    result,
    runtimeEligible: Object.keys(ingredients).length === Object.keys(recipe.input).length &&
      Object.values(recipe.input).every(canDeserializeIngredient) && recipe.output.every(canDeserializeStack),
  });
}

const shapelessRecipes = [];
for (const recipe of shapeless) {
  if (!recipe.block || recipe.block === "deprecated" || !Array.isArray(recipe.input) || !Array.isArray(recipe.output)) continue;
  const runtimeManager = ["crafting_table", "stonecutter", "smithing_table", "cartography_table"].includes(recipe.block)
    ? "crafting"
    : ["furnace", "blast_furnace", "smoker", "campfire", "soul_campfire"].includes(recipe.block)
      ? "furnace:" + recipe.block
      : null;
  const result = outputData(recipe.output?.[0]);
  const ingredients = recipe.input.map(ingredientData).filter(Boolean);
  if (!result || ingredients.length === 0) continue;
  const entry = {
    name: "Fabrication : " + result.name,
    station: recipe.block,
    type: "shapeless",
    ingredients,
    result,
    runtimeEligible: runtimeManager !== null &&
      recipe.input.every(canDeserializeIngredient) && recipe.output.every(canDeserializeStack) &&
      (!runtimeManager.startsWith("furnace:") || (recipe.input.length === 1 && recipe.output.length === 1)),
  };
  if (entry.runtimeEligible) {
    const runtimeIndex = runtimeManager === "crafting"
      ? craftingIndex++
      : furnaceIndexes.get(recipe.block) || 0;
    if (runtimeManager !== "crafting") furnaceIndexes.set(recipe.block, runtimeIndex + 1);
    entry.runtime = { manager: runtimeManager, index: runtimeIndex };
    recipeIndex.push({ recipe: entry, manager: runtimeManager, index: runtimeIndex, station: recipe.block });
  }
  shapelessRecipes.push(entry);
}

for (const recipe of shapedRecipes) {
  if (!recipe.runtimeEligible) continue;
  recipe.runtime = { manager: "crafting", index: craftingIndex++ };
  recipeIndex.push({ recipe, manager: "crafting", index: recipe.runtime.index, station: recipe.station });
}
for (const recipe of [...shapedRecipes, ...shapelessRecipes]) {
  delete recipe.runtimeEligible;
  if (!recipe.runtime) recipe.supported = false;
}
recipes.push(...shapedRecipes, ...shapelessRecipes);

let potionTypeIndex = 0;
for (const recipe of potionType) {
  const input = ingredientData(recipe.input);
  const ingredient = ingredientData(recipe.ingredient);
  const result = outputData(recipe.output);
  if (!input || !ingredient || !result) continue;
  const entry = {
    name: "Alchimie : " + result.name,
    station: "brewing_stand",
    type: "brewing",
    ingredients: [input, ingredient],
    result,
    supported: false,
  };
  if (canDeserializeIngredient(recipe.input) && canDeserializeIngredient(recipe.ingredient) && canDeserializeStack(recipe.output)) {
    entry.runtime = { manager: "potion_type", index: potionTypeIndex };
    entry.supported = true;
    recipeIndex.push({ recipe: entry, manager: "potion_type", index: potionTypeIndex++, station: "brewing_stand" });
  }
  recipes.push(entry);
}

let potionContainerIndex = 0;
for (const recipe of potionContainerChange) {
  const ingredient = ingredientData(recipe.ingredient);
  const input = ingredientData({ name: recipe.input_item_name });
  const result = outputData({ name: recipe.output_item_name });
  if (!input || !ingredient || !result) continue;
  const entry = {
    name: "Alchimie : " + result.name,
    station: "brewing_stand",
    type: "brewing",
    kindHint: "brewing_container",
    ingredients: [input, ingredient],
    result,
    supported: false,
  };
  if (canDeserializeIngredient(recipe.ingredient) &&
    knownRuntimeIds.has(String(recipe.input_item_name || "").replace(/^minecraft:/, "")) &&
    knownRuntimeIds.has(String(recipe.output_item_name || "").replace(/^minecraft:/, ""))) {
    entry.runtime = { manager: "potion_container_change", index: potionContainerIndex };
    entry.supported = true;
    recipeIndex.push({ recipe: entry, manager: "potion_container_change", index: potionContainerIndex++, station: "brewing_stand" });
  }
  recipes.push(entry);
}

for (const recipe of smithing) {
  const template = ingredientData(recipe.template);
  const input = ingredientData(recipe.input);
  const addition = ingredientData(recipe.addition);
  const result = outputData(recipe.output);
  if (!template || !input || !addition || !result) continue;
  recipes.push({
    name: "Forge : " + result.name,
    station: "smithing_table",
    type: "smithing",
    ingredients: [template, input, addition],
    result,
    supported: false,
  });
}

const destination = path.join(projectRoot, "public", "assets", "opal-heaven", "vanilla-catalogue.json");
const recipeIndexPath = path.join(projectRoot, "public", "assets", "opal-heaven", "vanilla-recipe-index.json");

// Réutilise les identifiants déjà publiés en les retrouvant par empreinte de
// contenu : une mise à jour du catalogue ne décale plus les overrides et les
// désactivations existants.
const readPreviousGroups = async () => {
  const groups = [];
  try {
    const previous = JSON.parse(await readFile(destination, "utf8"));
    if (Array.isArray(previous.recipes)) groups.push(groupRecipeIds(previous.recipes));
  } catch {
    /* premier lancement */
  }
  try {
    const previousIndex = JSON.parse(await readFile(recipeIndexPath, "utf8"));
    if (Array.isArray(previousIndex.recipes)) groups.push(groupRecipeIds(previousIndex.recipes));
  } catch {
    /* index absent */
  }
  return mergeRecipeIdGroups(...groups);
};

const { legacyIds } = assignRecipeIds(recipes, await readPreviousGroups());
for (const entry of recipeIndex) {
  entry.id = entry.recipe.id;
  entry.fingerprint = entry.recipe.fingerprint;
  delete entry.recipe;
}
for (const recipe of recipes) delete recipe.kindHint;

const catalogue = {
  version: 1,
  source: "PocketMine-MP 5 — registres VanillaItems/VanillaBlocks et recettes Bedrock du jeu",
  generatedAt: new Date().toISOString(),
  items: vanillaItems,
  blocks: vanillaBlocks,
  recipes,
  opal: [],
};
const recipeIndexDocument = {
  version: 1,
  legacyIds,
  counts: {
    crafting: craftingIndex,
    ...Object.fromEntries([...furnaceIndexes].map(([station, count]) => ["furnace:" + station, count])),
    potion_type: potionTypeIndex,
    potion_container_change: potionContainerIndex,
  },
  recipes: recipeIndex,
};

if (opalRoot) {
  const registryPath = path.join(opalRoot, "plugins_src", "OpalCore", "src", "opal", "core", "creative", "CreativeRegistry.php");
  const registry = await readFile(registryPath, "utf8");
  const assignments = /\$this->(customBlocks|customItems|rubisEquipment|argentEquipment|opaleEquipment|titaneEquipment|raidBlocks)\["([^"]+)"\]\s*=\s*([\s\S]*?);/g;
  const fallbackNames = {
    watering_can_iron: "Arrosoir en fer", watering_can_diamond: "Arrosoir en diamant",
    watering_can_opal: "Arrosoir céleste en opale", fast_fertilizer: "Engrais rapide",
    seed_iron: "Graine de fer", seed_gold: "Graine d’or", seed_diamond: "Graine de diamant",
    seed_opal: "Graine d’opale", diamond_shard: "Éclat de diamant", opal_nugget: "Pépite d’opale",
    acceleration_composter: "Composteur d’accélération", fast_smelter: "Fonderie rapide",
    fortified_stone: "Pierre renforcée", reinforced_obsidian: "Obsidienne renforcée",
    reinforced_glass: "Verre renforcé", steel_spikes: "Piques d’acier", breach_tnt: "TNT de brèche",
  };
  const frenchIcons = {
    ruby_gem: "gemme_rubis", silver_ingot: "lingot_argent", opal_gem: "gemme_opale",
    ruby_ore: "minerai_rubis", silver_ore: "minerai_argent", celestial_opal_ore: "minerai_opale",
    deepslate_ruby_ore: "deepslate_minerai_rubis", deepslate_silver_ore: "deepslate_minerai_argent",
    deepslate_opal_ore: "deepslate_minerai_opale", block_pure_opal: "bloc_opale",
    ruby_block: "bloc_rubis", silver_block: "bloc_argent", block_titanium: "block_titanium",
    block_pure_opal: "bloc_opale", opal_bricks: "briques_opale", opal_lamp: "lampe_opale",
    pioche_rubis: "hammer_rubis", pavois_opale: "pavois_opale", bouclier_argent: "bouclier_argent_icon",
    casque_argent: "casque_argent_icon",
    casque_opale: "casque_opale_icon", casque_titane: "casque_titane_icon",
    plastron_argent: "plastron_argent_icon", plastron_opale: "plastron_opale_icon",
    plastron_titane: "plastron_titane_icon", jambieres_argent: "jambieres_argent_icon",
    jambieres_opale: "jambieres_opale_icon", jambieres_titane: "jambieres_titane_icon",
    bottes_argent: "bottes_argent_icon", bottes_opale: "bottes_opale_icon",
    bottes_titane: "bottes_titane_icon", epee_argent: "epee_argent_icon",
    epee_opale: "epee_opale_icon", epee_titane: "epee_titane_icon",
    pioche_argent: "pioche_argent_icon", pioche_opale: "pioche_opale_icon",
    pioche_titane: "pioche_titane_icon", hache_argent: "hache_argent_icon",
    hache_opale: "hache_opale_icon", hache_titane: "hache_titane_icon",
    pelle_argent: "pelle_argent_icon", pelle_opale: "pelle_opale_icon",
    pelle_titane: "pelle_titane_icon", houe_argent: "houe_argent_icon",
    houe_opale: "houe_opale_icon", houe_titane: "houe_titane_icon",
    casque_rubis: "casque_rubis", plastron_rubis: "plastron_rubis",
    jambieres_rubis: "jambieres_rubis", bottes_rubis: "bottes_rubis",
    dague_rubis: "dague_rubis", stick_heal: "stick_heal", stick_speed: "stick_speed",
    stick_force: "stick_force", stick_breach: "stick_breach",
  };
  const iconDirectory = path.join(projectRoot, "public", "assets", "opal-heaven", "icons");
  const textureDirectory = path.join(projectRoot, "public", "assets", "opal-heaven", "textures", "blocks");
  const itemTextureDirectory = path.join(projectRoot, "public", "assets", "opal-heaven", "textures", "items");
  const iconFiles = new Set(await readdir(iconDirectory));
  const textureFiles = new Set(await readdir(textureDirectory));
  const itemTextureFiles = new Set(await readdir(itemTextureDirectory));
  for (const match of registry.matchAll(assignments)) {
    const [, bucket, key, expression] = match;
    const customId = expression.match(/"opal:([a-z0-9_]+)"/)?.[1] || key;
    const baseItem = expression.match(/Vanilla(?:Items|Blocks)::([A-Z0-9_]+)\(/)?.[1]?.toLowerCase() || "";
    const displayName = expression.match(/create(?:ImplementedBlock|CustomItem|CustomEquipment)\(\s*Vanilla(?:Items|Blocks)::[A-Z0-9_]+\(\)(?:->asItem\(\))?\s*,\s*"([^"]+)"/s)?.[1] ||
      expression.match(/createUnimplementedBlock\(\s*"([^"]+)"/s)?.[1];
    const name = (displayName || fallbackNames[key] || frenchName(key))
      .replace(/§[0-9a-fk-or]/gi, "")
      .replace(/\s*\([^)]*\)/g, "")
      .trim();
    const isBlock = bucket === "customBlocks" || bucket === "raidBlocks";
    const icon = frenchIcons[key] || (iconFiles.has(key + ".png") ? key : "");
    const blockTexture = textureFiles.has(key + ".png") ? key :
      isBlock && textureFiles.has(baseItem + ".png") ? baseItem : "";
    const itemTexture = itemTextureFiles.has(key + ".png") ? key :
      !isBlock && itemTextureFiles.has(baseItem + ".png") ? baseItem : "";
    const equipment = ["rubisEquipment", "argentEquipment", "opaleEquipment", "titaneEquipment"].includes(bucket);
    const kind = isBlock ? "block" : equipment
      ? (/(casque|plastron|jambieres|bottes)/.test(key) ? "armor" : /(dague|epee|masse)/.test(key) ? "weapon" : "tool")
      : "item";
    catalogue.opal.push({
      id: customId,
      name,
      kind,
      baseItem,
      implemented: !expression.includes("createUnimplementedBlock"),
      icon: icon && iconFiles.has(icon + ".png") ? "/assets/opal-heaven/icons/" + icon + ".png" :
        blockTexture ? "/assets/opal-heaven/textures/blocks/" + blockTexture + ".png" :
          itemTexture ? "/assets/opal-heaven/textures/items/" + itemTexture + ".png" : "",
    });
  }
}

await writeFile(destination, JSON.stringify(catalogue), "utf8");
await writeFile(recipeIndexPath, JSON.stringify(recipeIndexDocument), "utf8");
if (opalRoot) {
  const pluginRecipeIndexPath = path.join(opalRoot, "plugins_src", "OpalCore", "resources", "vanilla-recipe-index.json");
  await writeFile(pluginRecipeIndexPath, JSON.stringify(recipeIndexDocument), "utf8");
}
console.log(JSON.stringify({
  items: catalogue.items.length,
  blocks: catalogue.blocks.length,
  recipes: catalogue.recipes.length,
  supportedRecipes: recipeIndex.length,
  opal: catalogue.opal.length,
  destination,
}));
