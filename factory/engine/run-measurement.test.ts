import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { fakeHost } from "./fake-host.ts";
import { runWorkflow } from "./interpret.ts";
import { loadWorkflow } from "./workflow.ts";

const wf = (steps: string) =>
  loadWorkflow(`name: t\nmethod: m\nsource: s\nfor: f\nsteps:\n${steps}`);

describe("run measurement", () => {
  const one = wf("  - {stage: build, agent: builder, checks: []}");
  it("stamps the run and every stage with ISO start and finish times", async () => {
    const { host } = fakeHost();
    const r = await runWorkflow(host, one, 1, "t");
    const iso = /^\d{4}-\d\d-\d\dT[\d:.]+Z$/;
    expect(r.startedAt).toMatch(iso);
    expect(r.finishedAt).toMatch(iso);
    expect(r.stages.build?.startedAt).toMatch(iso);
    expect(r.stages.build?.finishedAt).toMatch(iso);
  });
  it("commits the run log only when asked to", async () => {
    const asked = fakeHost();
    await runWorkflow(asked.host, one, 1, "t", { commitLog: true });
    expect(asked.calls.filter((c) => c.startsWith("commit"))).toEqual([
      "commit factory run log #1 -- specs/1/run.log",
    ]);
    expect(asked.files.has("specs/1/run.log")).toBe(true);
    const quiet = fakeHost();
    await runWorkflow(quiet.host, one, 1, "t");
    expect(quiet.calls.filter((c) => c.startsWith("commit"))).toEqual([]);
  });
  it("does not git-ignore the run log", () => {
    const r = spawnSync("git", ["check-ignore", "-q", "specs/1/run.log"]);
    expect(r.status).toBe(1);
  });
});
