import { describe, expect, it } from "vitest";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { testAuthContext } from "../helpers/auth-context";
import { publicProcedure, router } from "@/server/api/trpc";
import { getAuthConfig } from "@/server/env";
import { loginSchema } from "@/shared/auth";
import { hasSameOrigin, requestOrigin } from "@/server/http/origin";

const testRouter = router({ check: publicProcedure.input(loginSchema).mutation(({ input }) => ({ email: input.email })) });
const createContext = ({ req, resHeaders }: Pick<FetchCreateContextFnOptions, "req" | "resHeaders">) => testAuthContext({ request: req, responseHeaders: resHeaders });
function request(origin: string | null, input: unknown) {
  return new Request("http://localhost/api/trpc/check", { method: "POST", headers: { "content-type": "application/json", ...(origin === null ? {} : { origin }) }, body: JSON.stringify({ json: input }) });
}
function endpoint(req: Request) {
  return fetchRequestHandler({ endpoint: "/api/trpc", req, router: testRouter, createContext });
}

describe("Transporte da autenticação", () => {
  it("test_ca_07_usa_host_publico_com_protocolo_encaminhado_e_recusa_origem_falsa", () => {
    const headers = { host: "publico.example.test", "x-forwarded-proto": "https", origin: "https://publico.example.test" };
    const req = new Request("http://localhost:3000/api/trpc", { headers });
    expect(requestOrigin(req)).toBe("https://publico.example.test");
    expect(hasSameOrigin(req)).toBe(true);
    expect(hasSameOrigin(new Request(req.url, { headers: { ...headers, origin: "https://outro.example.test", "x-forwarded-host": "outro.example.test" } }))).toBe(false);
    expect(hasSameOrigin(new Request(req.url, { headers: { ...headers, origin: "https://usuario@publico.example.test" } }))).toBe(false);
    expect(hasSameOrigin(new Request(req.url, { headers: { ...headers, host: "publico.example.test/caminho" } }))).toBe(false);
    expect(hasSameOrigin(new Request(req.url, { headers: { ...headers, "x-forwarded-proto": "https,http" } }))).toBe(false);
  });
  it("test_ca_02_ca_07_createcaller_valida_entrada_e_rejeita_tenant_ou_papel_no_input", async () => {
    const req = request("http://localhost", {});
    const caller = testRouter.createCaller(createContext({ req, resHeaders: new Headers() }));
    await expect(caller.check({ email: "invalido", password: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.check({ email: "pessoa@example.test", password: "fixture", tenant: "B", role: "admin" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.check({ email: " Pessoa@Example.Test ", password: "fixture" })).resolves.toEqual({ email: "pessoa@example.test" });
  });

  it("test_ca_07_endpoint_mutacao_de_outra_origem_ou_sem_origem_retorna_403_e_corpo_seguro", async () => {
    for (const origin of ["https://outro.example.test", null]) {
      const response = await endpoint(request(origin, { email: "pessoa@example.test", password: "fixture" }));
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.json.data.code).toBe("FORBIDDEN");
      expect(body.error.json.message).toBe("Origem da requisição não permitida.");
      expect(body.error.json.data).not.toHaveProperty("stack");
      expect(JSON.stringify(body)).not.toContain("fixture");
    }
  });

  it("test_ca_02_endpoint_valido_retorna_200_e_dados_serializados_sem_senha", async () => {
    const response = await endpoint(request("http://localhost", { email: "pessoa@example.test", password: "fixture" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: { data: { json: { email: "pessoa@example.test" } } } });
  });

  it("test_ca_07_configuracao_exige_url_e_chave_publica_sem_exigir_service_role_ou_expor_valores_no_erro", () => {
    const env = { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "chave-publica-da-fixture", NODE_ENV: "production" };
    expect(getAuthConfig(env)).toEqual({ url: env.NEXT_PUBLIC_SUPABASE_URL, key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, secureCookies: true });
    expect(() => getAuthConfig({ ...env, NEXT_PUBLIC_SUPABASE_URL: "URL_FICTICIA_INVALIDA" })).toThrow("Configuração de autenticação indisponível.");
  });
});
