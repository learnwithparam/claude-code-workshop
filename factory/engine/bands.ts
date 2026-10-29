import { parse } from "yaml";
import { z } from "zod";

export const bandsSchema = z.record(
  z.string(),
  z.object({ direction: z.enum(["up-is-bad", "down-is-bad"]), window: z.number().int().min(3) }),
);

export type Breach = { metric: string; sigma: 0 | 1 | 2 | 3; value: number; mean: number };
export const loadBands = (text: string) => bandsSchema.parse(parse(text));

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Deterministic: no model decides whether a metric is off. The history before `latest` sets mean and σ.
export function detect(
  metric: string,
  history: number[],
  latest: number,
  direction: "up-is-bad" | "down-is-bad",
): Breach {
  const m = mean(history);
  const sd = Math.sqrt(mean(history.map((x) => (x - m) ** 2))) || 1e-9;
  const z = (direction === "up-is-bad" ? latest - m : m - latest) / sd;
  const sigma = z >= 3 ? 3 : z >= 2 ? 2 : z >= 1 ? 1 : 0;
  return { metric, sigma, value: latest, mean: m };
}

// 1σ logs, 2σ asks a read-only agent to diagnose, 3σ writes the intent.md a new run starts from.
export const actionFor = (b: Breach) => (["none", "log", "diagnose", "intent"] as const)[b.sigma];

export const intentFor = (b: Breach) =>
  `# ${b.metric} is outside its band\n\n${b.metric} is ${b.value} against a rolling mean of ${b.mean.toFixed(2)} (${b.sigma} sigma).\n\n## Outcome\nBring ${b.metric} back inside its band, and add an eval so a repeat is caught.\n`;
