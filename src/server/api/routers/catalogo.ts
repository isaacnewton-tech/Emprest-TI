import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { equipmentCategory, equipmentPatrimonio } from "@/shared/loans";
import { getEquipment, listEquipment } from "@/server/services/catalogo";
import { router, tenantProcedure } from "../trpc";

export const catalogoRouter = router({
  listar: tenantProcedure.input(z.strictObject({
    categoria: equipmentCategory.optional(),
    disponiveis: z.boolean().optional(),
    cursor: equipmentPatrimonio.nullish(),
    direction: z.literal("forward").optional(),
  })).query(({ ctx, input }) => listEquipment(ctx.db, ctx.tenantId, input)),
  detalhe: tenantProcedure.input(z.strictObject({ patrimonio: equipmentPatrimonio })).query(async ({ ctx, input }) => {
    const item = await getEquipment(ctx.db, ctx.tenantId, input.patrimonio);
    if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Equipamento não encontrado." });
    return item;
  }),
});
