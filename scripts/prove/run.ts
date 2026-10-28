import { proveBoundary } from "./boundary.ts";
import { proveContext } from "./context.ts";
import { proveDelivery } from "./delivery.ts";
import { proveExecution } from "./execution.ts";
import { proveHandBuilt } from "./hand-built.ts";
import { proveSkills } from "./skills.ts";
import { proveVerification } from "./verification.ts";

// One proof per teaching level, keyed by the level's name: `make prove LEVEL=boundary`.
const proofs = {
  "hand-built": proveHandBuilt,
  boundary: proveBoundary,
  context: proveContext,
  skills: proveSkills,
  execution: proveExecution,
  verification: proveVerification,
  delivery: proveDelivery,
} as const;
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
