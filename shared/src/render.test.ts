import { describe, expect, it } from "vitest";
import { renderWorksheet } from "./render";
import type { Worksheet } from "./schema";

const sheet: Worksheet = {
  title: "Tom & <Jerry>",
  band: "grade-3-5",
  subject: "Reading",
  sections: [
    { heading: "Read", instruction: "Answer.", items: [{ prompt: "Who ran?", answer: "Tom" }] },
  ],
};

describe("renderWorksheet", () => {
  it("emits a still composition root", () => {
    const html = renderWorksheet(sheet);
    expect(html).toContain('data-composition-id="worksheet"');
    expect(html).toContain("data-no-timeline");
  });

  it("escapes model text", () => {
    const html = renderWorksheet(sheet);
    expect(html).toContain("Tom &amp; &lt;Jerry&gt;");
    expect(html).not.toContain("<Jerry>");
  });

  it("puts the answer key after the questions", () => {
    const html = renderWorksheet(sheet);
    expect(html.indexOf("Who ran?")).toBeLessThan(html.indexOf("Answer key"));
  });
});
