import { artifactDigest, artifactPath, writeArtifact } from "./artifacts.ts";
import { CHECKS } from "./checks/index.ts";
import type { CheckResult, Host } from "./types.ts";
import type { Step, Workflow } from "./workflow.ts";

export type Outcome = "done" | "awaiting-approval" | "needs-human";
export type Result = {
  outcome: Outcome;
  stoppedAt?: string;
  rounds: Record<string, number>;
  costUsd: number;
  log: string[];
};

async function runChecks(
  host: Host,
  n: number,
  names: readonly string[],
): Promise<Record<string, CheckResult>> {
  const out: Record<string, CheckResult> = {};
  for (const name of names) {
    const check = CHECKS[name];
    if (!check) throw new Error(`unknown check ${name}`);
    out[name] = await check.run({ host, n });
  }
  return out;
}

const failing = (r: Record<string, CheckResult>) => Object.entries(r).filter(([, v]) => !v.ok);

// Runs a workflow's steps in order. A step repeats its agent while its loop checks fail, up to the cap;
// the evidence of the failing checks is the next round's prompt, so the loop learns from the check, not the model.
export async function runWorkflow(
  host: Host,
  wf: Workflow,
  n: number,
  ticket: string,
): Promise<Result> {
  const res: Result = { outcome: "done", rounds: {}, costUsd: 0, log: [`workflow ${wf.name}`] };
  const finish = async (outcome: Outcome, stoppedAt?: string): Promise<Result> => {
    res.outcome = outcome;
    res.stoppedAt = stoppedAt;
    host.setPhase(null);
    await writeArtifact(host, n, "run.log", `${res.log.join("\n")}\n`);
    return res;
  };

  for (const step of wf.steps) {
    // A human gate approves what the stage produced, by hash. A stage whose artifacts were already
    // approved is not run again, because regenerating them would change what the person signed.
    if (
      step.gate === "human" &&
      (await host.approved(n, step.stage, await artifactDigest(host, n, step.stage)))
    ) {
      res.log.push(`gate ${step.stage} already approved, skipped`);
      continue;
    }
    const stopped = await runStep(host, step, n, ticket, res);
    if (stopped) return finish("needs-human", step.stage);
    if (
      step.gate === "human" &&
      !(await host.approved(n, step.stage, await artifactDigest(host, n, step.stage)))
    ) {
      res.log.push(`gate ${step.stage} awaiting approval`);
      return finish("awaiting-approval", step.stage);
    }
  }
  return finish("done");
}

// Returns true when the step could not reach its checks within its cap.
async function runStep(
  host: Host,
  step: Step,
  n: number,
  ticket: string,
  res: Result,
): Promise<boolean> {
  const max = step.loop?.max ?? 1;
  let feedback = "";
  const brief = `Stage: ${step.stage}. ${step.brief ?? ""}\nWrite this stage's artifacts under specs/${n}/.`;
  for (let round = 1; round <= max; round++) {
    res.rounds[step.stage] = round;
    host.setPhase(round > 1 || step.phase === "fix" ? "fix" : "build");
    const out = await host.agent(step.agent, `${brief}\n${ticket}\n${feedback}`, {
      stage: step.stage,
    });
    res.costUsd += out.costUsd;
    res.log.push(
      `${step.stage} round ${round} $${out.costUsd.toFixed(4)}${out.failed ? ` FAILED ${out.failed}` : ""}`,
    );
    host.setPhase(null);
    const results = await runChecks(host, n, step.checks);
    for (const [name, r] of Object.entries(results))
      res.log.push(`  check ${name} ${r.ok ? "ok" : "FAIL"}: ${r.evidence.split("\n")[0]}`);
    const until = new Set<string>(step.loop?.until ?? step.checks);
    const bad = failing(results).filter(([name]) => until.has(name));
    if (!bad.length && !out.failed) return false;
    feedback = `Checks failed in ${artifactPath(n, "run.log")}:\n${bad.map(([k, v]) => `${k}: ${v.evidence}`).join("\n")}`;
  }
  return true;
}
