import { createServer, type Server } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fixtureEmail, fixturePassword, fixtureSession, fixtureUser } from "./auth-provider";

async function listen(server: Server) {
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Porta local da fixture indisponível.");
  return address.port;
}

export async function startAuthHarness() {
  const state = { unavailable: false, delay: 0, passwordRequests: 0, refreshRequests: 0, logoutRequests: 0 };
  const tokens = new Map<string, ReturnType<typeof fixtureUser>>();
  const refreshTokens = new Set<string>();
  const provider = createServer(async (request, response) => {
    const reply = (status: number, data: unknown) => { response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" }); response.end(JSON.stringify(data)); };
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (state.unavailable) { reply(503, { error_code: "unexpected_failure", msg: "Provedor local indisponível na fixture." }); return; }
      if (url.pathname === "/auth/v1/token") {
        let raw = "";
        for await (const chunk of request) { raw += chunk.toString(); if (raw.length > 16384) { reply(413, {}); return; } }
        const input = JSON.parse(raw) as Record<string, unknown>;
        const refresh = url.searchParams.get("grant_type") === "refresh_token";
        if (refresh) {
          state.refreshRequests++;
          if (typeof input.refresh_token !== "string" || !refreshTokens.delete(input.refresh_token)) { reply(400, { error_code: "refresh_token_not_found", msg: "Refresh inválido na fixture." }); return; }
        } else {
          state.passwordRequests++;
          if (state.delay) await new Promise((resolve) => setTimeout(resolve, state.delay));
          if (input.email !== fixtureEmail || input.password !== fixturePassword) { reply(400, { error_code: "invalid_credentials", msg: "Detalhes internos da fixture não devem aparecer." }); return; }
        }
        const session = { ...fixtureSession(), refresh_token: `refresh-local-${randomUUID()}` };
        tokens.set(session.access_token, session.user);
        refreshTokens.add(session.refresh_token);
        reply(200, session);
        return;
      }
      const access = request.headers.authorization?.replace(/^Bearer /, "") ?? "";
      const user = tokens.get(access);
      if (!user) { reply(401, { error_code: "bad_jwt", msg: "Token não emitido pela fixture." }); return; }
      if (url.pathname === "/auth/v1/user") { reply(200, user); return; }
      if (url.pathname === "/auth/v1/logout" && url.searchParams.get("scope") === "local") {
        state.logoutRequests++;
        tokens.delete(access);
        reply(200, {});
        return;
      }
      reply(404, {});
    } catch { if (!response.headersSent) reply(400, {}); else response.end(); }
  });
  const providerPort = await listen(provider);
  const probe = createServer();
  const appPort = await listen(probe);
  await new Promise<void>((resolve) => probe.close(() => resolve()));
  const url = `http://127.0.0.1:${appPort}`;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(appPort)], {
    windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${providerPort}`, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publica-da-fixture-e2e", SUPABASE_SERVICE_ROLE_KEY: "", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture", DIRECT_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture", SENTRY_DSN: "" },
  });
  let output = "";
  let spawnFailure: Error | undefined;
  child.on("error", (error) => { spawnFailure = error; });
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (chunk) => { output = (output + String(chunk)).slice(-8000); });
  const close = async () => { child.kill(); provider.closeAllConnections(); await new Promise<void>((resolve) => provider.close(() => resolve())); };
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnFailure || child.exitCode !== null) throw new Error(`Servidor de teste não iniciou: ${spawnFailure?.message ?? output}`);
      try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* Só espera o servidor local. */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error(`Servidor de teste não ficou pronto: ${output}`);
  } catch (error) { await close(); throw error; }
  return { url, state, logs: () => output, reset() { Object.assign(state, { unavailable: false, delay: 0, passwordRequests: 0, refreshRequests: 0, logoutRequests: 0 }); tokens.clear(); refreshTokens.clear(); }, close };
}
