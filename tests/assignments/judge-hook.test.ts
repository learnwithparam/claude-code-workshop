import { describe, expect, it } from "vitest";
import { blocks } from "../../.claude/hooks/pretooluse-secrets.mjs";

// Assignment: an opt-in LLM-judge hook. Skipped until you start: ASSIGNMENT=1 npx vitest run tests/assignments
const on = process.env.ASSIGNMENT === "1";
const MODULE = "../../.claude/hooks/pretooluse-judge.mjs";
const diff = "diff --git a/a.ts b/a.ts\n+export const a = 1;\n";

describe.skipIf(!on)("assignment: judge hook", () => {
  it("is off unless JUDGE=1", async () => {
    const { shouldJudge } = await import(MODULE);
    expect(shouldJudge({})).toBe(false);
    expect(shouldJudge({ JUDGE: "1" })).toBe(true);
  });

  it("blocks on a blocking verdict and passes a clean one", async () => {
    const { decide } = await import(MODULE);
    expect(decide({ verdict: "blocking", reason: "unsafe" }).block).toBe(true);
    expect(decide({ verdict: "clean" }).block).toBe(false);
  });

  it("never sends a diff the secrets hook would block", async () => {
    const { diffToSend } = await import(MODULE);
    const secret = `${diff}+cat .env\n`;
    expect(blocks(secret)).toBe(true);
    expect(diffToSend(secret)).toBeNull();
    expect(diffToSend(diff)).toBe(diff);
  });
});
