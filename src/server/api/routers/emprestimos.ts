import { z } from "zod";
import { listOpenLoans } from "@/server/services/emprestimos";
import { router, tenantProcedure } from "../trpc";

export const emprestimosRouter = router({
  meusAbertos: tenantProcedure.input(z.strictObject({})).query(({ ctx }) =>
    listOpenLoans(ctx.db, ctx.tenantId, ctx.user.id)),
});
