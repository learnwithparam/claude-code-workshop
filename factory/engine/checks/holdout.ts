import type { Check } from "../types.ts";
import { commandCheck } from "./exec-check.ts";

const cases = commandCheck("medium", "npx", (n) => ["vitest", "run", `.factory/holdout/${n}`]);

// Holdout cases are added by a human; vitest exits 1 on an empty folder, which would fail every round.
export const holdout: Check = {
  size: "medium",
  async run(ctx) {
    const dir = `.factory/holdout/${ctx.n}`;
    if ((await ctx.host.list(`${dir}/`)).length === 0)
      return { ok: true, evidence: `no holdout cases at ${dir}, nothing graded` };
    return cases.run(ctx);
  },
};
