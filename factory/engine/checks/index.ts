import { portable } from "../portable.ts";
import type { Check } from "../types.ts";
import { commandCheck } from "./exec-check.ts";
import { holdout } from "./holdout.ts";
import { lock } from "./lock.ts";
import { manifestDeps } from "./manifest-deps.ts";
import { mutation } from "./mutation.ts";
import { planDriftCheck } from "./plan-drift.ts";
import { red } from "./red.ts";

const t = () => portable().tests;
const unit = (dir: (n: number) => string) => (n: number) => [...t().unit, dir(n)];

// Every check declares its test size: prepush runs the small ones, CI runs all of them.
export const CHECKS: Record<string, Check> = {
  red,
  lock,
  "plan-drift": planDriftCheck,
  green: commandCheck(
    "small",
    unit((n) => `specs/${n}`),
  ),
  acceptance: commandCheck(
    "medium",
    unit((n) => `specs/${n}`),
  ),
  // Holdout cases live where the builder's tools cannot read them; the runner alone executes them.
  holdout,
  properties: commandCheck(
    "medium",
    unit((n) => `specs/${n}/properties`),
  ),
  "behaviour-unchanged": commandCheck(
    "medium",
    unit((n) => `specs/${n}/golden`),
  ),
  mutation,
  "manifest-deps": manifestDeps,
  contract: commandCheck(
    "medium",
    unit(() => portable().paths.contract),
  ),
  visual: commandCheck("large", () => t().e2e),
  eval: commandCheck("large", () => t().eval),
  gate: commandCheck("large", () => portable().gate),
  prepush: commandCheck("small", () => t().prepush),
  ci: commandCheck("large", () => ["gh", "pr", "checks", "--watch"]),
  prose: commandCheck("small", () => t().prose),
};
