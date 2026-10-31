import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { checkBand } from "../../shared/src/check.ts";
import { renderWorksheet } from "../../shared/src/render.ts";
import { worksheetSchema } from "../../shared/src/schema.ts";

// Assignment: fuzz the tool input. Skipped until you start: ASSIGNMENT=1 npx vitest run tests/assignments
const on = process.env.ASSIGNMENT === "1";
const MODULE = "../../shared/src/arb-worksheet.ts";
const MARKUP = /<(script|img|svg|iframe)\b/i;

describe.skipIf(!on)("assignment: fuzz the worksheet tool input", () => {
  it("renders every accepted worksheet, with no raw markup from the text fields", async () => {
    const { arbWorksheet } = await import(MODULE);
    fc.assert(
      fc.property(arbWorksheet, (candidate) => {
        const parsed = worksheetSchema.safeParse(candidate);
        if (!parsed.success) return;
        const html = renderWorksheet(parsed.data);
        const written = parsed.data.sections.flatMap((s) => [s.heading, s.instruction]);
        for (const text of [parsed.data.title, parsed.data.subject, ...written])
          if (MARKUP.test(text)) expect(html).not.toContain(text);
      }),
    );
  });

  it("reports a problem, not a throw, for every accepted worksheet over its band", async () => {
    const { arbWorksheet } = await import(MODULE);
    fc.assert(
      fc.property(arbWorksheet, (candidate) => {
        const parsed = worksheetSchema.safeParse(candidate);
        if (!parsed.success) return;
        const verdict = checkBand(parsed.data);
        expect(verdict.ok).toBe(verdict.problems.length === 0);
      }),
    );
  });
});
