import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Lab } from "./catalog.ts";
import { type CliDeps, run } from "./cli.ts";
import { loadProgress, saveProgress } from "./progress.ts";

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
});

function setup(passes: boolean, withPath = true) {
  const out: string[] = [];
  const dir = mkdtempSync(join(tmpdir(), "labs-cli-"));
  const deps: CliDeps = {
    labs: [lab("start-01", "start"), lab("start-02", "start")],
    progressPath: join(dir, "progress.json"),
    color: false,
    proof: () => ({ ok: passes, output: "boom line\n" }),
    now: () => "2026-10-30",
    out: (s) => out.push(s),
  };
  if (withPath) saveProgress(deps.progressPath, { done: {}, hints: {}, path: "pro" });
  return { deps, out, text: () => out.join("\n") };
}

describe("cli", () => {
  it("with no path set, lab prints the choice, exits 2 and runs no proof", () => {
    const s = setup(true, false);
    s.deps.proof = () => {
      throw new Error("must not run");
    };
    expect(run(["lab"], s.deps)).toBe(2);
    expect(s.text()).toContain("PATH_ID=pro");
    expect(s.text()).toContain("PATH_ID=factory");
    expect(run(["next"], s.deps)).toBe(2);
  });

  it("--path sets the path, saves it and then runs the lab", () => {
    const s = setup(true, false);
    expect(run(["lab", "--path=factory"], s.deps)).toBe(0);
    expect(loadProgress(s.deps.progressPath).path).toBe("factory");
  });

  it("an unknown path exits 2 and saves nothing", () => {
    const s = setup(true, false);
    expect(run(["lab", "--path=nope"], s.deps)).toBe(2);
    expect(loadProgress(s.deps.progressPath).path).toBeUndefined();
  });

  it("progress shows the chosen path and names the other one", () => {
    const s = setup(true);
    run(["progress"], s.deps);
    expect(s.text()).toContain("PATH_ID=factory");
  });

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
