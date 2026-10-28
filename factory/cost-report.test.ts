import { describe, expect, it } from "vitest";
import { buildLedger, NO_TOKENS } from "./cost-ledger.ts";
import { formatReport } from "./cost-report.ts";

const prices = { m: { input: 10, output: 10, cacheRead: 1, cacheWrite: 12 } };

describe("cost report", () => {
  it("prints the saving against the all-Opus baseline", () => {
    const tokens = { ...NO_TOKENS, inputTokens: 1e6 };
    const text = formatReport(
      buildLedger([{ stage: "plan", model: "m", tokens, costUsd: 4 }], prices, "m"),
    );
    expect(text).toContain("saved $6.00 (60%) vs all-Opus");
    expect(text).toContain("plan");
  });

  it("prints a zero baseline as $0.00 (0%)", () => {
    const text = formatReport(buildLedger([], prices, "m"));
    expect(text).toContain("saved $0.00 (0%) vs all-Opus");
  });
});
