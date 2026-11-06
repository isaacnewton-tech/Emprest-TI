import type { PrismaClient } from "@prisma/client";
import { MAX_OPEN_LOANS } from "@/shared/loans";
import { isOverdue } from "./calendario";

export async function listOpenLoans(db: PrismaClient, tenantId: string, userId: string, now = new Date()) {
  const rows = await db.loan.findMany({
    where: { tenantId, userId, returnedAt: null },
    select: {
      id: true, dueAt: true, createdAt: true,
      equipment: { select: { nome: true, patrimonio: true, categoria: true } },
    },
    orderBy: [{ dueAt: "asc" }, { id: "asc" }],
  });
  return {
    itens: rows.map((row) => ({ ...row, emAtraso: isOverdue(row.dueAt, now) })),
    limite: MAX_OPEN_LOANS,
  };
}
