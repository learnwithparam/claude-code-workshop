import { describe, expect, it } from "vitest";
import { report } from "./exercise.ts";

const doc = "## Exercise\n\nTrack A: add a key. Track B: write a hook case.\n\n## Discussion\n\nx";
const out = "PASS hand-built: ok\nFAIL boundary: key found in web/dist\n";

describe("exercise report", () => {
  it("prints PASS for a green proof", () => {
    expect(report(true, "", "a", doc)).toBe("PASS");
  });
  it("gives track A the failing line and the hint", () => {
    const text = report(false, out, "a", doc);
    expect(text).toContain("FAIL boundary: key found in web/dist");
    expect(text).toContain("Hint: Track A: add a key.");
  });
  it("gives track B only the failing line", () => {
    expect(report(false, out, "b", doc)).toBe("FAIL boundary: key found in web/dist");
  });
});
