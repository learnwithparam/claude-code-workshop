import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Lab } from "./catalog.ts";
import { type CliDeps, run } from "./cli.ts";
import { loadProgress } from "./progress.ts";

const lab = (id: string, lane: Lab["lane"]): Lab => ({
  id,
  lane,
  title: `Title ${id}`,
  pairs: "docs/README.md",
  goal: `Goal ${id}`,
  steps: ["Do it."],
  proof: `proof-${id}`,
  hints: ["first hint", "second hint"],
  learned: `Learned ${id}`,
  predict: { question: `Question ${id}?`, answer: `Because reason ${id}.` },
});

function setup(passes: boolean, guess?: string) {
  const out: string[] = [];
  const dir = mkdtempSync(join(tmpdir(), "labs-cli-"));
  const deps: CliDeps = {
    labs: [lab("start-01", "start"), lab("start-02", "start")],
    progressPath: join(dir, "progress.json"),
    color: false,
    proof: () => ({ ok: passes, output: "boom line\n" }),
    guess,
    now: () => "2026-10-30",
    out: (s) => out.push(s),
  };
  return { deps, out, text: () => out.join("\n") };
}

describe("cli", () => {
  it("progress prints the lane map and exits 0", () => {
    const s = setup(true);
    expect(run(["progress"], s.deps)).toBe(0);
    expect(s.text()).toContain("start");
    expect(s.text()).toContain("0/2");
  });

  it("lab runs the proof, records a pass, and points at the next lab", () => {
    const s = setup(true);
    expect(run(["lab"], s.deps)).toBe(0);
    expect(s.text()).toContain("PASS start-01");
    expect(s.text()).toContain("Learned start-01");
    expect(s.text()).toContain("start-02");
    expect(loadProgress(s.deps.progressPath).done["start-01"]).toBe("2026-10-30");
  });

  it("a red proof exits 1, shows output and records nothing", () => {
    const s = setup(false);
    expect(run(["lab"], s.deps)).toBe(1);
    expect(s.text()).toContain("FAIL start-01");
    expect(s.text()).toContain("boom line");
    expect(s.text()).not.toContain("first hint");
    expect(loadProgress(s.deps.progressPath).done).toEqual({});
  });

  it("a passing run with a saved guess prints the guess, the answer, then what you learned", () => {
    const s = setup(true, "it edits a file");
    expect(run(["lab"], s.deps)).toBe(0);
    const text = s.text();
    expect(text).toContain("it edits a file");
    expect(text).toContain("Because reason start-01.");
    expect(text.indexOf("Because reason start-01.")).toBeLessThan(
      text.indexOf("What you just learned"),
    );
    expect(loadProgress(s.deps.progressPath).guesses?.["start-01"]).toBe("it edits a file");
  });

  it("a failing run saves the guess but prints neither the answer nor the reason", () => {
    const s = setup(false, "it edits a file");
    expect(run(["lab"], s.deps)).toBe(1);
    expect(s.text()).not.toContain("Because reason");
    expect(s.text()).not.toContain("Learned start-01");
    expect(loadProgress(s.deps.progressPath).guesses?.["start-01"]).toBe("it edits a file");
  });

  it("a later run without GUESS still shows the guess saved earlier", () => {
    const first = setup(false, "my guess");
    run(["lab"], first.deps);
    const second = setup(true);
    second.deps.progressPath = first.deps.progressPath;
    run(["lab"], second.deps);
    expect(second.text()).toContain("my guess");
  });

  it("a pass without a guess still shows the answer and says no guess was saved", () => {
    const s = setup(true);
    run(["lab"], s.deps);
    expect(s.text()).toContain("Because reason start-01.");
    expect(s.text()).toContain("no guess");
  });

  it("--hint reveals one hint per call", () => {
    const s = setup(false);
    expect(run(["lab", "--hint"], s.deps)).toBe(0);
    expect(s.text()).toContain("first hint");
    expect(s.text()).not.toContain("second hint");
    expect(run(["lab", "--hint"], s.deps)).toBe(0);
    expect(s.text()).toContain("second hint");
    expect(run(["lab", "--hint"], s.deps)).toBe(0);
    expect(s.text()).toContain("No more hints");
  });

  it("next shows the brief without running the proof", () => {
    const s = setup(true);
    s.deps.proof = () => {
      throw new Error("must not run");
    };
    expect(run(["next"], s.deps)).toBe(0);
    expect(s.text()).toContain("Goal start-01");
  });

  it("an unknown id exits 2 and lists the ids", () => {
    const s = setup(true);
    expect(run(["lab", "nope"], s.deps)).toBe(2);
    expect(s.text()).toContain("start-01");
  });

  it("says so when every lab is done", () => {
    const s = setup(true);
    run(["lab"], s.deps);
    run(["lab"], s.deps);
    s.out.length = 0;
    expect(run(["next"], s.deps)).toBe(0);
    expect(s.text()).toContain("Every lab is done");
  });
});
