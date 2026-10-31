import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadConfig, STAGE_NAMES } from "../../factory/config.ts";
import { resolveModel } from "../../factory/engine/models.ts";
import { loadWorkflow } from "../../factory/engine/workflow.ts";

// Assignment: a model for every stage name. Skipped until you start: ASSIGNMENT=1 npx vitest run tests/assignments
const on = process.env.ASSIGNMENT === "1";
const cfg = loadConfig();
const dir = ".factory/workflows";
const steps = readdirSync(dir)
  .filter((f) => f.endsWith(".yaml"))
  .flatMap((f) =>
    loadWorkflow(readFileSync(`${dir}/${f}`, "utf8")).steps.map((s) => ({
      file: f,
      stage: s.stage,
    })),
  );

describe.skipIf(!on)("assignment: every stage name resolves to a config stage", () => {
  it("maps each workflow stage name in stepStages or names a stage itself", () => {
    const unmapped = steps
      .filter(
        ({ stage }) =>
          !(stage in cfg.stepStages) && !(STAGE_NAMES as readonly string[]).includes(stage),
      )
      .map(({ file, stage }) => `${file}: ${stage}`);
    expect(unmapped).toEqual([]);
  });

  it("resolves every step to an allowed model", () => {
    for (const { stage } of steps)
      expect(cfg.allowedModels).toContain(resolveModel({ cfg, step: stage, type: "feature-atdd" }));
  });
});
