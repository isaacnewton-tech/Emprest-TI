import type { NextRequest } from "next/server";
import { guardSession } from "@/server/auth/guard";

export function proxy(request: NextRequest) {
  return guardSession(request);
}

export const config = { matcher: ["/", "/login", "/catalogo/:path*"] };
