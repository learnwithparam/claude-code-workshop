import { describe, expect, it } from "vitest";
import fixtures from "../../../fixtures/worksheets.json" with { type: "json" };
import { createPromptCache, normalisePrompt } from "./prompt-cache.ts";

const sheet = fixtures[0]?.worksheet as never;

describe("prompt cache", () => {
  it("normalises case and whitespace", () => {
    expect(normalisePrompt("  GRADE 2   Sums ")).toBe("grade 2 sums");
  });

  it("keys by band as well as prompt", () => {
    const cache = createPromptCache();
    cache.set("Sums", "grade-1-2", sheet);
    expect(cache.get(" sums ", "grade-1-2")).toBe(sheet);
    expect(cache.get("sums", "grade-3-5")).toBeUndefined();
  });
});
