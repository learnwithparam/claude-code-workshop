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
  steps: [{ where: "shell", text: "Run `claude`.", expect: "A short reply; wording varies." }],
  proof: [{ text: "It holds.", command: "true" }],
  hints: ["one", "two"],
  learned: "l",
  predict: { question: "Will it edit a file?", answer: "No, plan mode is read-only." },
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
      { done: { "start-01": "x" }, hints: {}, attempts: {} },
      "start-01",
      false,
    );
    expect(text).not.toMatch(ESC);
    expect(text).toContain("start");
    expect(text).toContain("1/2");
  });
  it("uses escape codes with color", () => {
    expect(
      renderMap(stats, [lab], { done: {}, hints: {}, attempts: {} }, "start-01", true),
    ).toMatch(ESC);
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
  const empty = { done: {}, hints: {}, attempts: {} };
  it("matches the snapshot with colour off", () => {
    expect(renderBrief(tagged, empty, false)).toMatchInlineSnapshot(`
      "start-01  First prompt
      Pairs with docs/README.md

      Goal Ask one question.

      Predict first
      Will it edit a file?
      Save your guess with: make lab GUESS="your guess"

      Steps
      1. [in your shell] Make the folder: \`mkdir -p .labs/work\`.
      2. [in Claude Code] Leave the session with \`/exit\`.
      3. [in your editor] Write \`.labs/work/notes.md\`.

      Hints: 0 of 2 revealed. Reveal the next with: make lab HINT=1
      Stuck? https://github.com/learnwithparam/claude-code-workshop/issues/new?template=lab-feedback.yml&lab=start-01"
    `);
  });
  it("paints each tag with its own colour code", () => {
    const text = renderBrief(tagged, empty, true);
    expect(text).toContain("\u001b[36min your shell\u001b[0m");
    expect(text).toContain("\u001b[33min Claude Code\u001b[0m");
    expect(text).toContain("\u001b[36min your editor\u001b[0m");
  });
});

describe("warm-up", () => {
  const withWarmup: Lab = {
    ...lab,
    id: "daily-01",
    warmup: { question: "What blocks a hook?", from: "start-01", answer: "Exit code 2." },
  };
  it("shows above the goal, with its answer under Hints, when the source lab is done", () => {
    const progress = { done: { "start-01": "x" }, hints: {}, attempts: {} };
    const text = renderBrief(withWarmup, progress, false);
    expect(text).toContain("Warm-up (from start-01) What blocks a hook?");
    expect(text.indexOf("Warm-up")).toBeLessThan(text.indexOf("Goal"));
    expect(text.indexOf("Answer: Exit code 2.")).toBeGreaterThan(text.indexOf("Hints:"));
  });
  it("is absent when the source lab is not done", () => {
    const text = renderBrief(withWarmup, { done: {}, hints: {}, attempts: {} }, false);
    expect(text).not.toContain("Warm-up");
    expect(text).not.toContain("Exit code 2.");
  });
});

describe("renderBrief", () => {
  it("shows the goal and steps but hides unrevealed hints", () => {
    const text = renderBrief(lab, { done: {}, hints: {}, attempts: {} }, false);
    expect(text).toContain("Ask one question.");
    expect(text).toContain("1. [in your shell] Run `claude`.");
    expect(text).toContain("   Expect: A short reply; wording varies.");
    expect(text).not.toContain("one\n");
    expect(text).toContain("0 of 2");
  });
  it("asks the predict question above the steps and never shows the answer", () => {
    const text = renderBrief(lab, { done: {}, hints: {}, attempts: {} }, false);
    expect(text).toContain("Will it edit a file?");
    expect(text.indexOf("Will it edit a file?")).toBeLessThan(text.indexOf("1. Run"));
    expect(text).not.toContain("plan mode is read-only");
  });
  it("prints the expect line dim under its step and omits it when absent", () => {
    const plain = { ...lab, steps: [{ where: "shell" as const, text: "Think." }] };
    const none = { done: {}, hints: {}, attempts: {} };
    expect(renderBrief(plain, none, false)).not.toContain("Expect:");
    const text = renderBrief(lab, { done: {}, hints: {}, attempts: {} }, true);
    expect(text).toContain("\u001b[2m   Expect: A short reply; wording varies.\u001b[0m");
  });
  it("hinted: swaps step commands for a pointer to the hints", () => {
    const steps = [{ where: "shell" as const, text: "Run `claude -p hi`, then read it." }];
    const hinted: Lab = { ...lab, help: "hinted", steps };
    const text = renderBrief(hinted, { done: {}, hints: {}, attempts: {} }, false);
    expect(text).not.toContain("claude -p hi");
    expect(text).toContain("(command in hints)");
    expect(text).toContain("Ask one question.");
  });
  it("goal: shows the goal and proof but no step list", () => {
    const steps = [{ where: "shell" as const, text: "Run `claude -p hi`." }];
    const proof = [
      { text: "The notes file exists.", command: "test -f x" },
      { text: "The notes file is not empty.", command: "test -s x" },
    ];
    const goal: Lab = { ...lab, help: "goal", steps, proof };
    const text = renderBrief(goal, { done: {}, hints: {}, attempts: {} }, false);
    expect(text).toContain("Ask one question.");
    expect(text).toContain("1. The notes file exists.");
    expect(text).toContain("2. The notes file is not empty.");
    expect(text).not.toContain("[object Object]");
    expect(text).not.toContain("Steps");
    expect(text).not.toContain("claude -p hi");
    expect(text).toContain("make lab HINT=1");
  });
  it("links to the feedback form with the lab id filled in", () => {
    const text = renderBrief(lab, { done: {}, hints: {}, attempts: {} }, false);
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
