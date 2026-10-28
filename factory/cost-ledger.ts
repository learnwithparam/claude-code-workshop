export type Tokens = {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
};
// Dollars per million tokens, as the config states them.
export type Price = { input: number; output: number; cacheRead: number; cacheWrite: number };
export type Entry = { stage: string; model: string; tokens: Tokens; costUsd: number };

export const NO_TOKENS: Tokens = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadInputTokens: 0,
  cacheCreationInputTokens: 0,
};

export const priceTokens = (p: Price, t: Tokens) =>
  (t.inputTokens * p.input +
    t.outputTokens * p.output +
    t.cacheReadInputTokens * p.cacheRead +
    t.cacheCreationInputTokens * p.cacheWrite) /
  1e6;

export type Ledger = {
  totalUsd: number;
  byStage: Record<string, number>;
  byModel: Record<string, number>;
  baselineModel: string;
  baselineUsd: number;
  savedUsd: number;
  savedPct: number;
  entries: Entry[];
};

const add = (into: Record<string, number>, key: string, usd: number) => {
  into[key] = (into[key] ?? 0) + usd;
};

// Spend as the SDK reported it, split two ways. The baseline re-prices the same tokens at the
// baseline model's rates: what the run would have cost had every stage used the top model.
export function buildLedger(
  entries: Entry[],
  prices: Record<string, Price>,
  baselineModel: string,
): Ledger {
  const byStage: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  let totalUsd = 0;
  let baselineUsd = 0;
  const base = prices[baselineModel];
  for (const e of entries) {
    totalUsd += e.costUsd;
    add(byStage, e.stage, e.costUsd);
    add(byModel, e.model, e.costUsd);
    if (base) baselineUsd += priceTokens(base, e.tokens);
  }
  // No token counts means no baseline: report zero saved rather than a made-up number.
  const savedUsd = baselineUsd > 0 ? baselineUsd - totalUsd : 0;
  const savedPct = baselineUsd > 0 ? (savedUsd / baselineUsd) * 100 : 0;
  return { totalUsd, byStage, byModel, baselineModel, baselineUsd, savedUsd, savedPct, entries };
}
