import { readFileSync } from "node:fs";
import { z } from "zod";

const rows = z.array(z.object({ compliant: z.boolean(), bandMatches: z.boolean().optional() }));

// The share of recorded eval rows that held: compliant, and in the right band when the row says so.
// It reads the last `make eval` from fixtures/eval.json and spends nothing, so a retro can score
// before and after a lesson without a live run.
export function evalScore(json: string): number {
  const all = rows.parse(JSON.parse(json));
  if (!all.length) throw new Error("no eval rows to score");
  return all.filter((r) => r.compliant && r.bandMatches !== false).length / all.length;
}

if (import.meta.url === `file://${process.argv[1]}`)
  console.log(`SCORE ${evalScore(readFileSync(process.argv[2] ?? "fixtures/eval.json", "utf8"))}`);
