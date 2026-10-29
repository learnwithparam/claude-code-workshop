import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fakeHost } from "./fake-host.ts";
import { runWorkflow } from "./interpret.ts";
import { loadWorkflow } from "./workflow.ts";

const dir = ".factory/workflows";
const files = readdirSync(dir).filter((f) => f.endsWith(".yaml"));
const agents = new Set(readdirSync(".claude/agents").map((f) => f.replace(/\.md$/, "")));

describe.each(files)("workflow %s", (file) => {
  const text = readFileSync(`${dir}/${file}`, "utf8");
  const wf = loadWorkflow(text);

  it("names its method and source in the header comment", () => {
    expect(text.split("\n")[0]).toMatch(/^# Method: .+/);
    expect(wf.method.length).toBeGreaterThan(0);
    expect(wf.source.length).toBeGreaterThan(0);
  });
  it("uses only agents that exist in .claude/agents", () => {
    for (const s of wf.steps) expect(agents.has(s.agent), `${s.stage}: ${s.agent}`).toBe(true);
  });
  it("dry-runs every step in order", async () => {
    const {
      host: base,
      files: fs,
      calls,
    } = fakeHost({
      files: { "specs/1/plan.md": "plan", "specs/1/a.test.ts": "t" },
      changed: ["specs/1/plan.md", "specs/1/a.test.ts"],
      exec: [{ match: "npx vitest", ref: "base", result: { code: 1, output: "red" } }],
    });
    // A person approves a gate only after reading what its stage produced.
    const host = {
      ...base,
      approved: async (_n: number, stage: string) =>
        calls.some((c) => c.startsWith("agent ") && c.endsWith(` ${stage}`)),
    };
    const r = await runWorkflow(host, wf, 1, "t");
    expect(r.outcome).toBe("done");
    expect(Object.keys(r.rounds)).toEqual(wf.steps.filter((s) => s.agent).map((s) => s.stage));
    expect(fs.get("specs/1/run.log")).toContain(`workflow ${wf.name}`);
  });
});

describe("workflow set", () => {
  it("covers every task type the plan names", () => {
    const names = files.map((f) => f.replace(".yaml", ""));
    for (const n of [
      "bug-tdd",
      "feature-atdd",
      "feature-bdd",
      "feature-sdd",
      "refactor",
      "ui-visual",
      "llm-eval",
      "contract",
      "deps",
      "security",
      "spike",
      "docs",
      "incident",
    ])
      expect(names).toContain(n);
  });
  it("keeps holdout cases unreadable to the builder's tools", () => {
    const settings = JSON.parse(readFileSync(".claude/settings.json", "utf8"));
    expect(settings.permissions.deny).toContain("Read(.factory/holdout/**)");
  });
});
