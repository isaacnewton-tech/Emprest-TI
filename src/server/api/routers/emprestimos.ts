import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { equipmentPatrimonio } from "@/shared/loans";
import { borrowEquipment, listOpenLoans, LoanRefusal } from "@/server/services/emprestimos";
import { router, tenantProcedure } from "../trpc";

export const emprestimosRouter = router({
  meusAbertos: tenantProcedure.input(z.strictObject({})).query(({ ctx }) =>
    listOpenLoans(ctx.db, ctx.tenantId, ctx.user.id)),
  solicitar: tenantProcedure.input(z.strictObject({ patrimonio: equipmentPatrimonio })).mutation(async ({ ctx, input }) => {
    try {
      const result = await borrowEquipment(ctx.db, ctx.tenantId, ctx.user.id, input.patrimonio);
      console.info(JSON.stringify({ event: "emprestimo_criado", request_id: ctx.requestId, tenant_id: ctx.tenantId }));
      return result;
    } catch (error) {
      if (error instanceof LoanRefusal) throw new TRPCError({ code: error.code, message: error.message });
      throw error;
    }
  }),
});
