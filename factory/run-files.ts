import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Ledger } from "./cost-ledger.ts";

// One folder per ticket under .factory/runs (gitignored): the data the retro stage reads.
export function writeRunFiles(root: string, n: number, ledger: Ledger, lines: string[]): string {
  const dir = join(root, ".factory", "runs", String(n));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "cost.json"), `${JSON.stringify(ledger, null, 2)}\n`);
  writeFileSync(join(dir, "run.log"), `${lines.join("\n")}\n`);
  return dir;
}
