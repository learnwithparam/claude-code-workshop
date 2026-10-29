import { describe, expect, it } from "vitest";
import { firstPass, type Metrics, rollup } from "./metrics.ts";

const m = (rounds: Record<string, number>, outcome: Metrics["outcome"] = "done"): Metrics => ({
  ticket: 1,
  workflow: "bug-tdd",
  outcome,
  rounds,
  costUsd: 0.5,
});

describe("metrics", () => {
  it("counts a run first-pass only when it finished with no repeat round", () => {
    expect(firstPass(m({ fix: 1 }))).toBe(true);
    expect(firstPass(m({ fix: 2 }))).toBe(false);
    expect(firstPass(m({ fix: 1 }, "needs-human"))).toBe(false);
  });
  it("rolls runs up", () => {
    const r = rollup([m({ fix: 1 }), m({ fix: 3 }, "needs-human")]);
    expect(r).toMatchObject({
      runs: 2,
      firstPassRate: 0.5,
      doneRate: 0.5,
      meanRounds: 2,
      costUsd: 1,
    });
    expect(r.costByWorkflow["bug-tdd"]).toBe(1);
  });
});
