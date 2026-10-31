import { describe, expect, it } from "vitest";
import { fakeHost } from "./fake-host.ts";
import type { Result } from "./interpret.ts";
import { recordSeries, runValues, SERIES } from "./series.ts";

const res = (log: string[]): Result => ({
  outcome: "done",
  rounds: {},
  startedAt: "2026-10-31T10:00:00.000Z",
  finishedAt: "2026-10-31T11:30:00.000Z",
  stages: {},
  costUsd: 0,
  calls: [],
  log,
});
const log = [
  "workflow t",
  "  check red ok: x",
  "  check lock FAIL: y",
  "  check gate ok: z",
  "  check green ok: w",
];

describe("run values", () => {
  it("counts failed checks, hours and the eval score", () => {
    expect(runValues(res(log), 0.8)).toEqual({
      "ci-failure-rate": 0.25,
      "pr-cycle-time-hours": 1.5,
      "eval-pass-rate": 0.8,
    });
  });
  it("adds no eval value without a score and no failures without checks", () => {
    expect(runValues(res(["workflow t"]))).toEqual({
      "ci-failure-rate": 0,
      "pr-cycle-time-hours": 1.5,
    });
  });
});

describe("recordSeries", () => {
  it("appends to the history --maintain reads, newest last", async () => {
    const { host, files } = fakeHost({
      files: { [SERIES]: JSON.stringify({ "ci-failure-rate": [0.5], other: [1] }) },
    });
    await recordSeries(host, res(log), 0.9);
    const s = JSON.parse(files.get(SERIES) ?? "{}");
    expect(s["ci-failure-rate"]).toEqual([0.5, 0.25]);
    expect(s["eval-pass-rate"]).toEqual([0.9]);
    expect(s.other).toEqual([1]);
  });
  it("starts the file when none exists and keeps the last 100", async () => {
    const { host, files } = fakeHost();
    await recordSeries(host, res(log));
    expect(JSON.parse(files.get(SERIES) ?? "{}")["pr-cycle-time-hours"]).toEqual([1.5]);
    const long = fakeHost({
      files: { [SERIES]: JSON.stringify({ "ci-failure-rate": Array(100).fill(0) }) },
    });
    await recordSeries(long.host, res(log));
    const kept = JSON.parse(long.files.get(SERIES) ?? "{}")["ci-failure-rate"];
    expect(kept).toHaveLength(100);
    expect(kept.at(-1)).toBe(0.25);
  });
});
