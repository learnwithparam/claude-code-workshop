import { z } from "zod";
import type { Result } from "./interpret.ts";

export const metricsSchema = z.object({
  ticket: z.number().int(),
  workflow: z.string(),
  outcome: z.enum(["done", "awaiting-approval", "needs-human"]),
  rounds: z.record(z.string(), z.number()),
  costUsd: z.number(),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
  stages: z.record(
    z.string(),
    z.object({ startedAt: z.iso.datetime(), finishedAt: z.iso.datetime() }),
  ),
});
export type Metrics = z.infer<typeof metricsSchema>;

export const metricsFor = (ticket: number, workflow: string, r: Result): Metrics => ({
  ticket,
  workflow,
  outcome: r.outcome,
  rounds: r.rounds,
  costUsd: r.costUsd,
  startedAt: r.startedAt,
  finishedAt: r.finishedAt,
  stages: r.stages,
});

// A run is first-pass when it finished and no step needed a second round.
export const firstPass = (m: Metrics) =>
  m.outcome === "done" && Object.values(m.rounds).every((n) => n === 1);

export function rollup(all: Metrics[]) {
  const done = all.filter((m) => m.outcome === "done");
  const by: Record<string, number> = {};
  for (const m of all) by[m.workflow] = (by[m.workflow] ?? 0) + m.costUsd;
  return {
    runs: all.length,
    firstPassRate: all.length ? all.filter(firstPass).length / all.length : 0,
    doneRate: all.length ? done.length / all.length : 0,
    meanRounds: all.length
      ? all.flatMap((m) => Object.values(m.rounds)).reduce((a, b) => a + b, 0) /
        Math.max(1, all.flatMap((m) => Object.values(m.rounds)).length)
      : 0,
    costUsd: all.reduce((a, m) => a + m.costUsd, 0),
    costByWorkflow: by,
  };
}
