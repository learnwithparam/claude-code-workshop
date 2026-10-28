import { describe, expect, it } from "vitest";
import { findViolations, trackedFiles } from "../../scripts/check-conventions.ts";

describe("conventions", () => {
  it("flags the helper-folder and loose-name habits the rules forbid", () => {
    const found = findViolations(["api/src/utils/Format_Band.ts"], () => 10);
    expect(found.join("\n")).toMatch(/kebab-case/);
    expect(found.join("\n")).toMatch(/utils/);
  });

  it("flags a file over the line cap", () => {
    expect(findViolations(["api/src/big.ts"], () => 301)).toHaveLength(1);
  });

  it("passes on the repo itself", () => {
    expect(findViolations(trackedFiles(), () => 1)).toEqual([]);
  });
});
