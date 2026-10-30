import { describe, expect, it } from "vitest";
import { ICONS } from "./art/icon-registry";
import { renderItem } from "./render-item";

describe("renderItem", () => {
  it("puts the registry SVG for the id inside the picture box", () => {
    const html = renderItem({ prompt: "ball", answer: "x", picture: "ball" }, 0, true);
    expect(html).toContain(`<div class="picture">${ICONS.ball}</div>`);
  });

  it("omits the box when the band has no picture boxes", () => {
    const html = renderItem({ prompt: "ball", answer: "x", picture: "ball" }, 0, false);
    expect(html).not.toContain("picture");
  });

  it("escapes the prompt text", () => {
    expect(renderItem({ prompt: "<b>", answer: "x" }, 0, false)).toContain("&lt;b&gt;");
  });
});
