import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig } from "@/server/env";
import { currentIdentity } from "@/server/services/auth";
import { requestOrigin } from "@/server/http/origin";
import { createAuthClient } from "./client";
import { expireAuthCookies, isAuthCookie, noSessionCache, type CookieAdapter } from "./cookies";
import { sessionUnavailable } from "./unavailable";

export async function guardSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  noSessionCache(response.headers);
  const protectedRoute = request.nextUrl.pathname === "/catalogo" || request.nextUrl.pathname.startsWith("/catalogo/");
  const loginRoute = request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/login";
  function withCookies(target: NextResponse) {
    for (const cookie of response.cookies.getAll()) target.cookies.set(cookie);
    noSessionCache(target.headers);
    return target;
  }
  const redirect = (path: string) => withCookies(NextResponse.redirect(new URL(path, requestOrigin(request))));
  if (!request.cookies.getAll().some((cookie) => isAuthCookie(cookie.name))) return protectedRoute ? redirect("/login") : response;

  const cookies: CookieAdapter = {
    getAll: () => request.cookies.getAll(),
    setAll(writes, headers) {
      const previous = response.cookies.getAll();
      for (const { name, value, options } of writes) {
        if (options.maxAge === 0) request.cookies.delete(name); else request.cookies.set(name, value);
      }
      response = NextResponse.next({ request });
      for (const cookie of previous) response.cookies.set(cookie);
      for (const { name, value, options } of writes) response.cookies.set(name, value, options);
      for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      noSessionCache(response.headers);
    },
  };
  try {
    const config = getAuthConfig();
    const user = await currentIdentity(createAuthClient(cookies, config).auth);
    if (!user) {
      expireAuthCookies(cookies, config.secureCookies);
      return protectedRoute ? redirect("/login") : response;
    }
    return loginRoute ? redirect("/catalogo") : response;
  } catch {
    if (protectedRoute) return withCookies(sessionUnavailable());
    return response;
  }
}
