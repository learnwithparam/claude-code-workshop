import { describe, expect, it } from "vitest";
import { BAND_IDS, BANDS } from "./bands";

// R5: the per-page limit lives in the band table, not in the renderer or the prompt.
describe("maxItemsPerPage", () => {
  it.each(BAND_IDS)("%s has a positive whole limit that fits within maxItems", (id) => {
    const band = BANDS[id];
    expect(Number.isInteger(band.maxItemsPerPage)).toBe(true);
    expect(band.maxItemsPerPage).toBeGreaterThan(0);
    expect(band.maxItemsPerPage).toBeLessThanOrEqual(band.maxItems);
  });

  it("gives younger bands no more items per page than older ones", () => {
    const limits = BAND_IDS.map((id) => BANDS[id].maxItemsPerPage);
    expect(limits.every((n) => typeof n === "number")).toBe(true);
    expect(limits).toEqual([...limits].sort((a, b) => a - b));
  });
});
