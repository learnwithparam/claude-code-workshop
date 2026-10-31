import type { FactoryConfig } from "../config.ts";
import {
  artifactDigest,
  artifactPath,
  badPlanLines,
  dropSpecLines,
  writeArtifact,
} from "./artifacts.ts";
import { runDeploy } from "./deploy-step.ts";
import { resolveModel } from "./models.ts";
import { portable } from "./portable.ts";
import { type RetroOutcome, retro } from "./retro.ts";
import { runReview } from "./review-step.ts";
import { failing, runChecks } from "./run-checks.ts";
import { APPROVALS, classify } from "./risk.ts";
import { recordSeries, SERIES } from "./series.ts";
import type { Host } from "./types.ts";
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
  // ISO times for the run and for each stage, written to metrics.json.
  startedAt: string;
  finishedAt: string;
  stages: Record<string, { startedAt: string; finishedAt: string }>;
  costUsd: number;
  log: string[];
};


// The tier comes from the paths changed so far, and the tier sets how many people must approve.
async function gateMet(host: Host, n: number, step: Step, log?: string[]): Promise<boolean> {
  const tier = classify(await host.changedFiles());
  // A step that says gate: human always needs a person; the tier only raises the count.
  const need = Math.max(1, APPROVALS[tier]);
  if (log)
    log.push(`gate ${step.stage} tier ${tier} needs ${need} approval${need === 1 ? "" : "s"}`);
  return host.approved(n, step.stage, await artifactDigest(host, n, step.stage), need);
}

// Runs a workflow's steps in order. A step repeats its agent while its loop checks fail, up to the cap;
// the evidence of the failing checks is the next round's prompt, so the loop learns from the check, not the model.
// `commitLog` commits specs/<n>/run.log when the run ends, so the log is not left untracked.
export type RunOptions = {
  config?: FactoryConfig;
  ticketType?: string;
  commitLog?: boolean;
  // When set, a finished run ends with one retro. `evalCmd` must print `SCORE <number>`.
  retro?: { evalCmd: [string, ...string[]]; revert: () => Promise<void> };
};

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
    startedAt: new Date().toISOString(),
    finishedAt: "",
    stages: {},
    costUsd: 0,
    calls: [],
    log: [`workflow ${wf.name}`],
  };
  const finish = async (outcome: Outcome, stoppedAt?: string, reason?: string): Promise<Result> => {
    res.outcome = outcome;
    res.stoppedAt = stoppedAt;
    res.finishedAt = new Date().toISOString();
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
    if (opts.commitLog) await host.commit(`factory run log #${n}`, [artifactPath(n, "run.log")]);
    return res;
  };

  // A human gate approves what the stage produced, by hash. Every step up to the last approved gate is
  // not run again, because regenerating its artifacts would change what the person signed.
  let resumeAt = 0;
  for (const [i, step] of wf.steps.entries()) {
    if (step.gate === "human" && (await gateMet(host, n, step))) {
      res.log.push(`gate ${step.stage} already approved, skipped`);
      resumeAt = i + 1;
    }
  }

  for (const step of wf.steps.slice(resumeAt)) {
    const startedAt = new Date().toISOString();
    const stopped = await runStep(host, step, n, ticket, res, wf, opts);
    res.stages[step.stage] = { startedAt, finishedAt: new Date().toISOString() };
    if (stopped) return finish("needs-human", step.stage, res.reason);
    if (step.gate === "human" && !(await gateMet(host, n, step, res.log))) {
      res.log.push(`gate ${step.stage} awaiting approval`);
      return finish("awaiting-approval", step.stage);
    }
  }
  const done = await finish("done");
  const score = opts.retro ? await endWithRetro(host, n, done, opts.retro) : undefined;
  // Only a finished run joins the history `--maintain` judges; a run that stopped says nothing about the bands.
  await recordSeries(host, done, score);
  if (opts.commitLog) await host.commit(`factory series #${n}`, [SERIES]);
  return done;
}

// The retro reads run.log, so it runs after the log is saved; its outcome is appended to the log.
// Returns the eval score the repo stands at afterwards, or undefined when the eval was broken.
async function endWithRetro(
  host: Host,
  n: number,
  res: Result,
  r: NonNullable<RunOptions["retro"]>,
): Promise<number | undefined> {
  let out: RetroOutcome;
  try {
    out = await retro(host, n, r.evalCmd, r.revert);
  } catch (e) {
    out = { kind: "error", error: e instanceof Error ? e.message : String(e) };
  }
  res.log.push(
    out.kind === "error"
      ? `retro error: ${out.error}`
      : out.kind === "none"
        ? "retro none"
        : `retro ${out.kind} ${out.proposal.file} delta ${out.delta.toFixed(2)}`,
  );
  await writeArtifact(host, n, "run.log", `${res.log.join("\n")}\n`);
  if (out.kind === "error") return undefined;
  return out.kind === "kept" ? out.after : out.before;
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
  if (step.review) return runReview(host, step, n, res, opts);
  if (step.deploy) {
    const d = await runDeploy(host, n, step);
    res.rounds[step.stage] = 1;
    res.log.push(`${step.stage} ${step.deploy} ${d.ok ? "ok" : "FAILED"}: ${d.reason}`);
    if (!d.ok) res.reason = d.reason;
    return !d.ok;
  }
  const agent = step.agent;
  if (!agent) throw new Error(`step ${step.stage} has no agent`);
  const max = step.loop?.max ?? (step.writes ? 3 : 1);
  let feedback = "";
  // The failing checks and their evidence, last round and how many rounds in a row they repeated.
  let lastFailure = "";
  let repeats = 0;
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
    const out = await host.agent(agent, `${brief}\n${ticket}\n${feedback}`, {
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
    const failure = JSON.stringify(bad.map(([k, v]) => [k, v.evidence]));
    repeats = bad.length && failure === lastFailure ? repeats + 1 : 1;
    lastFailure = failure;
    if (bad.length && repeats >= (step.loop?.sameFailure ?? 2)) {
      res.reason = "test contradicts ticket";
      res.log.push(`${step.stage} failed the same check with the same evidence ${repeats} rounds`);
      return true;
    }
    feedback = `${refused}\nChecks failed in ${artifactPath(n, "run.log")}:\n${bad.map(([k, v]) => `${k}: ${v.evidence}`).join("\n")}`;
  }
  return true;
}
