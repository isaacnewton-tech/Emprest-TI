import { z } from "zod";
import { loginSchema } from "@/shared/auth";
import { signIn, signOut } from "@/server/services/auth";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const empty = z.object({}).strict();
export const authRouter = router({
  login: publicProcedure.input(loginSchema).mutation(({ ctx, input }) => signIn(ctx.auth, input)),
  me: protectedProcedure.input(empty).query(({ ctx }) => ctx.user),
  logout: protectedProcedure.input(empty).mutation(({ ctx }) => signOut(ctx.auth, ctx.clearSessionCookies)),
});
