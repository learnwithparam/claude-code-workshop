import { describe, expect, it } from "vitest";
import { proseProblems } from "./check-prose.ts";

describe("proseProblems", () => {
  it("flags a dash and a filler phrase with their line", () => {
    const found = proseProblems("a.md", `fine\nthis — that\nin order to win`);
    expect(found).toEqual([
      "a.md:2 dash, use a comma or a full stop",
      'a.md:3 filler "in order to"',
    ]);
  });
  it("passes plain prose", () => {
    expect(proseProblems("a.md", "Plain words, short lines.")).toEqual([]);
  });
});
