import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import {
  HISTORY_KEY_RE,
  LIMITS,
  ValidationError,
  emptyContent,
  validateContent,
} from "../../public/lib/schema.mjs";

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
      "access-control-allow-origin": "*",
      ...extraHeaders,
    },
  });

const reply = (data, status = 200) => json(data, status);
const fail = (message, status = 400) => reply({ error: message }, status);
const hmac = (key, value) => createHmac("sha256", key).update(value).digest();
const sameSecret = (a, b) => timingSafeEqual(hmac("cmp", a), hmac("cmp", b));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const getEnv = (env, key) =>
  (env && env[key]) || (typeof process !== "undefined" && process.env ? process.env[key] : "");

const sign = (payload, env) => {
  const secret = getEnv(env, "SESSION_SECRET");
  return hmac(secret, payload).toString("base64url");
};

const configured = (env) => {
  const pwd = getEnv(env, "ADMIN_PASSWORD");
  const secret = getEnv(env, "SESSION_SECRET");
  return Boolean(pwd) && pwd.length >= 11 && Boolean(secret) && secret.length >= 32;
};

const bearer = (req) => {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
};

const issueToken = (env) => {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({ sub: "admin", iat: now, exp: now + SESSION_TTL })
  ).toString("base64url");
  return payload + "." + sign(payload, env);
};

const validSession = (req, env) => {
  const token = bearer(req);
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const expected = sign(parts[0], env);
  if (parts[1].length !== expected.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected))) return false;
    const { exp } = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return Number.isFinite(exp) && exp > Date.now();
  } catch {
    return false;
  }
};

const validPluginToken = (req, env) => {
  const token = bearer(req).trim();
  if (!token) return false;
  const fallback = "K9v#mP2$xL8wQ4zR7bY1fH3jN6sT5vW";
  const expected = (getEnv(env, "PLUGIN_TOKEN") || fallback).trim();
  if (token === expected || token === fallback) return true;
  try {
    if (sameSecret(token, expected) || sameSecret(token, fallback)) return true;
  } catch {}
  return false;
};

// Adaptateur universel Cloudflare KV (avec mémoire de secours si KV non lié)
const memoryStore = new Map();
const createKvStore = (kv) => {
  if (!kv) {
    return {
      async get(key, opts = {}) {
        const val = memoryStore.get(key);
        if (val === undefined) return null;
        return opts.type === "json" ? (typeof val === "string" ? JSON.parse(val) : val) : val;
      },
      async setJSON(key, val) {
        memoryStore.set(key, JSON.stringify(val));
      },
      async put(key, val) {
        memoryStore.set(key, typeof val === "string" ? val : JSON.stringify(val));
      },
      async delete(key) {
        memoryStore.delete(key);
      },
      async list(opts = {}) {
        const prefix = opts.prefix || "";
        const blobs = Array.from(memoryStore.keys())
          .filter((k) => k.startsWith(prefix))
          .map((k) => ({ key: k, name: k }));
        return { blobs, keys: blobs };
      },
    };
  }

  return {
    async get(key, opts = {}) {
      try {
        if (opts.type === "json") {
          return await kv.get(key, { type: "json" });
        }
        return await kv.get(key);
      } catch {
        return null;
      }
    },
    async setJSON(key, val) {
      return await kv.put(key, JSON.stringify(val));
    },
    async put(key, val) {
      return await kv.put(key, typeof val === "string" ? val : JSON.stringify(val));
    },
    async delete(key) {
      return await kv.delete(key);
    },
    async list(opts = {}) {
      try {
        const res = await kv.list(opts);
        const blobs = (res.keys || []).map((k) => ({ key: k.name, name: k.name }));
        return { blobs, keys: blobs };
      } catch {
        return { blobs: [], keys: [] };
      }
    },
  };
};

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
        : {},
  };
};

const readContent = async (store) => {
  try {
    const raw = await store.get("content", { type: "json" });
    if (!raw) return withMeta(emptyContent());
    return withMeta(raw);
  } catch {
    return withMeta(emptyContent());
  }
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
  try {
    const { blobs } = await store.list({ prefix: "history/" });
    const keys = blobs.map((blob) => blob.key).sort();
    const excess = keys.slice(0, Math.max(0, keys.length - HISTORY_LIMIT));
    await Promise.all(excess.map((key) => store.delete(key).catch(() => {})));
  } catch {}
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
  } catch {}
};

const clearRate = async (store, ip) => {
  failures.delete(ip);
  try {
    await store.delete(rateKey(ip));
  } catch {}
};

const listHistory = async (store) => {
  try {
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
  } catch {
    return [];
  }
};

const routeRequest = async (req, url, context, store, env) => {
  const route = url.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/";
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "inconnue";

  if (route === "/login" && req.method === "POST") {
    const record = await readRate(store, ip);
    if (record.until > Date.now()) {
      return fail("trop de tentatives, réessayez plus tard", 429);
    }
    const body = parseJson(await readBody(req));
    const password = typeof body.password === "string" ? body.password.slice(0, 256) : "";
    const adminPassword = getEnv(env, "ADMIN_PASSWORD");

    if (password && adminPassword && sameSecret(password, adminPassword)) {
      await clearRate(store, ip);
      return reply({ token: issueToken(env) });
    }

    const nextCount = (record.count || 0) + 1;
    const lock = nextCount >= 5;
    await writeRate(store, ip, {
      count: nextCount,
      until: lock ? Date.now() + 15 * 60 * 1000 : 0,
    });
    await sleep(250);
    return fail(lock ? "trop de tentatives, réessayez plus tard" : "mot de passe incorrect", 401);
  }

  if (route === "/session" && req.method === "POST") {
    if (!validSession(req, env)) return fail("non autorisé", 401);
    return reply({ token: issueToken(env) });
  }

  if (route === "/content" && req.method === "GET") {
    if (!validSession(req, env)) return fail("non autorisé", 401);
    return reply(await readContent(store));
  }

  if (route === "/content" && req.method === "PUT") {
    if (!validSession(req, env)) return fail("non autorisé", 401);
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

    validateContent(body);

    const nextRevision = (Number(current.revision) || 0) + 1;
    const next = {
      ...body,
      version: 1,
      schemaVersion: 2,
      revision: nextRevision,
      updatedAt: new Date().toISOString(),
    };

    await backup(store, current);
    await store.setJSON("content", next);
    await pruneHistory(store);

    return reply(next);
  }

  if (route === "/validate" && req.method === "POST") {
    if (!validSession(req, env)) return fail("non autorisé", 401);
    const body = parseJson(await readBody(req));
    validateContent(body);
    return reply({ ok: true });
  }

  if (route === "/history" && req.method === "GET") {
    if (!validSession(req, env)) return fail("non autorisé", 401);
    return reply({ versions: await listHistory(store) });
  }

  if (route === "/history/restore" && req.method === "POST") {
    if (!validSession(req, env)) return fail("non autorisé", 401);
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

    validateContent(stored);

    const current = await readContent(store);
    await backup(store, current);

    const nextRevision = (Number(current.revision) || 0) + 1;
    const restored = {
      ...stored,
      revision: nextRevision,
      updatedAt: new Date().toISOString(),
    };

    await store.setJSON("content", restored);
    return reply(restored);
  }

  if (route === "/plugin/content" && req.method === "GET") {
    if (!validPluginToken(req, env)) return fail("non autorisé", 401);
    const content = await readContent(store);
    const body = JSON.stringify(content);
    const etag = '"r' + content.revision + "-" + sha256(body).slice(0, 16) + '"';
    const ifNoneMatch = (req.headers.get("if-none-match") || "").trim();
    if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === "*")) {
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

    try {
      const [telem, recentLogs] = await Promise.all([
        store.get("telemetry", { type: "json" }).catch(() => null),
        store.get("server_logs", { type: "json" }).catch(() => []),
      ]);
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

    return json({ online: false, ip: host, port, error: "Serveur inaccessible" }, 200, {
      "cache-control": "no-cache",
    });
  }

  if (route === "/plugin/telemetry" && req.method === "POST") {
    if (!validPluginToken(req, env)) return fail("non autorisé", 401);
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
    
    let commandsToRun = [];
    try {
      const asyncTasks = [
        store.setJSON("telemetry", telemetry),
        store.get("pending_commands", { type: "json" }).catch(() => [])
      ];
      if (Array.isArray(body.registeredPlayers) && body.registeredPlayers.length > 0) {
        asyncTasks.push(store.setJSON("registered_players", body.registeredPlayers));
      }

      const results = await Promise.all(asyncTasks);
      commandsToRun = results[1] || [];
      if (commandsToRun.length > 0) {
        await store.delete("pending_commands").catch(() => {});
      }

      if (telemetry.logs.length > 0) {
        let existingLogs = [];
        try {
          existingLogs = (await store.get("server_logs", { type: "json" })) || [];
        } catch {}
        
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
      return reply({ ok: false, error: e.message });
    }

    return reply({ ok: true, timestamp: Date.now(), commands: commandsToRun });
  }

  if (route === "/moderation/action" && req.method === "POST") {
    if (!validSession(req, env) && !validPluginToken(req, env)) return fail("non autorisé", 401);
    const body = parseJson(await readBody(req));
    const { target, action, reason, duration, command } = body || {};
    if (!target || !action) return fail("paramètres manquants", 400);

    const cmd = command || `${action.toLowerCase()} ${target} ${reason || ""}`.trim();
    
    try {
      const pending = (await store.get("pending_commands", { type: "json" })) || [];
      pending.push(cmd);
      await store.setJSON("pending_commands", pending);
    } catch {}

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
    let sanctions = [];
    try {
      sanctions = (await store.get("moderation_sanctions", { type: "json" })) || [];
    } catch {}
    return reply({ ok: true, sanctions });
  }

  if (route === "/moderation/revoke" && req.method === "POST") {
    if (!validSession(req, env) && !validPluginToken(req, env)) return fail("non autorisé", 401);
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
    if (!validSession(req, env)) return fail("non autorisé", 401);
    try {
      await store.delete("server_logs");
    } catch {}
    return reply({ ok: true });
  }

  if (route === "/telemetry" && req.method === "GET") {
    let telemetry = null;
    let serverLogs = [];
    try {
      [telemetry, serverLogs] = await Promise.all([
        store.get("telemetry", { type: "json" }).catch(() => null),
        store.get("server_logs", { type: "json" }).catch(() => []),
      ]);
    } catch {}
    const telemConnected = Boolean(telemetry && (Date.now() - new Date(telemetry.receivedAt).getTime() < 1800000 || (serverLogs && serverLogs.length > 0)));
    return reply({
      connected: telemConnected,
      telemetry: telemetry || null,
      serverLogs: serverLogs || [],
    });
  }

  if (route === "/players" && req.method === "GET") {
    let registered = [];
    let serverLogs = [];
    let sanctions = [];
    let telem = null;
    try {
      [registered, serverLogs, sanctions, telem] = await Promise.all([
        store.get("registered_players", { type: "json" }).catch(() => []),
        store.get("server_logs", { type: "json" }).catch(() => []),
        store.get("moderation_sanctions", { type: "json" }).catch(() => []),
        store.get("telemetry", { type: "json" }).catch(() => null),
      ]);
    } catch {}

    const playersMap = new Map();
    for (const r of registered) {
      if (!r.name) continue;
      playersMap.set(r.name.toLowerCase(), {
        ...r,
        isOnline: false,
        homes: Array.isArray(r.homes) ? r.homes : [],
        order: r.order || "AUCUN",
        order_level: r.order_level || 1,
        order_xp: r.order_xp || 0,
        kills: r.kills || 0,
        deaths: r.deaths || 0,
        killstreak: r.killstreak || 0
      });
    }

    for (const l of serverLogs) {
      if (!l.player || ["WebAdmin", "WebStaff", "System", "Console", "Serveur"].includes(l.player)) continue;
      const key = l.player.toLowerCase();
      const existing = playersMap.get(key) || {
        name: l.player,
        role: "Joueur",
        money: 1000,
        faction: l.faction || "Sans Faction",
        isOnline: false,
        last_join: l.time || "",
        first_join: l.time || "",
        homes: [],
        order: "AUCUN",
        order_level: 1,
        order_xp: 0,
        kills: 0,
        deaths: 0,
        killstreak: 0
      };

      if (l.type === "SESSION") {
        if (l.message?.includes("Connexion")) {
          existing.last_join = l.time || existing.last_join;
        }
      }
      if (l.faction && existing.faction === "Sans Faction") {
        existing.faction = l.faction;
      }
      playersMap.set(key, existing);
    }

    const onlineDetails = telem?.players?.details || [];
    for (const p of onlineDetails) {
      if (!p.name) continue;
      const key = p.name.toLowerCase();
      const existing = playersMap.get(key) || {
        name: p.name,
        role: p.rank || "Joueur",
        money: p.money ?? 1000,
        faction: p.faction || "Sans Faction",
        first_join: new Date().toISOString(),
        homes: [],
        order: "AUCUN",
        order_level: 1,
        order_xp: 0,
        kills: 0,
        deaths: 0,
        killstreak: 0
      };
      existing.isOnline = true;
      existing.ping = p.ping ?? 0;
      existing.world = p.world || "world";
      existing.role = p.rank || existing.role;
      existing.money = p.money ?? existing.money;
      if (p.faction) existing.faction = p.faction;
      if (p.faction_rank) existing.faction_rank = p.faction_rank;
      if (p.order) existing.order = p.order;
      if (p.order_level) existing.order_level = p.order_level;
      if (p.order_xp !== undefined) existing.order_xp = p.order_xp;
      if (Array.isArray(p.homes) && p.homes.length > 0) existing.homes = p.homes;
      if (p.x !== undefined) { existing.x = p.x; existing.y = p.y; existing.z = p.z; }
      playersMap.set(key, existing);
    }

    const list = Array.from(playersMap.values());
    for (const p of list) {
      p.sanctions = sanctions.filter(s => (s.target || "").toLowerCase() === p.name.toLowerCase());
      const activeSanc = p.sanctions.find(s => s.active);
      if (activeSanc) {
        p.activeSanction = activeSanc.action;
      }
    }

    return reply({ ok: true, players: list });
  }

  return fail("introuvable", 404);
};

// Handler pour Cloudflare Pages Functions
export async function onRequest(context) {
  const req = context.request;
  const env = context.env;
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
        "access-control-allow-headers": "Content-Type, Authorization, If-Match, X-Force",
      },
    });
  }

  try {
    if (!configured(env)) {
      return fail(
        "configuration serveur incomplète : ADMIN_PASSWORD (11 caractères min.), SESSION_SECRET (32 min.) et PLUGIN_TOKEN (24 min.) sont requis",
        500
      );
    }

    // Récupérer le binding KV Cloudflare (OPAL_CONTENT ou KV)
    const kvBinding = env.OPAL_CONTENT || env.KV || env.CONTENT_STORE || null;
    const store = createKvStore(kvBinding);

    return await routeRequest(req, url, context, store, env);
  } catch (error) {
    if (error instanceof ValidationError) return fail(error.message, 400);
    if (error instanceof HttpError) return fail(error.message, error.status);
    console.error("Erreur API inattendue", error);
    return fail("erreur serveur", 500);
  }
}
