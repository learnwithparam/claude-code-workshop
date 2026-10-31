import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { loadPortable } from "../factory/engine/portable.ts";
import { loadWorkflow } from "../factory/engine/workflow.ts";

describe("the factory's maintain loop is scheduled and scored", () => {
  it("make factory-maintain runs --maintain, and a cron workflow runs that target", () => {
    expect(readFileSync("Makefile", "utf8")).toMatch(/factory-maintain:\n\t.*main\.ts --maintain/);
    const wf = parse(readFileSync(".github/workflows/maintain.yml", "utf8"));
    expect(wf.on.schedule[0].cron).toBeTruthy();
    expect(JSON.stringify(wf.jobs)).toContain("make factory-maintain");
  });
  it("the retro scores with a script that prints SCORE", () => {
    const [, , script] = loadPortable().tests.score;
    expect(script).toBe("scripts/eval-score.ts");
  });
  it("at least one shipped workflow has a deploy step", () => {
    const withDeploy = readdirSync(".factory/workflows")
      .map((f) => loadWorkflow(readFileSync(`.factory/workflows/${f}`, "utf8")))
      .filter((w) => w.steps.some((s) => s.deploy));
    expect(withDeploy.length).toBeGreaterThan(0);
  });
});
