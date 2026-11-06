import { execFileSync } from "node:child_process";
import { startAuthHarness } from "./auth-harness";
import { fixtureUserId } from "./auth-provider";
import { databaseEnv, startTestDatabase } from "./postgres";
import { makeSeedFixture } from "./seed-fixture";

export async function startLoanHarness() {
  const database = await startTestDatabase();
  try {
    const { input } = await makeSeedFixture();
    execFileSync(process.execPath, [
      "prisma/seed.ts", "--pacote", input.packageDirectory,
      "--professor-id", input.professorId, "--teste-id", fixtureUserId,
    ], {
      env: { ...databaseEnv(database.url), NEXT_PUBLIC_SUPABASE_URL: input.storageOrigin },
      encoding: "utf8",
      timeout: 45_000,
      windowsHide: true,
    });
    const app = await startAuthHarness(database.url);
    return {
      app, prisma: database.prisma,
      async close() {
        try { await app.close(); } finally { await database.close(); }
      },
    };
  } catch (error) {
    await database.close();
    throw error;
  }
}
