import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALLOWED } from "./doc-paths.allow.ts";
import { present, ROOTS, targetsOf } from "./repo-roots.ts";

// A doc that names a file or a make target that is not there is a claim the code does not keep.
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : [];
  });
const docs = ["README.md", ...walk("docs"), ...walk("assignments")];
const targets = targetsOf(readFileSync("Makefile", "utf8"));
// `factory/engine/x.ts` written as `engine/x.ts` is the slip this has caught before.
const BARE = /^(engine|src)\/[\w./-]+\.\w+$/;
const allowed = new Set(ALLOWED.map((a) => a.path));

function problems(file: string, text: string): string[] {
  const bad: string[] = [];
  for (const [, token = ""] of text.matchAll(/`([^`\n]+)`/g)) {
    for (const [, target = ""] of token.matchAll(/\bmake\s+([a-z][\w-]*)/g)) {
      if (!targets.has(target) && !allowed.has(`make ${target}`))
        bad.push(`${file}: make ${target}`);
    }
    const words = token.split(/\s+/);
    for (const [i, word] of words.entries()) {
      if (words[i - 1] === "-b") continue; // a new branch name, not a path
      const path = word.replace(/^["']|["'.,;:)]+$/g, "").replace(/(:\d+)+$/, "");
      if (BARE.test(path)) bad.push(`${file}: ${path} (missing its root)`);
      if (!ROOTS.some((r) => path.startsWith(r)) || /[*<>{}$]/.test(path)) continue;
      if (path.startsWith(".labs/work/") || allowed.has(path) || allowed.has(`${path}/`)) continue;
      if (!present(path) && !present(join(dirname(file), path))) bad.push(`${file}: ${path}`);
    }
  }
  return bad;
}

describe("doc paths", () => {
  it("names only make targets and paths that exist", () => {
    const bad = docs.flatMap((f) => problems(f, readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });

  it("allows nothing that now exists, and every reason is honest", () => {
    const stale = ALLOWED.filter((a) =>
      a.path.startsWith("make ") ? targets.has(a.path.slice(5)) : existsSync(a.path),
    ).map((a) => `${a.path}: exists now`);
    const ignored = ALLOWED.filter((a) => a.reason === "gitignored").filter((a) => {
      try {
        execFileSync("git", ["check-ignore", "--no-index", "-q", a.path]);
        return false;
      } catch {
        return true;
      }
    });
    expect([...stale, ...ignored.map((a) => `${a.path}: not in .gitignore`)]).toEqual([]);
  });

  it("catches a missing path and a missing make target", () => {
    const text = "Open `factory/engine/nope.ts` then run `make prove-all`.";
    expect(problems("docs/x.md", text)).toEqual([
      "docs/x.md: factory/engine/nope.ts",
      "docs/x.md: make prove-all",
    ]);
  });
});
