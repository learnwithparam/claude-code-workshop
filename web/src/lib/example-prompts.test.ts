import { describe, expect, it } from "vitest";
import { EXAMPLE_PROMPTS, examplePromptsSchema } from "./example-prompts.ts";

describe("example prompts", () => {
  it("keeps the shipped list valid", () => {
    expect(examplePromptsSchema.safeParse(EXAMPLE_PROMPTS).success).toBe(true);
  });

  it("rejects a list that is too short", () => {
    expect(examplePromptsSchema.safeParse(["a", "b", "c"]).success).toBe(false);
  });

  it("rejects duplicates and blank entries", () => {
    expect(examplePromptsSchema.safeParse(["a", "a", "b", "c"]).success).toBe(false);
    expect(examplePromptsSchema.safeParse(["a", "b", "c", "  "]).success).toBe(false);
  });
});
