import { describe, expect, it } from "vitest";
import type { Lab } from "./catalog.ts";
import { bar, colorEnabled, renderBrief, renderMap } from "./render.ts";

const lab: Lab = {
  id: "start-01",
  lane: "start",
  title: "First prompt",
  pairs: "docs/README.md",
  goal: "Ask one question.",
  steps: [{ text: "Run `claude`.", expect: "A short reply; wording varies." }],
  proof: "true",
  hints: ["one", "two"],
  learned: "l",
};
// biome-ignore lint/suspicious/noControlCharactersInRegex: the test looks for the escape byte
const ESC = /\u001b/;

describe("colorEnabled", () => {
  it("respects NO_COLOR and FORCE_COLOR", () => {
    expect(colorEnabled({ NO_COLOR: "1" }, true)).toBe(false);
    expect(colorEnabled({ NO_COLOR: "1", FORCE_COLOR: "1" }, true)).toBe(false);
    expect(colorEnabled({ FORCE_COLOR: "1" }, false)).toBe(true);
    expect(colorEnabled({}, true)).toBe(true);
    expect(colorEnabled({}, false)).toBe(false);
  });
});

describe("bar", () => {
  it("fills in proportion", () => {
    expect(bar(1, 4, 8, false)).toBe("██░░░░░░");
    expect(bar(0, 0, 4, false)).toBe("░░░░");
    expect(bar(4, 4, 4, false)).toBe("████");
  });
});

describe("renderMap", () => {
  const stats = [{ lane: "start" as const, done: 1, total: 2 }];
  it("has no escape codes without color", () => {
    const text = renderMap(
      stats,
      [lab],
      { done: { "start-01": "x" }, hints: {} },
      "start-01",
      false,
    );
    expect(text).not.toMatch(ESC);
    expect(text).toContain("start");
    expect(text).toContain("1/2");
  });
  it("uses escape codes with color", () => {
    expect(renderMap(stats, [lab], { done: {}, hints: {} }, "start-01", true)).toMatch(ESC);
  });
});

describe("renderBrief", () => {
  it("shows the goal and steps but hides unrevealed hints", () => {
    const text = renderBrief(lab, { done: {}, hints: {} }, false);
    expect(text).toContain("Ask one question.");
    expect(text).toContain("1. Run `claude`.");
    expect(text).toContain("   Expect: A short reply; wording varies.");
    expect(text).not.toContain("one\n");
    expect(text).toContain("0 of 2");
  });
  it("prints the expect line dim under its step and omits it when absent", () => {
    const plain = { ...lab, steps: [{ text: "Think." }] };
    expect(renderBrief(plain, { done: {}, hints: {} }, false)).not.toContain("Expect:");
    const text = renderBrief(lab, { done: {}, hints: {} }, true);
    expect(text).toContain("\u001b[2m   Expect: A short reply; wording varies.\u001b[0m");
  });
  it("shows revealed hints only", () => {
    const text = renderBrief(lab, { done: {}, hints: { "start-01": 1 } }, false);
    expect(text).toContain("Hint 1: one");
    expect(text).not.toContain("two");
  });
});
