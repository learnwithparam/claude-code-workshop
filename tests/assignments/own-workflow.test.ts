import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadWorkflow } from "../../factory/engine/workflow.ts";

// Assignment: a workflow from your own company. Skipped until you start: ASSIGNMENT=1 npx vitest run tests/assignments
// Set WORKFLOW=<name> to the file you wrote in .factory/workflows/.
const on = process.env.ASSIGNMENT === "1";
const name = process.env.WORKFLOW ?? "";
const file = `.factory/workflows/${name}.yaml`;

describe.skipIf(!on)("assignment: a workflow from your own company", () => {
  it("is a file in the workflows folder", () => {
    expect(name, "set WORKFLOW=<name>").not.toBe("");
    expect(readdirSync(".factory/workflows")).toContain(`${name}.yaml`);
  });

  it("starts with a Method line, names its source and loads", () => {
    const text = readFileSync(file, "utf8");
    expect(text.startsWith("# Method:")).toBe(true);
    const wf = loadWorkflow(text);
    expect(wf.name).toBe(name);
    expect(wf.source.length).toBeGreaterThan(0);
  });

  it("gates its main step with a check, so the model's word is never the proof", () => {
    const wf = loadWorkflow(readFileSync(file, "utf8"));
    expect(wf.steps.some((s) => (s.checks ?? []).length > 0)).toBe(true);
  });
});
