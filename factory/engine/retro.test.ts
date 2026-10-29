import { describe, expect, it } from "vitest";
import { fakeHost } from "./fake-host.ts";
import { retro, score } from "./retro.ts";

const PROPOSAL = (file: string) =>
  `PROPOSAL: ${JSON.stringify({ file, change: "say it shorter", why: "two review rounds" })}`;
const EVAL: [string, ...string[]] = ["eval"];

describe("retro", () => {
  it("leaves agent and config proposals to a person", async () => {
    const { host, calls } = fakeHost({
      byAgent: (n) =>
        n === "planner" ? { text: PROPOSAL(".claude/agents/builder.md") } : undefined,
    });
    host.exec = async () => ({ code: 0, output: "SCORE 1" });
    expect(await retro(host, 1, EVAL, async () => {})).toMatchObject({ kind: "error" });
    expect(calls.filter((c) => c === "agent builder retro")).toEqual([]);
  });
  it("keeps a lesson whose eval score did not fall and reports the change", async () => {
    const { host } = fakeHost({
      changed: [".claude/skills/a/SKILL.md"],
      byAgent: (n) =>
        n === "planner" ? { text: PROPOSAL(".claude/skills/a/SKILL.md") } : undefined,
    });
    let i = 0;
    host.exec = async () => ({ code: 0, output: `SCORE ${[0.8, 0.9][i++]}` });
    const r = await retro(host, 1, EVAL, async () => {});
    expect(r).toMatchObject({ kind: "kept", before: 0.8, after: 0.9 });
    expect(r.kind === "kept" && r.delta).toBeCloseTo(0.1);
  });
  it("reverts a lesson that lowered the score", async () => {
    const { host } = fakeHost({
      changed: [".claude/skills/a/SKILL.md"],
      byAgent: (n) =>
        n === "planner" ? { text: PROPOSAL(".claude/skills/a/SKILL.md") } : undefined,
    });
    let i = 0;
    host.exec = async () => ({ code: 0, output: `SCORE ${[0.9, 0.7][i++]}` });
    let reverted = false;
    const r = await retro(host, 1, EVAL, async () => {
      reverted = true;
    });
    expect(r.kind).toBe("reverted");
    expect(reverted).toBe(true);
  });
  it("reverts and errors when the builder touched another file", async () => {
    const { host } = fakeHost({
      changed: [".claude/skills/a/SKILL.md", "api/src/x.ts"],
      byAgent: (n) =>
        n === "planner" ? { text: PROPOSAL(".claude/skills/a/SKILL.md") } : undefined,
    });
    host.exec = async () => ({ code: 0, output: "SCORE 1" });
    let reverted = false;
    const r = await retro(host, 1, EVAL, async () => {
      reverted = true;
    });
    expect(r).toMatchObject({ kind: "error" });
    expect(reverted).toBe(true);
  });
  it("is a no-op when the proposal is none", async () => {
    const { host } = fakeHost({
      byAgent: (n) => (n === "planner" ? { text: "PROPOSAL: none" } : undefined),
    });
    host.exec = async () => ({ code: 0, output: "SCORE 1" });
    expect(await retro(host, 1, EVAL, async () => {})).toEqual({ kind: "none" });
  });
  it("treats a missing SCORE line as a broken eval", async () => {
    const { host } = fakeHost();
    await expect(score(host, "eval", [])).rejects.toThrow(/no SCORE/);
  });
});
