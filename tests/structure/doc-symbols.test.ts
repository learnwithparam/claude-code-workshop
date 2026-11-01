import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fullRepo } from "./repo-roots.ts";

// A doc that names a function must name one the code has. Only camelCase words are checked,
// since those are the ones a rename can strand.
const DIRS = ["api", "shared", "web", "factory", "scripts", "tests", ".claude", "plugins"];
const NOT_OURS = new Set(["apiKeyHelper"]); // a Claude Code setting, not a symbol in this repo

const docs = ["docs/factory", "docs/levels"].filter(existsSync).flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => `${dir}/${f}`),
);

const symbolsIn = (text: string): string[] =>
  [...text.matchAll(/`([a-z]+[A-Z]\w*)(\(\))?`/g)].map((m) => m[1] ?? "");

const known = (names: string[]): Set<string> => {
  const hits = new Set<string>();
  for (const name of names) {
    try {
      execFileSync("git", ["grep", "-qw", "-e", name, "--", ...DIRS, ...docs.map((d) => `:!${d}`)]);
      hits.add(name);
    } catch {
      // git grep exits 1 when nothing matches
    }
  }
  return hits;
};

describe.skipIf(!fullRepo)("doc symbols", () => {
  it("names only camelCase symbols the code has", () => {
    const named = new Map(docs.map((d) => [d, [...new Set(symbolsIn(readFileSync(d, "utf8")))]]));
    const all = [...new Set([...named.values()].flat())].filter((s) => !NOT_OURS.has(s));
    const found = known(all);
    const missing = [...named].flatMap(([doc, names]) =>
      names.filter((n) => !NOT_OURS.has(n) && !found.has(n)).map((n) => `${doc}: ${n}`),
    );
    expect(missing).toEqual([]);
  });

  it("reads a call with brackets as the same symbol", () => {
    expect(symbolsIn("Call `classify()` and `plain` and `x-Y`.")).toEqual([]);
    expect(symbolsIn("Call `classifyTier()` and `approvalsMet`.")).toEqual([
      "classifyTier",
      "approvalsMet",
    ]);
  });
});
