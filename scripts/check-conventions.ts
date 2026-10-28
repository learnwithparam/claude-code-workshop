import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename } from "node:path";

const BANNED_FOLDERS = ["utils", "helpers", "misc", "common"];
const MAX_LINES = 300;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+)*$/;
const ALLOWED_NAMES = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "SKILL.md",
  "Dockerfile",
  "Makefile",
  "README.md",
]);

export function findViolations(files: string[], lines: (file: string) => number): string[] {
  const out: string[] = [];
  for (const file of files) {
    const name = basename(file);
    const folders = file.split("/").slice(0, -1);
    if (!ALLOWED_NAMES.has(name) && !name.startsWith(".") && !KEBAB.test(name))
      out.push(`${file}: file name is not kebab-case`);
    for (const folder of folders)
      if (BANNED_FOLDERS.includes(folder)) out.push(`${file}: folder "${folder}" is banned`);
    if (/\.(ts|astro)$/.test(file) && lines(file) > MAX_LINES)
      out.push(`${file}: over ${MAX_LINES} lines`);
  }
  return out;
}

export function trackedFiles(): string[] {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter((f) => f && !f.startsWith("fixtures/") && f !== "package-lock.json");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const problems = findViolations(
    trackedFiles(),
    (f) => readFileSync(f, "utf8").split("\n").length,
  );
  for (const p of problems) console.error(p);
  process.exit(problems.length === 0 ? 0 : 1);
}
