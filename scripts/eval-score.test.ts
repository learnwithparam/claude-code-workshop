import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { evalScore } from "./eval-score.ts";

describe("evalScore", () => {
  it("is the share of rows that are compliant and in band", () => {
    const rows = [
      { compliant: true, bandMatches: true },
      { compliant: true, bandMatches: false },
      { compliant: false },
      { compliant: true },
    ];
    expect(evalScore(JSON.stringify(rows))).toBe(0.5);
  });
  it("refuses an empty record instead of scoring it zero", () => {
    expect(() => evalScore("[]")).toThrow("no eval rows");
  });
  it("prints the line the retro reads, for the committed record", () => {
    const out = execFileSync("npx", ["tsx", "scripts/eval-score.ts"], { encoding: "utf8" });
    expect(out).toMatch(/^SCORE \d(\.\d+)?\n$/);
  });
});
