import { describe, expect, it } from "vitest";
import type { Lab } from "./catalog.ts";
import { bar, colorEnabled, renderBrief, renderMap } from "./render.ts";

const lab: Lab = {
  id: "start-01",
  lane: "start",
  title: "First prompt",
  pairs: "docs/README.md",
  goal: "Ask one question.",
  steps: [{ where: "shell", text: "Run `claude`." }],
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

const tagged: Lab = {
  ...lab,
  steps: [
    { where: "shell", text: "Make the folder: `mkdir -p .labs/work`." },
    { where: "claude", text: "Leave the session with `/exit`." },
    { where: "editor", text: "Write `.labs/work/notes.md`." },
  ],
};

describe("renderBrief window tags", () => {
  const empty = { done: {}, hints: {} };
  it("matches the snapshot with colour off", () => {
    expect(renderBrief(tagged, empty, false)).toMatchInlineSnapshot(`
      "start-01  First prompt
      Pairs with docs/README.md

      Goal Ask one question.

      Steps
      1. [in your shell] Make the folder: \`mkdir -p .labs/work\`.
      2. [in Claude Code] Leave the session with \`/exit\`.
      3. [in your editor] Write \`.labs/work/notes.md\`.

      Hints: 0 of 2 revealed. Reveal the next with: make lab HINT=1"
    `);
  });
  it("paints each tag with its own colour code", () => {
    const text = renderBrief(tagged, empty, true);
    expect(text).toContain("\u001b[36min your shell\u001b[0m");
    expect(text).toContain("\u001b[33min Claude Code\u001b[0m");
    expect(text).toContain("\u001b[36min your editor\u001b[0m");
  });
});

describe("renderBrief", () => {
  it("shows the goal and steps but hides unrevealed hints", () => {
    const text = renderBrief(lab, { done: {}, hints: {} }, false);
    expect(text).toContain("Ask one question.");
    expect(text).toContain("1. [in your shell] Run `claude`.");
    expect(text).not.toContain("one\n");
    expect(text).toContain("0 of 2");
  });
  it("shows revealed hints only", () => {
    const text = renderBrief(lab, { done: {}, hints: { "start-01": 1 } }, false);
    expect(text).toContain("Hint 1: one");
    expect(text).not.toContain("two");
  });
});
