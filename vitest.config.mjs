import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)), "server-only": fileURLToPath(new URL("./tests/helpers/server-only.ts", import.meta.url)) } },
  test: {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:1",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publica-da-fixture-vitest",
      DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture",
      DIRECT_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture",
      SUPABASE_SERVICE_ROLE_KEY: "",
      SENTRY_DSN: "",
    },
    include: ["tests/**/*.test.{ts,tsx,js,mjs}"],
    exclude: ["tests/e2e/**"],
  },
});
