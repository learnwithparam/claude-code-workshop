import { artifactPath } from "./artifacts.ts";
import type { Result, RunOptions } from "./interpret.ts";
import { reviewLoop } from "./review.ts";
import { failing, runChecks } from "./run-checks.ts";
import type { Host } from "./types.ts";
import type { Step } from "./workflow.ts";

// Lenses hunt in parallel, three verifiers vote, and a builder fixes what survives, up to the round cap.
// Returns true when an Important finding is left or a lens reply was not findings; the checks still run.
export export async function runReview(
  host: Host,
  step: Step,
  n: number,
  res: Result,
  opts: RunOptions,
): Promise<boolean> {
  const lenses = step.review?.lenses ?? [];
  const cfg = opts.config;
  const cap = cfg?.spend.capUsd;
  // Every lens hunt, ballot and fix goes through here, so the run total and the cap see all of them.
  const counted: Host = {
    ...host,
    async agent(name, prompt, o) {
      if (cfg && cap !== undefined && res.costUsd >= cap * cfg.spend.stopAt) {
        res.reason = "spend cap";
        res.log.push(`${o.stage} not run: $${res.costUsd.toFixed(4)} of $${cap} spent`);
        // A refused call reads as a failed review, never a clean one.
        return { text: "", costUsd: 0, failed: "spend cap" };
      }
      const out = await host.agent(name, prompt, {
        ...o,
        maxUsd: cap === undefined ? undefined : cap - res.costUsd,
      });
      res.costUsd += out.costUsd;
      res.calls.push({
        stage: o.stage,
        round: res.rounds[step.stage] ?? 1,
        model: o.model ?? "frontmatter",
        costUsd: out.costUsd,
      });
      return out;
    },
  };
  let fixed = false;
  const fixer = async () => {
    fixed = true;
    const findings = (await host.read(artifactPath(n, "review.json"))) ?? "";
    host.setPhase("fix");
    await counted.agent(
      "builder",
      `Fix these verified review findings. Never edit the locked tests.\n${findings}`,
      { stage: "review-fix" },
    );
    host.setPhase(null);
  };
  const r = await reviewLoop(counted, n, lenses, fixer);
  res.rounds[step.stage] = r.rounds;
  res.log.push(`${step.stage} ${r.clean ? "clean" : "NOT clean"} after ${r.rounds} round(s)`);
  // A fixer writes code after the build's checks passed, so the gate runs again on what it left.
  const names = [...new Set([...(step.checks ?? []), ...(fixed ? ["gate"] : [])])];
  const results = await runChecks(host, n, names);
  for (const [name, c] of Object.entries(results))
    res.log.push(`  check ${name} ${c.ok ? "ok" : "FAIL"}: ${c.evidence.split("\n")[0]}`);
  return !r.clean || failing(results).length > 0;
}
