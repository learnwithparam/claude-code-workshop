import { describe, expect, it } from "vitest";
import { renderAnswerKey } from "./render-answer-key";

describe("renderAnswerKey", () => {
  it("lists answers in order", () => {
    const html = renderAnswerKey({
      title: "T",
      band: "grade-3-5",
      subject: "S",
      sections: [{ heading: "H", instruction: "I", items: [{ prompt: "p", answer: "A1" }] }],
    });
    expect(html).toContain('class="key"');
    expect(html).toContain("A1");
  });

  it("renders nothing without items, so no blank page", () => {
    expect(renderAnswerKey({ title: "T", band: "grade-3-5", subject: "S", sections: [] })).toBe("");
  });
});
