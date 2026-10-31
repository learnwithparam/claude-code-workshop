import { describe, expect, it } from "vitest";
import { fillSlotsSchema, fillTemplate, type Template } from "./template";

const template: Template = {
  band: "grade-1-2",
  title: "T",
  subject: "S",
  topic: [],
  slots: ["slot-1", "slot-2"],
  sections: [{ heading: "H", instruction: "I", pictures: [undefined, undefined] }],
};

describe("template", () => {
  it("fills slots into items and splits answers", () => {
    const sheet = fillTemplate(template, ["1 + 1 => 2", "x"]);
    expect(sheet.sections[0]?.items).toEqual([
      { prompt: "1 + 1", answer: "2" },
      { prompt: "x", answer: "x" },
    ]);
  });

  it("rejects the wrong number of values", () => {
    expect(() => fillTemplate(template, ["a"])).toThrow();
    expect(fillSlotsSchema(template).safeParse({ values: ["a"] }).success).toBe(false);
  });
});
