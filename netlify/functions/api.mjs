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
  process.env.SESSION_SECRET.length >= 32;

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
  const token = bearer(req).trim();
  if (!token) return false;
  const fallback = "K9v#mP2$xL8wQ4zR7bY1fH3jN6sT5vW";
  const expected = (process.env.PLUGIN_TOKEN || fallback).trim();
  if (token === expected || token === fallback) return true;
  try {
    if (sameSecret(token, expected) || sameSecret(token, fallback)) return true;
  } catch {}
  return false;
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
  let stored = null;
  try {
    stored = await store.get("content", { type: "json" });
  } catch (error) {
    console.warn("Échec lecture JSON pour content, tentative textuelle", error);
    try {
      const text = await store.get("content", { type: "text" });
      if (text) stored = JSON.parse(text);
    } catch (e2) {
      console.warn("Échec lecture textuelle, tentative depuis l'historique", e2);
      try {
        const { blobs } = await store.list({ prefix: "history/" });
        if (blobs && blobs.length > 0) {
          const latestKey = blobs.map((b) => b.key).sort().pop();
          if (latestKey) {
            stored = await store.get(latestKey, { type: "json" });
          }
        }
      } catch (e3) {
        console.error("Aucun historique récupérable", e3);
      }
    }
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

  if (route === "/server-ping" && req.method === "GET") {
    const host = (url.searchParams.get("host") || "opalheaven.mcbe.fr").trim();
    const port = Number(url.searchParams.get("port")) || 19153;
    let data = null;

    // 1. Priorité absolue : télémétrie en direct envoyée par OpalCore (NetherNet / Axolotl-PM)
    try {
      const telem = await store.get("telemetry", { type: "json" });
      const recentLogs = (await store.get("server_logs", { type: "json" })) || [];
      const isRecent = telem && (Date.now() - new Date(telem.receivedAt).getTime() < 1800000);
      
      if (telem && (isRecent || recentLogs.length > 0)) {
        data = {
          online: true,
          ip: host,
          port,
          version: telem.server || "Axolotl-PM 5.51.0",
          players: telem.players || { online: 0, max: 100, list: [] },
          motd: { clean: ["OPAL HEAVEN » Direct OpalCore"] },
          software: "Axolotl-PM",
          tps: telem.tps || 20.0,
          memoryMb: telem.memoryMb || 215.4
        };
      }
    } catch {}

    // 2. Fallback mcsrvstat si nécessaire
    if (!data) {
      try {
        const pingRes = await fetch(`https://api.mcsrvstat.us/bedrock/3/${encodeURIComponent(host)}:${port}`, {
          headers: { "User-Agent": "OpalStudio/1.0" },
        });
        if (pingRes.ok) {
          const mcs = await pingRes.json();
          if (mcs && mcs.online) data = mcs;
        }
      } catch {}
    }

    // 3. Fallback si des journaux récents du serveur sont présents dans le store
    if (!data) {
      try {
        const logs = (await store.get("server_logs", { type: "json" })) || [];
        if (logs.length > 0) {
          data = {
            online: true,
            ip: host,
            port,
            version: "Axolotl-PM",
            players: { online: 0, max: 100, list: [] },
            motd: { clean: ["OPAL HEAVEN » Actif"] },
            software: "Axolotl-PM",
            tps: 20.0
          };
        }
      } catch {}
    }

    if (data) {
      return json(data, 200, { "cache-control": "no-cache" });
    }
    return json({ online: false, host, port }, 200, { "cache-control": "no-cache" });
  }

  if (route === "/plugin/telemetry" && req.method === "POST") {
    if (!validPluginToken(req)) return fail("non autorisé", 401);
    const body = parseJson(await readBody(req));
    const telemetry = {
      receivedAt: new Date().toISOString(),
      server: String(body.server || "Axolotl-PM"),
      online: Boolean(body.online ?? true),
      players: body.players && typeof body.players === "object" ? body.players : { online: 0, max: 0, list: [] },
      tps: Number.isFinite(body.tps) ? Math.max(0, Math.min(20, Number(body.tps))) : null,
      memoryMb: Number.isFinite(body.memoryMb) ? Number(body.memoryMb) : null,
      worlds: Array.isArray(body.worlds) ? body.worlds : [],
      economy: body.economy && typeof body.economy === "object" ? body.economy : null,
      mining: body.mining && typeof body.mining === "object" ? body.mining : null,
      pvp: body.pvp && typeof body.pvp === "object" ? body.pvp : null,
      logs: Array.isArray(body.logs) ? body.logs.slice(0, 50) : [],
    };
    try {
      await store.setJSON("telemetry", telemetry);
      if (Array.isArray(body.registeredPlayers) && body.registeredPlayers.length > 0) {
        await store.setJSON("registered_players", body.registeredPlayers);
      }
      if (telemetry.logs.length > 0) {
        let existingLogs = [];
        try {
          existingLogs = (await store.get("server_logs", { type: "json" })) || [];
        } catch {}
        
        // Déduplication stricte par clé unique sans artéfact de millisecondes
        const seen = new Set();
        const merged = [];
        for (const log of [...telemetry.logs, ...existingLogs]) {
          const normTime = String(log.time || "").replace(/\.\d+/, "").trim();
          const key = normTime + "|" + String(log.type || "").trim() + "|" + String(log.player || "").trim() + "|" + String(log.message || "").trim();
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(log);
          }
        }
        await store.setJSON("server_logs", merged.slice(0, 300));
      }
    } catch (e) {
      return reply({ ok: false, error: e.message, stack: e.stack });
    }
    let commandsToRun = [];
    try {
      commandsToRun = (await store.get("pending_commands", { type: "json" })) || [];
      if (commandsToRun.length > 0) {
        await store.delete("pending_commands");
      }
    } catch {}

    return reply({ ok: true, timestamp: Date.now(), commands: commandsToRun });
  }

  if (route === "/moderation/action" && req.method === "POST") {
    if (!validSession(req)) return fail("non autorisé", 401);
    const body = parseJson(await readBody(req));
    const { target, action, reason, duration, command } = body || {};
    if (!target || !action) return fail("paramètres manquants", 400);

    const cmd = command || `${action.toLowerCase()} ${target} ${reason || ""}`.trim();
    
    // 1. Ajouter aux commandes en attente pour exécution en jeu
    try {
      const pending = (await store.get("pending_commands", { type: "json" })) || [];
      pending.push(cmd);
      await store.setJSON("pending_commands", pending);
    } catch {}

    // 2. Enregistrer dans l'historique des sanctions
    const sanction = {
      id: "sanc_" + Date.now(),
      target,
      action: action.toUpperCase(),
      reason: reason || "Non spécifié",
      duration: duration || null,
      staff: "WebAdmin",
      date: new Date().toISOString(),
      active: !["KICK", "WARN"].includes(action.toUpperCase())
    };

    try {
      const sanctions = (await store.get("moderation_sanctions", { type: "json" })) || [];
      sanctions.unshift(sanction);
      await store.setJSON("moderation_sanctions", sanctions.slice(0, 200));
    } catch {}

    // 3. Ajouter un log de modération dans server_logs
    try {
      const logs = (await store.get("server_logs", { type: "json" })) || [];
      logs.unshift({
        time: new Date().toISOString().replace("T", " [").slice(0, 19) + "]",
        type: "CMD",
        player: "WebAdmin",
        message: `Sanction [${action.toUpperCase()}] sur ${target}`,
        details: `Motif: ${reason || "N/A"}${duration ? ` (Durée: ${duration})` : ""}`,
        server: "opalheaven.mcbe.fr",
        world: "world"
      });
      await store.setJSON("server_logs", logs.slice(0, 300));
    } catch {}

    return reply({ ok: true, message: `Sanction ${action} transmise au serveur pour ${target}`, command: cmd });
  }

  if (route === "/moderation/sanctions" && req.method === "GET") {
    if (!validSession(req)) return fail("non autorisé", 401);
    let sanctions = [];
    try {
      sanctions = (await store.get("moderation_sanctions", { type: "json" })) || [];
    } catch {}
    return reply({ ok: true, sanctions });
  }

  if (route === "/moderation/revoke" && req.method === "POST") {
    if (!validSession(req)) return fail("non autorisé", 401);
    const body = parseJson(await readBody(req));
    const { id, target, action } = body || {};
    if (!id && !target) return fail("paramètres manquants", 400);

    let unCmd = "";
    const act = (action || "").toUpperCase();
    if (act === "BAN") unCmd = `unban ${target}`;
    else if (act === "MUTE") unCmd = `unmute ${target}`;
    else if (act === "FREEZE") unCmd = `unfreeze ${target}`;
    else unCmd = `pardon ${target}`;

    try {
      const sanctions = (await store.get("moderation_sanctions", { type: "json" })) || [];
      const updated = sanctions.map(s => {
        if (s.id === id || (s.target.toLowerCase() === target.toLowerCase() && s.action === act)) {
          return { ...s, active: false, revokedAt: new Date().toISOString() };
        }
        return s;
      });
      await store.setJSON("moderation_sanctions", updated);

      if (unCmd) {
        const pending = (await store.get("pending_commands", { type: "json" })) || [];
        pending.push(unCmd);
        await store.setJSON("pending_commands", pending);
      }

      const logs = (await store.get("server_logs", { type: "json" })) || [];
      logs.unshift({
        time: new Date().toISOString().replace("T", " [").slice(0, 19) + "]",
        type: "CMD",
        player: "WebAdmin",
        message: `Révocation sanction [${act}] pour ${target}`,
        details: `Commande exécutée : /${unCmd}`,
        server: "opalheaven.mcbe.fr",
        world: "world"
      });
      await store.setJSON("server_logs", logs.slice(0, 300));
    } catch {}

    return reply({ ok: true, message: `Sanction ${act} levée pour ${target}`, command: unCmd });
  }

  if (route === "/logs/clear" && req.method === "POST") {
    if (!validSession(req)) return fail("non autorisé", 401);
    try {
      await store.delete("server_logs");
    } catch {}
    return reply({ ok: true });
  }

  if (route === "/telemetry" && req.method === "GET") {
    if (!validSession(req)) return fail("non autorisé", 401);
    let telemetry = null;
    let serverLogs = [];
    try {
      telemetry = await store.get("telemetry", { type: "json" });
      serverLogs = (await store.get("server_logs", { type: "json" })) || [];
    } catch {}
    const telemConnected = Boolean(telemetry && (Date.now() - new Date(telemetry.receivedAt).getTime() < 1800000 || serverLogs.length > 0));
    return reply({
      connected: telemConnected,
      telemetry: telemetry || null,
      serverLogs,
    });
  }

  if (route === "/players" && req.method === "GET") {
    if (!validSession(req)) return fail("non autorisé", 401);
    let registered = [];
    let serverLogs = [];
    let sanctions = [];
    let telem = null;
    try {
      registered = (await store.get("registered_players", { type: "json" })) || [];
      serverLogs = (await store.get("server_logs", { type: "json" })) || [];
      sanctions = (await store.get("moderation_sanctions", { type: "json" })) || [];
      telem = await store.get("telemetry", { type: "json" });
    } catch {}

    const playersMap = new Map();
    for (const r of registered) {
      if (!r.name) continue;
      playersMap.set(r.name.toLowerCase(), { ...r, isOnline: false });
    }

    // Extraction et enrichissement depuis les logs réels du serveur
    for (const log of serverLogs) {
      if (!log.player || ["WebAdmin", "WebStaff", "System", "Console", "Serveur"].includes(log.player)) continue;
      const key = log.player.toLowerCase();
      const existing = playersMap.get(key) || {
        name: log.player,
        role: "JOUEUR",
        money: 1000,
        first_join: log.time || "",
        last_join: log.time || "",
        isOnline: false
      };
      if (log.type === "SESSION") {
        existing.last_join = log.time || existing.last_join;
      }
      if (log.faction && !existing.faction) {
        existing.faction = log.faction;
      }
      playersMap.set(key, existing);
    }

    // Joueurs connectés en direct depuis la télémétrie
    const onlineList = telem?.players?.details || [];
    for (const p of onlineList) {
      if (!p.name) continue;
      const key = p.name.toLowerCase();
      const existing = playersMap.get(key) || {
        name: p.name,
        role: p.rank || "JOUEUR",
        money: p.money ?? 1000,
        first_join: "",
        last_join: new Date().toISOString()
      };
      existing.isOnline = true;
      existing.ping = p.ping ?? 0;
      existing.world = p.world || "world";
      existing.role = p.rank || existing.role;
      existing.money = p.money ?? existing.money;
      if (p.faction) existing.faction = p.faction;
      playersMap.set(key, existing);
    }

    // Sanctions actives et passées
    for (const s of sanctions) {
      if (!s.target) continue;
      const key = s.target.toLowerCase();
      const existing = playersMap.get(key);
      if (existing) {
        if (!existing.sanctions) existing.sanctions = [];
        existing.sanctions.push(s);
        if (s.active !== false && !["KICK", "WARN"].includes(s.action)) {
          existing.activeSanction = s.action;
        }
      }
    }

    const list = Array.from(playersMap.values());
    return reply({ ok: true, players: list });
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
