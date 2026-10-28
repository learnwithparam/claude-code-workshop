// The one place the model name and its price live.
export const MODEL = "claude-haiku-5-5";

// USD per million tokens. Used only for the budget guard and the usage chip.
export const PRICE_PER_MTOK = { input: 1, cacheRead: 0.1, cacheWrite: 1.25, output: 5 };

export type Usage = { input: number; cacheRead: number; cacheWrite: number; output: number };

export function costUsd(usage: Usage): number {
  const p = PRICE_PER_MTOK;
  return (
    (usage.input * p.input +
      usage.cacheRead * p.cacheRead +
      usage.cacheWrite * p.cacheWrite +
      usage.output * p.output) /
    1_000_000
  );
}
