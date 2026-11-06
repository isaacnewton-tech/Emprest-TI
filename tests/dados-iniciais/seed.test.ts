import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, expect, test } from "vitest";
import { seedInitialData } from "../../prisma/seed";
import inventory from "../../skills/imagens-equipamentos/assets/equipamentos.json";
import { startTestDatabase } from "../helpers/postgres";
import { fixtureOrigin, hashImage, makeSeedFixture, professorId, testerId } from "../helpers/seed-fixture";

let database: Awaited<ReturnType<typeof startTestDatabase>>;
beforeAll(async () => { database = await startTestDatabase(); }, 180_000);
afterAll(async () => { await database?.close(); }, 45_000);

test("test_ca_01_ca_02_ca_03_ca_04_seed_exato_idempotente_e_preserva_itens_usados", async () => {
  const { prisma } = database;
  const { input, manifest } = await makeSeedFixture();
  const first = await seedInitialData(prisma, input);
  expect(first).toEqual({
    tenant: "suporte_ti",
    equipamentos: { criados: inventory.map((item) => item.patrimonio), sincronizados: [], preservados: [] },
    vinculosColaborador: 2,
    emprestimosCriados: 0,
  });
  expect(await prisma.tenant.count()).toBe(1);
  const rows = await prisma.equipment.findMany({ orderBy: { patrimonio: "asc" } });
  expect(rows).toHaveLength(12);
  expect(rows.filter((row) => row.situacao === "manutencao").map((row) => row.patrimonio))
    .toEqual(["TI-0004", "TI-0007", "TI-0010"]);
  for (const [i, row] of rows.entries()) {
    const { patrimonio, nome, categoria, situacao } = inventory[i];
    expect(row).toMatchObject({ patrimonio, nome, categoria, situacao, firstUsedAt: null });
    expect(row.photoUrl).toBe(fixtureOrigin + "/storage/v1/object/public/equipamentos/suporte_ti/" + patrimonio + ".jpg");
    expect(row.photoSource).toMatchObject({
      source: "pixabay", sourcePage: manifest.images[i].sourcePage, imageSha256: manifest.images[i].imageSha256,
      photographer: "Fixture", credit: "Fotos: Pixabay", license: "Pixabay Content License",
    });
  }
  expect(await prisma.membership.findMany({ orderBy: { userId: "asc" } })).toEqual([
    { tenantId: rows[0].tenantId, userId: professorId, role: "colaborador" },
    { tenantId: rows[0].tenantId, userId: testerId, role: "colaborador" },
  ]);
  const [{ total }] = await prisma.$queryRaw<{ total: number }[]>`
    SELECT count(*)::int AS total FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%loan%'
  `;
  expect(total).toBe(0);

  const used = await prisma.equipment.update({
    where: { id: rows[0].id },
    data: {
      nome: "Equipamento já usado", categoria: "monitor", situacao: "manutencao",
      photoUrl: "https://fixture.invalid/foto-preservada.jpg", photoSource: { existing: true },
      firstUsedAt: new Date("2026-11-05T14:00:00Z"),
    },
  });
  await prisma.equipment.update({
    where: { id: rows[1].id },
    data: { nome: "Mudança em item nunca usado", situacao: "manutencao", photoSource: { stale: true } },
  });
  const second = await seedInitialData(prisma, input);
  expect(second.equipamentos).toEqual({
    criados: [], sincronizados: inventory.slice(1).map((item) => item.patrimonio), preservados: ["TI-0001"],
  });
  expect(await prisma.equipment.findUnique({ where: { id: used.id } })).toEqual(used);
  expect(await prisma.equipment.findUnique({ where: { id: rows[1].id } })).toEqual(rows[1]);
  expect(await prisma.tenant.count()).toBe(1);
  expect(await prisma.membership.count()).toBe(2);
  expect(await prisma.equipment.count()).toBe(12);
});

test("test_ca_03_lote_incompleto_origem_errada_e_hash_invalido_falham_antes_de_escrever", async () => {
  const { prisma } = database;
  const before = await prisma.membership.count();
  const { input, manifest, writeManifest } = await makeSeedFixture();
  const otherInput = { ...input, professorId: "20000000-0000-4000-8000-000000000001" };
  const missing = manifest.images.pop()!;
  await writeManifest();
  await expect(seedInitialData(prisma, otherInput)).rejects.toThrow("Manifesto inválido");

  manifest.images.push(missing);
  const source = manifest.images[0].sourcePage;
  manifest.images[0].sourcePage = "https://pixabay.com.example.invalid/photos/fixture-1001/";
  await writeManifest();
  await expect(seedInitialData(prisma, otherInput)).rejects.toThrow("origem fora do Pixabay");

  manifest.images[0].sourcePage = source;
  manifest.images[0].imageSha256 = "a".repeat(64);
  await writeManifest();
  await expect(seedInitialData(prisma, otherInput)).rejects.toThrow("SHA-256");

  const wrongSize = await sharp({ create: { width: 400, height: 300, channels: 3, background: "red" } }).jpeg().toBuffer();
  manifest.images[0].imageSha256 = hashImage(wrongSize);
  await writeFile(path.join(input.packageDirectory, manifest.images[0].storageKey), wrongSize);
  await writeManifest();
  await expect(seedInitialData(prisma, otherInput)).rejects.toThrow("JPEG 800×600");
  expect(await prisma.membership.count()).toBe(before);
  expect(await prisma.membership.count({ where: { userId: otherInput.professorId } })).toBe(0);
});

test("test_ca_04_vinculo_com_papel_incompativel_cancela_seed_sem_mudar_permissoes", async () => {
  const { prisma } = database;
  const { input } = await makeSeedFixture();
  const tenant = await prisma.tenant.upsert({
    where: { slug: "suporte_ti" }, create: { slug: "suporte_ti" }, update: {},
  });
  const operator = "30000000-0000-4000-8000-000000000001";
  const otherId = "30000000-0000-4000-8000-000000000002";
  const current = await prisma.membership.create({
    data: { tenantId: tenant.id, userId: operator, role: "operacoes" },
  });
  await expect(seedInitialData(prisma, { ...input, professorId: operator, testerId: otherId }))
    .rejects.toThrow("papel diferente de Colaborador");
  expect(await prisma.membership.findMany({ where: { userId: { in: [operator, otherId] } } })).toEqual([current]);
});
