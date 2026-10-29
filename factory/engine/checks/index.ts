import type { Check } from "../types.ts";
import { commandCheck } from "./exec-check.ts";
import { lock } from "./lock.ts";
import { mutation } from "./mutation.ts";
import { planDriftCheck } from "./plan-drift.ts";
import { red } from "./red.ts";

const vitestFor = (dir: (n: number) => string) => (n: number) => ["vitest", "run", dir(n)];

// Every check declares its test size: prepush runs the small ones, CI runs all of them.
export const CHECKS: Record<string, Check> = {
  red,
  lock,
  "plan-drift": planDriftCheck,
  green: commandCheck(
    "small",
    "npx",
    vitestFor((n) => `specs/${n}`),
  ),
  acceptance: commandCheck(
    "medium",
    "npx",
    vitestFor((n) => `specs/${n}`),
  ),
  // Holdout cases live where the builder's tools cannot read them; the runner alone executes them.
  holdout: commandCheck(
    "medium",
    "npx",
    vitestFor((n) => `.factory/holdout/${n}`),
  ),
  properties: commandCheck(
    "medium",
    "npx",
    vitestFor((n) => `specs/${n}/properties`),
  ),
  "behaviour-unchanged": commandCheck(
    "medium",
    "npx",
    vitestFor((n) => `specs/${n}/golden`),
  ),
  mutation,
  contract: commandCheck(
    "medium",
    "npx",
    vitestFor(() => "tests/contract"),
  ),
  visual: commandCheck("large", "npx", () => ["playwright", "test", "tests/e2e"]),
  eval: commandCheck("large", "npx", () => ["tsx", "scripts/eval.ts"]),
  gate: commandCheck("large", "make", () => ["check"]),
  prepush: commandCheck("small", "bash", () => ["scripts/git/pre-push"]),
  ci: commandCheck("large", "gh", () => ["pr", "checks", "--watch"]),
  prose: commandCheck("small", "python3", () => ["scripts/check-prose.py", "docs"]),
};
