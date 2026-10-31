import { portable } from "../portable.ts";
import type { Check } from "../types.ts";
import { commandCheck } from "./exec-check.ts";

const cases = commandCheck("medium", (n) => [
  ...portable().tests.unit,
  `${portable().paths.holdout}/${n}`,
]);

// The builder reads the evidence of a failed check (its next prompt and specs/<n>/run.log), so a failing
// case must not show its output: that would hand over the hidden test and defeat the anti-overfit guard.
const WITHHELD = "holdout cases failed; their output is withheld from the builder";

// Holdout cases are added by a human; vitest exits 1 on an empty folder, which would fail every round.
export const holdout: Check = {
  size: "medium",
  async run(ctx) {
    const dir = `${portable().paths.holdout}/${ctx.n}`;
    if ((await ctx.host.list(`${dir}/`)).length === 0)
      return { ok: true, evidence: `no holdout cases at ${dir}, nothing graded` };
    const r = await cases.run(ctx);
    return r.ok ? r : { ok: false, evidence: WITHHELD };
  },
};
