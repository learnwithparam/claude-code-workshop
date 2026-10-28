import { proveL0 } from "./l0.ts";

const proofs = { "0": proveL0 } as const;
const only = process.argv[2]?.replace(/^L=/, "");
const chosen = Object.entries(proofs).filter(([level]) => !only || level === only);

let failed = 0;
for (const [, prove] of chosen) {
  const result = prove();
  if (!result.passed) failed += 1;
  console.log(
    `${result.passed ? "PASS" : "FAIL"} ${result.level}: ${result.claim} (${result.detail})`,
  );
}
process.exit(failed === 0 ? 0 : 1);
