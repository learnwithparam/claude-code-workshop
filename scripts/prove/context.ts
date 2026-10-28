import { globSync, readFileSync } from "node:fs";
import { findViolations, trackedFiles } from "../check-conventions.ts";
import type { Proof } from "./hand-built.ts";

// Context claim: Claude gets the standards on the first try, and the rules cannot silently rot.
export function proveContext(): Proof {
  const problems: string[] = [];

  const claude = readFileSync("CLAUDE.md", "utf8");
  if (!claude.includes("@AGENTS.md")) problems.push("CLAUDE.md does not import AGENTS.md");
  if (claude.split("\n").length > 20) problems.push("CLAUDE.md is over 20 lines");

  const agents = readFileSync("AGENTS.md", "utf8");
  for (const must of ["npm", "Geist", "make check", "kebab-case"])
    if (!agents.includes(must)) problems.push(`AGENTS.md misses "${must}"`);

  // A rule whose paths match nothing never loads. Fail instead of rotting quietly.
  for (const rule of globSync(".claude/rules/*.md")) {
    const text = readFileSync(rule, "utf8");
    const frontmatter = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
    const globs = [...frontmatter.matchAll(/^\s*- "(.+)"$/gm)].map((m) => m[1] ?? "");
    if (globs.length === 0) problems.push(`${rule}: no paths`);
    for (const pattern of globs)
      if (globSync(pattern).length === 0) problems.push(`${rule}: "${pattern}" matches no file`);
  }

  const violations = findViolations(
    trackedFiles(),
    (f) => readFileSync(f, "utf8").split("\n").length,
  );
  problems.push(...violations);

  return {
    level: "context",
    claim: "the standards load by default, every rule matches real files, and the repo obeys them",
    passed: problems.length === 0,
    detail: problems.length === 0 ? "context holds" : problems.join(" | "),
  };
}
