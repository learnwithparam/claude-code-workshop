import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BAND_IDS, BANDS } from "../../../shared/src/bands";
import { planWorkbook } from "../../../shared/src/workbook-plan";
import { buildWorkbook } from "../../../shared/src/workbook-schema";

// The PDF page-count property needs a browser, so it lives in shared/src/workbook-pdf.test.ts.
const workbookArb = fc
  .record({
    band: fc.constantFrom(...BAND_IDS),
    sizes: fc.array(fc.integer({ min: 1, max: 40 }), { minLength: 1, maxLength: 6 }),
  })
  .map(({ band, sizes }) => {
    let n = 0;
    return buildWorkbook({
      title: "T",
      band,
      subject: "S",
      cover: { title: "T", subtitle: "S" },
      chapters: sizes.map((size, c) => ({
        title: `Chapter ${c}`,
        items: Array.from({ length: size }, () => ({ prompt: `Q${n}`, answer: `A${n++}` })),
      })),
    });
  });

describe("workbook properties (issue 34)", () => {
  it("every item appears exactly once", () => {
    fc.assert(
      fc.property(workbookArb, (wb) => {
        const placed = planWorkbook(wb).pages.flatMap((p) =>
          p.kind === "chapter" ? p.items.map((i) => i.prompt) : [],
        );
        const expected = wb.chapters.flatMap((c) => c.items.map((i) => i.prompt));
        expect([...placed].sort()).toEqual([...expected].sort());
      }),
    );
  });

  it("no page exceeds maxItemsPerPage", () => {
    fc.assert(
      fc.property(workbookArb, (wb) => {
        const max = BANDS[wb.band].maxItemsPerPage;
        for (const page of planWorkbook(wb).pages) {
          if (page.kind === "chapter") expect(page.items.length).toBeLessThanOrEqual(max);
        }
      }),
    );
  });

  it("the plan total matches the pages it lists", () => {
    fc.assert(
      fc.property(workbookArb, (wb) => {
        const plan = planWorkbook(wb);
        expect(plan.totalPages).toBe(plan.pages.length);
      }),
    );
  });
});
