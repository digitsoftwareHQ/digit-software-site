// Owner Editing Mode: a local, development-only way to edit the site's copy on the rendered page.
// OWNER_EDIT_INTEGRATION
//
// `astro dev` gets a small page script (client.js) and a save endpoint on the dev server. `astro build` and
// `astro preview` get nothing: no script, no endpoint, no editing attributes (src/content/schema.ts only emits
// those in development). scripts/check-site.mjs verifies the built site carries no trace of the editor.
import { fileURLToPath } from "node:url";

export const ENDPOINT = "/__owner-edit/field";
const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 64 * 1024) {
        reject(Object.assign(new Error("Request too large."), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

function devServerPlugin(root) {
  return {
    name: "owner-edit",
    apply: "serve",
    async configureServer(server) {
      const { createStore, EditError } = await import("./store.mjs");
      const store = createStore(root);
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (url.pathname !== ENDPOINT) return next();
        // Local machine only, same origin only. The custom header forces a CORS preflight that is never granted,
        // so other sites open in the browser cannot call this endpoint.
        if (!LOOPBACK.has(req.socket.remoteAddress ?? "")) return send(res, 403, { error: "Owner Editing Mode only answers on this computer." });
        const origin = req.headers.origin;
        if (req.headers["x-owner-edit"] !== "1" || (origin && new URL(origin).host !== req.headers.host)) {
          return send(res, 403, { error: "Request refused." });
        }
        try {
          if (req.method === "GET") return send(res, 200, await store.read(url.searchParams.get("key")));
          if (req.method === "POST") {
            if (!String(req.headers["content-type"]).startsWith("application/json")) return send(res, 415, { error: "Send JSON." });
            const saved = await store.write(JSON.parse(await readBody(req)));
            // Make sure the dev server sees the new file even if the file watcher is slow, so the page reloads.
            server.watcher.emit("change", saved.file);
            delete saved.file;
            return send(res, 200, saved);
          }
          return send(res, 405, { error: "Method not allowed." });
        } catch (err) {
          if (err instanceof EditError) return send(res, err.status, { error: err.message, ...err.extra });
          if (err instanceof SyntaxError) return send(res, 400, { error: "Could not read the request." });
          return send(res, err.status ?? 500, { error: err.message ?? "Could not save." });
        }
      });
    },
  };
}

/** @returns {import("astro").AstroIntegration} */
export default function ownerEdit() {
  return {
    name: "owner-edit",
    hooks: {
      "astro:config:setup": ({ command, injectScript, updateConfig, config, logger }) => {
        if (command !== "dev") return;
        const root = fileURLToPath(config.root);
        injectScript("page", `import ${JSON.stringify(fileURLToPath(new URL("./client.js", import.meta.url)))};`);
        updateConfig({ vite: { plugins: [devServerPlugin(root)] } });
        logger.info("Owner Editing Mode is available: add ?edit to any page URL.");
      },
    },
  };
}
