import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { affectedLevels, CI_LEVELS } from "./affected-levels.ts";

describe("affectedLevels", () => {
  it("a trunk file reaches every level", () => {
    expect(affectedLevels(["Makefile"])).toEqual(CI_LEVELS);
  });
  it("a level's own file reaches that level and the ones after it", () => {
    const hit = affectedLevels(["docs/levels/delivery.md"]);
    expect(hit[0]).toBe("delivery");
    expect(hit).not.toContain("boundary");
    expect(hit).toContain("sharing");
  });
  it("a file no level owns reaches none", () => {
    expect(affectedLevels(["not-owned/anywhere.txt"])).toEqual([]);
  });
});

describe("check.yml", () => {
  const wf = parse(readFileSync(".github/workflows/check.yml", "utf8"));
  it("takes the level matrix from the selector, so there is one list", () => {
    expect(wf.jobs.levels.strategy.matrix.level).toContain("fromJSON");
    expect(wf.jobs.levels.needs).toBe("select");
  });
});
