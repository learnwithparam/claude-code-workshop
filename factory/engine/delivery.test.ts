import { describe, expect, it } from "vitest";
import { deliver, dependencyOrder } from "./delivery.ts";
import { fakeHost } from "./fake-host.ts";
import { loadWorkflow } from "./workflow.ts";

const wf = loadWorkflow(
  "name: t\nmethod: m\nsource: s\nfor: f\nsteps:\n  - {stage: build, agent: builder, checks: [green]}",
);
const sub = (number: number, dependsOn: number[] = []) => ({
  number,
  apiChange: false,
  small: true,
  dependsOn,
});
const ticket = (n: number) => `issue ${n}`;

describe("dependencyOrder", () => {
  it("puts a dependency before what needs it", () => {
    expect(dependencyOrder([sub(2, [1]), sub(1)])).toEqual([sub(1), sub(2, [1])]);
  });
  it("refuses a cycle", () => {
    expect(dependencyOrder([sub(1, [2]), sub(2, [1])])).toEqual({
      error: expect.stringMatching(/cycle/),
    });
  });
});

describe("deliver", () => {
  it("runs independent sub-issues as separate PRs, with no commits from the engine", async () => {
    const { host, calls } = fakeHost();
    const r = await deliver(host, wf, [sub(1), sub(2)], ticket);
    expect(r).toMatchObject({ delivery: "separate-prs" });
    expect(calls.filter((c) => c.startsWith("commit"))).toEqual([]);
    expect(calls.filter((c) => c.startsWith("agent"))).toHaveLength(2);
  });
  it("commits once per coupled sub-issue, in dependency order", async () => {
    const { host, calls } = fakeHost();
    const r = await deliver(host, wf, [sub(2, [1]), sub(1)], ticket);
    expect(r).toMatchObject({ delivery: "single-pr-commits" });
    expect(calls.filter((c) => c.startsWith("commit"))).toEqual(["commit #1", "commit #2"]);
  });
  it("stops at the first sub-issue that does not finish", async () => {
    const { host, calls } = fakeHost({
      exec: [{ match: "npx vitest run specs/1", result: { code: 1, output: "boom" } }],
    });
    const r = await deliver(host, wf, [sub(2, [1]), sub(1)], ticket);
    expect(r).toMatchObject({ stoppedAt: 1 });
    expect(calls.filter((c) => c.startsWith("agent"))).toHaveLength(1);
  });
  it("refuses an epic with a dependency outside it", async () => {
    const { host } = fakeHost();
    expect(await deliver(host, wf, [sub(1, [9])], ticket)).toEqual({ error: expect.any(String) });
  });
});
