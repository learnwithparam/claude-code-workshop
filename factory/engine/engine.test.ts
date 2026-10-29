import { describe, expect, it } from "vitest";
import { artifactDigest, planDrift } from "./artifacts.ts";
import { lock } from "./checks/lock.ts";
import { red } from "./checks/red.ts";
import { fakeHost } from "./fake-host.ts";
import { runWorkflow } from "./interpret.ts";
import { loadWorkflow } from "./workflow.ts";

const wf = (steps: string) =>
  loadWorkflow(`name: t\nmethod: m\nsource: s\nfor: f\nsteps:\n${steps}`);

describe("workflow schema", () => {
  it("rejects a loop on a check the step does not run", () => {
    expect(() =>
      wf("  - {stage: build, agent: builder, checks: [green], loop: {until: [gate], max: 2}}"),
    ).toThrow(/not in its checks/);
  });
  it("rejects an unknown check", () => {
    expect(() => wf("  - {stage: build, agent: builder, checks: [vibes]}")).toThrow();
  });
});

describe("runWorkflow", () => {
  const loop = wf(
    "  - {stage: fix, agent: builder, checks: [green], loop: {until: [green], max: 3}}",
  );
  it("loops until the check passes, feeding the evidence back", async () => {
    const { host, calls } = fakeHost({
      exec: [{ match: "npx vitest run specs/1", result: { code: 1, output: "boom" } }],
    });
    const r = await runWorkflow(host, loop, 1, "t");
    expect(r.outcome).toBe("needs-human");
    expect(r.rounds.fix).toBe(3);
    expect(calls.filter((c) => c.startsWith("agent"))).toHaveLength(3);
  });
  it("stops at the cap and writes run.log", async () => {
    const { host, files } = fakeHost({
      exec: [{ match: "npx vitest", result: { code: 1, output: "x" } }],
    });
    await runWorkflow(host, loop, 7, "t");
    expect(files.get("specs/7/run.log")).toContain("check green FAIL");
  });
  it("finishes in one round when the check passes", async () => {
    const { host } = fakeHost();
    const r = await runWorkflow(host, loop, 1, "t");
    expect(r).toMatchObject({ outcome: "done", rounds: { fix: 1 } });
  });
  it("stops after a human-gated stage until its artifacts are approved", async () => {
    const gated = wf("  - {stage: spec, agent: planner, gate: human}");
    const a = fakeHost();
    expect((await runWorkflow(a.host, gated, 2, "t")).outcome).toBe("awaiting-approval");
    expect(a.calls).toHaveLength(1);
    const b = fakeHost({ approvals: ["2:spec"] });
    const done = await runWorkflow(b.host, gated, 2, "t");
    expect(done.outcome).toBe("done");
    expect(b.calls).toHaveLength(0);
  });
  it("binds an approval to the artifact digest, so edited artifacts need a new one", async () => {
    const gated = wf("  - {stage: spec, agent: planner, gate: human}");
    const stale = fakeHost({
      files: { "specs/3/spec.md": "v2" },
      approvals: ["3:spec:not-this-hash"],
    });
    expect((await runWorkflow(stale.host, gated, 3, "t")).outcome).toBe("awaiting-approval");
    const digest = await artifactDigest(stale.host, 3);
    const ok = fakeHost({ files: { "specs/3/spec.md": "v2" }, approvals: [`3:spec:${digest}`] });
    expect((await runWorkflow(ok.host, gated, 3, "t")).outcome).toBe("done");
    expect(ok.calls).toHaveLength(0);
  });
  it("turns the test lock on for fix rounds and off after every agent call", async () => {
    const { host, phases } = fakeHost();
    await runWorkflow(host, wf("  - {stage: fix, agent: builder, phase: fix}"), 1, "t");
    expect(phases).toEqual(["fix", null, null]);
  });
});

describe("checks", () => {
  it("red refuses a test that already passes on base", async () => {
    const { host } = fakeHost();
    expect((await red.run({ host, n: 1 })).ok).toBe(false);
  });
  it("red accepts a test that fails on base", async () => {
    const { host } = fakeHost({
      exec: [{ match: "npx vitest", ref: "base", result: { code: 1, output: "" } }],
    });
    expect((await red.run({ host, n: 1 })).ok).toBe(true);
  });
  it("lock catches an edited test", async () => {
    const { host, files } = fakeHost({
      files: { "specs/1/a.test.ts": "expect(1)", "api/old.test.ts": "x" },
    });
    expect((await lock.run({ host, n: 1 })).ok).toBe(true);
    files.set("specs/1/a.test.ts", "expect(2)");
    const r = await lock.run({ host, n: 1 });
    expect(r.ok).toBe(false);
    expect(r.evidence).toContain("a.test.ts");
    // deleting the artifact copy does not reset the baseline, and an untouched old test is covered too
    files.set("specs/1/a.test.ts", "expect(1)");
    files.delete("specs/1/lock.json");
    files.set("api/old.test.ts", "y");
    expect((await lock.run({ host, n: 1 })).evidence).toContain("api/old.test.ts");
  });
  it("plan-drift fails on a stray file and passes when plan.md changes too", () => {
    expect(planDrift("touch a.ts", ["a.ts", "b.ts"], 1)).toEqual(["b.ts"]);
    expect(planDrift("touch a.ts", ["b.ts", "specs/1/plan.md"], 1)).toEqual([]);
  });
});
