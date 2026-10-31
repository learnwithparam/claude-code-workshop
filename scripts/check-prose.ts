import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// The house rules this repo teaches: no em or en dashes, no filler openers. Built from escapes so
// this file does not trip its own rule.
const DASHES = ["—", "–"];
const FILLER = ["in order to", "it is worth noting", "delve", "leverage", "seamless"];

export function proseProblems(file: string, text: string): string[] {
  const found: string[] = [];
  text.split("\n").forEach((line, i) => {
    const lower = line.toLowerCase();
    for (const d of DASHES)
      if (line.includes(d)) found.push(`${file}:${i + 1} dash, use a comma or a full stop`);
    for (const f of FILLER) if (lower.includes(f)) found.push(`${file}:${i + 1} filler "${f}"`);
  });
  return found;
}

function markdownIn(path: string): string[] {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).flatMap((name) => markdownIn(join(path, name)));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const files = process.argv
    .slice(2)
    .flatMap(markdownIn)
    .filter((f) => f.endsWith(".md"));
  const problems = files.flatMap((f) => proseProblems(f, readFileSync(f, "utf8")));
  for (const p of problems) console.error(p);
  process.exit(problems.length ? 1 : 0);
}
