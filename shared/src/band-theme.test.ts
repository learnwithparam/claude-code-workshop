import { describe, expect, it } from "vitest";
import {
  artIdSchema,
  bandThemeSchema,
  contrastRatio,
  MIN_TEXT_CONTRAST,
  textPairs,
} from "./band-theme";
import { BAND_IDS, BANDS } from "./bands";

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for a colour on itself", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });

  it("does not depend on argument order", () => {
    expect(contrastRatio("#777777", "#ffffff")).toBe(contrastRatio("#ffffff", "#777777"));
  });
});

describe("band themes", () => {
  it("rejects a theme that is not hex or has an unknown art id", () => {
    const ok = BANDS["grade-3-5"].theme;
    expect(bandThemeSchema.safeParse({ ...ok, ink: "red" }).success).toBe(false);
    expect(bandThemeSchema.safeParse({ ...ok, art: "dragon" }).success).toBe(false);
  });

  it.each(BAND_IDS)("%s has a valid theme", (id) => {
    expect(bandThemeSchema.safeParse(BANDS[id].theme).success).toBe(true);
  });

  it.each(BAND_IDS)("%s passes 4.5:1 on every text pair", (id) => {
    for (const [fg, bg] of textPairs(BANDS[id].theme)) {
      expect(contrastRatio(fg, bg), `${id} ${fg} on ${bg}`).toBeGreaterThanOrEqual(
        MIN_TEXT_CONTRAST,
      );
    }
  });

  it("gives each band its own art and palette", () => {
    const arts = BAND_IDS.map((id) => BANDS[id].theme.art);
    expect(new Set(arts).size).toBe(BAND_IDS.length);
    expect(artIdSchema.options.length).toBe(BAND_IDS.length);
    expect(new Set(BAND_IDS.map((id) => BANDS[id].theme.accent)).size).toBe(BAND_IDS.length);
  });
});
