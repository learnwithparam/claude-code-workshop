import { execFileSync } from "node:child_process";
import { filesFor, LEVEL_ORDER, type LevelName } from "./levels.ts";

// The levels CI generates and gates. A level holds trunk plus every level before it, so a changed
// file reaches its owner and everything after; a file no level owns reaches none.
export const CI_LEVELS: LevelName[] = LEVEL_ORDER.filter((l) => l !== "capstone");

export function affectedLevels(changed: string[]): LevelName[] {
  return CI_LEVELS.filter((level) => filesFor(level, changed).length > 0);
}

// With no base ref (main, nightly) every level runs.
if (import.meta.url === `file://${process.argv[1]}`) {
  const at = process.argv.indexOf("--base");
  const base = at >= 0 ? process.argv[at + 1] : undefined;
  const changed = base
    ? execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" })
        .split("\n")
        .filter(Boolean)
    : undefined;
  console.log(JSON.stringify(changed ? affectedLevels(changed) : CI_LEVELS));
}
