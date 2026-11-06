import { test as base, expect, type Page } from "@playwright/test";
import type { startAuthHarness } from "../helpers/auth-harness";
import { startLoanHarness } from "../helpers/loan-harness";
import { fixtureEmail, fixturePassword, fixtureUserId } from "../helpers/auth-provider";

const test = base.extend<Record<never, never>, { app: Awaited<ReturnType<typeof startAuthHarness>> }>({
  app: [async ({}, provide) => { const harness = await startLoanHarness(); try { await provide(harness.app); } finally { await harness.close(); } }, { scope: "worker", timeout: 180_000 }],
});
test.beforeEach(({ app }) => app.reset());
async function login(page: Page, url: string, logs?: () => string) {
  await page.goto(`${url}/login`);
  await page.getByLabel("E-mail").fill(fixtureEmail);
  await page.getByLabel("Senha", { exact: true }).fill(fixturePassword);
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/trpc/auth.login"));
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const response = await responsePromise;
  const body = await response.json();
  const headers = await response.request().allHeaders();
  expect(response.status(), JSON.stringify({ body, origin: headers.origin, site: headers["sec-fetch-site"], host: headers.host, server: logs?.() })).toBe(200);
  expect(body).toEqual([{ result: { data: { json: { user: { id: fixtureUserId, email: fixtureEmail } } } } }]);
  await expect(page).toHaveURL(`${url}/catalogo`);
  await expect(page.getByRole("heading", { name: "Catálogo", exact: true })).toBeVisible();
}

test("test_ca_01_ca_03_ca_05_login_navegacao_protegida_e_saida_com_cookies_httponly", async ({ page, context, app }) => {
  await page.goto(`${app.url}/catalogo`);
  await expect(page).toHaveURL(`${app.url}/login`);
  await login(page, app.url, app.logs);
  await expect(page.getByText(fixtureEmail, { exact: true })).toBeVisible();
  const cookies = (await context.cookies()).filter((cookie) => cookie.name.startsWith("empresti-auth"));
  expect(cookies.length).toBeGreaterThan(0);
  expect(cookies.every((cookie) => cookie.httpOnly && cookie.secure && cookie.sameSite === "Lax")).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("empresti-auth");
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.goto(`${app.url}/login`);
  await expect(page).toHaveURL(`${app.url}/catalogo`);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(`${app.url}/login`);
  expect((await context.cookies()).filter((cookie) => cookie.name.startsWith("empresti-auth"))).toHaveLength(0);
  expect(app.state.logoutRequests).toBe(1);
  await page.goto(`${app.url}/catalogo`);
  await expect(page).toHaveURL(`${app.url}/login`);
});

test("test_ca_02_ca_06_validacao_e_recusa_visiveis_sem_criar_sessao", async ({ page, context, app }) => {
  await page.goto(app.url);
  await page.getByLabel("E-mail").fill("invalido");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
  await expect(page.getByText("Informe sua senha.")).toBeVisible();
  expect(app.state.passwordRequests).toBe(0);
  await page.getByLabel("E-mail").fill(fixtureEmail);
  await page.getByLabel("Senha", { exact: true }).fill("senha-incorreta-da-fixture");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("E-mail ou senha inválidos.");
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeEnabled();
  expect((await context.cookies()).filter((cookie) => cookie.name.startsWith("empresti-auth"))).toHaveLength(0);
});

test("test_ca_06_responsividade_sem_overflow_e_envios_simultaneos_bloqueados", async ({ page, app }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(app.url);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("E-mail").fill(fixtureEmail);
  await page.getByLabel("Senha", { exact: true }).fill(fixturePassword);
  app.state.delay = 500;
  await page.locator("form").evaluate((form: HTMLFormElement) => { form.requestSubmit(); form.requestSubmit(); });
  await expect(page.getByRole("button", { name: "Entrando…" })).toBeDisabled();
  await expect(page).toHaveURL(`${app.url}/catalogo`);
  expect(app.state.passwordRequests).toBe(1);
});

test("test_ca_04_cookie_expirado_e_renovado_no_proxy_sem_perder_autenticacao", async ({ page, context, app }) => {
  await login(page, app.url);
  await page.goto("about:blank");
  const cookie = (await context.cookies()).find((entry) => entry.name === "empresti-auth");
  if (!cookie) throw new Error("Cookie da fixture não encontrado.");
  const session = JSON.parse(Buffer.from(cookie.value.slice(7), "base64url").toString());
  session.expires_at = Math.floor(Date.now() / 1000) - 180;
  const expired = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  await context.addCookies([{ ...cookie, value: expired }]);
  await page.goto(`${app.url}/catalogo`);
  await expect(page.getByRole("heading", { name: "Catálogo", exact: true })).toBeVisible();
  expect(app.state.refreshRequests).toBe(1);
  expect((await context.cookies()).find((entry) => entry.name === "empresti-auth")?.value).not.toBe(expired);
});

test("test_ca_07_mutacao_de_outra_origem_e_input_de_outro_usuario_sao_recusados", async ({ page, context, app }) => {
  await login(page, app.url);
  const forbidden = await context.request.post(`${app.url}/api/trpc/auth.logout`, { headers: { origin: "https://outro.example.test" }, data: { json: {} } });
  expect(forbidden.status()).toBe(403);
  expect((await forbidden.json()).error.json.data.code).toBe("FORBIDDEN");
  expect(app.state.logoutRequests).toBe(0);
  const input = encodeURIComponent(JSON.stringify({ json: { userId: "outra-pessoa" } }));
  const invalid = await context.request.get(`${app.url}/api/trpc/auth.me?input=${input}`);
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).error.json.data.code).toBe("BAD_REQUEST");
});

test("test_ca_03_ca_04_provedor_indisponivel_nao_libera_pagina_protegida", async ({ page, app }) => {
  await login(page, app.url);
  app.state.unavailable = true;
  const response = await page.goto(`${app.url}/catalogo`);
  expect(response?.status()).toBe(503);
  await expect(page.getByText("Não foi possível verificar sua sessão agora. Tente novamente.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tentar novamente" })).toHaveAttribute("href", "/catalogo");
  expect(await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor)).toBe("rgb(5, 7, 15)");
  await expect(page.getByRole("heading", { name: "Catálogo", exact: true })).toHaveCount(0);
});
