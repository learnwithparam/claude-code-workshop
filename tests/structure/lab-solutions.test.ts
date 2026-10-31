import { spawnSync } from "node:child_process";
import {
  copyFileSync,
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
import { LAZY, SOLUTIONS } from "./lab-artifacts.ts";

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

  it("has a solution and a lazy artifact for every lab and none extra", () => {
    expect(Object.keys(SOLUTIONS).sort()).toEqual(ids);
    expect(Object.keys(LAZY).sort()).toEqual(ids);
  });

  it.each(labs)("$id is red with no work", { timeout: 240_000 }, (lab) => {
    expect(inScratchRepo(undefined, lab.proof)).not.toBe(0);
  });

  it.each(labs)(
    "$id is red on a lazy artifact with the right shape",
    { timeout: 240_000 },
    (lab) => {
      expect(inScratchRepo(LAZY[lab.id], lab.proof)).not.toBe(0);
    },
  );

  it.each(labs)("$id is green once the steps are done", { timeout: 240_000 }, (lab) => {
    expect(inScratchRepo(SOLUTIONS[lab.id], lab.proof)).toBe(0);
  });
});
