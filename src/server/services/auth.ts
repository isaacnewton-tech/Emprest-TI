import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import type { loginSchema } from "@/shared/auth";

type ProviderUser = { id: string; email?: string };
type ProviderError = { status?: number; name?: string } | null;
export type AuthGateway = {
  signInWithPassword(input: z.infer<typeof loginSchema>): Promise<{ data: { user: ProviderUser | null }; error: ProviderError }>;
  getUser(): Promise<{ data: { user: ProviderUser | null }; error: ProviderError }>;
  signOut(options: { scope: "local" }): Promise<{ error: ProviderError }>;
};

const unavailable = () => new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Não foi possível acessar sua conta agora. Tente novamente." });
const temporary = (error: NonNullable<ProviderError>) => error.status === undefined || error.status >= 500 || error.status === 429;
const identity = (user: ProviderUser) => ({ id: user.id, email: user.email ?? null });

export async function signIn(auth: AuthGateway, input: z.infer<typeof loginSchema>) {
  try {
    const { data, error } = await auth.signInWithPassword(input);
    if (error) {
      if (temporary(error)) throw unavailable();
      throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
    }
    if (!data.user) throw unavailable();
    return { user: identity(data.user) };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw unavailable();
  }
}

export async function currentIdentity(auth: AuthGateway) {
  try {
    const { data, error } = await auth.getUser();
    if (error) {
      if (temporary(error)) throw unavailable();
      return null;
    }
    return data.user ? identity(data.user) : null;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw unavailable();
  }
}

export async function signOut(auth: AuthGateway, clearCookies: () => void) {
  try {
    const { error } = await auth.signOut({ scope: "local" });
    if (error && temporary(error)) throw unavailable();
    return { signedOut: true };
  } catch { throw unavailable(); } finally { clearCookies(); }
}
