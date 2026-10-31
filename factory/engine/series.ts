import { z } from "zod";
import type { Result } from "./interpret.ts";
import type { Host } from "./types.ts";

export const SERIES = ".factory/series.json";
export const seriesSchema = z.record(z.string(), z.array(z.number()));
const KEEP = 100;

// What one finished run adds to each metric in .factory/bands.yaml. The check failure rate is the share of
// check results in the run log that failed; the cycle time is the run itself, in hours; the eval pass rate
// is the score the retro read, so a run without a retro adds none.
export function runValues(res: Result, evalScore?: number): Record<string, number> {
  const checks = res.log.filter((l) => /^\s+check \S+ (ok|FAIL)/.test(l));
  const failed = checks.filter((l) => /^\s+check \S+ FAIL/.test(l)).length;
  const hours = (Date.parse(res.finishedAt) - Date.parse(res.startedAt)) / 3_600_000;
  return {
    "ci-failure-rate": checks.length ? failed / checks.length : 0,
    "pr-cycle-time-hours": hours,
    ...(evalScore === undefined ? {} : { "eval-pass-rate": evalScore }),
  };
}

// Appends the run's values to the file `--maintain` reads, newest last, keeping the last KEEP of each.
export async function recordSeries(host: Host, res: Result, evalScore?: number) {
  const old = await host.read(SERIES);
  const series = old === null ? {} : seriesSchema.parse(JSON.parse(old));
  for (const [metric, v] of Object.entries(runValues(res, evalScore)))
    series[metric] = [...(series[metric] ?? []), v].slice(-KEEP);
  await host.write(SERIES, `${JSON.stringify(series, null, 2)}\n`);
}
