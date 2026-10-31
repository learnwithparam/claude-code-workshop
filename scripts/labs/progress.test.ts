import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Lab } from "./catalog.ts";
import {
  currentLab,
  laneStats,
  loadProgress,
  markDone,
  recordAttempt,
  revealHint,
  saveProgress,
} from "./progress.ts";

const lab = (id: string, lane: Lab["lane"]): Lab => ({
  id,
  lane,
  title: id,
  pairs: "docs/README.md",
  goal: "g",
  steps: ["s"],
  proof: "true",
  hints: ["a", "b"],
  learned: "l",
});
const labs = [lab("start-01", "start"), lab("start-02", "start"), lab("daily-01", "daily")];

describe("progress", () => {
  it("starts empty when the file is missing or corrupt", () => {
    const dir = mkdtempSync(join(tmpdir(), "labs-"));
    expect(loadProgress(join(dir, "none.json"))).toEqual({ done: {}, hints: {}, attempts: {} });
    writeFileSync(join(dir, "bad.json"), "{nope");
    expect(loadProgress(join(dir, "bad.json"))).toEqual({ done: {}, hints: {}, attempts: {} });
    writeFileSync(join(dir, "shape.json"), '{"done":[1]}');
    expect(loadProgress(join(dir, "shape.json"))).toEqual({ done: {}, hints: {}, attempts: {} });
  });

  it("round-trips through the file", () => {
    const dir = mkdtempSync(join(tmpdir(), "labs-"));
    const file = join(dir, "sub", "progress.json");
    saveProgress(file, markDone({ done: {}, hints: {}, attempts: {} }, "start-01", "2026-10-30"));
    expect(loadProgress(file).done["start-01"]).toBe("2026-10-30");
    expect(readFileSync(file, "utf8")).toContain("start-01");
  });

  it("current lab is the first one not done", () => {
    expect(currentLab(labs, { done: {}, hints: {}, attempts: {} })?.id).toBe("start-01");
    expect(currentLab(labs, { done: { "start-01": "x" }, hints: {}, attempts: {} })?.id).toBe(
      "start-02",
    );
    const all = {
      done: { "start-01": "x", "start-02": "x", "daily-01": "x" },
      hints: {},
      attempts: {},
    };
    expect(currentLab(labs, all)).toBeUndefined();
  });

  it("reveals hints one at a time and stops at the last", () => {
    let p = { done: {}, hints: {}, attempts: {} };
    const first = revealHint(p, labs[0] as Lab);
    expect(first.revealed).toBe(1);
    p = first.progress;
    const second = revealHint(p, labs[0] as Lab);
    expect(second.revealed).toBe(2);
    expect(revealHint(second.progress, labs[0] as Lab).revealed).toBe(2);
  });

  it("counts attempts per lab and reads an old file without them", () => {
    const dir = mkdtempSync(join(tmpdir(), "labs-"));
    const p = recordAttempt({ done: {}, hints: {}, attempts: {} }, "start-01");
    expect(p.attempts).toEqual({ "start-01": 1 });
    expect(recordAttempt(p, "start-01").attempts["start-01"]).toBe(2);
    writeFileSync(join(dir, "old.json"), '{"done":{},"hints":{}}');
    expect(loadProgress(join(dir, "old.json")).attempts).toEqual({});
  });

  it("counts per lane", () => {
    const stats = laneStats(labs, { done: { "start-01": "x" }, hints: {}, attempts: {} });
    expect(stats.find((s) => s.lane === "start")).toMatchObject({ done: 1, total: 2 });
    expect(stats.find((s) => s.lane === "team")).toMatchObject({ done: 0, total: 0 });
  });
});
