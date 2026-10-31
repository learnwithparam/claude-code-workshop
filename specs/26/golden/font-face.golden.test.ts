import { describe, expect, it } from "vitest";
import { renderWorksheet } from "../../../shared/src/render";
import type { Worksheet } from "../../../shared/src/schema";

const sheet: Worksheet = {
  title: "Fonts",
  band: "grade-3-5",
  subject: "Reading",
  sections: [
    { heading: "Read", instruction: "Answer.", items: [{ prompt: "Who ran?", answer: "Tom" }] },
  ],
};

describe("renderWorksheet fonts", () => {
  it("declares @font-face for Geist with a data: source", () => {
    const html = renderWorksheet(sheet);
    const rules = html.match(/@font-face\s*{[^}]*}/g) ?? [];
    const geist = rules.filter((rule) => /font-family:\s*["']?Geist["']?\s*[;}]/.test(rule));
    expect(geist.length).toBeGreaterThan(0);
    expect(geist.some((rule) => /src:[^;}]*url\(\s*["']?data:/.test(rule))).toBe(true);
  });
});
