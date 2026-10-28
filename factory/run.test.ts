import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.ts";
import { type Deps, type Issue, runFactory } from "./run.ts";

const cfg = loadConfig();

function fake(script: Record<string, string[]>, labels: string[] = []) {
  const calls: string[] = [];
  const queues = Object.fromEntries(Object.entries(script).map(([k, v]) => [k, [...v]]));
  const deps: Deps = {
    getIssue: async (n): Promise<Issue> => ({ number: n, title: "t", body: "b", labels }),
    comment: async () => {},
    label: async (_n, l) => void calls.push(`label:${l}`),
    runStage: async (stage, model) => {
      calls.push(`${stage}:${model}`);
      const text = queues[stage]?.shift() ?? "VERDICT: clean";
      return { text, modelsUsed: [model], costUsd: 0.01 };
    },
  };
  return { deps, calls };
}

describe("factory state machine", () => {
  it("stops for approval after the plan", async () => {
    const { deps, calls } = fake({ triage: ["TYPE: bug DECISION: proceed"] });
    const r = await runFactory(deps, cfg, 1);
    expect(r.outcome).toBe("awaiting-approval");
    expect(calls.some((c) => c.startsWith("build"))).toBe(false);
  });

  it("runs build, review, verify in order once approved", async () => {
    const { deps } = fake({ triage: ["TYPE: bug DECISION: proceed"] }, [cfg.labels.approved]);
    const r = await runFactory(deps, cfg, 1);
    expect(r.outcome).toBe("pr-ready");
    expect(r.stages).toEqual(["triage", "plan", "build", "review", "verify"]);
  });

  it("caps the review loop at maxRounds and hands over to a human", async () => {
    const { deps, calls } = fake(
      { triage: ["TYPE: bug DECISION: proceed"], review: Array(9).fill("VERDICT: blocking") },
      [cfg.labels.approved],
    );
    const r = await runFactory(deps, cfg, 1);
    expect(r.outcome).toBe("needs-human");
    expect(r.rounds).toBe(cfg.reviewLoop.maxRounds);
    expect(calls).toContain(`label:${cfg.labels.needsHuman}`);
  });

  it("routes an epic plan to Opus", async () => {
    const { deps, calls } = fake({ triage: ["TYPE: epic DECISION: proceed"] });
    await runFactory(deps, cfg, 1);
    expect(calls).toContain("plan:claude-opus-5-5");
  });

  it("fails closed when a stage used a model outside the allowed set", async () => {
    const { deps } = fake({});
    deps.runStage = async () => ({ text: "", modelsUsed: ["claude-haiku-4-5"], costUsd: 0 });
    await expect(runFactory(deps, cfg, 1)).rejects.toThrow(/unlisted model/);
  });
});
