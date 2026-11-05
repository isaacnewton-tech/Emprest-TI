export function requestOrigin(request: Request) {
  const internal = new URL(request.url);
  const host = request.headers.get("host") ?? internal.host;
  if (!host || /[\\/\s@?#]/.test(host)) throw new Error("Host inválido.");
  const protocol = request.headers.get("x-forwarded-proto") ?? internal.protocol.slice(0, -1);
  if (protocol !== "http" && protocol !== "https") throw new Error("Protocolo encaminhado inválido.");
  return new URL(`${protocol}://${host}`).origin;
}

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    const normalized = new URL(origin).origin;
    return origin === normalized && normalized === requestOrigin(request);
  } catch { return false; }
}
