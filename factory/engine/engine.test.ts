import { describe, expect, it } from "vitest";
import { artifactDigest, badPlanLines, planDrift } from "./artifacts.ts";
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
  it("saves a read-only agent's reply as the step's artifact, and nothing when it failed", async () => {
    const plan = wf("  - {stage: plan, agent: planner, writes: plan.md}");
    const ok = fakeHost({ agents: [{ text: "shared/src/a.ts" }] });
    await runWorkflow(ok.host, plan, 3, "t");
    expect(ok.files.get("specs/3/plan.md")).toBe("shared/src/a.ts\n");
    const bad = fakeHost({ agents: [{ text: "partial", failed: "timeout" }] });
    await runWorkflow(bad.host, plan, 3, "t");
    expect(bad.files.has("specs/3/plan.md")).toBe(false);
  });
  it("refuses a plan that is prose or names gate-owned or parent paths, and saves none of it", async () => {
    const plan = wf("  - {stage: plan, agent: planner, writes: plan.md}");
    for (const text of [
      "I will edit shared/src/a.ts",
      ".github/workflows/check.yml",
      ".claude/settings.json",
      "../outside.ts",
      "factory/engine/checks/red.ts",
      "Package.json",
      "web/package.json",
      "api/tsconfig.build.json",
      "Makefile",
      "/etc/passwd",
      "shared/**",
    ]) {
      const { host, files } = fakeHost({ agents: [{ text }] });
      const r = await runWorkflow(host, plan, 3, "t");
      expect(files.has("specs/3/plan.md"), text).toBe(false);
      expect(r.outcome).toBe("needs-human");
    }
  });
  it("drops plan lines under specs/<n>/ instead of refusing the plan", async () => {
    // Run 27 listed specs/27/intent.md, which the runner allows anyway, and the whole plan was refused.
    const plan = wf("  - {stage: plan, agent: planner, writes: plan.md}");
    const { host, files } = fakeHost({ agents: [{ text: "shared/src/a.ts\nspecs/3/intent.md" }] });
    expect((await runWorkflow(host, plan, 3, "t")).outcome).toBe("done");
    expect(files.get("specs/3/plan.md")).toBe("shared/src/a.ts\n");
  });
  it("refuses a reply that does not begin as the step requires, and saves nothing", async () => {
    // Run 28 saved the planner's chat apology as the spec, and it reached the amigos gate as if it were Gherkin.
    const scenarios = wf(
      '  - {stage: scenarios, agent: planner, writes: spec.md, startsWith: "Feature:"}',
    );
    const chat = fakeHost({
      agents: [{ text: "I drafted the scenarios, but plan mode blocks edits." }],
    });
    expect((await runWorkflow(chat.host, scenarios, 4, "t")).outcome).toBe("needs-human");
    expect(chat.files.has("specs/4/spec.md")).toBe(false);
    const real = fakeHost({ agents: [{ text: "\nFeature: kinds\n  Scenario: one" }] });
    expect((await runWorkflow(real.host, scenarios, 4, "t")).outcome).toBe("done");
    expect(real.files.get("specs/4/spec.md")).toBe("Feature: kinds\n  Scenario: one\n");
  });
  it("retries a refused reply instead of ending the run, and tells the agent why", async () => {
    // Run 35 stopped three times on one chat reply from the planner; a second try wrote the spec.
    const scenarios = wf(
      '  - {stage: scenarios, agent: planner, writes: spec.md, startsWith: "Feature:"}',
    );
    const { host, files, prompts } = fakeHost({
      agents: [{ text: "Plan mode blocks edits." }, { text: "Feature: kinds\n  Scenario: one" }],
    });
    expect((await runWorkflow(host, scenarios, 4, "t")).outcome).toBe("done");
    expect(files.get("specs/4/spec.md")).toContain("Feature: kinds");
    expect(prompts[1]).toContain('the reply must begin with "Feature:"');
  });
  it("tells a step that has `writes` to reply, not to write files", async () => {
    // Run 34: the read-only planner was told to write under specs/<n>/, could not, and replied with plan-mode chatter.
    const { host, prompts } = fakeHost({ agents: [{ text: "R1. When x, the system shall y." }] });
    const spec = wf("  - {stage: spec, agent: planner, writes: spec.md}");
    await runWorkflow(host, spec, 5, "t");
    expect(prompts[0]).toContain("runner saves your reply as specs/5/spec.md");
    expect(prompts[0]).not.toContain("Write this stage's artifacts");
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
  it("on resume skips every step before the last approved gate, so the signed artifacts stay put", async () => {
    // Run 28 reran its scenarios stage on resume, the spec changed, and the approval no longer matched.
    const two = wf(
      "  - {stage: scenarios, agent: planner}\n  - {stage: amigos, agent: reviewer, gate: human}\n  - {stage: build, agent: builder}",
    );
    const { host, calls } = fakeHost({ approvals: ["4:amigos"] });
    const r = await runWorkflow(host, two, 4, "t");
    expect(r.outcome).toBe("done");
    expect(calls.filter((c) => c.startsWith("agent"))).toHaveLength(1);
  });
  it("digest tells a missing file from an empty one and a moved boundary from the same text", async () => {
    const d = (files: Record<string, string>) =>
      artifactDigest(fakeHost({ files }).host, 5, "spec");
    expect(await d({ "specs/5/spec.md": "" })).not.toBe(await d({}));
    expect(await d({ "specs/5/spec.md": "a\nb" })).not.toBe(
      await d({ "specs/5/spec.md": "a", "specs/5/intent.md": "b" }),
    );
  });
  it("keeps a spec or plan approval valid after later stages change other files", async () => {
    // Run 34: the build changed code, so the approved spec hashed differently and a resume regenerated it.
    const d = (stage: string, files: Record<string, string>) =>
      artifactDigest(fakeHost({ files: { "specs/6/spec.md": "s", ...files } }).host, 6, stage);
    expect(await d("spec", {})).toBe(
      await d("spec", { "specs/6/plan.md": "p", "shared/a.ts": "x" }),
    );
    expect(await d("plan", { "specs/6/plan.md": "p" })).toBe(
      await d("plan", { "specs/6/plan.md": "p", "shared/a.ts": "x" }),
    );
    expect(await d("plan", { "specs/6/plan.md": "p" })).not.toBe(
      await d("plan", { "specs/6/plan.md": "q" }),
    );
  });
  it("binds an approval to the artifact digest, so edited artifacts need a new one", async () => {
    const gated = wf("  - {stage: spec, agent: planner, gate: human}");
    const stale = fakeHost({
      files: { "specs/3/spec.md": "v2" },
      approvals: ["3:spec:not-this-hash"],
    });
    expect((await runWorkflow(stale.host, gated, 3, "t")).outcome).toBe("awaiting-approval");
    const digest = await artifactDigest(
      fakeHost({ files: { "specs/3/spec.md": "v2" } }).host,
      3,
      "spec",
    );
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
  it("plan-drift fails on a stray file, even when plan.md is in the diff", () => {
    expect(planDrift("a.ts", ["a.ts", "b.ts"], 1)).toEqual(["b.ts"]);
    expect(planDrift("a.ts", ["b.ts", "specs/1/plan.md"], 1)).toEqual(["b.ts"]);
    expect(planDrift("- `a.ts`\n* b.ts\n", ["a.ts", "b.ts"], 1)).toEqual([]);
    // A path that only appears inside a longer one is not listed.
    expect(planDrift("src/a.ts.bak", ["a.ts"], 1)).toEqual(["a.ts"]);
  });
  it("plan-drift lets regenerated golden snapshots through, since a human reviews them at the feedback gate", () => {
    // Run 29 changed icons, the goldens were regenerated, and the plan could not list them: the gate owns that folder.
    const snap = "specs/25/golden/__snapshots__/early-reader.html";
    expect(planDrift("a.ts", ["a.ts", snap], 29)).toEqual([]);
    // Only snapshot files in a numbered spec's folder: no traversal, no scripts dressed as snapshots.
    for (const bad of [
      "specs/../golden/__snapshots__/a.html",
      "specs/25/golden/__snapshots__/a.ts",
      "specs/25/golden/__snapshots__/sub/a.html",
    ])
      expect(planDrift("a.ts", [bad], 29)).toEqual([bad]);
    expect(planDrift("a.ts", ["specs/25/golden/other.test.ts"], 29)).toEqual([
      "specs/25/golden/other.test.ts",
    ]);
  });
});

describe("badPlanLines for another spec's golden test", () => {
  it("lets a plan list an older spec's golden test, which the lock check already protects", () => {
    expect(badPlanLines("specs/31/golden/sse-contract.golden.test.ts")).toEqual([]);
  });
  it("still refuses golden snapshots and other golden files", () => {
    const plan = "specs/31/golden/__snapshots__/a.html\nspecs/31/golden/data.json";
    expect(badPlanLines(plan)).toEqual(plan.split("\n"));
  });
});

describe("badPlanLines for a dependency update", () => {
  it("lists manifests only when the workflow allows them, and never a script", () => {
    const plan = "package.json\npackage-lock.json\nscripts/x.ts";
    expect(badPlanLines(plan)).toEqual(["package.json", "package-lock.json", "scripts/x.ts"]);
    expect(badPlanLines(plan, true)).toEqual(["scripts/x.ts"]);
  });
});
