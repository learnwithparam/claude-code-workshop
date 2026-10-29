import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fakeHost } from "./fake-host.ts";
import { runWorkflow } from "./interpret.ts";
import { loadWorkflow } from "./workflow.ts";

const dir = ".factory/workflows";
const files = readdirSync(dir).filter((f) => f.endsWith(".yaml"));
// The planner has no Write tool, so these stages only produce an artifact if the runner saves the reply.
const ARTIFACT_STAGES = new Set(["intent", "spec", "plan"]);
const agents = new Set(readdirSync(".claude/agents").map((f) => f.replace(/\.md$/, "")));

describe.each(files)("workflow %s", (file) => {
  const text = readFileSync(`${dir}/${file}`, "utf8");
  const wf = loadWorkflow(text);

  it("names its method and source in the header comment", () => {
    expect(text.split("\n")[0]).toMatch(/^# Method: .+/);
    expect(wf.method.length).toBeGreaterThan(0);
    expect(wf.source.length).toBeGreaterThan(0);
  });
  it("lets the plan list manifests only if a step holds them to dependency fields", () => {
    const guarded = wf.steps.some((s) => s.checks.includes("manifest-deps"));
    expect(wf.manifests ? guarded : true).toBe(true);
  });
  it("uses only agents that exist in .claude/agents", () => {
    for (const s of wf.steps) expect(agents.has(s.agent), `${s.stage}: ${s.agent}`).toBe(true);
  });
  it("dry-runs every step in order", async () => {
    // A deps workflow must change a manifest to pass, so its dry run bumps one dependency.
    const manifest = (v: string) => JSON.stringify({ dependencies: { zod: v } });
    const [before, bumped] = [manifest("^4.0.0"), manifest("^4.1.0")];
    const plan = wf.manifests ? "plan\npackage.json" : "plan";
    const {
      host: base,
      files: fs,
      calls,
    } = fakeHost({
      files: {
        "specs/1/plan.md": plan,
        "specs/1/a.test.ts": "t",
        ...(wf.manifests ? { "package.json": bumped } : {}),
      },
      changed: ["specs/1/plan.md", "specs/1/a.test.ts", ...(wf.manifests ? ["package.json"] : [])],
      exec: [
        { match: "npx vitest", ref: "base", result: { code: 1, output: "red" } },
        { match: "git show HEAD:package.json", ref: "base", result: { code: 0, output: before } },
      ],
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

describe("plan-drift needs a plan", () => {
  it.each(files)("%s writes plan.md before it checks plan-drift", (file) => {
    const wf = loadWorkflow(readFileSync(`${dir}/${file}`, "utf8"));
    const at = wf.steps.findIndex((s) => s.checks?.includes("plan-drift"));
    if (at < 0) return;
    expect(wf.steps.slice(0, at + 1).some((s) => s.stage === "plan")).toBe(true);
  });
});

describe("read-only planner stages", () => {
  it.each(files)("%s saves each planner artifact through the runner", (file) => {
    const wf = loadWorkflow(readFileSync(`${dir}/${file}`, "utf8"));
    for (const s of wf.steps.filter((x) => x.agent === "planner" && ARTIFACT_STAGES.has(x.stage)))
      expect(s.writes, `${file} ${s.stage}`).toBe(`${s.stage}.md`);
  });
});

describe("every step knows its job", () => {
  // A final review step has no work to brief: it only re-runs checks that hold the diff to the plan.
  const REVIEW_ONLY = ["plan-drift", "manifest-deps"];
  it.each(files)("%s gives each step a brief unless it only re-checks the plan", (file) => {
    const wf = loadWorkflow(readFileSync(`${dir}/${file}`, "utf8"));
    for (const s of wf.steps.filter((x) => !x.brief)) {
      expect(s.checks[0], `${file} ${s.stage}`).toBe("plan-drift");
      for (const c of s.checks) expect(REVIEW_ONLY, `${file} ${s.stage}`).toContain(c);
    }
  });
});
