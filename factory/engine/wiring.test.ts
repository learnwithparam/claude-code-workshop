import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHECKS } from "./checks/index.ts";
import { fakeHost } from "./fake-host.ts";
import { runWorkflow } from "./interpret.ts";
import { loadWorkflow } from "./workflow.ts";

const wf = (steps: string) =>
  loadWorkflow(`name: t\nmethod: m\nsource: s\nfor: f\nsteps:\n${steps}`);
const finding = { file: "a.ts", line: 3, severity: "important", claim: "bad", evidence: "x=null" };
const reviewStep =
  "  - {stage: review, agent: reviewer, review: {lenses: [reviewer, test-reviewer]}}";

describe("the review step runs lenses and voters", () => {
  it("runs every lens, three voters per finding, and writes review.json", async () => {
    const { host, calls, files } = fakeHost({
      byAgent: (name) => ({
        text: name === "verifier" ? "yes" : name === "reviewer" ? JSON.stringify([finding]) : "[]",
      }),
    });
    // The fixer cannot clear the finding, so the run stops with the finding on file.
    const r = await runWorkflow(host, wf(reviewStep), 4, "t");
    expect(calls).toContain("agent reviewer review");
    expect(calls).toContain("agent test-reviewer review");
    expect(calls.filter((c) => c === "agent verifier review-vote").length).toBeGreaterThanOrEqual(
      3,
    );
    expect(JSON.parse(files.get("specs/4/review.json") ?? "{}").findings).toHaveLength(1);
    expect(r.outcome).toBe("needs-human");
    expect(r.stoppedAt).toBe("review");
  });
  it("passes when no finding survives the vote", async () => {
    const { host } = fakeHost({
      byAgent: (name) => ({
        text: name === "verifier" ? "no" : name === "reviewer" ? JSON.stringify([finding]) : "[]",
      }),
    });
    expect((await runWorkflow(host, wf(reviewStep), 4, "t")).outcome).toBe("done");
  });
  it("stops when a lens replies with something that is not findings", async () => {
    const { host } = fakeHost({ agents: [{ text: "looks fine" }] });
    expect((await runWorkflow(host, wf(reviewStep), 4, "t")).outcome).toBe("needs-human");
  });
});

describe("the human gate takes its approval count from the risk tier", () => {
  const gate = wf("  - {stage: spec, agent: planner, gate: human}");
  it("needs one approval for a medium change and two for a high one", async () => {
    const one = fakeHost({ approvals: ["5:spec"], changed: ["specs/5/spec.md"] });
    expect((await runWorkflow(one.host, gate, 5, "t")).outcome).toBe("done");
    const high = fakeHost({ approvals: ["5:spec"], changed: [".github/workflows/ci.yml"] });
    const r = await runWorkflow(high.host, gate, 5, "t");
    expect(r.outcome).toBe("awaiting-approval");
    expect(r.log.join("\n")).toContain("tier high needs 2");
    const two = fakeHost({
      approvals: ["5:spec", "5:spec"],
      changed: [".github/workflows/ci.yml"],
    });
    expect((await runWorkflow(two.host, gate, 5, "t")).outcome).toBe("done");
  });
  it("still needs one person for a docs-only change", async () => {
    const { host } = fakeHost({ changed: ["docs/a.md"] });
    expect((await runWorkflow(host, gate, 5, "t")).outcome).toBe("awaiting-approval");
  });
});

describe("a check names a script that exists", () => {
  it("prepush and eval run files in this repo", async () => {
    for (const name of ["prepush", "eval"]) {
      const { host, calls } = fakeHost();
      await CHECKS[name]?.run({ host, n: 1 });
      const paths = calls
        .flatMap((c) => c.split(" "))
        .filter((a) => a.endsWith(".ts") && a.includes("/"));
      expect(paths.length, name).toBeGreaterThan(0);
      for (const p of paths) expect(existsSync(p), `${name}: ${p}`).toBe(true);
    }
  });
});

describe("feature-sdd carries the Spec Kit stages", () => {
  const sdd = loadWorkflow(readFileSync(".factory/workflows/feature-sdd.yaml", "utf8"));
  it("orders constitution, spec, clarify, plan, tasks, analyze before the tests", () => {
    const order = sdd.steps.map((s) => s.stage);
    const at = (s: string) => order.indexOf(s);
    for (const s of ["constitution", "clarify", "tasks", "analyze"])
      expect(at(s)).toBeGreaterThan(-1);
    expect(at("constitution")).toBeLessThan(at("spec"));
    expect(at("spec")).toBeLessThan(at("clarify"));
    expect(at("clarify")).toBeLessThan(at("plan"));
    expect(at("plan")).toBeLessThan(at("tasks"));
    expect(at("tasks")).toBeLessThan(at("analyze"));
    expect(at("analyze")).toBeLessThan(at("tests"));
  });
  it("saves each new stage as its own artifact", () => {
    for (const s of ["constitution", "clarify", "tasks", "analyze"])
      expect(sdd.steps.find((x) => x.stage === s)?.writes).toBe(`${s}.md`);
  });
});

describe("every workflow review step runs lenses", () => {
  it("names at least two lenses and uses the voting path", () => {
    for (const f of ["bug-tdd", "feature-sdd", "security", "deps"]) {
      const w = loadWorkflow(readFileSync(`.factory/workflows/${f}.yaml`, "utf8"));
      expect(w.steps.find((s) => s.stage === "review")?.review?.lenses.length, f).toBeGreaterThan(
        1,
      );
    }
  });
});
