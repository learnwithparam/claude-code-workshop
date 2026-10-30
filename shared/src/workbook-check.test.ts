import { describe, expect, it } from "vitest";
import { BANDS } from "./bands";
import { checkWorkbook } from "./workbook-check";
import { buildWorkbook } from "./workbook-schema";

const make = (count: number) =>
  buildWorkbook({
    title: "T",
    band: "grade-3-5",
    subject: "S",
    cover: { title: "T", subtitle: "S" },
    chapters: [
      {
        title: "C",
        items: Array.from({ length: count }, (_, i) => ({ prompt: `Q${i}`, answer: `A${i}` })),
      },
    ],
  });

describe("checkWorkbook", () => {
  it("passes a well-formed workbook (R16)", () => {
    const wb = make(BANDS["grade-3-5"].maxItemsPerPage * 2 + 1);
    expect(checkWorkbook(wb)).toEqual({ ok: true, problems: [] });
  });

  it("reports a duplicated item (R3)", () => {
    const wb = make(3);
    const first = wb.chapters[0]?.items[0];
    if (first) wb.chapters[0]?.items.push({ ...first });
    expect(checkWorkbook(wb).ok).toBe(false);
  });

  it("reports an answer-key entry for a missing item, and a missing entry (R4)", () => {
    const extra = make(2);
    extra.answerKey.push({ chapter: 0, item: 9, answer: "ghost" });
    expect(checkWorkbook(extra).ok).toBe(false);
    const missing = make(2);
    missing.answerKey.pop();
    expect(checkWorkbook(missing).ok).toBe(false);
  });
});
