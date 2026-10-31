import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadWorkflow } from "../../factory/engine/workflow.ts";

const DIR = ".factory/workflows";
// A spike writes a throwaway note and has no review step.
const files = readdirSync(DIR).filter((f) => f.endsWith(".yaml") && f !== "spike.yaml");

describe("f5-review.md matches the shipped workflows", () => {
  it("has every shipped workflow but spike call the review loop, so no doc may say otherwise", () => {
    for (const f of files) {
      const wf = loadWorkflow(readFileSync(`${DIR}/${f}`, "utf8"));
      expect(
        wf.steps.some((s) => s.review?.lenses.length),
        f,
      ).toBe(true);
    }
  });

  it("does not claim the shipped workflows skip reviewRound", () => {
    const doc = readFileSync("docs/factory/f5-review.md", "utf8");
    expect(doc).not.toMatch(/shipped workflows do not call/i);
  });
});
