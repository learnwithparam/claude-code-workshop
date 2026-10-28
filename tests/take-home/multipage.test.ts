import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BANDS } from "../../shared/src/bands";
import { checkBand } from "../../shared/src/check";
import { renderWorksheet } from "../../shared/src/render";
import { worksheetSchema } from "../../shared/src/schema";

// The take-home brief as tests. Skipped in make check, red under make prove-homework until it is built.
const homework = process.env.HOMEWORK === "1";
const pack = JSON.parse(readFileSync("fixtures/take-home/pack.json", "utf8"));
const render = () => renderWorksheet(pack);
const pages = (html: string) => html.match(/<div class="page"[ >]/g)?.length ?? 0;

describe.skipIf(!homework)("take-home: multi-page worksheets", () => {
  it("the schema accepts a worksheet made of pages", () => {
    expect(worksheetSchema.safeParse(pack).success).toBe(true);
  });

  it("renders every page plus the answer key as its own page", () => {
    expect(pages(render())).toBe(3);
  });

  it("puts the answer key on the last page, never earlier", () => {
    const last = render().split('<div class="page"').at(-1) ?? "";
    expect(last).toContain("Answer key");
    expect(render().split("Answer key")).toHaveLength(2);
  });

  it("gives each band a maxItemsPerPage and keeps every page under it", () => {
    const cap = (BANDS[pack.band as keyof typeof BANDS] as { maxItemsPerPage?: number })
      .maxItemsPerPage;
    expect(cap).toBeGreaterThan(0);
    for (const page of pack.pages) {
      const count = page.sections.flatMap((s: { items: unknown[] }) => s.items).length;
      expect(count).toBeLessThanOrEqual(cap ?? 0);
    }
  });

  it("checks compliance page by page and flags an overfull page", () => {
    expect(checkBand(pack).ok).toBe(true);
    const crowded = structuredClone(pack);
    const extra = crowded.pages[0].sections[0].items;
    while (extra.length < 40) extra.push({ ...extra[0] });
    expect(checkBand(crowded).ok).toBe(false);
  });

  it("starts a new printed page at every page", () => {
    expect(render()).toMatch(
      /@media print[\s\S]*(break-after|page-break-after)\s*:\s*(page|always)/,
    );
  });

  it("costs under 2,500 output tokens for three pages, from a recorded run", () => {
    const file = "fixtures/take-home/eval.json";
    expect(existsSync(file), "record a 3-page run into fixtures/take-home/eval.json").toBe(true);
    const rows = JSON.parse(readFileSync(file, "utf8")) as { outputTokens: number }[];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.outputTokens).toBeLessThan(2500);
  });
});
