import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ICONS } from "./art/icon-registry";
import { renderItem } from "./render-item";
import { itemSchema } from "./schema";

const RAW_MARKUP = /[<>]|<svg|javascript:|\bon\w+\s*=/i;

describe("itemSchema picture", () => {
  it("rejects an unknown icon id", () => {
    const parsed = itemSchema.safeParse({ prompt: "p", answer: "a", picture: "dragon" });
    expect(parsed.success).toBe(false);
  });

  it("allows an item with no picture", () => {
    expect(itemSchema.safeParse({ prompt: "p", answer: "a" }).success).toBe(true);
  });

  it("never lets raw markup through as a picture, and renders only registry SVG", () => {
    const markupish = fc.oneof(
      fc.string(),
      fc.constantFrom("<svg onload=alert(1)>", "javascript:alert(1)", "<img src=x onerror=a()>"),
      fc.constantFrom(...Object.keys(ICONS)).map((id) => `${id}<script>`),
    );
    fc.assert(
      fc.property(markupish, (picture) => {
        const parsed = itemSchema.safeParse({ prompt: "p", answer: "a", picture });
        if (!parsed.success) return true;
        const html = renderItem(parsed.data, 0, true);
        const box = html.match(/<div class="picture">(.*?)<\/div>/s)?.[1] ?? "";
        return !RAW_MARKUP.test(picture) && Object.values(ICONS).includes(box);
      }),
    );
  });
});
