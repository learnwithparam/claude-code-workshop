import { describe, expect, it } from "vitest";
import { fakeHost } from "../fake-host.ts";
import { holdout } from "./holdout.ts";

describe("holdout check", () => {
  it("says there is nothing to grade when no cases exist, instead of failing the loop forever", async () => {
    // Run 28 looped four rounds on "No test files found": nothing in the factory authors holdout cases.
    const { host, calls } = fakeHost();
    const r = await holdout.run({ host, n: 7 } as never);
    expect(r).toEqual({
      ok: true,
      evidence: "no holdout cases at .factory/holdout/7, nothing graded",
    });
    expect(calls.filter((c) => c.startsWith("exec"))).toHaveLength(0);
  });
  it("runs the cases when they exist, and fails when one fails without showing why", async () => {
    const { host } = fakeHost({
      files: { ".factory/holdout/7/a.test.ts": "x" },
      exec: [{ match: "npx vitest", result: { code: 1, output: "expected 42 to equal SECRET-9" } }],
    });
    const r = await holdout.run({ host, n: 7 } as never);
    expect(r.ok).toBe(false);
    expect(r.evidence).not.toContain("SECRET-9");
    expect(r.evidence).toContain("withheld");
  });
});
