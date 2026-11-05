import "server-only";
import { createServerClient } from "@supabase/ssr";
import { getAuthConfig } from "@/server/env";
import { AUTH_COOKIE, type CookieAdapter } from "./cookies";

export function createAuthClient(cookies: CookieAdapter, config = getAuthConfig(), fetcher: typeof fetch = fetch) {
  return createServerClient(config.url, config.key, {
    cookieOptions: { name: AUTH_COOKIE, httpOnly: true, secure: config.secureCookies, sameSite: "lax", path: "/" },
    cookies: { getAll: () => cookies.getAll(), setAll: (writes, headers) => cookies.setAll(writes.map((cookie) => ({ ...cookie, options: { ...cookie.options, httpOnly: true, secure: config.secureCookies, sameSite: "lax", path: "/", domain: undefined } })), headers) },
    global: { fetch: (input, init) => fetcher(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000) }) },
  });
}
