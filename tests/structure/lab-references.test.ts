import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type Lab, loadLabs } from "../../scripts/labs/catalog.ts";

// The gate swaps Claude steps for their output, so it never reads step text. This reads it:
// every `make <target>` and every repo path a learner is told to use must exist.
// Paths under .labs/work/ are made by the learner, so they are not in ROOTS and never checked.
const ROOTS = [
  "api/",
  "docs/",
  "factory/",
  "features/",
  "fixtures/",
  "lab/",
  "labs/",
  "plugins/",
  "scripts/",
  "shared/",
  "specs/",
  "tests/",
  "web/",
  ".claude/",
  ".factory/",
  ".github/",
];

const targetsOf = (makefile: string): Set<string> =>
  new Set([...makefile.matchAll(/^([a-z][\w-]*):/gm)].map((m) => m[1] ?? ""));

function badReferences(
  lab: Lab,
  targets: Set<string>,
  exists: (path: string) => boolean,
): string[] {
  const bad: string[] = [];
  for (const text of [...lab.steps, ...lab.hints]) {
    for (const [, token = ""] of text.matchAll(/`([^`\n]+)`/g)) {
      for (const [, target = ""] of token.matchAll(/\bmake\s+([a-z][\w-]*)/g)) {
        if (!targets.has(target)) bad.push(`make ${target}`);
      }
      const words = token.split(/\s+/);
      for (const [i, word] of words.entries()) {
        if (words[i - 1] === "-b") continue; // a new branch name, not a path
        const path = word.replace(/^["']|["'.,;:]+$/g, "");
        if (!ROOTS.some((r) => path.startsWith(r)) || /[*<>{}$]/.test(path)) continue;
        if (!exists(path)) bad.push(path);
      }
    }
  }
  return bad;
}

const targets = targetsOf(readFileSync("Makefile", "utf8"));
const labs = loadLabs("labs");

describe("lab references", () => {
  it.each(labs)("$id names only make targets and paths that exist", (lab) => {
    expect(badReferences(lab, targets, existsSync)).toEqual([]);
  });

  it("fails when a step names a missing target or file", () => {
    const broken: Lab = {
      ...(labs[0] as Lab),
      steps: ["Run `make labz`.", "Open `scripts/missing.ts`."],
      hints: ["Try `make lab` then `docs/labs/README.md`.", "b"],
    };
    expect(badReferences(broken, targets, existsSync)).toEqual(["make labz", "scripts/missing.ts"]);
  });

  it("allows a path under .labs/work, since the learner creates it", () => {
    const lab: Lab = { ...(labs[0] as Lab), steps: ["Write `.labs/work/notes.md`."] };
    expect(badReferences(lab, targets, existsSync)).toEqual([]);
  });
});
