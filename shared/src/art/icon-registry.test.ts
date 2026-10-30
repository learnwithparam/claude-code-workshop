import { describe, expect, it } from "vitest";
import { ICON_IDS, iconIdSchema } from "./icon-ids";
import { ICONS, renderIcon } from "./icon-registry";

describe("icon registry", () => {
  it("has about forty icons", () => {
    expect(ICON_IDS.length).toBeGreaterThanOrEqual(40);
  });

  it("has an SVG for every id and an id for every SVG", () => {
    expect(Object.keys(ICONS).sort()).toEqual([...ICON_IDS].sort());
    expect(new Set(Object.values(ICONS)).size).toBe(ICON_IDS.length);
  });

  it.each(ICON_IDS)("%s is a self-contained, titled, scalable SVG", (id) => {
    const svg = renderIcon(id);
    expect(svg.startsWith("<svg ")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain('viewBox="0 0 64 64"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain(`<title>${id}</title>`);
    expect(svg).not.toMatch(/<script|<image|<foreignObject|href=|url\(|\son\w+=|javascript:/i);
    expect(svg.match(/^<svg[^>]*>/)?.[0]).not.toMatch(/\swidth=|\sheight=/);
  });

  it("accepts every id and rejects unknown ones", () => {
    for (const id of ICON_IDS) expect(iconIdSchema.safeParse(id).success).toBe(true);
    for (const bad of ["", "dragon", "BALL", "<svg>", "ball ", "3 apples"]) {
      expect(iconIdSchema.safeParse(bad).success).toBe(false);
    }
  });
});
