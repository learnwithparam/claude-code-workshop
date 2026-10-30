import type { FactoryConfig } from "../config.ts";
import {
  artifactDigest,
  artifactPath,
  badPlanLines,
  dropSpecLines,
  writeArtifact,
} from "./artifacts.ts";
import { CHECKS } from "./checks/index.ts";
import { resolveModel } from "./models.ts";
import { portable } from "./portable.ts";
import type { CheckResult, Host } from "./types.ts";
import type { Step, Workflow } from "./workflow.ts";

export type Outcome = "done" | "awaiting-approval" | "needs-human";
export type Result = {
  outcome: Outcome;
  stoppedAt?: string;
  // Why a run stopped when the cause is not a failed check, e.g. "spend cap".
  reason?: string;
  // One entry per agent call: the model the resolver chose and what it cost. Written to cost.json.
  calls: { stage: string; round: number; model: string; costUsd: number }[];
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
export type RunOptions = { config?: FactoryConfig; ticketType?: string };

export async function runWorkflow(
  host: Host,
  wf: Workflow,
  n: number,
  ticket: string,
  opts: RunOptions = {},
): Promise<Result> {
  const res: Result = {
    outcome: "done",
    rounds: {},
    costUsd: 0,
    calls: [],
    log: [`workflow ${wf.name}`],
  };
  const finish = async (outcome: Outcome, stoppedAt?: string, reason?: string): Promise<Result> => {
    res.outcome = outcome;
    res.stoppedAt = stoppedAt;
    host.setPhase(null);
    if (reason) {
      res.reason = reason;
      res.log.push(`needs-human: ${reason}`);
    }
    await writeArtifact(host, n, "run.log", `${res.log.join("\n")}\n`);
    await writeArtifact(
      host,
      n,
      "cost.json",
      `${JSON.stringify({ capUsd: opts.config?.spend.capUsd ?? null, totalUsd: res.costUsd, calls: res.calls }, null, 2)}\n`,
    );
    return res;
  };

  // A human gate approves what the stage produced, by hash. Every step up to the last approved gate is
  // not run again, because regenerating its artifacts would change what the person signed.
  let resumeAt = 0;
  for (const [i, step] of wf.steps.entries()) {
    if (
      step.gate === "human" &&
      (await host.approved(n, step.stage, await artifactDigest(host, n, step.stage)))
    ) {
      res.log.push(`gate ${step.stage} already approved, skipped`);
      resumeAt = i + 1;
    }
  }

  for (const step of wf.steps.slice(resumeAt)) {
    const stopped = await runStep(host, step, n, ticket, res, wf, opts);
    if (stopped) return finish("needs-human", step.stage, res.reason);
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
  wf: Workflow,
  opts: RunOptions,
): Promise<boolean> {
  const manifests = wf.manifests;
  const cfg = opts.config;
  // A reply the runner refuses (chat instead of the artifact) gets the reason and two more tries.
  const max = step.loop?.max ?? (step.writes ? 3 : 1);
  let feedback = "";
  const where = step.writes
    ? `Reply with the artifact only; the runner saves your reply as specs/${n}/${step.writes}.`
    : `Write this stage's artifacts under specs/${n}/.`;
  const brief = `Stage: ${step.stage}. ${step.brief ?? ""}\n${where}`;
  for (let round = 1; round <= max; round++) {
    // The cap is per run, over every agent call: stop at the configured share, never let a call pass it.
    const cap = cfg?.spend.capUsd;
    if (cfg && cap !== undefined && res.costUsd >= cap * cfg.spend.stopAt) {
      res.reason = "spend cap";
      res.log.push(`${step.stage} not run: $${res.costUsd.toFixed(4)} of $${cap} spent`);
      return true;
    }
    res.rounds[step.stage] = round;
    host.setPhase(round > 1 || step.phase === "fix" ? "fix" : "build");
    const model = cfg
      ? resolveModel({ cfg, step: step.stage, type: opts.ticketType ?? wf.name })
      : undefined;
    const out = await host.agent(step.agent, `${brief}\n${ticket}\n${feedback}`, {
      stage: step.stage,
      model,
      maxUsd: cap === undefined ? undefined : cap - res.costUsd,
    });
    res.costUsd += out.costUsd;
    res.calls.push({
      stage: step.stage,
      round,
      model: model ?? "frontmatter",
      costUsd: out.costUsd,
    });
    let refused = "";
    if (step.writes && !out.failed && out.text.trim()) {
      const text = step.writes === "plan.md" ? dropSpecLines(out.text, n) : out.text;
      const odd =
        step.writes === "plan.md" ? badPlanLines(text, manifests, portable().protected) : [];
      if (odd.length)
        refused = `plan.md refused, these lines are not ordinary repo paths: ${odd.slice(0, 5).join(" | ")}`;
      else if (step.startsWith && !text.trim().startsWith(step.startsWith))
        refused = `${step.writes} refused, the reply must begin with "${step.startsWith}" and hold the artifact only`;
      else await writeArtifact(host, n, step.writes, `${text.trim()}\n`);
    }
    res.log.push(
      `${step.stage} round ${round} model ${model ?? "frontmatter"} $${out.costUsd.toFixed(4)}${out.failed ? ` FAILED ${out.failed}` : ""}`,
    );
    host.setPhase(null);
    const results = await runChecks(host, n, step.checks);
    for (const [name, r] of Object.entries(results))
      res.log.push(`  check ${name} ${r.ok ? "ok" : "FAIL"}: ${r.evidence.split("\n")[0]}`);
    const until = new Set<string>(step.loop?.until ?? step.checks);
    const bad = failing(results).filter(([name]) => until.has(name));
    if (refused) res.log.push(`  ${refused}`);
    if (!bad.length && !out.failed && !refused) return false;
    feedback = `${refused}\nChecks failed in ${artifactPath(n, "run.log")}:\n${bad.map(([k, v]) => `${k}: ${v.evidence}`).join("\n")}`;
  }
  return true;
}
