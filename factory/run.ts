import { type FactoryConfig, type StageName, stageFor } from "./config.ts";

export type Issue = { number: number; title: string; body: string; labels: string[] };
export type StageResult = { text: string; modelsUsed: string[]; costUsd: number };
export type Deps = {
  getIssue(n: number): Promise<Issue>;
  comment(n: number, body: string): Promise<void>;
  label(n: number, label: string): Promise<void>;
  runStage(
    stage: StageName,
    model: string,
    prompt: string,
    limits: ReturnType<typeof stageFor>,
  ): Promise<StageResult>;
};
export type Outcome = "pr-ready" | "awaiting-approval" | "needs-human" | "refused";
export type Report = {
  outcome: Outcome;
  type: string;
  rounds: number;
  costUsd: number;
  stages: string[];
};

const verdictOf = (text: string) => /VERDICT:\s*(clean|blocking)/i.exec(text)?.[1]?.toLowerCase();

// One ticket through the factory. Order is fixed here; models, turns and budget come from config.
export async function runFactory(deps: Deps, cfg: FactoryConfig, n: number): Promise<Report> {
  const issue = await deps.getIssue(n);
  const report: Report = { outcome: "refused", type: "feature", rounds: 0, costUsd: 0, stages: [] };

  const stage = async (name: StageName, prompt: string) => {
    const limits = stageFor(cfg, name, report.type);
    // Fail closed: a stage that used a model outside its allowed set is an error, not a result.
    const result = await deps.runStage(name, limits.model, prompt, limits);
    for (const used of result.modelsUsed)
      if (!cfg.allowedModels.includes(used))
        throw new Error(`stage ${name} used unlisted model ${used}`);
    report.costUsd += result.costUsd;
    report.stages.push(name);
    return result.text;
  };

  const triage = await stage(
    "triage",
    `Classify issue #${n}: ${issue.title}\n${issue.body}\nEnd with TYPE: feature|enhancement|bug|epic|docs and DECISION: proceed|refuse.`,
  );
  report.type = /TYPE:\s*(\w+)/i.exec(triage)?.[1]?.toLowerCase() ?? "feature";
  if (/DECISION:\s*refuse/i.test(triage)) {
    await deps.comment(n, triage);
    return report;
  }

  const plan = await stage(
    "plan",
    `Plan issue #${n} with AC-n acceptance criteria and NG-n non-goals, tests first.`,
  );
  await deps.comment(n, plan);
  await deps.label(n, cfg.labels.planned);
  if (!issue.labels.includes(cfg.labels.approved))
    return { ...report, outcome: "awaiting-approval" };

  await stage("build", `Build the approved plan for issue #${n}. Tests first. Run make check.`);
  for (let round = 1; round <= cfg.reviewLoop.maxRounds; round++) {
    report.rounds = round;
    const review = await stage(
      "review",
      `Review the change for #${n}. End with VERDICT: clean or VERDICT: blocking.`,
    );
    if (verdictOf(review) === "clean") {
      const verify = await stage(
        "verify",
        `Verify #${n}: run make check, revert the fix, show the test fails. End with VERDICT: clean or blocking.`,
      );
      if (verdictOf(verify) === "clean") return { ...report, outcome: "pr-ready" };
    }
    if (round < cfg.reviewLoop.maxRounds)
      await stage("build", `Fix the blocking findings for #${n}.`);
  }
  await deps.label(n, cfg.labels.needsHuman);
  return { ...report, outcome: "needs-human" };
}
