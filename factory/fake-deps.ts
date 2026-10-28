// Scripted stand-ins for GitHub and the agent, shared by the runner tests.
import { loadConfig } from "./config.ts";
import type { Ledger } from "./cost-ledger.ts";
import type { Deps, Issue } from "./run.ts";

export const cfg = loadConfig();

export const PLAN = "AC-1 | factory/x.test.ts | does x";
export const PASSING = [{ file: "/r/factory/x.test.ts", name: "does x", status: "passed" }];

export function fake(
  script: Record<string, string[]>,
  labels: string[] = [],
  gateOk = true,
  plan = PLAN,
  results = PASSING,
) {
  const calls: string[] = [];
  const prompts: Record<string, string> = {};
  const queues = Object.fromEntries(Object.entries(script).map(([k, v]) => [k, [...v]]));
  const adrs: string[] = [];
  const released: string[] = [];
  const comments: string[] = [];
  const saved: { ledger?: Ledger; lines?: string[] } = {};
  const deps: Deps = {
    listAdrs: async () => ["docs/adr/0003-old.md"],
    writeAdr: async (f) => void adrs.push(f),
    applyRelease: async (entry) => {
      released.push(entry("0.2.0"));
      return "0.2.0";
    },
    saveRun: async (_n, ledger, lines) => void Object.assign(saved, { ledger, lines }),
    getIssue: async (n): Promise<Issue> => ({ number: n, title: "t", body: "b", labels }),
    comment: async (_n, b) => void comments.push(b),
    label: async (_n, l) => void calls.push(`label:${l}`),
    latestPlan: async () => plan,
    testResults: async () => results,
    gate: async () => ({ ok: gateOk, output: "gate" }),
    startBranch: async () => void calls.push("branch"),
    openPr: async () => {
      calls.push("pr");
      return "url";
    },
    unlabel: async (_n, l) => void calls.push(`unlabel:${l}`),
    runStage: async (stage, model, prompt, _limits, extra) => {
      if (extra?.allowProtected) calls.push(`protected:${stage}`);
      calls.push(`${stage}:${model}`);
      prompts[stage] = prompt;
      const text =
        queues[stage]?.shift() ?? (stage === "adr" ? "CRITICALITY: C1" : "VERDICT: clean");
      return { text, modelsUsed: [model], costUsd: 0.01 };
    },
  };
  return { deps, calls, prompts, saved, adrs, released, comments };
}
