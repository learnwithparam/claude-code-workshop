import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImpact, planChecks } from "../../scripts/impact.ts";

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const map = parseImpact(read("repo.json"));
// factory/ is not an npm workspace but has its own checks.
const workspaces = [...(read("package.json").workspaces as string[]), "factory"];

describe("impact map", () => {
  it.each(workspaces)("%s has checks and a path entry, so its changes never escalate", (ws) => {
    expect(map.workspaces[ws]?.length).toBeGreaterThan(0);
    expect(planChecks(map, [`${ws}/anything.ts`]).full).toBe(false);
  });

  it("sends every unmapped top-level file to the full gate", () => {
    for (const f of ["Makefile", "package.json", "levels.json", "tests/structure/a.test.ts"])
      expect(planChecks(map, [f]).full).toBe(true);
  });
});
