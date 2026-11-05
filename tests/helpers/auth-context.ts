import type { TRPCContext } from "@/server/api/context";
import type { AuthGateway, currentIdentity } from "@/server/services/auth";

export function testAuthGateway(overrides: Partial<AuthGateway> = {}): AuthGateway {
  return {
    signInWithPassword: async () => ({ data: { user: null }, error: { status: 400 } }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    ...overrides,
  };
}

export function testAuthContext(overrides: Partial<TRPCContext> & { user?: Awaited<ReturnType<typeof currentIdentity>> } = {}): TRPCContext {
  const { user, ...context } = overrides;
  return {
    request: new Request("http://localhost/api/trpc", { method: "POST", headers: { origin: "http://localhost" } }),
    responseHeaders: new Headers(), requestId: "fixture-request", auth: testAuthGateway(), getIdentity: async () => user ?? null, clearSessionCookies() {},
    ...context,
  };
}
