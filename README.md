# Opal Heaven Studio

Studio web d’édition du contenu du serveur **Opal Heaven** (PocketMine-MP 5) : items et blocs personnalisés, crafts, textures et catalogue vanilla. L’interface est en français, sans build ni framework : un fichier HTML, une feuille de styles et un module JavaScript.

## Sommaire

- [Architecture](#architecture)
- [Démarrage local](#démarrage-local)
- [Variables d’environnement](#variables-denvironnement)
- [Tests et vérifications](#tests-et-vérifications)
- [API](#api)
- [Format des données](#format-des-données)
- [Catalogue et identifiants de recettes](#catalogue-et-identifiants-de-recettes)
- [Génération des données](#génération-des-données)
- [Déploiement](#déploiement)
- [Sécurité et limites connues](#sécurité-et-limites-connues)

## Architecture

```text
public/
  index.html                 Interface
  app.js                     Application (modules concaténés, sans build)
  style.css                  Styles
  lib/schema.mjs             Validation partagée front + API
  assets/opal-heaven/        Catalogue, textures, modèles, traductions
netlify/
  functions/api.mjs          API Netlify (auth, contenu, historique, plugin)
scripts/
  lib/recipe-id.mjs          Empreintes et identifiants stables de recettes
  generate-vanilla-catalogue.mjs
  generate-vanilla-textures.mjs
  backfill-recipe-fingerprints.mjs
  check-data.mjs             Vérification des données générées
tests/
  schema.test.mjs            Règles de validation
  data.test.mjs              Cohérence du catalogue et des assets
netlify.toml                 En-têtes, CSP, cache, configuration Netlify
```

Le contenu éditorial n’est pas versionné dans le dépôt : il vit dans **Netlify Blobs** (`opal-content/content`) et l’historique dans `history/`. Les assets du pack restent publics.

## Démarrage local

Prérequis : **Node.js 20 ou 22** et un compte Netlify (ou la CLI Netlify).

```bash
npm install
npm run dev
```

`npm run dev` lance `netlify dev` sur `http://localhost:8888` avec les fonctions et le stockage Blobs local. Créez un fichier `.env` (non versionné) ou utilisez les variables Netlify :

```dotenv
ADMIN_PASSWORD=un-mot-de-passe-de-12-caracteres-minimum
SESSION_SECRET=une-chaine-aleatoire-de-32-caracteres-minimum
PLUGIN_TOKEN=un-jeton-de-24-caracteres-minimum
```

Sans ces variables, l’API répond `500 configuration serveur incomplète` : c’est volontaire.

## Variables d’environnement

| Variable | Minimum | Rôle |
|---|---:|---|
| `ADMIN_PASSWORD` | 12 caractères | Mot de passe du studio (comparaison à temps constant). |
| `SESSION_SECRET` | 32 caractères | Signature HMAC des sessions (durée 2 h, rafraîchies par `POST /api/session`). |
| `PLUGIN_TOKEN` | 24 caractères | Jeton du plugin pour `GET /api/plugin/content`. |

Utilisez des valeurs générées aléatoirement, par exemple :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Tests et vérifications

```bash
npm test             # node:test — schéma, empreintes, cohérence des données
npm run check:data   # icônes/assets, index runtime, manifest, traductions
npm run check        # syntaxe + données + tests
```

Les tests ne nécessitent aucune dépendance npm supplémentaire. `check:data` échoue si une icône implémentée manque, si un asset référencé est absent, si l’index runtime ne correspond plus au catalogue, ou si le manifeste et les traductions sont incohérents.

## API

Toutes les routes sont sous `/api`.

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/login` | mot de passe | Retourne un jeton de session. |
| `POST` | `/session` | session | Rafraîchit un jeton. |
| `GET` | `/content` | session | Contenu courant et révision. |
| `PUT` | `/content` | session + `If-Match` | Enregistre si la révision correspond ; `409` sinon. `If-Match: *` force l’écrasement. |
| `POST` | `/validate` | session | Valide un document sans l’enregistrer. |
| `GET` | `/history` | session | 15 dernières versions. |
| `POST` | `/history/restore` | session | Restaure une version (crée une nouvelle révision). |
| `GET` | `/plugin/content` | `PLUGIN_TOKEN` | Contenu pour le plugin ; ETag, `304`, `?textures=0`. |

Le client gère les conflits : en cas de `409`, il propose d’écraser avec ses modifications ou de recharger la version du serveur. Les sessions expirées conservent les modifications en mémoire et proposent une reconnexion.

## Format des données

Le document de contenu suit `version: 1` et `schemaVersion: 2` :

```json
{
  "version": 1,
  "schemaVersion": 2,
  "revision": 12,
  "updatedAt": "2026-10-24T12:00:00.000Z",
  "entries": [],
  "recipes": [],
  "disabledVanillaRecipes": [],
  "customTextures": {}
}
```

Points importants :

- **Textures** : une seule clé canonique par élément, `minecraft:<id>` ou `opal:<id>`. Les anciennes clés nues sont migrées au chargement.
- **Références** : les ingrédients et résultats utilisent `minecraft:<id>` ou `opal:<id>`. Le client vérifie que l’identifiant `opal:` existe dans les contenus personnalisés ou le catalogue Opal Heaven ; le serveur valide le format (il ne possède pas le catalogue).
- **Recettes vanilla remplacées** : `vanillaOverride` doit être un identifiant de recette vanilla valide, et la recette correspondante est automatiquement ajoutée à `disabledVanillaRecipes`.
- **Validation** : `public/lib/schema.mjs` est l’unique source de vérité, importée par le front et par la fonction Netlify.
- **Limites** : 500 contenus, 1 000 crafts, 5 000 désactivations, 500 textures, 4 Mo de corps de requête, 10 lignes de description de 100 caractères.

## Catalogue et identifiants de recettes

Les identifiants historiques (`vanilla_shaped_0001`, etc.) restent **valides et inchangés**. Le générateur calcule une empreinte SHA-256 du contenu fonctionnel d’une recette (station, type, motif, ingrédients, résultat) et réutilise l’identifiant existant lorsque l’empreinte est déjà connue. Une nouvelle recette reçoit un identifiant déterministe :

```text
vanilla_<type>_<12 caractères hexadécimaux>
```

Ainsi, réordonner ou régénérer le catalogue ne décale plus les overrides et les désactivations. `vanilla-recipe-index.json` contient les empreintes et une table `legacyIds` pour les éventuels renommages. Le format `VANILLA_RECIPE_ID` accepte les deux formes.

Les recettes `brewing`, `smithing` et les stations non éditables restent en **consultation seule** : le plugin ne sait pas encore les modifier. Les recettes sans handle `runtime` ne sont ni modifiables ni désactivables.

## Génération des données

### Catalogue vanilla

Le générateur nécessite un checkout local de PocketMine-MP 5 et, pour les entrées Opal, du dépôt `OpalCore` :

```bash
node scripts/generate-vanilla-catalogue.mjs /chemin/vers/PocketMine-MP /chemin/vers/opal-core
```

### Textures vanilla

```bash
GITHUB_TOKEN=... node scripts/generate-vanilla-textures.mjs
```

Le jeton GitHub est optionnel mais évite la limite de 60 requêtes/heure de l’API non authentifiée.

### Anciennes données

Après une mise à jour depuis une version antérieure, `node scripts/backfill-recipe-fingerprints.mjs` ajoute les empreintes aux fichiers existants sans changer les identifiants.

## Déploiement

1. Créer le site Netlify et connecter le dépôt.
2. Définir les trois variables d’environnement dans **Site configuration → Environment variables**.
3. Vérifier que le répertoire de publication est `public` et que les fonctions sont dans `netlify/functions` (déjà dans `netlify.toml`).
4. Déployer :

```bash
npx netlify deploy --prod
```

Le stockage Blobs est créé au premier enregistrement. Sauvegardez régulièrement `custom_content.json` depuis l’onglet **Données** : l’historique Blobs couvre les 15 dernières versions, pas une restauration de site complète.

## Sécurité et limites connues

- CSP stricte, sans style ni script inline ; en-têtes HSTS, `nosniff`, `DENY`, `no-referrer`, `X-Robots-Tag`.
- Aucun `innerHTML`, `eval`, `alert` ou `confirm` natif : le rendu passe par `textContent` et des dialogues `<dialog>`.
- Rate limiting par IP (Blobs + mémoire) sur la connexion ; délai constant en cas d’échec.
- Les jetons de session sont signés HMAC et stockés dans `sessionStorage`. Une déconnexion ou une expiration impose une reconnexion.
- Le contenu reste limité à 4 Mo. Les images importées sont redimensionnées à 64 px et limitées à 500 Ko encodés.
- L’historique est borné à 15 versions et stocké dans les Blobs ; ce n’est pas un système de sauvegarde externalisé.
- Les recettes avec méta/variantes, alchimie, forge et stations non supportées ne sont pas éditables par le studio. Le catalogue les expose en lecture seule.
- Les assets du pack sont publics par conception. N’y placez jamais de secret.
