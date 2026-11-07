import { onRequest } from "./functions/api/[[catchall]].js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Routes API du Studio Opal (/api/*)
    if (url.pathname.startsWith("/api")) {
      return onRequest({
        request,
        env,
        params: {},
        data: {},
        next: () => (env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 })),
      });
    }

    // 2. Fichiers statiques depuis le dossier public/ (HTML, JS, CSS, Textures)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};
