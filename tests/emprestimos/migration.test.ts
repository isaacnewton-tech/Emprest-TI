import { cp, mkdir, mkdtemp, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test } from "vitest";
import { seedInitialData } from "../../prisma/seed";
import { deployTestMigrations, startTestDatabase } from "../helpers/postgres";
import { makeSeedFixture, professorId, testerId } from "../helpers/seed-fixture";

let db: Awaited<ReturnType<typeof startTestDatabase>>;
beforeAll(async () => { db = await startTestDatabase({ gatewayRoles: true }); }, 180_000);
afterAll(async () => { await db?.close(); }, 45_000);

test("test_ca_02_ca_07_ca_09_fk_unicidade_e_rls_protegem_o_emprestimo", async () => {
  const { input } = await makeSeedFixture();
  await seedInitialData(db.prisma, input);
  const tenant = await db.prisma.tenant.findUniqueOrThrow({ where: { slug: "suporte_ti" } });
  const otherTenant = await db.prisma.tenant.create({ data: { slug: "outro" } });
  const outsider = "10000000-0000-4000-8000-000000000003";
  await db.prisma.membership.create({ data: { tenantId: otherTenant.id, userId: outsider, role: "colaborador" } });
  const item = await db.prisma.equipment.findFirstOrThrow({ where: { tenantId: tenant.id } });
  const createdAt = new Date("2026-11-05T15:00:00Z");
  const data = { tenantId: tenant.id, userId: professorId, equipmentId: item.id, createdAt, dueAt: new Date("2026-11-27T02:59:00Z") };
  const loan = await db.prisma.loan.create({ data });
  await expect(db.prisma.loan.create({ data: { ...data, userId: testerId } })).rejects.toMatchObject({ code: "P2002" });
  await expect(db.prisma.loan.create({ data: { ...data, tenantId: otherTenant.id, userId: outsider } })).rejects.toMatchObject({ code: "P2003" });
  const asUser = (userId: string) => db.prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL ROLE authenticated`;
    await tx.$queryRaw`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`;
    return tx.loan.findUnique({ where: { id: loan.id } });
  });
  expect(await asUser(professorId)).toMatchObject({ id: loan.id });
  expect(await asUser(testerId)).toBeNull();
  expect(await asUser(outsider)).toBeNull();
  const event = await db.prisma.auditEvent.create({
    data: { tenantId: tenant.id, actorId: professorId, action: "emprestimo.criado", resourceId: loan.id, createdAt },
  });
  await expect(db.prisma.auditEvent.delete({ where: { id: event.id } })).rejects.toThrow();
  expect(await db.prisma.auditEvent.findUnique({ where: { id: event.id } })).toEqual(event);
  const [grants] = await db.prisma.$queryRaw<{ write_loan: boolean; read_audit: boolean }[]>`
    SELECT has_table_privilege('authenticated', 'loans', 'INSERT, UPDATE, DELETE') AS write_loan,
      has_table_privilege('authenticated', 'audit_events', 'SELECT') AS read_audit
  `;
  expect(grants).toEqual({ write_loan: false, read_audit: false });
}, 45_000);

test("test_ca_01_ca_03_migracao_preserva_dados_iniciais_ja_aplicados", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "empresti-schema-inicial-"));
  const schemaFile = path.join(directory, "schema.prisma");
  const firstMigration = "20261106000031_dados_iniciais";
  await mkdir(path.join(directory, "migrations"));
  await copyFile("prisma/schema.prisma", schemaFile);
  await copyFile("prisma/migrations/migration_lock.toml", path.join(directory, "migrations/migration_lock.toml"));
  await cp(path.join("prisma/migrations", firstMigration), path.join(directory, "migrations", firstMigration), { recursive: true });
  const initial = await startTestDatabase({ schemaFile });
  try {
    const { input } = await makeSeedFixture();
    await seedInitialData(initial.prisma, input);
    const before = await initial.prisma.equipment.findMany({ orderBy: { patrimonio: "asc" } });
    deployTestMigrations(initial.url);
    expect(await initial.prisma.equipment.findMany({ orderBy: { patrimonio: "asc" } })).toEqual(before);
    expect(await initial.prisma.loan.count()).toBe(0);
    expect(await initial.prisma.membership.count()).toBe(2);
  } finally {
    await initial.close();
  }
}, 180_000);
