import { describe, expect, it } from "vitest";
import { renderWorkbook } from "./render-workbook";
import { planWorkbook } from "./workbook-plan";
import { buildWorkbook } from "./workbook-schema";

const wb = buildWorkbook({
  title: "T",
  band: "grade-3-5",
  subject: "S",
  cover: { title: "Cover <b>", subtitle: "Sub" },
  chapters: [
    {
      title: "Alpha",
      items: Array.from({ length: 30 }, (_, i) => ({ prompt: `Q${i}`, answer: `A${i}` })),
    },
    { title: "Beta", items: [{ prompt: "Last", answer: "Z" }] },
  ],
});

describe("renderWorkbook", () => {
  const html = renderWorkbook(wb);
  const plan = planWorkbook(wb);

  it("renders one page element per planned page (R8, R10)", () => {
    expect(html.match(/class="[^"]*\bworkbook-page\b/g)?.length).toBe(plan.totalPages);
  });

  it("lists each chapter title with its start page on the contents page (R9)", () => {
    for (const entry of plan.contents) {
      const row = new RegExp(`${entry.title}[^<]*</[^>]+>\\s*<[^>]+>\\s*${entry.page}\\b`);
      expect(html).toMatch(row);
    }
  });

  it("forces a print break before the cover, contents, chapters and answer key (R11)", () => {
    expect(html).toMatch(/break-before:\s*page|page-break-before:\s*always/);
    for (const kind of ["cover", "contents", "chapter", "answer-key"]) {
      expect(html).toContain(`data-page-kind="${kind}"`);
    }
  });

  it("escapes model text", () => {
    expect(html).not.toContain("Cover <b>");
  });
});
