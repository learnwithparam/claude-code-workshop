import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BAND_IDS } from "./bands";
import { countPdfPages, renderWorkbookPdf } from "./workbook-pdf";
import { planWorkbook } from "./workbook-plan";
import { buildWorkbook } from "./workbook-schema";

describe("workbook pdf", () => {
  it("counts the pages of a PDF", () => {
    const fake = "%PDF-1.4 << /Type /Pages /Count 2 >> << /Type /Page >> << /Type /Page >>";
    expect(countPdfPages(new TextEncoder().encode(fake))).toBe(2);
  });

  // R10, R21: the PDF a customer prints has exactly the pages the plan promised.
  it("has a page count equal to the plan", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...BAND_IDS),
        fc.array(fc.integer({ min: 1, max: 25 }), { minLength: 1, maxLength: 3 }),
        async (band, sizes) => {
          const wb = buildWorkbook({
            title: "T",
            band,
            subject: "S",
            cover: { title: "T", subtitle: "S" },
            chapters: sizes.map((size, c) => ({
              title: `C${c}`,
              items: Array.from({ length: size }, (_, i) => ({
                prompt: `Q${c}.${i}`,
                answer: `A${c}.${i}`,
              })),
            })),
          });
          const pdf = await renderWorkbookPdf(wb);
          expect(countPdfPages(pdf)).toBe(planWorkbook(wb).totalPages);
        },
      ),
      { numRuns: 4 },
    );
  }, 120_000);
});
