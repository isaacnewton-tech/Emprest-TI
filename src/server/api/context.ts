import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createAuthClient } from "@/server/auth/client";
import { noSessionCache, requestCookies } from "@/server/auth/cookies";
import { currentIdentity, type AuthGateway } from "@/server/services/auth";
import { getDatabase } from "@/server/db";
import { createTenantResolver } from "@/server/services/membership";

export async function createContext({ req, resHeaders }: Pick<FetchCreateContextFnOptions, "req" | "resHeaders">) {
  noSessionCache(resHeaders);
  const cookies = requestCookies(req, resHeaders, process.env.NODE_ENV === "production");
  const auth: AuthGateway = createAuthClient(cookies).auth;
  let identity: ReturnType<typeof currentIdentity> | undefined;
  const getIdentity = () => identity ??= currentIdentity(auth);
  return {
    request: req, responseHeaders: resHeaders, requestId: crypto.randomUUID(), auth, getIdentity,
    clearSessionCookies: cookies.clear, getDatabase, getTenant: createTenantResolver(getDatabase),
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
