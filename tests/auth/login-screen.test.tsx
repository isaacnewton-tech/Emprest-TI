// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";
import { LoginScreen } from "@/components/login-screen";
import { fixtureEmail, fixturePassword, fixtureUserId } from "../helpers/auth-provider";

const mocks = vi.hoisted(() => ({ login: vi.fn<(input: RouterInputs["auth"]["login"]) => Promise<RouterOutputs["auth"]["login"]>>(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }) }));
vi.mock("@/trpc/react", async () => {
  const { useState } = await import("react");
  return { api: { auth: { login: { useMutation(options: { onError(error: { data?: { code?: string } }): void }) {
    const [isPending, setPending] = useState(false);
    return { isPending, async mutateAsync(input: RouterInputs["auth"]["login"]) {
      setPending(true);
      try { return await mocks.login(input); }
      catch (error) { options.onError(error as { data?: { code?: string } }); throw error; }
      finally { setPending(false); }
    } };
  } } } } };
});

beforeEach(() => { mocks.login.mockReset(); mocks.replace.mockReset(); mocks.refresh.mockReset(); });
afterEach(cleanup);
function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const clear = vi.spyOn(queryClient, "clear");
  render(<QueryClientProvider client={queryClient}><LoginScreen /></QueryClientProvider>);
  return { user: userEvent.setup(), clear };
}
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("E-mail"), fixtureEmail);
  await user.type(screen.getByLabelText("Senha"), fixturePassword);
}

describe("Formulário de login", () => {
  it("test_ca_02_ca_06_campos_invalidos_mostram_erros_acessiveis_sem_chamar_api", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("E-mail"), "email-invalido");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Informe um e-mail válido.")).toBeTruthy();
    expect(screen.getByText("Informe sua senha.")).toBeTruthy();
    expect(screen.getByLabelText("E-mail").getAttribute("aria-invalid")).toBe("true");
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("test_ca_01_ca_06_envios_simultaneos_criam_uma_chamada_e_sucesso_limpa_cache_e_navega", async () => {
    const deferred = Promise.withResolvers<RouterOutputs["auth"]["login"]>();
    mocks.login.mockReturnValueOnce(deferred.promise);
    const { user, clear } = setup();
    await fill(user);
    const button = screen.getByRole("button", { name: "Entrar" });
    const form = button.closest("form");
    if (!form) throw new Error("Formulário não encontrado no teste.");
    fireEvent.submit(form); fireEvent.submit(form);
    await waitFor(() => expect(mocks.login).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Entrando…" })).toHaveProperty("disabled", true);
    expect(form.getAttribute("aria-busy")).toBe("true");
    expect(clear).not.toHaveBeenCalled();
    deferred.resolve({ user: { id: fixtureUserId, email: fixtureEmail } });
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/catalogo"));
    expect(clear).toHaveBeenCalledOnce();
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("test_ca_02_ca_06_recusa_mostra_mensagem_generica_e_permite_nova_tentativa", async () => {
    mocks.login.mockRejectedValueOnce({ data: { code: "UNAUTHORIZED" }, message: "mensagem interna da fixture" }).mockResolvedValueOnce({ user: { id: fixtureUserId, email: fixtureEmail } });
    const { user } = setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect((await screen.findByRole("alert")).textContent).toBe("E-mail ou senha inválidos.");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/catalogo"));
    expect(mocks.login).toHaveBeenCalledTimes(2);
  });
});
