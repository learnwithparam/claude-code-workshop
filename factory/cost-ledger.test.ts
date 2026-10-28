import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.ts";
import { buildLedger, type Entry, NO_TOKENS, priceTokens } from "./cost-ledger.ts";

const cfg = loadConfig();
const opus = "claude-opus-5-5";
const haiku = "claude-haiku-5-5";

describe("cost ledger", () => {
  it("prices each token kind at its own rate", () => {
    const p = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 };
    const t = {
      inputTokens: 1e6,
      outputTokens: 1e6,
      cacheReadInputTokens: 1e6,
      cacheCreationInputTokens: 1e6,
    };
    expect(priceTokens(p, t)).toBeCloseTo(29.2);
  });

  it("splits spend by stage and model and sums to the reported total", () => {
    const entries: Entry[] = [
      { stage: "plan", model: opus, tokens: NO_TOKENS, costUsd: 0.3 },
      { stage: "build", model: haiku, tokens: NO_TOKENS, costUsd: 0.1 },
      { stage: "build", model: haiku, tokens: NO_TOKENS, costUsd: 0.05 },
    ];
    const l = buildLedger(entries, cfg.prices, cfg.baselineModel);
    expect(l.totalUsd).toBeCloseTo(0.45);
    expect(l.byStage.build).toBeCloseTo(0.15);
    expect(l.byModel[haiku]).toBeCloseTo(0.15);
    expect(Object.values(l.byStage).reduce((a, b) => a + b, 0)).toBeCloseTo(l.totalUsd);
  });

  it("re-prices the same tokens at the baseline rates to show the saving", () => {
    const tokens = { ...NO_TOKENS, inputTokens: 1e6, outputTokens: 1e6 };
    const haikuCost = priceTokens(cfg.prices[haiku] as never, tokens);
    const l = buildLedger(
      [{ stage: "build", model: haiku, tokens, costUsd: haikuCost }],
      cfg.prices,
      opus,
    );
    expect(l.baselineUsd).toBeCloseTo(24);
    expect(l.savedUsd).toBeCloseTo(24 - haikuCost);
    expect(l.savedPct).toBeGreaterThan(90);
  });

  it("reports zero saved when there are no token counts", () => {
    const l = buildLedger(
      [{ stage: "plan", model: opus, tokens: NO_TOKENS, costUsd: 0.2 }],
      cfg.prices,
      opus,
    );
    expect(l.savedUsd).toBe(0);
    expect(l.savedPct).toBe(0);
  });
});
