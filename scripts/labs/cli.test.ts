import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Lab } from "./catalog.ts";
import { type CliDeps, run, runWatch } from "./cli.ts";
import { loadProgress, saveProgress } from "./progress.ts";

const lab = (id: string, lane: Lab["lane"]): Lab => ({
  id,
  lane,
  title: `Title ${id}`,
  pairs: "docs/README.md",
  goal: `Goal ${id}`,
  help: "guided",
  steps: [{ text: "Do it." }],
  proof: [{ text: `Item for ${id}.`, command: `proof-${id}` }],
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
    status: (s) => out.push(s),
    isTTY: false,
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

  it("lists every item with its sentence, red and green together, and exits 1", () => {
    const s = setup(true);
    s.deps.labs = [
      {
        ...lab("start-01", "start"),
        proof: [
          { text: "The notes file exists.", command: "good" },
          { text: "The notes file has three lines.", command: "bad" },
        ],
      },
    ];
    s.deps.proof = (command) => ({ ok: command === "good", output: "" });
    expect(run(["lab"], s.deps)).toBe(1);
    expect(s.text()).toContain("PASS The notes file exists.");
    expect(s.text()).toContain("FAIL The notes file has three lines.");
    expect(loadProgress(s.deps.progressPath).done).toEqual({});
  });

  it("runs every item even after one is red", () => {
    const s = setup(true);
    const ran: string[] = [];
    s.deps.labs = [
      {
        ...lab("start-01", "start"),
        proof: [
          { text: "One.", command: "a" },
          { text: "Two.", command: "b" },
        ],
      },
    ];
    s.deps.proof = (command) => {
      ran.push(command);
      return { ok: false, output: "" };
    };
    run(["lab"], s.deps);
    expect(ran).toEqual(["a", "b"]);
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

describe("cli watch", () => {
  function watching(results: boolean[]) {
    const s = setup(false);
    let change = () => {};
    let key = (_k: string) => {};
    const stops: string[] = [];
    const queue = [...results];
    s.deps.isTTY = true;
    s.deps.proof = () => ({ ok: queue.shift() ?? false, output: "boom line\n" });
    s.deps.watch = (onChange) => {
      change = onChange;
      return () => stops.push("watch");
    };
    s.deps.keys = (onKey) => {
      key = onKey;
      return () => stops.push("keys");
    };
    return { ...s, change: () => change(), key: (k: string) => key(k), stops };
  }

  it("reruns on a change, prints FAIL then PASS, records the lab and exits 0", async () => {
    const s = watching([false, true]);
    const done = runWatch(["lab", "--watch"], s.deps);
    expect(s.text()).toContain("FAIL start-01");
    expect(s.text()).not.toContain("PASS start-01");
    s.change();
    expect(await done).toBe(0);
    expect(s.text()).toContain("PASS start-01");
    expect(s.text()).toContain("Learned start-01");
    expect(loadProgress(s.deps.progressPath).done["start-01"]).toBe("2026-10-30");
    expect(s.stops).toEqual(["watch", "keys"]);
  });

  it("h reveals the next hint and q quits with nothing recorded", async () => {
    const s = watching([false]);
    const done = runWatch(["lab", "--watch"], s.deps);
    s.key("h");
    expect(s.text()).toContain("first hint");
    s.key("q");
    expect(await done).toBe(1);
    expect(loadProgress(s.deps.progressPath).done).toEqual({});
  });

  it("with no TTY it runs once and prints the fallback line", async () => {
    const s = watching([false]);
    s.deps.isTTY = false;
    expect(await runWatch(["lab", "--watch"], s.deps)).toBe(1);
    expect(s.text()).toContain("Watch needs a terminal; running the proof once.");
    expect(s.text()).toContain("FAIL start-01");
    expect(s.stops).toEqual([]);
  });
});
