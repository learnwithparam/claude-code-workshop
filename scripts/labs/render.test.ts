import { describe, expect, it } from "vitest";
import type { Lab } from "./catalog.ts";
import { bar, colorEnabled, renderBrief, renderMap } from "./render.ts";

const lab: Lab = {
  id: "start-01",
  lane: "start",
  title: "First prompt",
  pairs: "docs/README.md",
  goal: "Ask one question.",
  help: "guided",
  steps: ["Run `claude`."],
  proof: [{ text: "It holds.", command: "true" }],
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

describe("warm-up", () => {
  const withWarmup: Lab = {
    ...lab,
    id: "daily-01",
    warmup: { question: "What blocks a hook?", from: "start-01", answer: "Exit code 2." },
  };
  it("shows above the goal, with its answer under Hints, when the source lab is done", () => {
    const text = renderBrief(withWarmup, { done: { "start-01": "x" }, hints: {} }, false);
    expect(text).toContain("Warm-up (from start-01) What blocks a hook?");
    expect(text.indexOf("Warm-up")).toBeLessThan(text.indexOf("Goal"));
    expect(text.indexOf("Answer: Exit code 2.")).toBeGreaterThan(text.indexOf("Hints:"));
  });
  it("is absent when the source lab is not done", () => {
    const text = renderBrief(withWarmup, { done: {}, hints: {} }, false);
    expect(text).not.toContain("Warm-up");
    expect(text).not.toContain("Exit code 2.");
  });
});

describe("renderBrief", () => {
  it("shows the goal and steps but hides unrevealed hints", () => {
    const text = renderBrief(lab, { done: {}, hints: {} }, false);
    expect(text).toContain("Ask one question.");
    expect(text).toContain("1. Run `claude`.");
    expect(text).not.toContain("one\n");
    expect(text).toContain("0 of 2");
  });
  it("hinted: swaps step commands for a pointer to the hints", () => {
    const hinted: Lab = { ...lab, help: "hinted", steps: ["Run `claude -p hi`, then read it."] };
    const text = renderBrief(hinted, { done: {}, hints: {} }, false);
    expect(text).not.toContain("claude -p hi");
    expect(text).toContain("(command in hints)");
    expect(text).toContain("Ask one question.");
  });
  it("goal: shows the goal and proof but no step list", () => {
    const goal: Lab = { ...lab, help: "goal", steps: ["Run `claude -p hi`."], proof: "test -f x" };
    const text = renderBrief(goal, { done: {}, hints: {} }, false);
    expect(text).toContain("Ask one question.");
    expect(text).toContain("test -f x");
    expect(text).not.toContain("Steps");
    expect(text).not.toContain("claude -p hi");
    expect(text).toContain("make lab HINT=1");
  });
  it("links to the feedback form with the lab id filled in", () => {
    const text = renderBrief(lab, { done: {}, hints: {} }, false);
    expect(text).toContain(
      "Stuck? https://github.com/learnwithparam/claude-code-workshop/issues/new?template=lab-feedback.yml&lab=start-01",
    );
  });
  it("shows revealed hints only", () => {
    const text = renderBrief(lab, { done: {}, hints: { "start-01": 1 } }, false);
    expect(text).toContain("Hint 1: one");
    expect(text).not.toContain("two");
  });
});
