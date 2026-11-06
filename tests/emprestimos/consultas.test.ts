import { afterAll, beforeAll, expect, test } from "vitest";
import { seedInitialData } from "../../prisma/seed";
import { appRouter } from "@/server/api/root";
import { testAuthContext } from "../helpers/auth-context";
import { startTestDatabase } from "../helpers/postgres";
import { makeSeedFixture, professorId, testerId } from "../helpers/seed-fixture";

const outsider = "20000000-0000-4000-8000-000000000001";
const ambiguous = "20000000-0000-4000-8000-000000000002";
const absent = "20000000-0000-4000-8000-000000000003";
let db: Awaited<ReturnType<typeof startTestDatabase>>;
let tenantA: string;

beforeAll(async () => {
  db = await startTestDatabase();
  const { input } = await makeSeedFixture();
  await seedInitialData(db.prisma, input);
  tenantA = (await db.prisma.tenant.findUniqueOrThrow({ where: { slug: "suporte_ti" } })).id;
  const other = await db.prisma.tenant.create({ data: { slug: "tenant_b" } });
  await db.prisma.membership.createMany({ data: [
    { tenantId: other.id, userId: outsider, role: "colaborador" },
    { tenantId: other.id, userId: ambiguous, role: "colaborador" },
    { tenantId: tenantA, userId: ambiguous, role: "colaborador" },
  ] });
  await db.prisma.equipment.create({ data: {
    tenantId: other.id, patrimonio: "TI-0099", nome: "Só no tenant B", categoria: "notebook",
    situacao: "disponivel", photoUrl: "https://fixture.invalid/notebook.jpg", photoSource: { fixture: true },
  } });
}, 180_000);
afterAll(async () => { await db?.close(); }, 45_000);

const caller = (id?: string) => appRouter.createCaller(testAuthContext({
  getDatabase: () => db.prisma,
  user: id ? { id, email: "fixture@example.invalid" } : null,
}));

test("test_ca_01_ca_09_catalogo_lista_itens_do_tenant_e_filtra_disponibilidade", async () => {
  const a = caller(testerId);
  const b = caller(outsider);
  const { itens } = await a.catalogo.listar({});
  expect(itens).toHaveLength(12);
  expect(itens.filter((item) => item.situacao === "manutencao").map((item) => item.patrimonio))
    .toEqual(["TI-0004", "TI-0007", "TI-0010"]);
  expect(itens[0]).toMatchObject({ nome: "Notebook 14 polegadas", categoria: "notebook", photoUrl: expect.stringContaining("/storage/v1/object/public/equipamentos/") });
  expect((await a.catalogo.listar({ disponiveis: true, categoria: "cabo" })).itens.map((item) => item.patrimonio))
    .toEqual(["TI-0008", "TI-0009"]);
  expect((await b.catalogo.listar({})).itens.map((item) => item.patrimonio)).toEqual(["TI-0099"]);
  expect(await a.catalogo.detalhe({ patrimonio: "TI-0001" })).toMatchObject({ patrimonio: "TI-0001" });
  await expect(b.catalogo.detalhe({ patrimonio: "TI-0001" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(a.catalogo.detalhe({ patrimonio: "TI-0099" })).rejects.toMatchObject({ code: "NOT_FOUND" });
});

test("test_ca_08_ca_09_meus_abertos_esconde_emprestimo_de_outra_pessoa_e_tenant", async () => {
  const [openItem, closedItem] = await db.prisma.equipment.findMany({ where: { tenantId: tenantA }, take: 2 });
  const createdAt = new Date("2026-10-01T15:00:00Z");
  const dueAt = new Date("2026-10-20T02:59:00Z");
  const record = { tenantId: tenantA, userId: testerId, createdAt, dueAt };
  const open = await db.prisma.loan.create({ data: { ...record, equipmentId: openItem.id } });
  await db.prisma.loan.create({ data: { ...record, equipmentId: closedItem.id, returnedAt: dueAt } });
  expect(await caller(testerId).emprestimos.meusAbertos({})).toMatchObject({
    limite: 5, itens: [{ id: open.id, dueAt, equipment: { nome: openItem.nome } }],
  });
  expect((await caller(professorId).emprestimos.meusAbertos({})).itens).toEqual([]);
  expect((await caller(outsider).emprestimos.meusAbertos({})).itens).toEqual([]);
});

test("test_ca_09_procedimentos_rejeitam_sessao_sem_vinculo_e_tenant_injetado", async () => {
  await expect(caller().catalogo.listar({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  await expect(caller(absent).catalogo.listar({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(caller(ambiguous).catalogo.listar({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  const forged = { disponiveis: true, tenantId: tenantA };
  await expect(caller(outsider).catalogo.listar(forged)).rejects.toMatchObject({ code: "BAD_REQUEST" });
});
