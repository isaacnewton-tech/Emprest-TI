import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/trpc/[trpc]/route";
import { guardSession } from "@/server/auth/guard";
import { AUTH_COOKIE } from "@/server/auth/cookies";
import { fixtureEmail, fixturePassword, fixtureSession, fixtureUser } from "../helpers/auth-provider";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
function configure(fetcher: typeof fetch) {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://auth.example.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publica-da-fixture");
  vi.stubEnv("NODE_ENV", "production");
  vi.stubGlobal("fetch", fetcher);
}
async function loginCookie() {
  const response = await POST(new Request("https://app.example.test/api/trpc/auth.login", { method: "POST", headers: { origin: "https://app.example.test", "content-type": "application/json" }, body: JSON.stringify({ json: { email: fixtureEmail, password: fixturePassword } }) }));
  expect(response.status).toBe(200);
  return response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
}

describe("Guardas e renovação de sessão", () => {
  it("test_ca_03_visitante_e_cookie_invalido_nao_acessam_catalogo", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => { throw new Error("Esta fixture não permite rede."); });
    configure(fetcher);
    const visitor = await guardSession(new NextRequest("https://app.example.test/catalogo"));
    expect(visitor.status).toBe(307);
    expect(visitor.headers.get("location")).toBe("https://app.example.test/login");
    expect(fetcher).not.toHaveBeenCalled();
    const invalid = await guardSession(new NextRequest("https://app.example.test/catalogo", { headers: { cookie: `${AUTH_COOKIE}=invalido` } }));
    expect(invalid.status).toBe(307);
    expect(invalid.headers.get("location")).toBe("https://app.example.test/login");
    expect(invalid.headers.getSetCookie().some((cookie) => cookie.includes("Max-Age=0"))).toBe(true);
  });

  it("test_ca_03_sessao_confirmada_redireciona_login_e_libera_catalogo", async () => {
    const calls: string[] = [];
    configure(async (input) => {
      const path = new URL(input instanceof Request ? input.url : input.toString()).pathname;
      calls.push(path);
      return json(path.endsWith("/token") ? fixtureSession() : fixtureUser());
    });
    const cookie = await loginCookie();
    const login = await guardSession(new NextRequest("https://app.example.test/login", { headers: { cookie } }));
    expect(login.status).toBe(307);
    expect(login.headers.get("location")).toBe("https://app.example.test/catalogo");
    const catalog = await guardSession(new NextRequest("https://app.example.test/catalogo", { headers: { cookie } }));
    expect(catalog.status).toBe(200);
    expect(catalog.headers.get("x-middleware-next")).toBe("1");
    expect(catalog.headers.get("cache-control")).toContain("no-store");
    expect(calls.filter((path) => path.endsWith("/user"))).toHaveLength(2);
  });

  it("test_ca_04_sessao_expirada_e_renovada_com_cookies_protegidos_e_encaminhada_no_request", async () => {
    let refreshes = 0;
    configure(async (input) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      if (url.searchParams.get("grant_type") === "refresh_token") {
        refreshes++;
        return json({ ...fixtureSession(), refresh_token: "refresh-renovado-da-fixture" });
      }
      return json(url.pathname.endsWith("/token") ? fixtureSession() : fixtureUser());
    });
    const original = await loginCookie();
    const encoded = decodeURIComponent(original.slice(original.indexOf("=") + 1));
    expect(encoded.startsWith("base64-")).toBe(true);
    const session = JSON.parse(Buffer.from(encoded.slice(7), "base64url").toString());
    session.expires_at = Math.floor(Date.now() / 1000) - 180;
    const cookie = `${AUTH_COOKIE}=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
    const request = new NextRequest("https://app.example.test/catalogo", { headers: { cookie } });
    const response = await guardSession(request);
    expect(response.status).toBe(200);
    expect(refreshes).toBe(1);
    expect(response.headers.getSetCookie().length).toBeGreaterThan(0);
    expect(response.headers.getSetCookie().every((header) => /HttpOnly/i.test(header) && /Secure/i.test(header) && /SameSite=lax/i.test(header))).toBe(true);
    expect(request.cookies.get(AUTH_COOKIE)?.value).not.toBe(cookie.split("=")[1]);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("test_ca_04_falha_do_provedor_nao_libera_conteudo_protegido", async () => {
    let unavailable = false;
    configure(async (input) => {
      const path = new URL(input instanceof Request ? input.url : input.toString()).pathname;
      if (unavailable) return json({ error_code: "unexpected_failure", msg: "erro interno da fixture" }, 503);
      return json(path.endsWith("/token") ? fixtureSession() : fixtureUser());
    });
    const cookie = await loginCookie();
    unavailable = true;
    const response = await guardSession(new NextRequest("https://app.example.test/catalogo", { headers: { cookie } }));
    expect(response.status).toBe(503);
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://app.example.test/sessao-indisponivel");
    expect(response.headers.get("x-middleware-next")).toBeNull();
  });
});
