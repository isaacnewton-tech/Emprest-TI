import { Prisma, type PrismaClient } from "@prisma/client";
import { MAX_OPEN_LOANS } from "@/shared/loans";
import { isOverdue, loanDeadline } from "./calendario";

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

type RefusalCode = "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "PRECONDITION_FAILED";

export class LoanRefusal extends Error {
  constructor(readonly code: RefusalCode, message: string) { super(message); }
}

const unavailable = () => new LoanRefusal("CONFLICT", "Este equipamento não está mais disponível.");

export async function borrowEquipment(db: PrismaClient, tenantId: string, userId: string, patrimonio: string, clock = () => new Date()) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const links = await tx.membership.findMany({ where: { userId }, select: { tenantId: true }, take: 2 });
        if (links.length !== 1 || links[0].tenantId !== tenantId) {
          throw new LoanRefusal("FORBIDDEN", "Sua conta precisa de um vínculo com o catálogo.");
        }
        const item = await tx.equipment.findUnique({
          where: { tenantId_patrimonio: { tenantId, patrimonio } },
          select: { id: true, nome: true, situacao: true, firstUsedAt: true },
        });
        if (!item) throw new LoanRefusal("NOT_FOUND", "Equipamento não encontrado.");
        if (item.situacao === "manutencao") {
          throw new LoanRefusal("PRECONDITION_FAILED", "Este equipamento está em manutenção.");
        }
        if (item.situacao !== "disponivel") throw unavailable();

        const createdAt = clock();
        const open = { tenantId, userId, returnedAt: null };
        const overdue = await tx.loan.findFirst({ where: { ...open, dueAt: { lt: createdAt } }, select: { id: true } });
        if (overdue) throw new LoanRefusal("PRECONDITION_FAILED", "Você tem um empréstimo em atraso.");
        if (await tx.loan.count({ where: open }) >= MAX_OPEN_LOANS) {
          throw new LoanRefusal("PRECONDITION_FAILED", "Você atingiu o limite de 5 empréstimos em aberto.");
        }

        const dueAt = loanDeadline(createdAt);
        const changed = await tx.equipment.updateMany({
          where: { id: item.id, tenantId, situacao: "disponivel" },
          data: { situacao: "emprestado", firstUsedAt: item.firstUsedAt ?? createdAt },
        });
        if (changed.count !== 1) throw unavailable();
        const loan = await tx.loan.create({
          data: { tenantId, userId, equipmentId: item.id, createdAt, dueAt },
          select: { id: true, createdAt: true, dueAt: true },
        });
        await tx.auditEvent.create({
          data: { tenantId, actorId: userId, action: "emprestimo.criado", resourceId: loan.id, createdAt },
        });
        return { ...loan, patrimonio, nome: item.nome };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === "P2002") throw unavailable();
      if (error.code !== "P2034") throw error;
    }
  }
  throw new LoanRefusal("CONFLICT", "O catálogo mudou durante a solicitação. Atualize a página e tente novamente.");
}
