import { describe, expect, it } from "vitest";
import { BAND_IDS, BANDS } from "./bands";
import { renderWorksheet } from "./render";
import type { Worksheet } from "./schema";

const sheet: Worksheet = {
  title: "Tom & <Jerry>",
  band: "grade-3-5",
  subject: "Reading",
  sections: [
    { heading: "Read", instruction: "Answer.", items: [{ prompt: "Who ran?", answer: "Tom" }] },
  ],
};

describe("renderWorksheet", () => {
  it("emits a still composition root", () => {
    const html = renderWorksheet(sheet);
    expect(html).toContain('data-composition-id="worksheet"');
    expect(html).toContain("data-no-timeline");
  });

  it("escapes model text", () => {
    const html = renderWorksheet(sheet);
    expect(html).toContain("Tom &amp; &lt;Jerry&gt;");
    expect(html).not.toContain("<Jerry>");
  });

  it("puts the answer key after the questions", () => {
    const html = renderWorksheet(sheet);
    expect(html.indexOf("Who ran?")).toBeLessThan(html.indexOf("Answer key"));
  });

  it.each(BAND_IDS)("themes %s with its own tokens and art", (id) => {
    const { theme } = BANDS[id];
    const html = renderWorksheet({ ...sheet, band: id });
    expect(html).toContain(`data-art="${theme.art}"`);
    for (const token of [theme.paper, theme.ink, theme.muted, theme.accent, theme.rule]) {
      expect(html).toContain(token);
    }
    expect(html).not.toContain("#5c5c5c");
  });

  it("renders two bands differently", () => {
    const a = renderWorksheet({ ...sheet, band: "early-reader" });
    const b = renderWorksheet({ ...sheet, band: "university" });
    expect(a).not.toBe(b);
  });

  it("keeps the art decorative and above the title", () => {
    const html = renderWorksheet(sheet);
    expect(html).toContain('aria-hidden="true"');
    expect(html.indexOf('class="art"')).toBeLessThan(html.indexOf("<h1>"));
  });

  it("gives the art a fixed height and lets a long title wrap", () => {
    const html = renderWorksheet(sheet);
    expect(html).toMatch(/\.art \{[^}]*height: 56px[^}]*overflow: hidden/);
    expect(html).toMatch(/h1 \{[^}]*overflow-wrap: anywhere/);
  });
});
