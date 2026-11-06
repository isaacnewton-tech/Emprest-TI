import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, test } from "vitest";
import { appRouter } from "@/server/api/root";
import { borrowEquipment } from "@/server/services/emprestimos";
import { testAuthContext } from "../helpers/auth-context";
import { startTestDatabase } from "../helpers/postgres";

let db: Awaited<ReturnType<typeof startTestDatabase>>;
beforeAll(async () => { db = await startTestDatabase(); }, 180_000);
afterAll(async () => { await db?.close(); }, 45_000);

const caller = (id: string) => appRouter.createCaller(testAuthContext({
  getDatabase: () => db.prisma, user: { id, email: "teste@example.invalid" },
}));

async function scenario(firstNumber = 1) {
  const tenant = await db.prisma.tenant.create({ data: { slug: randomUUID() } });
  const users = [randomUUID(), randomUUID()];
  await db.prisma.membership.createMany({ data: users.map((userId) => ({ tenantId: tenant.id, userId, role: "colaborador" })) });
  const items = await db.prisma.equipment.createManyAndReturn({ data: Array.from({ length: 8 }, (_, index) => ({
    tenantId: tenant.id, patrimonio: "TI-" + String(firstNumber + index).padStart(4, "0"),
    nome: "Fixture " + index, categoria: "notebook", situacao: index === 7 ? "manutencao" : "disponivel",
    photoUrl: "https://fixture.invalid/item.jpg", photoSource: { fixture: true },
  })) });
  items.sort((a, b) => a.patrimonio.localeCompare(b.patrimonio));
  return { tenantId: tenant.id, users, items };
}

async function openFixture(s: Awaited<ReturnType<typeof scenario>>, count: number, overdue = false) {
  const now = Date.now();
  const createdAt = new Date(now - 86_400_000);
  const dueAt = new Date(now + (overdue ? -60_000 : 86_400_000));
  await db.prisma.loan.createMany({ data: s.items.slice(0, count).map((item) => ({
    tenantId: s.tenantId, equipmentId: item.id, userId: s.users[0], createdAt, dueAt,
  })) });
  await db.prisma.equipment.updateMany({ where: { id: { in: s.items.slice(0, count).map((item) => item.id) } }, data: {
    situacao: "emprestado", firstUsedAt: createdAt,
  } });
}

test("test_ca_02_ca_03_ca_04_criacao_imediata_com_prazo_primeiro_uso_e_auditoria", async () => {
  const s = await scenario();
  const now = new Date("2026-11-05T15:00:00Z");
  const item = s.items[0];
  const loan = await borrowEquipment(db.prisma, s.tenantId, s.users[0], item.patrimonio, () => now);
  expect(loan.dueAt.toISOString()).toBe("2026-11-27T02:59:00.000Z");
  expect(await db.prisma.loan.findUnique({ where: { id: loan.id } })).toMatchObject({ userId: s.users[0], equipmentId: item.id, returnedAt: null });
  expect(await db.prisma.equipment.findUnique({ where: { id: item.id } })).toMatchObject({ situacao: "emprestado", firstUsedAt: now });
  expect(await db.prisma.auditEvent.findFirst({ where: { tenantId: s.tenantId } })).toMatchObject({
    actorId: s.users[0], action: "emprestimo.criado", resourceId: loan.id,
  });
  const client = caller(s.users[1]);
  await expect(client.emprestimos.solicitar({ patrimonio: item.patrimonio })).rejects.toMatchObject({ code: "CONFLICT" });
  await expect(client.emprestimos.solicitar({ patrimonio: s.items[7].patrimonio })).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: expect.stringContaining("manutenção") });
  expect(await db.prisma.loan.count({ where: { tenantId: s.tenantId } })).toBe(1);
});

test("test_ca_03_indice_reverte_situacao_e_primeiro_uso_ao_falhar_insercao", async () => {
  const s = await scenario();
  const item = s.items[0];
  await db.prisma.loan.create({ data: {
    tenantId: s.tenantId, equipmentId: item.id, userId: s.users[1],
    createdAt: new Date("2026-11-05T12:00:00Z"), dueAt: new Date("2026-11-06T12:00:00Z"),
  } });
  await expect(caller(s.users[0]).emprestimos.solicitar({ patrimonio: item.patrimonio })).rejects.toMatchObject({ code: "CONFLICT" });
  expect(await db.prisma.equipment.findUnique({ where: { id: item.id } })).toMatchObject({ situacao: "disponivel", firstUsedAt: null });
  expect(await db.prisma.loan.count({ where: { tenantId: s.tenantId } })).toBe(1);
  expect(await db.prisma.auditEvent.count({ where: { tenantId: s.tenantId } })).toBe(0);
});

test("test_ca_05_ca_07_concorrencia_por_itens_distintos_respeita_o_quinto_e_recusa_o_sexto", async () => {
  const s = await scenario();
  await openFixture(s, 4);
  const client = caller(s.users[0]);
  const requests = s.items.slice(4, 6).map((item) => client.emprestimos.solicitar({ patrimonio: item.patrimonio }));
  const results = await Promise.allSettled(requests);
  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  expect(results.find((result) => result.status === "rejected")).toMatchObject({ reason: { code: "PRECONDITION_FAILED", message: expect.stringContaining("limite de 5") } });
  expect(await db.prisma.loan.count({ where: { tenantId: s.tenantId, userId: s.users[0], returnedAt: null } })).toBe(5);
  expect(await db.prisma.auditEvent.count({ where: { tenantId: s.tenantId } })).toBe(1);
});

test("test_ca_06_atraso_bloqueia_mesmo_abaixo_do_limite", async () => {
  const s = await scenario();
  await openFixture(s, 1, true);
  await expect(caller(s.users[0]).emprestimos.solicitar({ patrimonio: s.items[1].patrimonio }))
    .rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: expect.stringContaining("atraso") });
  expect(await db.prisma.loan.count({ where: { tenantId: s.tenantId } })).toBe(1);
});

test("test_ca_07_dois_usuarios_no_mesmo_item_confirmam_um_unico_emprestimo", async () => {
  const s = await scenario();
  const item = s.items[0];
  const results = await Promise.allSettled(s.users.map((id) => caller(id).emprestimos.solicitar({ patrimonio: item.patrimonio })));
  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  expect(results.find((result) => result.status === "rejected")).toMatchObject({ reason: { code: "CONFLICT" } });
  expect(await db.prisma.loan.count({ where: { tenantId: s.tenantId, equipmentId: item.id } })).toBe(1);
});

test("test_ca_09_mutacao_de_outro_tenant_nao_encontra_nem_altera_equipamento", async () => {
  const a = await scenario();
  const b = await scenario(20);
  await expect(caller(b.users[0]).emprestimos.solicitar({ patrimonio: a.items[0].patrimonio })).rejects.toMatchObject({ code: "NOT_FOUND" });
  const forged = { patrimonio: a.items[0].patrimonio, tenantId: a.tenantId, userId: a.users[0] };
  await expect(caller(b.users[0]).emprestimos.solicitar(forged)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(await db.prisma.equipment.findUnique({ where: { id: a.items[0].id } })).toMatchObject({ situacao: "disponivel", firstUsedAt: null });
  expect(await db.prisma.loan.count({ where: { tenantId: { in: [a.tenantId, b.tenantId] } } })).toBe(0);
});
