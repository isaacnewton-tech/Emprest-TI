import { spawnSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { databaseEnv, startTestDatabase } from "../helpers/postgres";
import { fixtureOrigin, makeSeedFixture, professorId, testerId } from "../helpers/seed-fixture";

let database: Awaited<ReturnType<typeof startTestDatabase>>;
let fixture: Awaited<ReturnType<typeof makeSeedFixture>>;
test.describe.configure({ timeout: 180_000 });
test.beforeAll(async () => {
  fixture = await makeSeedFixture();
  database = await startTestDatabase();
});
test.afterAll(async () => { await database?.close(); });

function runSeed({ testUser = testerId, directUrl = database.url, flags = [] as string[] } = {}) {
  return spawnSync(process.execPath, [
    "prisma/seed.ts", "--pacote", fixture.input.packageDirectory,
    "--professor-id", professorId, "--teste-id", testUser, ...flags,
  ], {
    encoding: "utf8",
    env: { ...databaseEnv(database.url), DIRECT_URL: directUrl, NEXT_PUBLIC_SUPABASE_URL: fixtureOrigin },
    timeout: 30_000,
    windowsHide: true,
  });
}

test("test_ca_03_ca_04_cli_aplica_lote_e_retorna_resumo_sem_identidades", async () => {
  const result = runSeed();
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toMatchObject({
    tenant: "suporte_ti",
    equipamentos: { criados: expect.arrayContaining(["TI-0001", "TI-0012"]), preservados: [], sincronizados: [] },
    vinculosColaborador: 2,
    emprestimosCriados: 0,
  });
  expect(result.stdout).not.toContain(professorId);
  expect(result.stdout).not.toContain(testerId);
  expect(await database.prisma.equipment.count()).toBe(12);
  expect(await database.prisma.membership.count({ where: { userId: professorId, role: "colaborador" } })).toBe(1);
});

test("test_ca_04_cli_recusa_uuids_iguais_e_argumento_de_senha", () => {
  const duplicate = runSeed({ testUser: professorId });
  expect(duplicate.status).toBe(1);
  expect(duplicate.stderr).toContain("dois UUIDs distintos");
  const passwordArgument = runSeed({ flags: ["--senha", "sentinela-apenas-do-teste"] });
  expect(passwordArgument.status).toBe(1);
  expect(passwordArgument.stderr).toContain("Uso: npm run db:seed");
  expect(passwordArgument.stdout + passwordArgument.stderr).not.toContain("sentinela-apenas-do-teste");
});

test("test_ca_06_cli_exige_execucao_humana_explicita_e_recusa_outro_projeto", () => {
  const url = "postgresql://postgres:sentinela-local@remoto.invalid:5432/postgres?sslmode=require";
  const withoutConsent = runSeed({ directUrl: url });
  expect(withoutConsent.status).toBe(1);
  expect(withoutConsent.stderr).toContain("Conexão remota exige --confirmar-producao");
  const otherProject = runSeed({ directUrl: url, flags: ["--confirmar-producao"] });
  expect(otherProject.status).toBe(1);
  expect(otherProject.stderr).toContain("do mesmo projeto Supabase");
  expect(withoutConsent.stderr + otherProject.stderr).not.toContain("sentinela-local");
});
