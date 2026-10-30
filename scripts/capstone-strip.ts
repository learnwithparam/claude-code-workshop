import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

// The feature the capstone rebuilds. Stripping these from a copy of the tree gives the red start:
// the specs in specs/34, 35 and 37 import them, so they fail until your factory writes them back.
export const CAPSTONE_CODE = [
  "shared/src/workbook-check.ts",
  "shared/src/workbook-check.test.ts",
  "shared/src/workbook-pdf.ts",
  "shared/src/workbook-pdf.test.ts",
  "shared/src/workbook-plan.ts",
  "shared/src/workbook-plan.test.ts",
  "shared/src/workbook-schema.ts",
  "shared/src/workbook-schema.test.ts",
  "shared/src/render-workbook.ts",
  "shared/src/render-workbook.test.ts",
  "shared/src/template.ts",
  "shared/src/template.test.ts",
  "api/src/cache",
  "api/src/templates",
  "api/src/agent/fill-template.ts",
  "api/src/agent/template-eval.ts",
  "api/src/agent/workbook-agent.ts",
  "api/src/agent/workbook-agent.test.ts",
  "api/src/templates-good-route.test.ts",
  "api/src/workbook-server.test.ts",
];

export function stripCapstone(root: string): string[] {
  const removed = CAPSTONE_CODE.filter((p) => existsSync(join(root, p)));
  for (const p of removed) rmSync(join(root, p), { recursive: true, force: true });
  return removed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: npx tsx scripts/capstone-strip.ts <copy of the tree>");
    process.exit(1);
  }
  console.log(`removed ${stripCapstone(target).length} paths from ${target}`);
}
