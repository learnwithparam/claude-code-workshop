import { existsSync } from "node:fs";
import { LEVEL_ORDER } from "../levels.ts";
import type { Proof } from "./hand-built.ts";

// One proof per teaching level, found by name: scripts/prove/<level>.ts exports prove*().
// A level's snapshot only has the proofs of the levels up to it, so discovery beats a fixed import list.
const proofs: Record<string, () => Proof> = {};
for (const name of LEVEL_ORDER) {
  if (!existsSync(new URL(`./${name}.ts`, import.meta.url))) continue;
  const mod = await import(`./${name}.ts`);
  const prove = Object.entries(mod).find(([key]) => key.startsWith("prove"))?.[1];
  if (typeof prove === "function") proofs[name] = prove as () => Proof;
}
const only = process.argv[2]?.replace(/^LEVEL=/, "");
const chosen = Object.entries(proofs).filter(([name]) => !only || name === only);
if (only && chosen.length === 0) {
  console.error(`Unknown level "${only}". Levels: ${Object.keys(proofs).join(", ")}`);
  process.exit(1);
}

let failed = 0;
for (const [, prove] of chosen) {
  const result = prove();
  if (!result.passed) failed += 1;
  console.log(
    `${result.passed ? "PASS" : "FAIL"} ${result.level}: ${result.claim} (${result.detail})`,
  );
}
process.exit(failed === 0 ? 0 : 1);
