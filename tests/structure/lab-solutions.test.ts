import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadLabs } from "../../scripts/labs/catalog.ts";
import { LAZY, NEEDS, SOLUTIONS, sh } from "./lab-artifacts.ts";

const REPO = resolve(".");
// Proofs read this repo (its folders, shared/ files, make targets), so each run gets a scratch
// folder that links to it. The learner's work lands in the scratch folder, never in the repo.
const SKIP = new Set([".git", ".labs", ".gitignore", "CLAUDE.local.md"]);

function scratchRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "lab-proof-"));
  for (const name of readdirSync(REPO)) {
    if (!SKIP.has(name)) symlinkSync(join(REPO, name), join(dir, name));
  }
  copyFileSync(join(REPO, ".gitignore"), join(dir, ".gitignore"));
  // A real repo with one commit, so labs that run git have something true to point at.
  const git = (...args: string[]) => spawnSync("git", args, { cwd: dir });
  git("init", "-q");
  git(
    "-c",
    "user.name=lab",
    "-c",
    "user.email=lab@example.com",
    "commit",
    "-q",
    "--allow-empty",
    "-m",
    "init",
  );
  return dir;
}

function inScratchRepo(setup: string | undefined, proof: string) {
  const dir = scratchRepo();
  if (setup) {
    writeFileSync(join(dir, "..", `${dir.split("/").pop()}-setup.sh`), setup);
    mkdirSync(join(dir, ".labs"), { recursive: true });
    spawnSync("sh", [join(dir, "..", `${dir.split("/").pop()}-setup.sh`)], { cwd: dir });
  }
  return spawnSync("sh", ["-c", proof], { cwd: dir, encoding: "utf8" }).status;
}

describe("lab proofs", () => {
  const labs = loadLabs("labs");
  const ids = labs.map((l) => l.id).sort();
  const reachable = (id: string) => (NEEDS[id] ?? []).every((f) => existsSync(join(REPO, f)));
  const items = labs.flatMap((lab) => lab.proof.map((item, n) => ({ lab, item, n: n + 1 })));

  it("has a solution and a lazy artifact for every lab and none extra", () => {
    expect(Object.keys(SOLUTIONS).sort()).toEqual(ids);
    expect(Object.keys(LAZY).sort()).toEqual(ids);
  });

  // A red item names one missing part, so every item must be red alone in an empty folder.
  it.each(items)(
    "$lab.id item $n is red with no work: $item.text",
    { timeout: 240_000 },
    ({ item }) => {
      expect(inScratchRepo(undefined, item.command)).not.toBe(0);
    },
  );

  it.each(labs)(
    "$id is red on a lazy artifact with the right shape",
    { timeout: 240_000 },
    (lab) => {
      const codes = lab.proof.map((item) => inScratchRepo(LAZY[lab.id], item.command));
      expect(codes.some((code) => code !== 0)).toBe(true);
    },
  );

  it.each(items.filter(({ lab }) => reachable(lab.id)))(
    "$lab.id item $n is green once the steps are done: $item.text",
    { timeout: 240_000 },
    ({ lab, item }) => {
      expect(inScratchRepo(SOLUTIONS[lab.id], item.command)).toBe(0);
    },
  );

  it("advanced-05 goes red when the deny list changes after cloud-guards.txt was saved", () => {
    const lab = labs.find((l) => l.id === "advanced-05");
    const changed = sh(SOLUTIONS["advanced-05"] ?? "", "echo stale > .labs/work/cloud-guards.txt");
    expect(lab, "advanced-05 is missing").toBeDefined();
    expect(inScratchRepo(changed, lab?.proof[0]?.command ?? "false")).not.toBe(0);
  });
});
