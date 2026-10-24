# Audit — Opal Heaven Studio

**Date de l’audit :** 23 octobre 2026
**Mise à jour :** 24 octobre 2026 (corrections appliquées)
**Périmètre :** `public/` (UI), `netlify/functions/api.mjs` (API), `netlify.toml`, `scripts/`, données générées dans `public/assets/opal-heaven/`.
**Méthode :** lecture intégrale du code applicatif, analyse des données générées (3 475 recettes, 324 items + 830 blocs vanilla, 83 entrées Opal avant déduplication), vérification des références d'assets et des règles de validation client/serveur.
**Volumétrie initiale :** ~1 460 lignes de JS front, 233 lignes de fonction, 587 fichiers d'assets (3,6 Mo), 213 doublons binaires.

---

## 0. État après mise en œuvre

Les corrections ci-dessous sont appliquées dans le dépôt. Les sections suivantes conservent l’analyse initiale et servent de référence.

| Sujet | État | Emplacement |
|---|---|---|
| Perte de données si le chargement échoue | Corrigé : `state.ready` requis, écran fatal, sauvegarde désactivée | `public/app.js` |
| Écrasement concurrent | Corrigé : révisions, `If-Match`, `409`, écrasement/rechargement explicite | `public/app.js`, `netlify/functions/api.mjs` |
| Historique / restauration | Corrigé : 15 versions, restauration avec nouvelle révision | API + onglet Données |
| IDs de recettes instables | Corrigé : empreinte SHA-256, réutilisation des IDs existants, IDs stables pour les nouvelles recettes, `legacyIds` | `scripts/lib/recipe-id.mjs`, générateur |
| Recettes non supportées | Corrigé : `runtime` et stations vérifiés, édition/désactivation bloquées, consultation conservée | `public/app.js` |
| Regex smithing / overrides invalides | Corrigé : familles `smithing` et IDs stables acceptés, override invalide rejeté | `public/lib/schema.mjs` |
| Textures triplées / non validées | Corrigé : clé canonique, migration, allowlist d’URL, protection `__proto__` | `public/lib/schema.mjs`, `public/app.js` |
| Rate limiting / configuration | Corrigé : Blobs + mémoire, longueurs minimales, délai constant | `netlify/functions/api.mjs` |
| En-têtes / CSP / cache | Corrigé : CSP sans inline, HSTS, `X-Robots-Tag`, cache assets, JSON revalidés | `netlify.toml`, `public/robots.txt` |
| Accessibilité | Corrigé : onglets ARIA, focus, `aria-live`, dialogues, listes clavier, `noscript`, favicon | `index.html`, `style.css` |
| Tests / CI / documentation | Ajoutés : 25 tests, `check:data`, workflow GitHub Actions, README, `.gitignore`, lockfile | `tests/`, `scripts/`, `.github/` |
| Données | Corrigé : manifeste `1.5.0`, `en_US` traduit, 5 icônes implémentées ajoutées, 2 doublons Opal supprimés, empreintes ajoutées | `public/assets/opal-heaven/` |

### Limites restantes, assumées

- **Pas de dépôt Git initialisé** : le dossier n’est pas versionné, conformément à la demande. Le workflow CI est prêt mais ne s’exécutera qu’après `git init` et publication.
- **Plugin `OpalCore` absent du poste** : le générateur n’a pas été relancé. Les IDs actuels sont conservés ; les empreintes ont été rétro-remplies avec `scripts/backfill-recipe-fingerprints.mjs`. À la prochaine génération, les IDs existants seront réutilisés par empreinte.
- **14 empreintes en double** : ce sont des recettes strictement identiques dans les données source (ex. `vanilla_shaped_0469`/`0470`). Elles sont conservées pour ne pas casser le contenu publié ; le générateur attribue des IDs distincts aux doublons.
- **1 718 recettes non supportées** et 669 recettes sur stations non éditables restent en lecture seule. Le support complet de `brewing`/`smithing`/`meta` nécessiterait une évolution du schéma et du plugin, hors périmètre.
- **6 entrées Opal non implémentées sans icône** (`cobalt_ore`, `titanium_ore`, `aetherite_ore`, `block_cobalt`, `dense_void_obsidian`, `ground_spikes`) : fallback visuel, aucune texture source n’existe.
- **213 doublons binaires d’assets** non nettoyés : sans impact fonctionnel, gain de poids uniquement.
- **Sauvegarde planifiée** non ajoutée : l’historique Blobs (15 versions) et l’export JSON manuel restent les seuls mécanismes.
- **Tests API** : `@netlify/blobs` n’est pas installé dans le dépôt ; les tests couvrent le schéma, les IDs et les données. Un smoke test navigateur avec API simulée a validé connexion, sauvegarde, conflit `409`, historique, texture et onglets.

---

## 1. Synthèse

### Ce qui est déjà solide

- Validation serveur stricte et centralisée (`api.mjs:75-173`), avec normalisation et limites de taille.
- Auth par token signé HMAC, comparaison à temps constant, TTL, `no-store`.
- Aucun `innerHTML` / `eval` : le rendu passe par `textContent`, donc pas de XSS stockée.
- CSP, `nosniff`, `DENY`, `no-referrer`, permissions restreintes.
- Séparation nette entre contenu personnalisé et catalogue vanilla ; UX de modification des textures et des crafts déjà riche.
- Zéro dépendance front, pas de build : simple et rapide à déployer.

### Les 6 risques majeurs

| # | Risque | Impact |
|---|--------|--------|
| 1 | **Perte de données** : si le chargement initial échoue, l'app s'affiche avec un état vide et « Enregistrer » écrase le contenu serveur | Critique |
| 2 | **Écrasement concurrent** : aucun contrôle de révision, deux onglets = dernier écrivain gagne | Critique |
| 3 | **IDs de recettes vanilla instables** (positionnels) : toute régénération décale les overrides/désactivations | Critique |
| 4 | **Éditeur de crafts incompatible avec ~50 % du catalogue** (`supported:false`, stations autres que table de craft, ingrédients avec `meta`) | Élevé |
| 5 | **Recettes smithing** : la regex serveur les rejette → la sauvegarde entière échoue | Élevé |
| 6 | **Textures stockées sous 3 clés** → payload ×3, proche de la limite 4 Mo, collisions vanilla/mod | Élevé |

---

## 2. P0 — À corriger immédiatement

### P0-1 · Perte de données si le chargement échoue

**Preuves**
- `public/app.js:1345-1352` : `enter()` affiche l'app **avant** `load()` et se contente d'écrire l'erreur dans `#status`.
- `public/app.js:1238-1256` : `save()` envoie `state.data`, initialisé à des tableaux vides (`app.js:79`).
- `api.mjs` accepte un PUT `{entries:[],recipes:[]}` comme valide.

**Scénario** : panne Blobs, 500, coupure réseau au login → l'admin voit l'interface, clique « Enregistrer » → tout le contenu est remplacé par du vide.

**Correctif**
```js
// app.js
let contentReady = false;

const enter = async () => {
  showApp(true, { busy: true });
  try {
    await load();
    contentReady = true;
  } catch (error) {
    contentReady = false;
    showFatal("Impossible de charger le contenu : " + error.message);
  } finally {
    $("#save").disabled = !contentReady;
  }
};

const save = async () => {
  if (!contentReady) return; // + garde anti double-clic
  ...
};
```
Et désactiver le formulaire (`fieldset disabled`) tant que le contenu n'est pas chargé. Ajouter un bouton « Réessayer ».

### P0-2 · Aucun contrôle de concurrence

**Preuve** : `api.mjs:214-225` remplace la valeur Blob sans comparer l'état lu. `updatedAt` existe mais n'est jamais utilisé côté client. Deux admins (ou deux onglets) → perte silencieuse du travail de l'autre.

**Correctif (simple et efficace)**
- Ajouter `revision: number` au document.
- Le client envoie `If-Match: <revision>` (ou `revision` dans le corps).
- Le serveur répond `409` avec le document courant ; le client propose « Recharger » / « Écraser ».
```js
const stored = (await store.get("content", { type: "json" })) || emptyContent();
const expected = Number(req.headers.get("if-match") ?? body.revision ?? stored.revision);
if (Number.isFinite(expected) && expected !== (stored.revision ?? 0)) {
  return reply({ error: "conflit", revision: stored.revision ?? 0, content: stored }, 409);
}
content.revision = (stored.revision ?? 0) + 1;
```
Ajouter en complément un historique borné (`history/<timestamp>`, 20 dernières versions) + bouton « Restaurer ». C'est la meilleure assurance-vie de ce projet.

### P0-3 · IDs de recettes vanilla instables

**Preuves**
- `scripts/generate-vanilla-catalogue.mjs:357,382,422,446,473` : IDs = `vanilla_shaped_0001`, `vanilla_shapeless_0001`, etc., basés sur l'index.
- `public/app.js:890` et `api.mjs:14` s'appuient sur ces IDs pour `vanillaOverride` et `disabledVanillaRecipes`.

**Impact** : dès qu'une recette est ajoutée/retirée/réordonnée dans PMMP Bedrock (montée de version, correctif), tous les IDs glissent. Les overrides et désactivations pointent alors vers **d'autres recettes**, silencieusement.

**Correctif**
1. Générer un ID stable par contenu :
```js
// scripts/generate-vanilla-catalogue.mjs
import { createHash } from "node:crypto";

const stableId = (kind, payload) =>
  "vanilla_" + kind + "_" +
  createHash("sha1").update(JSON.stringify(payload)).digest("hex").slice(0, 12);
```
`payload` = `{station, pattern|ingredients (id+meta), result (id+meta+count)}`.
2. Conserver dans `vanilla-recipe-index.json` une table `legacyIds: { "vanilla_shaped_0001": "vanilla_shaped_a1b2c3d4e5f6", ... }`.
3. Migration côté API : réécrire `disabledVanillaRecipes` et `vanillaOverride` via cette table au premier chargement post-déploiement.
4. Ajouter un test qui garantit que deux générations successives du même jeu produisent les mêmes IDs.

### P0-4 · L'éditeur ne couvre pas la moitié du catalogue

**Preuves**
- Catalogue : **1 718 / 3 475** recettes ont `supported:false`. L'index transmis au plugin (`vanilla-recipe-index.json`) ne contient que les **1 757** recettes dotées d'un handle `runtime` (`generate-vanilla-catalogue.mjs:394-409`) : une désactivation portant sur les 1 718 autres est enregistrée mais ne peut pas être résolue par le plugin.
- Stations présentes : stonecutter 354, brewing 212, blast furnace 62, smithing 12, campfire/soul campfire 18, smoker 9, cartography 2, soit **669 recettes** dont la station n'est pas représentable dans l'éditeur (seuls `shaped`, `shapeless`, `furnace` existent).
- **3 198** recettes utilisent des ingrédients avec `meta` (ex. `beef` meta 32767) ; le schéma `{item,count}` de l'éditeur ne transporte pas `meta`.
- L'UI ignore complètement `supported`, `runtime`, `station` et `meta` (`grep` : aucune occurrence dans `app.js`).
- `index.html:164` promet pourtant : « modifier ou personnaliser n'importe quel craft ».

**Conséquences** : pour brewing/smithing (224 recettes), l'override est forcément enregistré avec le mauvais type (smithing est même rejeté, cf. P0-5) ; pour les autres stations, l'éditeur ne permet pas de conserver la station d'origine ; pour les recettes `meta`, l'override perd la variante ; pour 1 718 recettes, « Désactiver » n'a aucun effet côté plugin.

**Correctif**
- Court terme : afficher un badge et **bloquer édition/désactivation** si `!recipe.runtime` ou station non supportée, en gardant la consultation (le bouton « Modifier » disparaît, le détail reste lisible).
- Moyen terme : étendre le schéma `{ station, meta }` et l'éditeur (station explicite, méta sur ingrédients/résultat, types `stonecutter`, `brewing`, `smithing`) — ou documenter officiellement que seuls table de craft + four sont supportés.
- Filtrer/afficher `supported` dans la liste et le statut (« 1 757 crafts disposent d'un handle runtime sur 3 475 »).

### P0-5 · Recettes smithing : la sauvegarde entière échoue

**Preuves**
- `api.mjs:14` : `VANILLA_RECIPE_ID` n'accepte pas `smithing`.
- `api.mjs:149-154` : la liste `disabledVanillaRecipes` est validée **strictement** → un seul ID smithing renvoie 400 « liste de recettes vanilla désactivées invalide ».
- `app.js:889` : une recette smithing est chargée comme `shapeless`.
- `api.mjs:142-144` : un `vanillaOverride` invalide est **silencieusement supprimé** (pas d'erreur) → l'override est perdu à l'enregistrement.

**Correctif**
```js
const VANILLA_RECIPE_ID =
  /^vanilla_(shaped|shapeless|brewing|brewing_container|smithing)_\d{2,4}$/;
```
+ refuser explicitement un `vanillaOverride` invalide (400) au lieu de l'ignorer.
+ empêcher l'édition d'une smithing/brewing tant que le modèle ne les gère pas.
+ test unitaire avec un ID de chaque famille.

### P0-6 · Textures : clés triplées, payload ×3, collisions

**Preuves**
- `app.js:393-395` écrit la même valeur sous `fullRef`, `cleanId` et `id`.
- `iconUrl` (`app.js:167-171`) lit d'abord la clé nue → une texture `minecraft:diamond` s'applique à toute entrée `diamond`, y compris une future entrée Opal.
- Limite serveur : 4 Mo (`api.mjs:6`) et 500 textures (`api.mjs:168`) ; 500 × 3 × ~5 Ko ≈ 7,5 Mo → limite atteignable.
- Aucune validation du format de valeur (`api.mjs:164`) : n'importe quelle chaîne est acceptée.

**Correctif**
- Une seule clé canonique : `minecraft:<id>` ou `opal:<id>`.
- Migration v1 → v2 au chargement (les clés nues deviennent `opal:` si l'ID existe dans les entrées, sinon `minecraft:`) + `schemaVersion` pour ne migrer qu'une fois.
- Valider côté serveur : `data:image/(png|jpeg|webp);base64,...` ou URL des CDN autorisés.
- À terme, stocker les images dans des Blobs séparés (`texture/<ref>`) et ne garder que des références dans le document de contenu ; le plugin télécharge à la demande.

---

## 3. Sécurité (P1)

| # | Constat | Preuve | Correctif |
|---|---------|--------|-----------|
| S1 | Rate limiting en mémoire, par instance Lambda : contournable en parallèle, remis à zéro à froid, `Map` non bornée | `api.mjs:15,186-205` | Compteur Blobs avec expiration + purge, ou rate limiting Netlify ; plafonner la Map ; délai constant succès/échec |
| S2 | `ADMIN_PASSWORD` sans longueur minimale dans `configured()` | `api.mjs:29-34` | Exiger ≥ 12 caractères, refuser les mots de passe triviaux |
| S3 | Corps entièrement bufferisé avant le contrôle de taille | `api.mjs:216-217` | Vérifier `content-length` avant `req.text()`, puis lire en flux si possible |
| S4 | `customTextures` accepte toute chaîne (dont `data:image/svg+xml`) | `api.mjs:156-167` | Allowlist stricte de préfixes/formats ; rejeter le reste |
| S5 | Clé `__proto__` acceptée par `TEXTURE_REF` | `api.mjs:156` | `Object.create(null)` + rejet explicite de `__proto__`/`constructor`/`prototype` |
| S6 | Pas de HSTS, `object-src`, `manifest-src`, `X-Robots-Tag` | `netlify.toml:8-16` | Compléter la CSP et les en-têtes |
| S7 | Pas de cache long sur `/assets/*` (1,7 Mo revalidés à chaque visite) | `netlify.toml` | `Cache-Control` long + URLs versionnées (`?v=<generatedAt>`) |
| S8 | Endpoint plugin sans ETag : plusieurs Mo à chaque poll | `api.mjs:227-230` | `ETag`/`If-None-Match`, paramètre `?textures=0`, réponse allégée |
| S9 | Sessions non révocables ; expiration 401 → déconnexion + rechargement = travail perdu | `app.js:113-116` | Conserver les modifications en mémoire, proposer reconnexion + rejeu, ou rafraîchir le token |
| S10 | Données `supported`/`meta` non validées côté serveur | `api.mjs:110-147` | Étendre le schéma si l'on ouvre l'édition, sinon rejeter |

> Note : les assets du pack sont publics. C'est probablement voulu (le pack doit être téléchargeable), mais il faut le documenter pour éviter d'y mettre un jour des secrets.

---

## 4. Bugs fonctionnels (P1)

| # | Bug | Preuve | Correctif |
|---|-----|--------|-----------|
| F1 | Doublons dans « Tous les crafts » : un override apparaît 2 fois (custom + vanilla marqué « Modifié ») | `app.js:752-782` | Dédupliquer par `vanillaOverride` ; n'ajouter la ligne vanilla que si non overridée |
| F2 | Doublons dans « Crafts associés » d'un item | `app.js:513-543` | Même déduplication |
| F3 | Suppression d'une entrée : textures orphelines conservées, sélection de bibliothèque obsolète | `app.js:706-721` | Nettoyer `customTextures` des clés concernées + rafraîchir le détail |
| F4 | Import non validé : structures/IDs invalides acceptés puis refusés au save, après travail | `app.js:1267-1343` | Endpoint `POST /api/validate` (dry-run) ou schéma partagé ; valider avant de muter l'état |
| F5 | Plusieurs overrides possibles pour une même recette vanilla ; `disabledVanillaRecipes` incohérent | `api.mjs:110-154` | Unicité de `vanillaOverride`, cohérence avec la liste désactivée |
| F6 | Références `opal:typo` acceptées dans les crafts | `api.mjs:114,120,124,135` | Vérifier l'existence dans `entries` (référentiel déjà disponible) |
| F7 | `Créer une variante` : `baseItem` inexistant pour 28 entrées Opal sans `baseItem` (ex. `cobalt_ore`) ; le type armor/weapon/tool devient `item` | `app.js:259-277` ; catalogue `opal` | Fallback sûr + sélection explicite de l'item de base ; préserver `kind` |
| F8 | 8 entrées Opal sans icône résoluble (`cobalt_ore`, `titanium_ore`, `aetherite_ore`, `block_cobalt`, `dense_void_obsidian`, `ground_spikes`, `acceleration_composter`, `fast_smelter`) ; 2 IDs dupliqués (`acceleration_composter`, `fortified_stone`) | catalogue généré | Corriger le générateur + check de données |
| F9 | Champ « URL directe » de texture inutilisable pour la plupart des hôtes : la CSP n'autorise que self/data/jsdelivr/raw.githubusercontent | `index.html:237-239`, `netlify.toml:11`, `app.js:1447` | Valider l'URL et afficher les hôtes autorisés, ou proxy d'image |
| F10 | `renderLibrary` reconstruit toute la grille au clic sur une carte (sélection) | `app.js:1058-1061` | Basculer uniquement les classes `selected` |
| F11 | `#entry-texture-status` / `#entry-preview` non rafraîchis après application d'une texture | `app.js:397-400` | Appeler `updateEntryPreview()` |
| F12 | `save()` sans garde anti double-clic ; un double PUT peut s'entrelacer | `app.js:1238` | Désactiver le bouton + `aria-busy` |
| F13 | Déconnexion/fermeture d'onglet avec modifications non enregistrées : seul `beforeunload` protège, pas `logout()` | `app.js:133-137,1456` | Confirmation si `state.dirty` ; ajouter `event.returnValue` |
| F14 | Troncature silencieuse du lore (100 car./ligne, 10 lignes) côté serveur | `api.mjs:95` | Compteur/limite visible dans l'UI |
| F15 | `alert()` / `confirm()` natifs, hétérogènes avec le thème | plusieurs | Modale maison + toasts |
| F16 | `VANILLA_LABELS.cobblestone = "Pierres taillées"` (traduction incorrecte) | `app.js:10` | « Pierre » ; audit des libellés |

---

## 5. Performance (P2)

**Mesures / constats**

- `vanilla-catalogue.json` = **1,35 Mo** ; `vanilla-textures.json` = 240 Ko ; `library.json` = 105 Ko ; + `vanilla-recipe-index.json` = 160 Ko **jamais utilisé par l'app** (seulement par le générateur).
- `renderRecipes()` est appelé au démarrage (`load()` et `loadLibrary()`), alors que l'onglet est caché → **3 475 `<details>` + ~3 475 images** créés d'emblée.
- Chaque `iconUrl()` fait un `.some()` sur 350 textures et jusqu'à 3 `.find()` sur 1 154 items/blocs → plusieurs millions de comparaisons au démarrage.
- Le filtre de recherche relance un rendu complet **à chaque frappe**, sans debounce.
- `fetch(..., { cache: "no-cache" })` sur des fichiers immuables (`app.js:1196-1198`).
- 213 fichiers binaires en doublon (icônes vs textures/items, ui vs items).

**Correctifs concrets**

1. **Index en `Map`/`Set`** construits une fois au chargement :
```js
const index = {
  entries: new Map(state.data.entries.map(e => [e.id, e])),
  vanillaItems: new Map(state.vanilla.items.map(i => [i.id, i])),
  vanillaBlocks: new Map(state.vanilla.blocks.map(b => [b.id, b])),
  textureFiles: new Set(state.library.textures.map(a => a.file)),
  iconById: ICON_BY_ID,
};
```
2. **Rendu paresseux par onglet** : ne rendre que l'onglet visible, marquer l'onglet « sale » et rendre à l'ouverture.
3. **Pagination ou `content-visibility`** :
```css
.library-card { content-visibility: auto; contain-intrinsic-size: 150px 142px; }
```
+ bouton « Afficher plus » par tranches de 120.
4. **Debounce 120 ms** sur les filtres.
5. **Cache** : `Cache-Control: public, max-age=604800, stale-while-revalidate=86400` sur `/assets/*` + query `?v=<generatedAt>` injectée par le générateur ; supprimer `cache:"no-cache"`.
6. **Supprimer** `public/assets/opal-heaven/vanilla-recipe-index.json` du dossier public (le plugin a sa copie) ou l'utiliser réellement pour la migration d'IDs.
7. Dédupliquer les assets et faire pointer `icons/` vers `textures/items/`.

Gain attendu : démarrage divisé par 3 à 5, filtres fluides, ~1,5 Mo de moins par visite à froid.

---

## 6. Accessibilité & UX (P2)

| # | Constat | Preuve | Correctif |
|---|---------|--------|-----------|
| A1 | Lignes de listes cliquables non focalisables (`<li onclick>`) | `app.js:615,789` | `<li><button type="button" class="list-row">` ou `role="option"` + clavier |
| A2 | Onglets sans sémantique ARIA (`role=tablist/tab/tabpanel`, `aria-selected`) ni navigation flèches | `index.html:32-37` | Ajouter rôles + `aria-selected` + `tabindex` |
| A3 | `#status`, `#entry-error`, `#recipe-error`, `#login-error` sans `aria-live`/`role=alert` | `index.html` | `aria-live="polite"`, `role="alert"` |
| A4 | Aucun style `:focus-visible` | `style.css` | Anneau visible 2 px accent |
| A5 | Focus non placé sur le mot de passe au chargement | `index.html` | `$("#password").focus()` |
| A6 | Boutons/`.badge-override` : contraste ~3:1 (texte 11 px blanc sur #2a9d8f) | `style.css:92` | Assombrir le fond ou augmenter le texte |
| A7 | Modale : fallback sans piège de focus si `showModal` absent | `app.js:327-333` | `<dialog>` moderne uniquement, ou focus trap |
| A8 | Pas de `<noscript>`, favicon absent (404 à chaque visite) | `index.html` | Ajouter les deux |
| A9 | Libellé « 3 475 crafts modifiables » trompeur | `index.html:164` | Refléter `supported` |
| A10 | Pas de brouillon/autosave : un refresh ou une session expirée coûte le travail | — | `localStorage` par token + « Restaurer le brouillon » ; `Ctrl+S` |

---

## 7. Maintenabilité / exploitation (P2-P3)

| # | Constat | Correctif |
|---|---------|-----------|
| M1 | Pas de dépôt Git, pas de `.gitignore`, pas de `README`, pas de `package-lock.json` | Initialiser Git, verrouiller les dépendances, documenter variables d'env et déploiement |
| M2 | Duplication des règles de validation client/serveur (`ID_RE`, `ING_RE`, `VANILLA_RECIPE_ID`) : cause directe du bug smithing | Module partagé `public/lib/schema.mjs`, importé par la fonction (esbuild le bundle) et par l'UI |
| M3 | Aucun test | `node --test` : validate, grille de craft, cohérence du catalogue, regex des IDs |
| M4 | Aucun script npm (`dev`, `test`, `data:check`) ; pas de CLI Netlify | Ajouter `netlify-cli` en dev, scripts et CI GitHub Actions |
| M5 | Le générateur de catalogue exige des dépôts locaux (PMMP + OpalCore) non documentés ; le générateur de textures utilise l'API GitHub non authentifiée (60 req/h) | README + `GITHUB_TOKEN` optionnel + sortie déterministe (IDs stables) |
| M6 | `manifest.json` : version `[1,3,4]` mais description « v1.5.0 » | Aligner |
| M7 | `en_US.lang` est identique à `fr_FR.lang` (français) | Traduire ou retirer la locale |
| M8 | Zéro en-tête `X-Robots-Tag`/`robots.txt` malgré `noindex` | Défense en profondeur |
| M9 | Pas de version Node déclarée (`engines`/`NODE_VERSION`) | Épingler Node 20/22 |
| M10 | Pas de sauvegarde planifiée du contenu | Fonction scheduled Netlify → snapshot Blob + export JSON quotidien |

---

## 8. Plan d'action proposé

### Sprint 0 — « Colmater » (~1 jour)
1. Garde de chargement + désactivation du save (P0-1).
2. Révision optimiste + 409 + bouton « Recharger » (P0-2, version minimale).
3. Regex smithing + refus explicite des overrides invalides (P0-5).
4. Déduplication des listes de crafts (F1, F2).
5. Nettoyage des textures orphelines + rafraîchissement du détail (F3, F11).
6. Garde anti double-clic, confirmation de déconnexion, taille max des images, `content-length` (F12, F13, S3).
7. Styles inline → classes + `aria-live` + `:focus-visible` + focus login + listes clavier (A1-A5, CSP).
8. En-têtes HSTS/`object-src` + cache assets (S6, S7).

### Sprint 1 — « Fiabiliser » (~2-3 jours)
1. IDs de recettes stables + table de migration + migration des overrides existants (P0-3).
2. Modèle `station` + `meta` + `supported` : gater l'édition, ou l'étendre réellement (P0-4).
3. Schéma de validation partagé + tests unitaires (M2, M3).
4. Historique/rollback du contenu + restauration (P0-2 complet).
5. Textures : clé canonique unique, migration v2, validation de format, stockage séparé (P0-6).
6. Import via dry-run serveur + messages d'erreur par champ (F4).
7. Rate limiting persistant + robustesse config (S1, S2).

### Sprint 2 — « Accélérer & documenter » (~2 jours)
1. Index `Map`/`Set`, rendu paresseux, debounce, pagination (perf).
2. Découpage modulaire de `app.js` (api, state, ui/entries, ui/recipes, ui/library, ui/textures).
3. README, `.gitignore`, lockfile, scripts npm, CI (lint + tests + `data:check`).
4. `check-data.mjs` : IDs valides/dupliqués, assets manquants, `supported` cohérent, versions de manifest.
5. Nettoyage des 213 doublons + fichier d'index inutilisé.

### Sprint 3 — « Confort » (optionnel)
- Brouillons locaux + `Ctrl+S` + toasts.
- Vue « diff » avant enregistrement.
- Journal d'audit (qui/quand/quoi) dans les Blobs.
- Recherche globale (items + crafts + assets) avec raccourci `/`.

---

## 9. Quick wins (< 30 min chacun)

- [ ] Regex smithing corrigée + test.
- [ ] `save` désactivé tant que le contenu n'est pas chargé.
- [ ] Déduplication des overrides dans les deux listes.
- [ ] `logout()` demande confirmation si `dirty`.
- [ ] Styles inline remplacés par des classes (CSP respectée).
- [ ] `aria-live` sur le statut + `role="alert"` sur les erreurs.
- [ ] `:focus-visible` global.
- [ ] `<li>` cliquables → `<button>`.
- [ ] Taille max 2 Mo sur l'upload d'image.
- [ ] `beforeunload` avec `returnValue`.
- [ ] `Cache-Control` sur `/assets/*`.
- [ ] Suppression du `cache:"no-cache"` inutile (ou versionnage).
- [ ] Libellé `cobblestone` corrigé.
- [ ] Manifest synchronisé + `en_US.lang` traduit.
- [ ] Favicon + `<noscript>`.

---

## 10. Vérifications rapides à automatiser

```js
// scripts/check-data.mjs (extrait)
const RE = /^[a-z0-9_]{2,40}$/;
const errors = [];
const ids = new Set();
for (const r of catalogue.recipes) {
  if (!RE.test(r.id)) errors.push(`ID recette invalide: ${r.id}`);
  if (ids.has(r.id)) errors.push(`ID recette dupliqué: ${r.id}`);
  if (!VANILLA_RECIPE_ID.test(r.id)) errors.push(`ID non désactivable: ${r.id}`);
  ids.add(r.id);
}
for (const o of catalogue.opal) {
  if (o.icon && !existsSync("public" + o.icon)) errors.push(`Icône absente: ${o.id}`);
}
```

Cette vérification aurait détecté les 12 recettes smithing, les 2 IDs Opal dupliqués et les 8 icônes manquantes **avant** déploiement.
