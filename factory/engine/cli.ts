import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runWorkflow } from "./interpret.ts";
import { type Metrics, metricsFor, metricsSchema, rollup } from "./metrics.ts";
import { realHost } from "./real-host.ts";
import { loadWorkflow } from "./workflow.ts";

const RUNS = ".factory/runs";
const gh = (...a: string[]) => execFileSync("gh", a, { encoding: "utf8" });

// Runs one issue through a named workflow on the current checkout and saves metrics.json.
export async function runIssue(n: number, name: string) {
  const wf = loadWorkflow(readFileSync(`.factory/workflows/${name}.yaml`, "utf8"));
  const issue = JSON.parse(gh("issue", "view", String(n), "--json", "title,body"));
  const base = execFileSync("git", ["merge-base", "HEAD", "origin/main"], {
    encoding: "utf8",
  }).trim();
  const host = realHost({ cwd: process.cwd(), base });
  const result = await runWorkflow(host, wf, n, `${issue.title}\n\n${issue.body}`);
  mkdirSync(join(RUNS, String(n)), { recursive: true });
  writeFileSync(
    join(RUNS, String(n), "metrics.json"),
    JSON.stringify(metricsFor(n, name, result), null, 2),
  );
  return result;
}

// What `--report` prints: the roll-up of every saved metrics.json.
export function report(dir = RUNS) {
  const all: Metrics[] = [];
  for (const d of readdirSync(dir, { withFileTypes: true }))
    if (d.isDirectory())
      try {
        all.push(
          metricsSchema.parse(JSON.parse(readFileSync(join(dir, d.name, "metrics.json"), "utf8"))),
        );
      } catch {
        // A run with no metrics yet (or a half-written one) is not part of the roll-up.
      }
  return rollup(all);
}

// What `--watch` prints: the issues the factory would pick up next.
export const ready = (label = "factory:ready") =>
  JSON.parse(gh("issue", "list", "--label", label, "--json", "number,title"));
