import { describe, expect, it } from "vitest";

// Assignment: a canary prompt with rollback. Skipped until you start: ASSIGNMENT=1 npx vitest run tests/assignments
const on = process.env.ASSIGNMENT === "1";
const MODULE = "../../api/src/agent/canary.ts";

describe.skipIf(!on)("assignment: canary prompt", () => {
  it("sends the configured share of requests to the candidate, the same way every time", async () => {
    const { routePrompt } = await import(MODULE);
    const ids = Array.from({ length: 2000 }, (_, i) => `req-${i}`);
    const first = ids.map((id) => routePrompt(id, 0.1));
    expect(ids.map((id) => routePrompt(id, 0.1))).toEqual(first);
    const share = first.filter((r) => r === "candidate").length / ids.length;
    expect(share).toBeGreaterThan(0.05);
    expect(share).toBeLessThan(0.15);
  });

  it("keeps a candidate that matches and rolls back one that drops past the margin", async () => {
    const { decideCanary } = await import(MODULE);
    expect(decideCanary({ current: 0.9, candidate: 0.9, margin: 0.05 })).toBe("keep");
    expect(decideCanary({ current: 0.9, candidate: 0.7, margin: 0.05 })).toBe("rollback");
  });

  it("sends everything to the current prompt once rolled back", async () => {
    const { routePrompt } = await import(MODULE);
    const results = Array.from({ length: 200 }, (_, i) => routePrompt(`req-${i}`, 0));
    expect(results.every((r) => r === "current")).toBe(true);
  });
});
