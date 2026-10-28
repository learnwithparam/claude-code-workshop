import { configDefaults, defineConfig } from "vitest/config";

// supplied/ holds generated copies of the repo; running their tests here would test the copy, not the source.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, "supplied/**"] },
});
