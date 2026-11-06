import "server-only";
import { PrismaClient } from "@prisma/client";

const globalDatabase = globalThis as typeof globalThis & { emprestiDatabase?: PrismaClient };

export function getDatabase() {
  return globalDatabase.emprestiDatabase ??= new PrismaClient();
}
