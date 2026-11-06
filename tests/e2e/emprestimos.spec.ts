import path from "node:path";
import { test as base, expect } from "@playwright/test";
import { fixtureEmail, fixturePassword, fixtureUserId } from "../helpers/auth-provider";
import { startLoanHarness } from "../helpers/loan-harness";
import { fixtureOrigin, professorId } from "../helpers/seed-fixture";

const test = base.extend<Record<never, never>, { harness: Awaited<ReturnType<typeof startLoanHarness>> }>({
  harness: [async ({}, provide) => {
    const harness = await startLoanHarness();
    try { await provide(harness); } finally { await harness.close(); }
  }, { scope: "worker", timeout: 180_000 }],
});

test("test_ca_01_ca_02_ca_03_ca_05_ca_06_ca_08_ca_09_ca_10_catalogo_confirmacao_e_meus_emprestimos", async ({ page, context, harness }, info) => {
  test.setTimeout(90_000);
  const { app, prisma } = harness;
  await page.route(fixtureOrigin + "/storage/**", async (route) => {
    const name = path.posix.basename(new URL(route.request().url()).pathname);
    if (!/^TI-\d{4}\.jpg$/.test(name)) return route.abort();
    await route.fulfill({
      path: path.join("docs/verificacoes/004-imagens-equipamentos/lote-final", name),
      contentType: "image/jpeg",
    });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(app.url + "/meus-emprestimos");
  await expect(page).toHaveURL(app.url + "/login");
  await page.getByLabel("E-mail").fill(fixtureEmail);
  await page.getByLabel("Senha", { exact: true }).fill(fixturePassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(app.url + "/catalogo");
  const grid = page.getByRole("list", { name: "Equipamentos" });
  await expect(grid.getByRole("listitem")).toHaveCount(12);
  await expect(grid.getByRole("img")).toHaveCount(12);
  await expect(page.getByRole("link", { name: "Fotos: Pixabay" })).toHaveAttribute("href", "https://pixabay.com/");
  const maintenance = grid.getByRole("listitem").filter({ hasText: "Em manutenção" });
  await expect(maintenance).toHaveCount(3);
  await expect(maintenance.getByRole("link")).toHaveCount(0);
  await expect.poll(() => grid.getByRole("img").first().evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 800)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await page.screenshot({ path: info.outputPath("catalogo-desktop.png") });

  const requestLoan = (patrimonio: string) => context.request.post(app.url + "/api/trpc/emprestimos.solicitar", {
    headers: { origin: app.url }, data: { json: { patrimonio } },
  });
  const invalid = await requestLoan("TI-0004");
  expect(invalid.status()).toBe(412);
  expect((await invalid.json()).error.json).toMatchObject({ message: expect.stringContaining("manutenção"), data: { code: "PRECONDITION_FAILED" } });
  await page.getByLabel("Só disponíveis").check();
  await expect(grid.getByRole("listitem")).toHaveCount(9);
  await page.getByLabel("Só disponíveis").uncheck();
  await expect(grid.getByRole("listitem")).toHaveCount(12);
  await page.getByRole("link", { name: "Meus empréstimos", exact: true }).click();
  await expect(page.getByText("Você não tem empréstimos em aberto.")).toBeVisible();
  await page.getByRole("link", { name: "Ver catálogo" }).click();
  await page.getByRole("link", { name: "Ver detalhes de TI-0001", exact: true }).click();
  const requestButton = page.getByRole("button", { name: "Solicitar empréstimo" });
  await expect(requestButton).toBeEnabled();
  await requestButton.click();
  const dialog = page.getByRole("dialog", { name: "Confirmar empréstimo" });
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: info.outputPath("confirmacao-desktop.png") });
  const mutation = page.waitForResponse((response) => response.url().includes("/api/trpc/emprestimos.solicitar"));
  await dialog.getByRole("button", { name: "Confirmar empréstimo" }).click();
  const accepted = await mutation;
  expect(accepted.status()).toBe(200);
  expect((await accepted.json())[0].result.data.json).toMatchObject({ patrimonio: "TI-0001", dueAt: expect.any(String) });
  await expect(page).toHaveURL(app.url + "/meus-emprestimos");
  const loan = await prisma.loan.findFirstOrThrow({ where: { userId: fixtureUserId } });
  await expect(page.getByText("Notebook 14 polegadas")).toBeVisible();
  await expect(page.locator("time")).toHaveAttribute("datetime", loan.dueAt.toISOString());
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("meus-emprestimos-mobile.png") });
  expect(await prisma.loan.count({ where: { userId: professorId } })).toBe(0);

  await page.getByRole("link", { name: "Catálogo", exact: true }).click();
  await expect(grid.getByRole("listitem").filter({ hasText: "TI-0001" })).toContainText("Emprestado");
  await expect(grid.getByRole("link", { name: "Ver detalhes de TI-0001", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole("link", { name: "Ver detalhes de TI-0002", exact: true }).click();
  await expect(requestButton).toBeEnabled();
  await requestButton.click();
  await expect(dialog).toBeInViewport({ ratio: 1 });
  const staleItem = await prisma.equipment.update({
    where: { tenantId_patrimonio: { tenantId: loan.tenantId, patrimonio: "TI-0002" } },
    data: { situacao: "emprestado" },
  });
  const rejected = page.waitForResponse((response) => response.url().includes("/api/trpc/emprestimos.solicitar"));
  await dialog.getByRole("button", { name: "Confirmar empréstimo" }).click();
  const conflict = await rejected;
  expect(conflict.status()).toBe(409);
  expect((await conflict.json())[0].error.json.data.code).toBe("CONFLICT");
  await expect(dialog.getByRole("alert")).toContainText("não está mais disponível");
  await expect(dialog.getByRole("button", { name: "Confirmar empréstimo" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await prisma.equipment.update({ where: { id: staleItem.id }, data: { situacao: "disponivel" } });

  const extra = await prisma.equipment.findMany({
    where: { tenantId: loan.tenantId, situacao: "disponivel", patrimonio: { not: "TI-0012" } }, take: 4, orderBy: { patrimonio: "asc" },
  });
  const now = Date.now();
  await prisma.loan.createMany({ data: extra.map((item) => ({
    tenantId: loan.tenantId, userId: fixtureUserId, equipmentId: item.id,
    createdAt: new Date(now - 86_400_000), dueAt: new Date(now + 86_400_000),
  })) });
  await prisma.equipment.updateMany({ where: { id: { in: extra.map((item) => item.id) } }, data: { situacao: "emprestado" } });
  await page.goto(app.url + "/catalogo/TI-0012");
  await expect(page.getByText("Você atingiu o limite de 5 empréstimos em aberto.")).toBeVisible();
  await expect(requestButton).toBeDisabled();
  const tooMany = await requestLoan("TI-0012");
  expect(tooMany.status()).toBe(412);
  expect((await tooMany.json()).error.json).toMatchObject({ message: expect.stringContaining("limite de 5"), data: { code: "PRECONDITION_FAILED" } });
  await prisma.loan.updateMany({
    where: { tenantId: loan.tenantId, userId: fixtureUserId, equipmentId: extra[0].id },
    data: { dueAt: new Date(now - 60_000) },
  });
  await page.reload();
  await expect(page.getByText("Você tem um empréstimo em atraso.")).toBeVisible();
  await expect(requestButton).toBeDisabled();
  const late = await requestLoan("TI-0012");
  expect(late.status()).toBe(412);
  expect((await late.json()).error.json).toMatchObject({ message: expect.stringContaining("atraso"), data: { code: "PRECONDITION_FAILED" } });
  expect(await prisma.loan.count({ where: { userId: fixtureUserId } })).toBe(5);
});
