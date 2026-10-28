import { lstatSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Ledger } from "./cost-ledger.ts";

// The build agent can write anywhere in the working tree, and .factory/runs is gitignored, so the
// gate never looks at it. A planted symlink would turn our write into one outside the tree.
function refuseSymlink(path: string) {
  try {
    if (lstatSync(path).isSymbolicLink())
      throw new Error(`refusing to write through symlink ${path}`);
  } catch (error) {
    if ((error as { code?: string }).code !== "ENOENT") throw error;
  }
}

// One folder per ticket under .factory/runs (gitignored): the data the retro stage reads.
export function writeRunFiles(root: string, n: number, ledger: Ledger, lines: string[]): string {
  let dir = root;
  for (const part of [".factory", "runs", String(n)]) {
    dir = join(dir, part);
    refuseSymlink(dir);
    mkdirSync(dir, { recursive: true });
  }
  // Remove then create exclusively, so a file or link planted in between fails the write.
  for (const [name, body] of [
    ["cost.json", `${JSON.stringify(ledger, null, 2)}\n`],
    ["run.log", `${lines.join("\n")}\n`],
  ] as const) {
    const file = join(dir, name);
    refuseSymlink(file);
    rmSync(file, { force: true });
    writeFileSync(file, body, { flag: "wx" });
  }
  return dir;
}
