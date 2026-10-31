import { describe, expect, it } from "vitest";
import { artIdSchema } from "./band-theme";
import { BAND_IDS, BANDS } from "./bands";
import { renderHeaderArt } from "./render-header-art";

describe("renderHeaderArt", () => {
  it.each(BAND_IDS)("%s art is decorative, has no text and no external reference", (id) => {
    const svg = renderHeaderArt(BANDS[id].theme);
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('focusable="false"');
    expect(svg).toContain(`data-art="${BANDS[id].theme.art}"`);
    expect(svg).not.toMatch(/<text|<image|<title|href=|url\(|<script/);
  });

  it("draws a different picture for every art id", () => {
    const drawn = artIdSchema.options.map((art) =>
      renderHeaderArt({ ...BANDS["grade-3-5"].theme, art }),
    );
    expect(new Set(drawn).size).toBe(artIdSchema.options.length);
  });

  it("colours the art from the theme tokens only", () => {
    const theme = BANDS["grade-6-8"].theme;
    const colours = renderHeaderArt(theme).match(/#[0-9a-f]{6}/gi) ?? [];
    expect(colours.length).toBeGreaterThan(0);
    for (const colour of colours) expect([theme.accent, theme.rule]).toContain(colour);
  });
});
