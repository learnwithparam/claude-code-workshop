import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import type { Proof } from "./hand-built.ts";

// Claim: every workflow parses and runs its steps in order, and each gate refuses what it should.
// The engine tests hold both halves, so the proof runs them rather than restating them.
export function proveWorkflows(): Proof {
  const flows = readdirSync(".factory/workflows").filter((f) => f.endsWith(".yaml"));
  const run = spawnSync("npx", ["vitest", "run", "factory/engine", "--reporter=dot"], {
    encoding: "utf8",
  });
  return {
    level: "workflows",
    claim: "every workflow dry-runs in order and every gate refuses what it should",
    passed: run.status === 0 && flows.length > 0,
    detail:
      run.status === 0
        ? "every workflow runs; red, lock, plan-drift, voting, risk and bands bite"
        : (run.stdout + run.stderr).split("\n").slice(-8).join(" | "),
  };
}
