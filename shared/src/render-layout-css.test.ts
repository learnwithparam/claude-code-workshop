import { describe, expect, it } from "vitest";
import { BANDS } from "./bands";
import { layoutCss, useGrid } from "./render-layout-css";

const items = (n: number, prompt = "Short one") =>
  Array.from({ length: n }, () => ({ prompt, answer: "a" }));

describe("useGrid", () => {
  it("uses two columns for four or more short items", () => {
    expect(useGrid(items(4), BANDS["grade-6-8"])).toBe(true);
  });

  it("stays single column below four items", () => {
    expect(useGrid(items(3), BANDS["grade-6-8"])).toBe(false);
  });

  it("stays single column when any item is long", () => {
    const long = [
      ...items(4),
      { prompt: "one two three four five six seven eight nine", answer: "a" },
    ];
    expect(useGrid(long, BANDS["grade-6-8"])).toBe(false);
  });

  it("keeps picture bands single column", () => {
    expect(useGrid(items(5), BANDS.kindergarten)).toBe(false);
  });
});

describe("layoutCss", () => {
  it("breaks the page before the key and keeps items whole", () => {
    const css = layoutCss(BANDS["grade-3-5"]);
    expect(css).toMatch(/\.key \{[^}]*break-before: page/);
    expect(css).toMatch(/li \{ break-inside: avoid/);
    expect(css).toMatch(/h2 \{[^}]*break-after: avoid/);
  });

  it("uses a minimum height, never a clipping one", () => {
    expect(layoutCss(BANDS["grade-3-5"])).toContain("min-height: 1056px");
  });
});
