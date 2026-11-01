import { existsSync } from "node:fs";
import levels from "../../levels.json" with { type: "json" };

// Shared by the tests that read prose for repo paths and `make` targets.
// Paths under .labs/work/ are made by the learner, so they are not in ROOTS and never checked.
export const ROOTS = [
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

export const targetsOf = (makefile: string): Set<string> =>
  new Set([...makefile.matchAll(/^([a-z][\w-]*):/gm)].map((m) => m[1] ?? ""));

// A level snapshot holds only its own files, so there a path counts when some level owns it.
// The full repo has .git and is checked strictly: an owned glob does not make a missing file real.
const owned = (Object.values(levels) as string[][]).flat();
const isOwned = (f: string) => {
  const dir = `${f.replace(/\/$/, "")}/`;
  return owned.some(
    (g) => g === f || (g.endsWith("/**") && f.startsWith(g.slice(0, -2))) || g.startsWith(dir),
  );
};
// These tests read prose across every level, so they run on the full repo and not on a snapshot.
export const fullRepo = existsSync(".git");
export const present = (f: string) => existsSync(f) || (!existsSync(".git") && isOwned(f));
