import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/trpc/[trpc]/route";
import { AUTH_COOKIE, requestCookies } from "@/server/auth/cookies";
import { fixtureEmail, fixturePassword, fixtureSession, fixtureUser } from "../helpers/auth-provider";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function configure(fetcher: typeof fetch) {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://auth.example.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "chave-publica-ficticia");
  vi.stubEnv("NODE_ENV", "production");
  vi.stubGlobal("fetch", fetcher);
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const post = (procedure: string, input: unknown, cookies?: string) => new Request(`https://app.example.test/api/trpc/auth.${procedure}`, { method: "POST", headers: { origin: "https://app.example.test", "content-type": "application/json", ...(cookies ? { cookie: cookies } : {}) }, body: JSON.stringify({ json: input }) });
const cookieHeader = (response: Response) => response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");

describe("SDK Supabase e endpoint real com transporte controlado localmente", () => {
  it("test_ca_01_ca_04_ca_07_endpoint_emite_cookies_protegidos_e_me_confirma_usuario_no_provedor", async () => {
    const session = fixtureSession();
    const calls: string[] = [];
    configure(async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      calls.push(url.pathname);
      if (url.pathname === "/auth/v1/token") {
        const body = JSON.parse(String(init?.body));
        expect(body).toMatchObject({ email: fixtureEmail, password: fixturePassword });
        return json(session);
      }
      if (url.pathname === "/auth/v1/user") {
        expect(new Headers(init?.headers).get("authorization")).toBe(`Bearer ${session.access_token}`);
        return json(fixtureUser());
      }
      throw new Error("Destino não previsto na fixture local.");
    });
    const login = await POST(post("login", { email: fixtureEmail, password: fixturePassword }));
    expect(login.status).toBe(200);
    expect(await login.json()).toEqual({ result: { data: { json: { user: { id: session.user.id, email: fixtureEmail } } } } });
    const cookies = login.headers.getSetCookie();
    expect(cookies.length).toBeGreaterThan(0);
    for (const cookie of cookies) {
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/Secure/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      expect(cookie).not.toMatch(/Domain=/i);
    }
    expect(login.headers.get("cache-control")).toContain("no-store");
    const me = await GET(new Request("https://app.example.test/api/trpc/auth.me?input=%7B%22json%22%3A%7B%7D%7D", { headers: { cookie: cookieHeader(login) } }));
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ result: { data: { json: { id: session.user.id, email: fixtureEmail } } } });
    expect(calls).toContain("/auth/v1/user");
  });

  it("test_ca_02_endpoint_recusado_nao_grava_sessao_nem_devolve_corpo_do_provedor", async () => {
    configure(async () => json({ error_code: "invalid_credentials", msg: "DETALHE_INTERNO_FICTICIO" }, 400));
    const response = await POST(post("login", { email: fixtureEmail, password: fixturePassword }));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.json.message).toBe("E-mail ou senha inválidos.");
    expect(response.headers.getSetCookie()).toHaveLength(0);
    expect(JSON.stringify(body)).not.toContain("DETALHE_INTERNO_FICTICIO");
    expect(JSON.stringify(body)).not.toContain(fixturePassword);
  });

  it("test_ca_05_endpoint_sair_revoga_sessao_local_e_expira_cookies", async () => {
    const session = fixtureSession();
    const calls: string[] = [];
    configure(async (input) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      calls.push(url.pathname + url.search);
      if (url.pathname === "/auth/v1/token") return json(session);
      if (url.pathname === "/auth/v1/user") return json(fixtureUser());
      if (url.pathname === "/auth/v1/logout") return json({});
      throw new Error("Destino não previsto na fixture local.");
    });
    const login = await POST(post("login", { email: fixtureEmail, password: fixturePassword }));
    const logout = await POST(post("logout", {}, cookieHeader(login)));
    expect(logout.status).toBe(200);
    expect(await logout.json()).toEqual({ result: { data: { json: { signedOut: true } } } });
    expect(calls).toContain("/auth/v1/logout?scope=local");
    expect(logout.headers.getSetCookie().some((cookie) => cookie.includes("Max-Age=0"))).toBe(true);
    const visitor = await GET(new Request("https://app.example.test/api/trpc/auth.me?input=%7B%22json%22%3A%7B%7D%7D"));
    expect(visitor.status).toBe(401);
    expect((await visitor.json()).error.json.data.code).toBe("UNAUTHORIZED");
  });

  it("test_ca_05_limpeza_inclui_todos_os_chunks_e_preserva_cookie_alheio", () => {
    const headers = new Headers();
    const store = requestCookies(new Request("https://app.example.test", { headers: { cookie: `${AUTH_COOKIE}.0=parte0; ${AUTH_COOKIE}.1=parte1; tema=escuro` } }), headers, true);
    store.clear();
    expect(store.getAll()).toEqual([{ name: "tema", value: "escuro" }]);
    expect(headers.getSetCookie()).toHaveLength(3);
    expect(headers.getSetCookie().every((cookie) => cookie.includes("Max-Age=0") && /HttpOnly/i.test(cookie) && /Secure/i.test(cookie))).toBe(true);
  });
});
