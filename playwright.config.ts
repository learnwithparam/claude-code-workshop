import { defineConfig } from "@playwright/test";

// Serves the static build, the same bytes a CDN would. make check builds web first.
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "*.e2e.ts",
  webServer: {
    command: "npm run preview -w web",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: "http://localhost:4321" },
});
