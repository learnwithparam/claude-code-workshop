import { describe, expect, it } from "vitest";
import { fakeHost } from "./fake-host.ts";
import { runWorkflow } from "./interpret.ts";
import { loadWorkflow } from "./workflow.ts";

const wf = (steps: string) =>
  loadWorkflow(`name: t\nmethod: m\nsource: s\nfor: f\nsteps:\n${steps}`);
const one = "  - {stage: spec, agent: planner}";
const retro = (revert = async () => {}) => ({ evalCmd: ["eval"] as [string, ...string[]], revert });
const none = (name: string) => (name === "planner" ? { text: "PROPOSAL: none" } : undefined);

describe("retro runs at the end of a finished run", () => {
  it("runs once after a done run and logs the outcome", async () => {
    const { host, calls, files } = fakeHost({
      byAgent: none,
      exec: [{ match: "eval", result: { code: 0, output: "SCORE 1" } }],
    });
    const r = await runWorkflow(host, wf(one), 6, "t", { retro: retro() });
    expect(r.outcome).toBe("done");
    expect(calls.filter((c) => c === "agent planner retro")).toHaveLength(1);
    expect(files.get("specs/6/run.log")).toContain("retro none");
  });
  it("does not run when the run stopped for a human", async () => {
    const { host, calls } = fakeHost({
      byAgent: none,
      exec: [{ match: "eval", result: { code: 0, output: "SCORE 1" } }],
    });
    const gate = wf("  - {stage: spec, agent: planner, gate: human}");
    const r = await runWorkflow(host, gate, 6, "t", { retro: retro() });
    expect(r.outcome).toBe("awaiting-approval");
    expect(calls.filter((c) => c.endsWith(" retro"))).toHaveLength(0);
  });
  it("logs a broken eval and still finishes done", async () => {
    const { host, files } = fakeHost({
      byAgent: none,
      exec: [{ match: "eval", result: { code: 0, output: "no score here" } }],
    });
    const r = await runWorkflow(host, wf(one), 6, "t", { retro: retro() });
    expect(r.outcome).toBe("done");
    expect(files.get("specs/6/run.log")).toContain("retro error");
  });
  it("proposes nothing when no retro option is given", async () => {
    const { host, calls } = fakeHost({ byAgent: none });
    await runWorkflow(host, wf(one), 6, "t");
    expect(calls.filter((c) => c.endsWith(" retro"))).toHaveLength(0);
  });
});

describe("a workflow step can run the merge queue and a release", () => {
  const head = { match: "git rev-parse HEAD", result: { code: 0, output: "c1\n" } };
  it("runs the merge queue as a step and stops the run when it fails", async () => {
    const ok = fakeHost();
    const w = wf("  - {stage: queue, deploy: merge-queue}");
    expect((await runWorkflow(ok.host, w, 6, "t")).outcome).toBe("done");
    expect(ok.calls).toContain("exec make check");
    expect(ok.calls.some((c) => c.startsWith("agent"))).toBe(false);
    const bad = fakeHost({ exec: [{ match: "make check", result: { code: 1, output: "red" } }] });
    const r = await runWorkflow(bad.host, w, 6, "t");
    expect(r).toMatchObject({ outcome: "needs-human", stoppedAt: "queue" });
  });
  it("releases production only with the tier's approvals", async () => {
    const w = wf("  - {stage: ship, deploy: production}");
    const no = fakeHost({ changed: ["src/a.ts"], exec: [head] });
    const r = await runWorkflow(no.host, w, 6, "t");
    expect(r.outcome).toBe("needs-human");
    expect(no.calls.some((c) => c.startsWith("exec make deploy"))).toBe(false);
    const yes = fakeHost({ changed: ["src/a.ts"], approvals: ["6:ship"], exec: [head] });
    expect((await runWorkflow(yes.host, w, 6, "t")).outcome).toBe("done");
    expect(yes.calls).toContain("exec make deploy ENV=production");
  });
  it("releases a preview without approvals", async () => {
    const { host, calls } = fakeHost({ exec: [head] });
    await runWorkflow(host, wf("  - {stage: ship, deploy: preview}"), 6, "t");
    expect(calls).toContain("exec make deploy ENV=preview");
  });
});
