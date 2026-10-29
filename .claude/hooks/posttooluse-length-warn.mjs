// Pattern: warn-only validator. A standard that is a warning, not a wall: the model fixes it or says why not.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const LIMIT = 300;

export function warningFor(filePath, text) {
  if (!/\.(ts|tsx|mjs|astro)$/.test(filePath)) return null;
  const lines = text.split("\n").length;
  return lines > LIMIT
    ? `${filePath} has ${lines} lines and the limit is ${LIMIT}. Split it by concept before moving on.`
    : null;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    const file = String(input.tool_input?.file_path ?? "");
    const warning = warningFor(file, readFileSync(file, "utf8"));
    if (warning) console.log(JSON.stringify({ systemMessage: warning }));
  } catch {
    // Exit 0 always: this hook never blocks.
  }
}
