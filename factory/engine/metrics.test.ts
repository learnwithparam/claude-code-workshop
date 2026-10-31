import { describe, expect, it } from "vitest";
import type { Result } from "./interpret.ts";
import { firstPass, type Metrics, metricsFor, metricsSchema, rollup } from "./metrics.ts";

const m = (rounds: Record<string, number>, outcome: Metrics["outcome"] = "done"): Metrics => ({
  ticket: 1,
  workflow: "bug-tdd",
  outcome,
  rounds,
  costUsd: 0.5,
  startedAt: "2026-10-31T10:00:00.000Z",
  finishedAt: "2026-10-31T10:05:00.000Z",
  stages: {},
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
  it("records the auth mode and usage, and still reads metrics written without them", () => {
    const result = { outcome: "done", rounds: { fix: 1 }, costUsd: 0 } as unknown as Result;
    const u = { auth: "subscription" as const, calls: 3, tokens: 900, estimatedUsd: 0.4 };
    const saved = metricsSchema.parse(metricsFor(1, "bug-tdd", result, u));
    expect(saved).toMatchObject({
      auth: "subscription",
      costUsd: 0,
      usage: { calls: 3, tokens: 900 },
    });
    expect(metricsSchema.parse(m({ fix: 1 })).auth).toBeUndefined();
  });
});

describe("metricsFor", () => {
  it("carries the run and stage timestamps through the schema", () => {
    const r: Result = {
      outcome: "done",
      rounds: { fix: 1 },
      costUsd: 0.1,
      calls: [],
      log: [],
      startedAt: "2026-10-31T10:00:00.000Z",
      finishedAt: "2026-10-31T10:01:00.000Z",
      stages: {
        fix: { startedAt: "2026-10-31T10:00:00.000Z", finishedAt: "2026-10-31T10:01:00.000Z" },
      },
    };
    const out = metricsSchema.parse(metricsFor(1, "bug-tdd", r));
    expect(out.startedAt).toBe(r.startedAt);
    expect(out.stages.fix?.finishedAt).toBe(r.finishedAt);
    expect(() => metricsSchema.parse({ ...out, startedAt: "yesterday" })).toThrow();
  });
});

describe("report", () => {
  it("rolls up every saved metrics.json and skips a half-written run", async () => {
    const { mkdtempSync, mkdirSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { report } = await import("./cli.ts");
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    for (const [n, body] of [
      [
        "1",
        {
          ticket: 1,
          workflow: "bug-tdd",
          outcome: "done",
          rounds: { fix: 1 },
          costUsd: 0.5,
          startedAt: "2026-10-31T10:00:00.000Z",
          finishedAt: "2026-10-31T10:05:00.000Z",
          stages: {},
        },
      ],
      ["2", "{broken"],
    ] as const) {
      mkdirSync(join(dir, n));
      writeFileSync(
        join(dir, n, "metrics.json"),
        typeof body === "string" ? body : JSON.stringify(body),
      );
    }
    const r = report(dir);
    expect(r.runs).toBe(1);
    expect(r.firstPassRate).toBe(1);
    expect(r.costUsd).toBe(0.5);
  });
});
