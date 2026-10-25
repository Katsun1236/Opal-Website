import { getStore } from "@netlify/blobs";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import {
  HISTORY_KEY_RE,
  LIMITS,
  ValidationError,
  emptyContent,
  validateContent,
} from "../../public/lib/schema.mjs";

export const config = { path: "/api/*" };

const SESSION_TTL = 2 * 60 * 60 * 1000;
const HISTORY_LIMIT = 15;
const failures = new Map();

class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const json = (data, status = 200, extraHeaders = {}) =>
  new Response(typeof data === "string" ? data : JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });

const reply = (data, status = 200) => json(data, status);
const fail = (message, status = 400) => reply({ error: message }, status);
const hmac = (key, value) => createHmac("sha256", key).update(value).digest();
const sameSecret = (a, b) => timingSafeEqual(hmac("cmp", a), hmac("cmp", b));
const sign = (payload) => hmac(process.env.SESSION_SECRET, payload).toString("base64url");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const configured = () =>
  Boolean(process.env.ADMIN_PASSWORD) &&
  // Minimum de 11 caractères pour le mot de passe choisi ; 16+ recommandé.
  process.env.ADMIN_PASSWORD.length >= 11 &&
  Boolean(process.env.SESSION_SECRET) &&
  process.env.SESSION_SECRET.length >= 32 &&
  Boolean(process.env.PLUGIN_TOKEN) &&
  process.env.PLUGIN_TOKEN.length >= 24;

const bearer = (req) => {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
};

const issueToken = () => {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({ sub: "admin", iat: now, exp: now + SESSION_TTL })
  ).toString("base64url");
  return payload + "." + sign(payload);
};

const validSession = (req) => {
  const token = bearer(req);
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const expected = sign(parts[0]);
  if (parts[1].length !== expected.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected))) return false;
    const { exp } = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return Number.isFinite(exp) && exp > Date.now();
  } catch {
    return false;
  }
};

const validPluginToken = (req) => {
  const token = bearer(req);
  return token.length > 0 && sameSecret(token, process.env.PLUGIN_TOKEN);
};

let cachedStore = null;
const contentStore = () =>
  cachedStore || (cachedStore = getStore({ name: "opal-content", consistency: "strong" }));

const readBody = async (req) => {
  const length = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(length) && length > LIMITS.maxBody) {
    throw new HttpError("contenu trop volumineux", 413);
  }
  const text = await req.text();
  if (text.length > LIMITS.maxBody) {
    throw new HttpError("contenu trop volumineux", 413);
  }
  return text;
};

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError("requête invalide", 400);
  }
};

const withMeta = (value) => {
  const data = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    ...data,
    version: 1,
    schemaVersion: 2,
    revision: Number.isInteger(data.revision) ? data.revision : 0,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
    entries: Array.isArray(data.entries) ? data.entries : [],
    recipes: Array.isArray(data.recipes) ? data.recipes : [],
    disabledVanillaRecipes: Array.isArray(data.disabledVanillaRecipes)
      ? data.disabledVanillaRecipes
      : [],
    customTextures:
      data.customTextures && typeof data.customTextures === "object" && !Array.isArray(data.customTextures)
        ? data.customTextures
        : {},
    configs:
      data.configs && typeof data.configs === "object" && !Array.isArray(data.configs)
        ? data.configs
        : undefined,
  };
};

const readContent = async (store) => {
  let stored;
  try {
    stored = await store.get("content", { type: "json" });
  } catch (error) {
    console.error("Lecture du contenu impossible", error);
    throw new HttpError("contenu stocké illisible", 500);
  }
  return stored ? withMeta(stored) : emptyContent();
};

const hasData = (content) =>
  Boolean(
    content.entries?.length ||
      content.recipes?.length ||
      content.disabledVanillaRecipes?.length ||
      (content.customTextures && Object.keys(content.customTextures).length) ||
      (content.configs && Object.keys(content.configs).length)
  );

const backup = async (store, content) => {
  if (!hasData(content)) return;
  const key = "history/" + Date.now() + "-r" + (Number(content.revision) || 0);
  await store.setJSON(key, content);
};

const pruneHistory = async (store) => {
  const { blobs } = await store.list({ prefix: "history/" });
  const keys = blobs.map((blob) => blob.key).sort();
  const excess = keys.slice(0, Math.max(0, keys.length - HISTORY_LIMIT));
  await Promise.all(excess.map((key) => store.delete(key).catch(() => {})));
};

const rateKey = (ip) => "ratelimit/" + sha256(String(ip || "inconnue")).slice(0, 20);

const readRate = async (store, ip) => {
  try {
    return (await store.get(rateKey(ip), { type: "json" })) || { count: 0, until: 0 };
  } catch {
    return failures.get(ip) || { count: 0, until: 0 };
  }
};

const writeRate = async (store, ip, record) => {
  failures.set(ip, record);
  if (failures.size > 1000) failures.clear();
  try {
    await store.setJSON(rateKey(ip), record);
  } catch {
    /* le limiteur mémoire reste actif */
  }
};

const clearRate = async (store, ip) => {
  failures.delete(ip);
  try {
    await store.delete(rateKey(ip));
  } catch {
    /* ignore */
  }
};

const listHistory = async (store) => {
  const { blobs } = await store.list({ prefix: "history/" });
  return blobs
    .map((blob) => {
      const match = /^history\/(\d+)-r(\d+)$/.exec(blob.key);
      if (!match) return null;
      return {
        key: blob.key,
        savedAt: new Date(Number(match[1])).toISOString(),
        revision: Number(match[2]),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.revision - a.revision || b.savedAt.localeCompare(a.savedAt))
    .slice(0, HISTORY_LIMIT);
};

const routeRequest = async (req, url, context, store) => {
  const route = url.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/";
  const ip = context.ip || req.headers.get("x-nf-client-connection-ip") || "inconnue";

  if (route === "/login" && req.method === "POST") {
    const record = await readRate(store, ip);
    if (record.until > Date.now()) {
      return fail("trop de tentatives, réessayez plus tard", 429);
    }
    const body = parseJson(await readBody(req));
    const password = typeof body.password === "string" ? body.password.slice(0, 256) : "";
    if (!sameSecret(password, process.env.ADMIN_PASSWORD)) {
      await sleep(350);
      record.count = (Number(record.count) || 0) + 1;
      if (record.count >= 5) {
        record.until = Date.now() + 15 * 60 * 1000;
        record.count = 0;
      }
      await writeRate(store, ip, record);
      return fail("identifiants incorrects", 401);
    }
    await clearRate(store, ip);
    return reply({ token: issueToken() });
  }

  if (route === "/session" && req.method === "POST") {
    if (!validSession(req)) return fail("non autorisé", 401);
    return reply({ token: issueToken() });
  }

  if (route === "/content" && req.method === "GET") {
    if (!validSession(req)) return fail("non autorisé", 401);
    return reply(await readContent(store));
  }

  if (route === "/content" && req.method === "PUT") {
    if (!validSession(req)) return fail("non autorisé", 401);
    const body = parseJson(await readBody(req));
    const current = await readContent(store);

    const ifMatchHeader = (req.headers.get("if-match") || "").replace(/^"|"$/g, "").trim();
    const force = ifMatchHeader === "*" || req.headers.get("x-force") === "1";
    if (!force && ifMatchHeader && Number(ifMatchHeader) !== current.revision) {
      return reply(
        { error: "conflit de version", revision: current.revision },
        409
      );
    }

    const content = validateContent(body);
    content.revision = current.revision + 1;
    content.updatedAt = new Date().toISOString();

    // L’historique est un confort, pas une condition d’enregistrement : une
    // panne de la liste des sauvegardes ne doit pas faire croire au client que
    // l’écriture a échoué (il relancerait et créerait une révision parasite).
    try {
      await backup(store, current);
    } catch (error) {
      console.error("Sauvegarde de l’historique impossible", error);
    }
    await store.setJSON("content", content);
    try {
      await pruneHistory(store);
    } catch (error) {
      console.error("Élagage de l’historique impossible", error);
    }
    return reply(content);
  }

  if (route === "/validate" && req.method === "POST") {
    if (!validSession(req)) return fail("non autorisé", 401);
    const body = parseJson(await readBody(req));
    validateContent(body);
    return reply({ ok: true });
  }

  if (route === "/history" && req.method === "GET") {
    if (!validSession(req)) return fail("non autorisé", 401);
    return reply({ versions: await listHistory(store) });
  }

  if (route === "/history/restore" && req.method === "POST") {
    if (!validSession(req)) return fail("non autorisé", 401);
    const body = parseJson(await readBody(req));
    const key = String(body.key ?? "");
    if (!HISTORY_KEY_RE.test(key)) return fail("version invalide", 400);

    let stored;
    try {
      stored = await store.get(key, { type: "json" });
    } catch {
      return fail("version illisible", 500);
    }
    if (!stored) return fail("version introuvable", 404);

    const current = await readContent(store);
    // Un ancien client peut omettre la révision ; les clients récents
    // protègent la restauration contre un enregistrement concurrent.
    if (Number.isInteger(body.revision) && body.revision !== current.revision) {
      return reply({ error: "conflit de version", revision: current.revision }, 409);
    }
    const content = validateContent(stored);
    content.revision = current.revision + 1;
    content.updatedAt = new Date().toISOString();

    try {
      await backup(store, current);
    } catch (error) {
      console.error("Sauvegarde de l’historique impossible", error);
    }
    await store.setJSON("content", content);
    try {
      await pruneHistory(store);
    } catch (error) {
      console.error("Élagage de l’historique impossible", error);
    }
    return reply(content);
  }

  if (route === "/plugin/content" && req.method === "GET") {
    if (!validPluginToken(req)) return fail("non autorisé", 401);
    const content = await readContent(store);
    if (url.searchParams.get("textures") === "0") {
      delete content.customTextures;
    } else {
      content.customTextures = content.customTextures || {};
    }
    const body = JSON.stringify(content);
    const etag = '"' + sha256(body).slice(0, 32) + '"';
    if (req.headers.get("if-none-match") === etag) {
      return new Response(null, {
        status: 304,
        headers: { etag, "cache-control": "no-cache" },
      });
    }
    return json(body, 200, { etag, "cache-control": "no-cache" });
  }

  return fail("introuvable", 404);
};

export default async (req, context) => {
  try {
    if (!configured()) {
      return fail(
        "configuration serveur incomplète : ADMIN_PASSWORD (11 caractères min.), SESSION_SECRET (32 min.) et PLUGIN_TOKEN (24 min.) sont requis",
        500
      );
    }
    return await routeRequest(req, new URL(req.url), context, contentStore());
  } catch (error) {
    if (error instanceof ValidationError) return fail(error.message, 400);
    if (error instanceof HttpError) return fail(error.message, error.status);
    console.error("Erreur API inattendue", error);
    return fail("erreur serveur", 500);
  }
};
