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
  revealHint,
  saveProgress,
} from "./progress.ts";

const lab = (id: string, lane: Lab["lane"]): Lab => ({
  id,
  lane,
  title: id,
  pairs: "docs/README.md",
  goal: "g",
  help: "guided",
  steps: [{ text: "s" }],
  proof: [{ text: "It holds.", command: "true" }],
  hints: ["a", "b"],
  learned: "l",
});
const labs = [lab("start-01", "start"), lab("start-02", "start"), lab("daily-01", "daily")];

describe("progress", () => {
  it("starts empty when the file is missing or corrupt", () => {
    const dir = mkdtempSync(join(tmpdir(), "labs-"));
    expect(loadProgress(join(dir, "none.json"))).toEqual({ done: {}, hints: {} });
    writeFileSync(join(dir, "bad.json"), "{nope");
    expect(loadProgress(join(dir, "bad.json"))).toEqual({ done: {}, hints: {} });
    writeFileSync(join(dir, "shape.json"), '{"done":[1]}');
    expect(loadProgress(join(dir, "shape.json"))).toEqual({ done: {}, hints: {} });
  });

  it("round-trips through the file", () => {
    const dir = mkdtempSync(join(tmpdir(), "labs-"));
    const file = join(dir, "sub", "progress.json");
    saveProgress(file, markDone({ done: {}, hints: {} }, "start-01", "2026-10-30"));
    expect(loadProgress(file).done["start-01"]).toBe("2026-10-30");
    expect(readFileSync(file, "utf8")).toContain("start-01");
  });

  it("current lab is the first one not done", () => {
    expect(currentLab(labs, { done: {}, hints: {} })?.id).toBe("start-01");
    expect(currentLab(labs, { done: { "start-01": "x" }, hints: {} })?.id).toBe("start-02");
    const all = { done: { "start-01": "x", "start-02": "x", "daily-01": "x" }, hints: {} };
    expect(currentLab(labs, all)).toBeUndefined();
  });

  it("on pro with every team lab done, the current lab is the first advanced lab", () => {
    const all = [
      lab("start-01", "start"),
      lab("daily-01", "daily"),
      lab("team-01", "team"),
      lab("factory-01", "factory"),
      lab("advanced-01", "advanced"),
    ];
    const done = { "start-01": "x", "daily-01": "x", "team-01": "x" };
    expect(currentLab(all, { done, hints: {}, path: "pro" })?.id).toBe("advanced-01");
    expect(currentLab(all, { done, hints: {}, path: "factory" })?.id).toBe("factory-01");
  });

  it("on factory with every daily lab done, the current lab is the first factory lab", () => {
    const all = [
      lab("start-01", "start"),
      lab("daily-01", "daily"),
      lab("team-01", "team"),
      lab("factory-01", "factory"),
    ];
    const done = { "start-01": "x", "daily-01": "x" };
    expect(currentLab(all, { done, hints: {}, path: "factory" })?.id).toBe("factory-01");
    expect(currentLab(all, { done, hints: {}, path: "pro" })?.id).toBe("team-01");
  });

  it("lane stats cover only the chosen path", () => {
    const stats = laneStats(labs, { done: {}, hints: {}, path: "factory" });
    expect(stats.map((s) => s.lane)).toEqual(["start", "daily", "factory"]);
  });

  it("reveals hints one at a time and stops at the last", () => {
    let p = { done: {}, hints: {} };
    const first = revealHint(p, labs[0] as Lab);
    expect(first.revealed).toBe(1);
    p = first.progress;
    const second = revealHint(p, labs[0] as Lab);
    expect(second.revealed).toBe(2);
    expect(revealHint(second.progress, labs[0] as Lab).revealed).toBe(2);
  });

  it("counts per lane", () => {
    const stats = laneStats(labs, { done: { "start-01": "x" }, hints: {} });
    expect(stats.find((s) => s.lane === "start")).toMatchObject({ done: 1, total: 2 });
    expect(stats.find((s) => s.lane === "team")).toMatchObject({ done: 0, total: 0 });
  });
});
