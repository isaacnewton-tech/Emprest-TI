import { createHmac, randomUUID } from "node:crypto";

export const fixtureEmail = "colaborador@example.test";
export const fixturePassword = "Senha-local-da-fixture-42";
export const fixtureUserId = "11111111-1111-4111-8111-111111111111";
export function fixtureUser() {
  return { id: fixtureUserId, aud: "authenticated", role: "authenticated", email: fixtureEmail, email_confirmed_at: "2026-01-01T00:00:00Z", app_metadata: { tenant_id: "IGNORAR_METADATA_DA_FIXTURE" }, user_metadata: {}, identities: [], created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" };
}
export function fixtureSession(expiresAt = Math.floor(Date.now() / 1000) + 3600) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: fixtureUserId, exp: expiresAt, iat: Math.floor(Date.now() / 1000), jti: randomUUID(), aud: "authenticated", role: "authenticated", email: fixtureEmail })).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const token = `${unsigned}.${createHmac("sha256", "chave-ficticia-apenas-para-testes").update(unsigned).digest("base64url")}`;
  return { access_token: token, refresh_token: "refresh-ficticio-local", expires_at: expiresAt, expires_in: Math.max(1, expiresAt - Math.floor(Date.now() / 1000)), token_type: "bearer", user: fixtureUser() };
}
