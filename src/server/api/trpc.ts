import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TRPCContext } from "./context";

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

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
  if (type === "mutation" && !hasSameOrigin(ctx.request)) throw new TRPCError({ code: "FORBIDDEN", message: "Origem da requisição não permitida." });
  return next();
});

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.getIdentity();
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Entre na sua conta para continuar." });
  return next({ ctx: { ...ctx, user } });
});
