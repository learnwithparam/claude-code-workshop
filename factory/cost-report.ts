import type { Ledger } from "./cost-ledger.ts";

const usd = (n: number) => `$${n.toFixed(2)}`;

// The line a person reads after a run: what it cost, split, and what routing saved.
export function formatReport(l: Ledger): string {
  const rows = (m: Record<string, number>) =>
    Object.entries(m)
      .map(([k, v]) => `  ${k.padEnd(18)} ${usd(v)}`)
      .join("\n");
  const pct = `${Math.round(l.savedPct)}%`;
  return [
    `total ${usd(l.totalUsd)}`,
    "by stage:",
    rows(l.byStage),
    "by model:",
    rows(l.byModel),
    `saved ${usd(l.savedUsd)} (${pct}) vs all-Opus`,
  ].join("\n");
}
