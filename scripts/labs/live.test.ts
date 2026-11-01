import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Lab } from "./catalog.ts";
import type { CliDeps } from "./cli.ts";
import { runLive } from "./live.ts";
import { loadProgress, saveProgress } from "./progress.ts";

const lab: Lab = {
  id: "start-01",
  lane: "start",
  title: "First prompt",
  pairs: "docs/README.md",
  goal: "Ask one question.",
  help: "guided",
  steps: [
    { where: "shell", text: "Make the folder.", expect: "SEE-ONE" },
    { where: "claude", text: "Ask it.", expect: "SEE-TWO" },
    { where: "editor", text: "Save it." },
  ],
  proof: [{ text: "It holds.", command: "p" }],
  hints: ["one", "two"],
  learned: "A prompt is a question.",
  trick: "Press Esc twice to rewind.",
  predict: { question: "Will it edit?", answer: "No." },
};

function setup(ok: boolean, target: Lab = lab) {
  const out: string[] = [];
  const seen: string[] = [];
  const log: string[] = [];
  const dir = mkdtempSync(join(tmpdir(), "labs-live-"));
  const progressPath = join(dir, "progress.json");
  const deps = {
    labs: [target],
    progressPath,
    color: false,
    proof: () => {
      log.push("proof");
      return { ok, output: "boom\n" };
    },
    now: () => "2026-11-01",
    out: (s: string) => out.push(s),
    status: (s: string) => out.push(s),
    isTTY: false,
    // Records everything shown so far each time the learner would press Enter.
    enter: async () => {
      log.push("enter");
      seen.push(out.join("\n"));
    },
  } satisfies CliDeps & { enter: () => Promise<void> };
  saveProgress(progressPath, { done: {}, hints: {}, attempts: {}, path: "pro" });
  return { deps, text: () => out.join("\n"), seen, log, progressPath };
}

describe("runLive", () => {
  it("shows one step, waits for Enter, then reveals that step's Expect", async () => {
    const s = setup(true);
    await runLive(lab, loadProgress(s.progressPath), s.deps);
    expect(s.seen).toHaveLength(3);
    expect(s.seen[0]).toContain("Make the folder.");
    expect(s.seen[0]).not.toContain("Ask it.");
    expect(s.seen[0]).not.toContain("SEE-ONE");
    expect(s.seen[1]).toContain("SEE-ONE");
    expect(s.seen[1]).toContain("Ask it.");
    expect(s.seen[1]).not.toContain("SEE-TWO");
    expect(s.seen[2]).toContain("SEE-TWO");
    expect(s.text()).toContain("Save it.");
  });

  it("runs the proofs only after the last Enter, then prints the trick and records the pass", async () => {
    const s = setup(true);
    expect(await runLive(lab, loadProgress(s.progressPath), s.deps)).toBe(0);
    expect(s.log).toEqual(["enter", "enter", "enter", "proof"]);
    expect(s.text()).toContain("PASS start-01");
    expect(s.text()).toContain("Trick to keep: Press Esc twice to rewind.");
    expect(loadProgress(s.progressPath).done["start-01"]).toBeDefined();
  });

  it("on a red proof exits 1, names the failure, and prints no trick", async () => {
    const s = setup(false);
    expect(await runLive(lab, loadProgress(s.progressPath), s.deps)).toBe(1);
    expect(s.text()).toContain("FAIL It holds.");
    expect(s.text()).not.toContain("Trick to keep");
    expect(loadProgress(s.progressPath).done["start-01"]).toBeUndefined();
  });

  it("prints no trick line for a lab without one", async () => {
    const { trick: _drop, ...bare } = lab;
    const s = setup(true, bare);
    await runLive(bare, loadProgress(s.progressPath), s.deps);
    expect(s.text()).not.toContain("Trick to keep");
  });

  it("a goal-only lab has no steps to walk, so it shows the proof and runs it", async () => {
    const goal: Lab = { ...lab, help: "goal" };
    const s = setup(true, goal);
    await runLive(goal, loadProgress(s.progressPath), s.deps);
    expect(s.text()).toContain("1. It holds.");
    expect(s.log).toEqual(["proof"]);
  });
});
