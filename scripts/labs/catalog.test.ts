import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LANES, loadLabs, parseLab } from "./catalog.ts";

const good = `# First prompt

**Pairs with:** \`docs/levels/hand-built.md\`
**Help:** guided

## Goal
Ask Claude one question.

## Predict
Will the answer print to the screen or go to a file?
Answer: It goes to the file, because the redirect catches it before the screen.

## Steps
1. Run \`claude\`.
   Expect: A reply in plain words; the wording differs each time.
2. [claude] Ask it.
3. [editor] Write \`a.md\`.

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
      predict: {
        question: "Will the answer print to the screen or go to a file?",
        answer: "It goes to the file, because the redirect catches it before the screen.",
      },
    });
    expect(lab.steps).toEqual([
      {
        where: "shell",
        text: "Run `claude`.",
        expect: "A reply in plain words; the wording differs each time.",
      },
      { where: "claude", text: "Ask it." },
      { where: "editor", text: "Write `a.md`." },
    ]);
    expect(lab.proof).toEqual([
      { text: "The notes file exists.", command: "test -f .labs/work/a.md" },
      { text: "The notes file is not empty.", command: "test -s .labs/work/a.md" },
    ]);
    expect(lab.hints).toHaveLength(2);
  });

  it("rejects an unknown window tag", () => {
    expect(() => parseLab("start", "01-x.md", good.replace("[claude]", "[browser]"))).toThrow(
      /window tag/,
    );
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

  it("reads an optional warm-up", () => {
    const text = good.replace(
      "## Goal",
      "## Warm-up\nWhat does a prompt need?\nFrom: start-01\nAnswer: A question.\n\n## Goal",
    );
    expect(parseLab("start", "02-x.md", text).warmup).toEqual({
      question: "What does a prompt need?",
      from: "start-01",
      answer: "A question.",
    });
    expect(parseLab("start", "01-x.md", good).warmup).toBeUndefined();
  });

  it("rejects a warm-up with no From or no Answer", () => {
    const bad = good.replace("## Goal", "## Warm-up\nWhy?\nAnswer: Because.\n\n## Goal");
    expect(() => parseLab("start", "02-x.md", bad)).toThrow(/from/i);
  });

  it("rejects a lab with no predict section", () => {
    const text = good.replace(/## Predict[\s\S]*?## Steps/, "## Steps");
    expect(() => parseLab("start", "01-x.md", text)).toThrow(/predict/i);
  });

  it("rejects a predict section with no Answer line", () => {
    const text = good.replace(/^Answer:.*\n/m, "");
    expect(() => parseLab("start", "01-x.md", text)).toThrow(/predict/i);
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

  it("rejects a warm-up whose From is not an earlier lab", () => {
    const dir = mkdtempSync(join(tmpdir(), "labs-"));
    for (const lane of LANES) mkdirSync(join(dir, lane));
    const lab = (from: string) =>
      good.replace("## Goal", `## Warm-up\nWhy?\nFrom: ${from}\nAnswer: Because.\n\n## Goal`);
    writeFileSync(join(dir, "start", "01-a.md"), lab("start-01"));
    for (const lane of LANES.slice(1)) writeFileSync(join(dir, lane, "01-a.md"), good);
    expect(() => loadLabs(dir)).toThrow(/earlier/);
    writeFileSync(join(dir, "start", "01-a.md"), good);
    writeFileSync(join(dir, "daily", "01-a.md"), lab("team-01"));
    expect(() => loadLabs(dir)).toThrow(/earlier/);
    writeFileSync(join(dir, "daily", "01-a.md"), lab("start-01"));
    expect(loadLabs(dir)).toHaveLength(LANES.length);
  });
});
