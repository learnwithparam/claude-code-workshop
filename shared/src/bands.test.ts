import { describe, expect, it } from "vitest";
import { BAND_IDS, BANDS, parseBand } from "./bands";

describe("parseBand", () => {
  it("reads a grade number", () => {
    expect(parseBand("worksheet for grade 4 fractions")).toBe("grade-3-5");
  });

  it("does not let grade 1 swallow grade 10", () => {
    expect(parseBand("grade 10 physics")).toBe("grade-9-12");
  });

  it("returns null when the audience is unknown", () => {
    expect(parseBand("a worksheet about volcanoes")).toBeNull();
  });
});

describe("band table", () => {
  it("has limits that grow with the band", () => {
    const limits = BAND_IDS.map((id) => BANDS[id].maxItems);
    expect(limits).toEqual([...limits].sort((a, b) => a - b));
  });
});
