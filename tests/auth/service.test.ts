import { describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/api/root";
import { currentIdentity, signIn, signOut } from "@/server/services/auth";
import { testAuthContext, testAuthGateway } from "../helpers/auth-context";

describe("Identidade e procedimentos de autenticação", () => {
  it("test_ca_01_ca_07_login_via_createcaller_retorna_somente_identidade_sem_tokens_ou_papeis", async () => {
    const gateway = testAuthGateway({ signInWithPassword: async () => ({ data: { user: { id: "pessoa-A", email: "a@example.test", access_token: "TOKEN_FICTICIO" } }, error: null }) });
    const result = await appRouter.createCaller(testAuthContext({ auth: gateway })).auth.login({ email: "a@example.test", password: "senha-da-fixture" });
    expect(result).toEqual({ user: { id: "pessoa-A", email: "a@example.test" } });
    expect(JSON.stringify(result)).not.toContain("TOKEN_FICTICIO");
  });

  it("test_ca_02_credenciais_recusadas_e_falha_de_rede_nao_revelam_detalhes_do_provedor", async () => {
    const rejected = testAuthGateway();
    await expect(signIn(rejected, { email: "a@example.test", password: "fixture" })).rejects.toMatchObject({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
    const broken = testAuthGateway({ signInWithPassword: async () => { throw new Error("DETALHE_INTERNO_FICTICIO"); } });
    await expect(signIn(broken, { email: "a@example.test", password: "fixture" })).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", message: "Não foi possível acessar sua conta agora. Tente novamente." });
  });

  it("test_ca_03_ca_07_identidade_ausente_e_input_de_outro_usuario_nao_liberam_me", async () => {
    const anonymous = appRouter.createCaller(testAuthContext());
    await expect(anonymous.auth.me({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const a = { id: "pessoa-A", email: "a@example.test" };
    const b = { id: "pessoa-B", email: "b@example.test" };
    await expect(appRouter.createCaller(testAuthContext({ user: a })).auth.me({})).resolves.toEqual(a);
    const callerB = appRouter.createCaller(testAuthContext({ user: b }));
    await expect(callerB.auth.me({})).resolves.toEqual(b);
    await expect(callerB.auth.me({ userId: a.id } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("test_ca_04_identidade_e_confirmada_no_provedor_e_falha_temporaria_nao_e_aceita", async () => {
    const getUser = vi.fn(async () => ({ data: { user: { id: "confirmado", email: "a@example.test" } }, error: null }));
    expect(await currentIdentity(testAuthGateway({ getUser }))).toEqual({ id: "confirmado", email: "a@example.test" });
    expect(getUser).toHaveBeenCalledOnce();
    expect(await currentIdentity(testAuthGateway({ getUser: async () => ({ data: { user: null }, error: { status: 401 } }) }))).toBeNull();
    await expect(currentIdentity(testAuthGateway({ getUser: async () => ({ data: { user: null }, error: { status: 503 } }) }))).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });

  it("test_ca_05_logout_revoga_apenas_sessao_local_e_limpa_cookies_mesmo_com_falha_do_provedor", async () => {
    const clear = vi.fn();
    const revoke = vi.fn(async () => ({ error: null }));
    const caller = appRouter.createCaller(testAuthContext({ user: { id: "pessoa-A", email: "a@example.test" }, auth: testAuthGateway({ signOut: revoke }), clearSessionCookies: clear }));
    await expect(caller.auth.logout({})).resolves.toEqual({ signedOut: true });
    expect(revoke).toHaveBeenCalledWith({ scope: "local" });
    expect(clear).toHaveBeenCalledOnce();
    const clearAfterFailure = vi.fn();
    await expect(signOut(testAuthGateway({ signOut: async () => { throw new Error("fixture"); } }), clearAfterFailure)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(clearAfterFailure).toHaveBeenCalledOnce();
  });
});
