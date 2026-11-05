import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.{ts,tsx,js,mjs}"],
    exclude: ["tests/e2e/**"],
  },
});
