import { configDefaults, defineConfig } from "vitest/config";

// plugins/*/hooks tests need `claude-code/testing`, so `claude plugin test` runs them, not vitest.
// .labs/ holds learner work, including worktrees that hold whole copies of the repo.
// supplied/ holds generated copies of the repo; running their tests here would test the copy, not the source.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, "supplied/**", "plugins/*/hooks/**", ".labs/**"] },
});
