import type { TRPCContext } from "@/server/api/context";
import type { AuthGateway, currentIdentity } from "@/server/services/auth";
import { getDatabase as defaultDatabase } from "@/server/db";
import { createTenantResolver } from "@/server/services/membership";

export function testAuthGateway(overrides: Partial<AuthGateway> = {}): AuthGateway {
  return {
    signInWithPassword: async () => ({ data: { user: null }, error: { status: 400 } }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    ...overrides,
  };
}

export function testAuthContext(overrides: Partial<TRPCContext> & { user?: Awaited<ReturnType<typeof currentIdentity>> } = {}): TRPCContext {
  const { user, getDatabase = defaultDatabase, ...context } = overrides;
  return {
    request: new Request("http://localhost/api/trpc", { method: "POST", headers: { origin: "http://localhost" } }),
    responseHeaders: new Headers(), requestId: "00000000-0000-4000-8000-000000000000", auth: testAuthGateway(), getIdentity: async () => user ?? null, clearSessionCookies() {},
    getDatabase, getTenant: createTenantResolver(getDatabase),
    ...context,
  };
}
