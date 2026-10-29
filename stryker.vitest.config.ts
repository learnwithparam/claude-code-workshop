import { defineConfig } from "vitest/config";

// Mutation runs only the unit tests beside the mutated code. The structure and e2e suites read the whole
// repo, so inside Stryker's copied sandbox they fail before a single mutant runs.
export default defineConfig({
  test: { include: ["shared/src/**/*.test.ts", "specs/*/golden/**/*.test.ts"] },
});
