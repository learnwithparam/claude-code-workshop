import { writeArtifact } from "./artifacts.ts";
import { type Breach, detect, intentFor, loadBands } from "./bands.ts";
import { SERIES, seriesSchema } from "./series.ts";
import type { Host } from "./types.ts";

// Reads each metric's history from .factory/series.json (the latest value last) and checks it against
// .factory/bands.yaml. No model decides: 1 and 2 sigma are logged, 3 sigma writes specs/<n>/intent.md,
// the record the incident workflow starts from. `recordSeries` in series.ts records it at the end of each run.
export async function maintain(host: Host, n: number) {
  const bandsText = await host.read(".factory/bands.yaml");
  if (bandsText === null) throw new Error(".factory/bands.yaml is missing");
  const seriesText = await host.read(SERIES);
  if (seriesText === null)
    throw new Error(`${SERIES} is missing; nothing has recorded the metrics`);
  const bands = loadBands(bandsText);
  const series = seriesSchema.parse(JSON.parse(seriesText));
  const lines: string[] = [];
  const breaches: Breach[] = [];
  for (const [metric, band] of Object.entries(bands)) {
    const values = series[metric] ?? [];
    // The latest value is judged against the window before it; a short history proves nothing.
    if (values.length < band.window + 1) {
      lines.push(`${metric}: not enough history (${values.length} of ${band.window + 1} values)`);
      continue;
    }
    const latest = values[values.length - 1] ?? 0;
    const b = detect(metric, values.slice(-band.window - 1, -1), latest, band.direction);
    lines.push(`${metric}: ${b.sigma} sigma (latest ${b.value}, mean ${b.mean.toFixed(2)})`);
    if (b.sigma === 3) breaches.push(b);
  }
  if (!breaches.length) return { lines, breaches, wrote: false };
  await writeArtifact(host, n, "intent.md", breaches.map(intentFor).join("\n"));
  lines.push(`wrote specs/${n}/intent.md for ${breaches.map((b) => b.metric).join(", ")}`);
  return { lines, breaches, wrote: true };
}
