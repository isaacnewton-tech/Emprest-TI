import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TRPCContext } from "./context";
import { hasSameOrigin, requestOrigin } from "@/server/http/origin";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message: error.code === "INTERNAL_SERVER_ERROR" ? "Não foi possível concluir a operação." : error.code === "BAD_REQUEST" ? "Dados inválidos." : shape.message,
      data: { code: shape.data.code, httpStatus: shape.data.httpStatus, path: shape.data.path },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure.use(({ ctx, type, next }) => {
  if (type === "mutation" && !hasSameOrigin(ctx.request)) {
    let origin: string | null = null;
    let expected: string | null = null;
    try { origin = new URL(ctx.request.headers.get("origin") ?? "").origin; } catch { /* Não registrar cabeçalho inválido. */ }
    try { expected = requestOrigin(ctx.request); } catch { /* Host inválido não é copiado para o log. */ }
    console.warn(JSON.stringify({ event: "auth_origin_rejected", request_id: ctx.requestId, tenant_id: null, expected_origin: expected, received_origin: origin }));
    throw new TRPCError({ code: "FORBIDDEN", message: "Origem da requisição não permitida." });
  }
  return next();
});

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.getIdentity();
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Entre na sua conta para continuar." });
  return next({ ctx: { ...ctx, user } });
});

export const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const membership = await ctx.getTenant(ctx.user.id);
  if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Sua conta precisa de um vínculo com o catálogo." });
  return next({ ctx: { ...ctx, ...membership, db: ctx.getDatabase() } });
});
