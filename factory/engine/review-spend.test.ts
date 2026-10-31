import { describe, expect, it } from "vitest";
import { loadConfig } from "../config.ts";
import { fakeHost } from "./fake-host.ts";
import { runWorkflow } from "./interpret.ts";
import { loadWorkflow } from "./workflow.ts";

const finding = {
  file: "a.ts",
  line: 3,
  severity: "important",
  claim: "unchecked",
  evidence: "x=null",
};
const wf = loadWorkflow(
  "name: t\nmethod: m\nsource: s\nfor: f\nsteps:\n  - {stage: review, agent: reviewer, review: {lenses: [reviewer]}}",
);
const withCap = (capUsd: number, stopAt = 0.75) => ({
  ...loadConfig(),
  spend: { capUsd, stopAt },
});
// A lens reports one finding at $0.2, each of three voters says yes at $0.1, the fixer costs $0.3.
const priced = (name: string) =>
  name === "verifier"
    ? { text: "yes", costUsd: 0.1 }
    : name === "builder"
      ? { text: "fixed", costUsd: 0.3 }
      : { text: JSON.stringify([finding]), costUsd: 0.2 };

describe("review calls count toward the run spend", () => {
  it("adds every lens hunt, ballot and fix to the total and the call list", async () => {
    const { host } = fakeHost({ byAgent: priced });
    const r = await runWorkflow(host, wf, 1, "t", { config: withCap(1000) });
    // Three rounds: 3 x (lens 0.2 + three ballots 0.3) plus two fixes at 0.3.
    expect(r.costUsd).toBeCloseTo(3 * 0.5 + 2 * 0.3, 6);
    expect(r.calls.filter((c) => c.stage === "review")).toHaveLength(3);
    expect(r.calls.filter((c) => c.stage === "review-vote")).toHaveLength(9);
    expect(r.calls.reduce((s, c) => s + c.costUsd, 0)).toBeCloseTo(r.costUsd, 6);
  });

  it("hands each review call only the money that is left", async () => {
    const { host, budgets } = fakeHost({ byAgent: priced });
    await runWorkflow(host, wf, 1, "t", { config: withCap(1000) });
    expect(budgets.every((b) => b !== undefined && b <= 1000)).toBe(true);
    expect(budgets.some((b) => b !== undefined && b < 1000)).toBe(true);
  });

  it("stops with the reason spend cap instead of running review calls past it", async () => {
    const { host, calls } = fakeHost({ byAgent: priced });
    const r = await runWorkflow(host, wf, 1, "t", { config: withCap(1, 0.5) });
    expect(r.outcome).toBe("needs-human");
    expect(r.reason).toBe("spend cap");
    expect(r.costUsd).toBeLessThan(1);
    expect(calls.filter((c) => c.startsWith("agent")).length).toBeLessThan(15);
  });
});
