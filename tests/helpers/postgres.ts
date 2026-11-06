import { spawnSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

const roles = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO anon, authenticated;
`;

export function localDatabaseUrl(connection: string) {
  const url = new URL(connection);
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Os testes só podem conectar ao PostgreSQL local descartável.");
  }
  return connection;
}

export function databaseEnv(connection: string) {
  const url = localDatabaseUrl(connection);
  return {
    ...process.env,
    DATABASE_URL: url,
    DIRECT_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: "",
  };
}

export async function startTestDatabase({ gatewayRoles = false } = {}) {
  const image = new PostgreSqlContainer("postgres:17-alpine")
    .withDatabase("empresti_teste")
    .withStartupTimeout(90_000);
  if (gatewayRoles) {
    image.withCopyContentToContainer([{ content: roles, target: "/docker-entrypoint-initdb.d/00-roles.sql" }]);
  }
  const container = await image.start();
  try {
    const url = localDatabaseUrl(container.getConnectionUri());
    const migrate = spawnSync(process.execPath, [
      path.resolve("node_modules/prisma/build/index.js"), "migrate", "deploy",
    ], { env: databaseEnv(url), encoding: "utf8", timeout: 60_000, windowsHide: true });
    if (migrate.status !== 0) {
      throw new Error(`Prisma Migrate falhou no PostgreSQL descartável.\n${migrate.stdout}\n${migrate.stderr}`, { cause: migrate.error });
    }
    const prisma = new PrismaClient({ datasourceUrl: url });
    return {
      prisma,
      url,
      async close() {
        try { await prisma.$disconnect(); } finally { await container.stop(); }
      },
    };
  } catch (error) {
    await container.stop();
    throw error;
  }
}
