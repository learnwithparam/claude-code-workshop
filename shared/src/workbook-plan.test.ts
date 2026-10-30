import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BAND_IDS, BANDS } from "./bands";
import { planWorkbook } from "./workbook-plan";
import { buildWorkbook } from "./workbook-schema";

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

describe("planWorkbook", () => {
  it("never puts more than maxItemsPerPage items on a page, from the band table (R5, R6)", () => {
    fc.assert(
      fc.property(workbookArb, (wb) => {
        const max = BANDS[wb.band].maxItemsPerPage;
        for (const page of planWorkbook(wb).pages) {
          if (page.kind === "chapter") expect(page.items.length).toBeLessThanOrEqual(max);
        }
      }),
    );
  });

  it("places every item exactly once across chapter pages (R3)", () => {
    fc.assert(
      fc.property(workbookArb, (wb) => {
        const pages = planWorkbook(wb).pages;
        const placed = pages.flatMap((p) =>
          p.kind === "chapter" ? p.items.map((i) => i.prompt) : [],
        );
        const expected = wb.chapters.flatMap((c) => c.items.map((i) => i.prompt));
        expect([...placed].sort()).toEqual([...expected].sort());
        expect(new Set(placed).size).toBe(placed.length);
      }),
    );
  });

  it("splits in item order and never starts a page empty (R7)", () => {
    fc.assert(
      fc.property(workbookArb, (wb) => {
        const plan = planWorkbook(wb);
        wb.chapters.forEach((chapter, index) => {
          const pages = plan.pages.flatMap((p) =>
            p.kind === "chapter" && p.chapter === index ? [p] : [],
          );
          for (const page of pages) expect(page.items.length).toBeGreaterThan(0);
          expect(pages.flatMap((p) => p.items)).toEqual(chapter.items);
        });
      }),
    );
  });

  it("orders cover, contents, chapter pages, answer-key pages with a total (R8)", () => {
    fc.assert(
      fc.property(workbookArb, (wb) => {
        const plan = planWorkbook(wb);
        const kinds = plan.pages.map((p) => p.kind);
        expect(kinds[0]).toBe("cover");
        expect(kinds[1]).toBe("contents");
        const firstKey = kinds.indexOf("answer-key");
        expect(firstKey).toBeGreaterThan(1);
        expect(kinds.slice(2, firstKey).every((k) => k === "chapter")).toBe(true);
        expect(kinds.slice(firstKey).every((k) => k === "answer-key")).toBe(true);
        expect(plan.totalPages).toBe(plan.pages.length);
        expect(plan.pages.map((p) => p.number)).toEqual(plan.pages.map((_, i) => i + 1));
      }),
    );
  });

  it("lists each chapter with the page it starts on (R9)", () => {
    fc.assert(
      fc.property(workbookArb, (wb) => {
        const plan = planWorkbook(wb);
        wb.chapters.forEach((chapter, index) => {
          const first = plan.pages.find((p) => p.kind === "chapter" && p.chapter === index);
          expect(plan.contents[index]).toEqual({ title: chapter.title, page: first?.number });
        });
      }),
    );
  });

  it("covers every answer once on answer-key pages within the page limit (R4, R6)", () => {
    fc.assert(
      fc.property(workbookArb, (wb) => {
        const max = BANDS[wb.band].maxItemsPerPage;
        const keyPages = planWorkbook(wb).pages.flatMap((p) =>
          p.kind === "answer-key" ? [p] : [],
        );
        expect(keyPages.flatMap((p) => p.entries.map((e) => e.answer))).toEqual(
          wb.answerKey.map((e) => e.answer),
        );
        for (const p of keyPages) expect(p.entries.length).toBeLessThanOrEqual(max);
      }),
    );
  });
});
