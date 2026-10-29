// Pattern: fail-safe auto-format. Formatting is a convenience, so any failure is swallowed and the edit stands.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function formattable(filePath) {
  return /\.(ts|tsx|js|mjs|json)$/.test(filePath) && !filePath.includes("node_modules");
}

/** @param {(file: string, args: string[], options: object) => unknown} [run] */
export function format(filePath, run = execFileSync) {
  if (!formattable(filePath)) return false;
  try {
    run("npx", ["biome", "format", "--write", filePath], { stdio: "ignore", timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    format(String(input.tool_input?.file_path ?? ""));
  } catch {
    // Nothing to do.
  }
}
