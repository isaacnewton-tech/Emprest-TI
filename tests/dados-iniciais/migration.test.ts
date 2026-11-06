import type { Prisma } from "@prisma/client";
import { afterAll, beforeAll, expect, test } from "vitest";
import { startTestDatabase } from "../helpers/postgres";

let database: Awaited<ReturnType<typeof startTestDatabase>>;
const userA = "00000000-0000-4000-8000-000000000001";
const userB = "00000000-0000-4000-8000-000000000002";
const withoutMembership = "00000000-0000-4000-8000-000000000003";

beforeAll(async () => { database = await startTestDatabase({ gatewayRoles: true }); }, 180_000);
afterAll(async () => { await database?.close(); }, 45_000);

async function authenticated<T>(user: string, operation: (tx: Prisma.TransactionClient) => Promise<T>) {
  return database.prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL ROLE authenticated`;
    await tx.$queryRaw`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: user })}, true)`;
    return operation(tx);
  });
}

test("test_ca_05_politicas_bloqueiam_os_mesmos_registros_para_outro_tenant", async () => {
  const { prisma } = database;
  const a = await prisma.tenant.create({ data: { slug: "fixture_a" } });
  const b = await prisma.tenant.create({ data: { slug: "fixture_b" } });
  await prisma.membership.createMany({ data: [
    { userId: userA, tenantId: a.id, role: "colaborador" },
    { userId: userB, tenantId: b.id, role: "colaborador" },
  ] });
  const item = await prisma.equipment.create({ data: {
    tenantId: a.id, patrimonio: "TI-0001", nome: "Fixture", categoria: "notebook",
    situacao: "disponivel", photoUrl: "https://fixture.invalid/foto.jpg", photoSource: { fixture: true },
  } });
  const readA = (tx: Prisma.TransactionClient) => Promise.all([
    tx.tenant.findUnique({ where: { id: a.id } }),
    tx.membership.findUnique({ where: { userId_tenantId: { userId: userA, tenantId: a.id } } }),
    tx.equipment.findUnique({ where: { id: item.id } }),
  ]);
  expect(await authenticated(userA, readA)).toMatchObject([
    { id: a.id }, { userId: userA, tenantId: a.id }, { id: item.id },
  ]);
  expect(await authenticated(userB, readA)).toEqual([null, null, null]);
  expect(await authenticated(withoutMembership, readA)).toEqual([null, null, null]);
});

test("test_ca_05_nega_leitura_anonima_e_escrita_autenticada_mesmo_com_grants_padrao", async () => {
  const access = await database.prisma.$queryRaw<{ name: string; anon_read: boolean; user_write: boolean }[]>`
    SELECT name, has_table_privilege('anon', name, 'SELECT') AS anon_read,
      has_table_privilege('authenticated', name, 'INSERT, UPDATE, DELETE') AS user_write
    FROM unnest(ARRAY['public.tenants', 'public.memberships', 'public.equipment']) AS relations(name)
  `;
  expect(access).toHaveLength(3);
  expect(access.every(({ anon_read, user_write }) => !anon_read && !user_write)).toBe(true);
  const [historyAccess] = await database.prisma.$queryRaw<{ anon_read: boolean; user_read: boolean }[]>`
    SELECT has_table_privilege('anon', 'public._prisma_migrations', 'SELECT') AS anon_read,
      has_table_privilege('authenticated', 'public._prisma_migrations', 'SELECT') AS user_read
  `;
  expect(historyAccess).toEqual({ anon_read: false, user_read: false });
});
