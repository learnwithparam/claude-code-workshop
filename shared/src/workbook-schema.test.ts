import { describe, expect, it } from "vitest";
import { buildWorkbook, workbookContentSchema, workbookSchema } from "./workbook-schema";

const item = (n: number) => ({ prompt: `Q${n}`, answer: `A${n}` });
const content = {
  title: "Fractions",
  band: "grade-3-5" as const,
  subject: "Maths",
  cover: { title: "Fractions workbook", subtitle: "Grades 3 to 5" },
  chapters: [
    { title: "Halves", items: [item(1), item(2)] },
    { title: "Quarters", items: [item(3)] },
  ],
};

describe("workbookSchema", () => {
  it("builds a workbook with cover, contents, chapters and answer-key appendix (R1)", () => {
    const wb = workbookSchema.parse(buildWorkbook(content));
    expect(wb.cover.title).toBe("Fractions workbook");
    expect(wb.contents.map((c) => c.title)).toEqual(["Halves", "Quarters"]);
    expect(wb.chapters).toHaveLength(2);
    expect(wb.answerKey.length).toBe(3);
  });

  it("rejects a workbook without chapters or without a cover (R1)", () => {
    expect(workbookContentSchema.safeParse({ ...content, chapters: [] }).success).toBe(false);
    expect(workbookContentSchema.safeParse({ ...content, cover: undefined }).success).toBe(false);
  });

  it("gives every chapter a title and an ordered item list (R2)", () => {
    const wb = buildWorkbook(content);
    expect(wb.chapters[0]?.items.map((i) => i.prompt)).toEqual(["Q1", "Q2"]);
    const untitled = { ...content, chapters: [{ title: "", items: [item(1)] }] };
    expect(workbookContentSchema.safeParse(untitled).success).toBe(false);
    const empty = { ...content, chapters: [{ title: "T", items: [] }] };
    expect(workbookContentSchema.safeParse(empty).success).toBe(false);
  });

  it("has one answer-key entry per item and none for a missing item (R4)", () => {
    const wb = buildWorkbook(content);
    expect(wb.answerKey.map((e) => e.answer)).toEqual(["A1", "A2", "A3"]);
    expect(wb.answerKey.map((e) => `${e.chapter}.${e.item}`)).toEqual(["0.0", "0.1", "1.0"]);
  });
});
