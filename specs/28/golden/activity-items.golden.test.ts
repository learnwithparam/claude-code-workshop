import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { renderWorksheet, worksheetSchema } from "../../../shared/src/index.ts";
import { ACTIVITY_KIND_LIST, occurrences, oneItem, rawSheet } from "./activity-fixtures.ts";

// Scenario "Every item appears exactly once (property)": N items, 1 to 20, any mix of the 11 kinds.
// Each item gets its own section so kinds mix freely and the item id is unique across the page.
describe("every item appears exactly once", () => {
  it("holds for any mix of kinds, N from 1 to 20", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...ACTIVITY_KIND_LIST), { minLength: 1, maxLength: 20 }),
        (kinds) => {
          const built = kinds.map((kind, i) => oneItem(kind, `id${String.fromCharCode(97 + i)}z`));
          const sheet = worksheetSchema.parse(
            rawSheet("grade-6-8", ...built.map((b) => b.activity)),
          );
          const html = renderWorksheet(sheet);
          for (const token of built.flatMap((b) => b.tokens)) {
            expect(occurrences(html, token), token).toBe(1);
          }
          expect(html.match(/data-item="\d+"/g)?.length ?? 0).toBe(kinds.length);
        },
      ),
      { numRuns: 200 },
    );
  });

  for (const kind of ACTIVITY_KIND_LIST) {
    it(`${kind}: an N-item activity draws N items`, () => {
      const items = oneItem(kind, "q");
      const activity = items.activity as { items: unknown[] };
      const n = 4;
      const many = { ...activity, items: Array.from({ length: n }, () => activity.items[0]) };
      const html = renderWorksheet(worksheetSchema.parse(rawSheet("grade-6-8", many)));
      expect(html.match(/data-item="\d+"/g)?.length ?? 0).toBe(n);
    });
  }
});
