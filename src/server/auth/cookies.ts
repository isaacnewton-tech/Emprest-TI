import "server-only";
import { parseCookieHeader, serializeCookieHeader, type CookieOptions } from "@supabase/ssr";

export const AUTH_COOKIE = "empresti-auth";
export const isAuthCookie = (name: string) => name === AUTH_COOKIE || name.startsWith(`${AUTH_COOKIE}.`);
export type CookieWrite = { name: string; value: string; options: CookieOptions };
export type CookieAdapter = { getAll(): { name: string; value: string }[]; setAll(cookies: CookieWrite[], headers: Record<string, string>): void };

export function noSessionCache(headers: Headers) {
  headers.set("cache-control", "private, no-cache, no-store, must-revalidate, max-age=0");
  headers.set("pragma", "no-cache");
  headers.set("expires", "0");
}

export function requestCookies(request: Request, headers: Headers, secure: boolean) {
  const values = new Map(parseCookieHeader(request.headers.get("cookie") ?? "").map((cookie) => [cookie.name, cookie.value ?? ""]));
  const adapter: CookieAdapter = {
    getAll: () => Array.from(values, ([name, value]) => ({ name, value })),
    setAll(cookies, extraHeaders) {
      for (const { name, value, options } of cookies) {
        if (options.maxAge === 0) values.delete(name); else values.set(name, value);
        headers.append("set-cookie", serializeCookieHeader(name, value, { ...options, httpOnly: true, secure, sameSite: "lax", path: "/", domain: undefined }));
      }
      for (const [key, value] of Object.entries(extraHeaders)) headers.set(key, value);
      noSessionCache(headers);
    },
  };
  return {
    ...adapter,
    clear() {
      const names = new Set([AUTH_COOKIE, ...adapter.getAll().filter((cookie) => isAuthCookie(cookie.name)).map((cookie) => cookie.name)]);
      adapter.setAll(Array.from(names, (name) => ({ name, value: "", options: { maxAge: 0 } })), {});
    },
  };
}
