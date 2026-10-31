import { describe, expect, it } from "vitest";
import { statusLine } from "../../.claude/statusline.mjs";

describe("status line", () => {
  it("shows the model and the session cost", () => {
    expect(
      statusLine({ model: { display_name: "Haiku 5.5" }, cost: { total_cost_usd: 0.014 } }),
    ).toBe("Haiku 5.5 | $0.01");
  });

  it("prints a safe line when the payload is missing fields", () => {
    expect(statusLine({})).toBe("claude | $0.00");
    expect(statusLine({ cost: { total_cost_usd: "x" } })).toBe("claude | $0.00");
  });
});
