import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { STAGE_NAMES } from "../../factory/config.ts";
import type { Proof } from "./hand-built.ts";

// Delivery claim: a ticket flows through every stage in order, capped, with a human sign-off at the end.
export function proveDelivery(): Proof {
  const problems: string[] = [];
  const plan = execFileSync("npx", ["tsx", "factory/main.ts", "1", "--dry-run"], {
    encoding: "utf8",
  });
  let last = -1;
  for (const name of STAGE_NAMES) {
    const at = plan.indexOf(`  ${name}`);
    if (at <= last) problems.push(`dry run does not list ${name} in order`);
    last = at;
  }
  if (!/review loop: at most \d+ rounds/.test(plan)) problems.push("review loop has no cap");

  const template = readFileSync(".github/PULL_REQUEST_TEMPLATE.md", "utf8");
  if (!template.includes("A human merges this"))
    problems.push("PR template lacks the human sign-off");

  return {
    level: "delivery",
    claim: "tickets flow triage to verify in order, the review loop is capped, a human merges",
    passed: problems.length === 0,
    detail: problems.length === 0 ? "six stages, capped loop, human merge" : problems.join(" | "),
  };
}
