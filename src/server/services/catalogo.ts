import type { Prisma, PrismaClient } from "@prisma/client";

const equipmentFields = {
  patrimonio: true, nome: true, categoria: true, situacao: true, photoUrl: true,
} satisfies Prisma.EquipmentSelect;
const pageSize = 12;

export async function listEquipment(db: PrismaClient, tenantId: string, input: {
  categoria?: "notebook" | "monitor" | "cabo" | "camera";
  disponiveis?: boolean;
  cursor?: string | null;
}) {
  const rows = await db.equipment.findMany({
    where: {
      tenantId,
      categoria: input.categoria,
      situacao: input.disponiveis ? "disponivel" : undefined,
      patrimonio: input.cursor ? { gt: input.cursor } : undefined,
    },
    select: equipmentFields,
    orderBy: { patrimonio: "asc" },
    take: pageSize + 1,
  });
  const itens = rows.slice(0, pageSize);
  return { itens, nextCursor: rows.length > pageSize ? itens.at(-1)?.patrimonio : undefined };
}

export function getEquipment(db: PrismaClient, tenantId: string, patrimonio: string) {
  return db.equipment.findUnique({
    where: { tenantId_patrimonio: { tenantId, patrimonio } },
    select: equipmentFields,
  });
}
