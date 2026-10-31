import { describe, expect, it } from "vitest";
import { BANDS } from "./bands";
import { renderSection } from "./render-section";

const section = (n: number) => ({
  heading: "H",
  instruction: "I",
  items: Array.from({ length: n }, () => ({ prompt: "Short", answer: "a" })),
});

describe("renderSection", () => {
  it("wraps the section in a card", () => {
    expect(renderSection(section(2), BANDS["grade-6-8"])).toContain('<section class="card">');
  });

  it("marks the list as a grid only above the threshold", () => {
    expect(renderSection(section(4), BANDS["grade-6-8"])).toContain('<ol class="grid">');
    expect(renderSection(section(3), BANDS["grade-6-8"])).not.toContain("grid");
  });
});
