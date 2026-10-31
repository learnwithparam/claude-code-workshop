import { spawnSync } from "node:child_process";
import type { Proof } from "./hand-built.ts";

// Claim: the workbook and template features are green against the specs that were red on the workflows snapshot.
// The golden and property suites are the red half; the tests beside the code are the unit half.
const SUITES = [
  "specs/34",
  "specs/35",
  "specs/37",
  "shared/src/workbook",
  "shared/src/render-workbook",
  "shared/src/template",
  "api/src/cache",
  "api/src/templates",
  "api/src/agent/workbook-agent",
  "api/src/workbook-server",
  "api/src/templates-good-route",
];

export function proveCapstone(): Proof {
  const run = spawnSync("npx", ["vitest", "run", ...SUITES, "--reporter=dot"], {
    encoding: "utf8",
  });
  return {
    level: "capstone",
    claim: "the workbook and template specs are green on the finished tree",
    passed: run.status === 0,
    detail:
      run.status === 0
        ? "workbook plan, schema, check, pdf, template store, cache and routes all pass their specs"
        : (run.stdout + run.stderr).split("\n").slice(-8).join(" | "),
  };
}
