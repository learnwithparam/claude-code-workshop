import { describe, expect, it } from "vitest";
import { LANES, loadLabs, parseLab } from "./catalog.ts";

const good = `# First prompt

**Pairs with:** \`docs/levels/hand-built.md\`
**Help:** guided

## Goal
Ask Claude one question.

## Steps
1. Run \`claude\`.
2. Ask it.

## Proof

1. The notes file exists.
   \`\`\`sh
   test -f .labs/work/a.md
   \`\`\`
2. The notes file is not empty.
   \`\`\`sh
   test -s .labs/work/a.md
   \`\`\`

## Hints
1. Look in .labs.
2. Create the file.

## What you just learned
A prompt is just a question.
`;

describe("parseLab", () => {
  it("reads every section", () => {
    const lab = parseLab("start", "01-first-prompt.md", good);
    expect(lab).toMatchObject({
      id: "start-01",
      lane: "start",
      title: "First prompt",
      pairs: "docs/levels/hand-built.md",
      help: "guided",
      goal: "Ask Claude one question.",
      learned: "A prompt is just a question.",
    });
    expect(lab.proof).toEqual([
      { text: "The notes file exists.", command: "test -f .labs/work/a.md" },
      { text: "The notes file is not empty.", command: "test -s .labs/work/a.md" },
    ]);
    expect(lab.steps).toEqual(["Run `claude`.", "Ask it."]);
    expect(lab.hints).toHaveLength(2);
  });

  it("rejects a lab with no proof", () => {
    const text = good.replace(/## Proof[\s\S]*?## Hints/, "## Hints");
    expect(() => parseLab("start", "01-x.md", text)).toThrow(/proof/i);
  });

  it("rejects a proof item that has no command", () => {
    const text = good.replace(/ {3}`{3}sh\n {3}test -s[^\n]*\n {3}`{3}\n/, "");
    expect(() => parseLab("start", "01-x.md", text)).toThrow(/proof/i);
  });

  it("rejects a lab with fewer than two hints", () => {
    expect(() => parseLab("start", "01-x.md", good.replace("2. Create the file.\n", ""))).toThrow();
  });

  it("rejects a missing or unknown help level", () => {
    expect(() => parseLab("start", "01-x.md", good.replace("**Help:** guided\n", ""))).toThrow(
      /help/i,
    );
    expect(() => parseLab("start", "01-x.md", good.replace("guided", "easy"))).toThrow(/help/i);
  });

  it("rejects a file name that is not kebab-case with a number", () => {
    expect(() => parseLab("start", "FirstPrompt.md", good)).toThrow(/file name/);
  });
});

describe("loadLabs", () => {
  it("orders labs by lane then number", () => {
    const labs = loadLabs("labs");
    const lanes = labs.map((l) => LANES.indexOf(l.lane));
    expect(lanes).toEqual([...lanes].sort((a, b) => a - b));
    expect(new Set(labs.map((l) => l.id)).size).toBe(labs.length);
  });
});
