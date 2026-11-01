import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Assignments are markdown briefs in assignments/, listed in docs/factory/f10-assignments.md.
// This test holds the briefs, the page, the README table and the red tests to one another.
const doc = readFileSync("docs/factory/f10-assignments.md", "utf8");
const names = readdirSync("assignments")
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .map((f) => f.replace(/\.md$/, ""))
  .sort();
const brief = (name: string) => readFileSync(`assignments/${name}.md`, "utf8");

const HEADINGS = [
  "Brief",
  "Level",
  "Acceptance",
  "Workflow",
  "Red test",
  "Walkthrough",
  "Discussion",
  "File it",
];
const LEVELS = ["noob", "senior", "principal"];

const sections = doc
  .split(/^## /m)
  .filter((s) => /^\d+\. /.test(s))
  .map((s) => ({
    title: s.split("\n")[0] ?? "",
    brief: s.match(/Brief:\*\* `([^`]+)`/)?.[1],
    test: s.match(/Red test:\*\* `([^`]+)`/)?.[1],
  }));

const body = (text: string, heading: string) =>
  text
    .split(new RegExp(`^## ${heading}$`, "m"))[1]
    ?.split(/^## /m)[0]
    ?.trim() ?? "";

describe("f10 assignments page", () => {
  it("names a brief and a red test that exist, for every section", () => {
    const bad = sections.flatMap(({ title, brief: b, test }) => [
      ...(b && existsSync(b) ? [] : [`${title}: brief missing`]),
      ...(test && existsSync(test) ? [] : [`${title}: test missing`]),
    ]);
    expect(sections.length).toBeGreaterThan(0);
    expect(bad).toEqual([]);
  });

  it("names every brief and every red test, and nothing else", () => {
    const named = new Set(sections.flatMap((s) => [s.brief, s.test]));
    const files = [
      ...names.map((n) => `assignments/${n}.md`),
      ...readdirSync("tests/assignments").map((f) => `tests/assignments/${f}`),
    ];
    expect(files.filter((f) => !named.has(f))).toEqual([]);
  });

  it("does not call a test proposed, and no longer talks of issue templates", () => {
    expect(doc).not.toMatch(/proposed/i);
    expect(doc).not.toMatch(/issue template/i);
  });
});

describe("assignment briefs", () => {
  it.each(names)("%s has its headings in order", (name) => {
    const text = brief(name);
    expect(text).toMatch(/^# Assignment: .+/);
    const found = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(found).toEqual(HEADINGS);
  });

  it.each(names)("%s names a level, a workflow that exists and a gated red test", (name) => {
    const text = brief(name);
    expect(LEVELS).toContain(body(text, "Level"));
    const workflow = body(text, "Workflow").match(/`([^`]+)`/)?.[1] ?? "";
    expect(existsSync(`.factory/workflows/${workflow}.yaml`)).toBe(true);
    const command = body(text, "Red test").match(/```sh\n(.+)\n```/)?.[1];
    expect(command).toBe(`ASSIGNMENT=1 npx vitest run tests/assignments/${name}.test.ts`);
    const test = readFileSync(`tests/assignments/${name}.test.ts`, "utf8");
    expect(test).toMatch(/describe\.skipIf\(!on\)/);
    expect(test).toMatch(/ASSIGNMENT === "1"/);
  });

  it.each(names)("%s walks red to green, each step with an Expect line", (name) => {
    const steps = body(brief(name), "Walkthrough")
      .split(/^\d+\. /m)
      .slice(1);
    expect(steps.length).toBeGreaterThanOrEqual(3);
    for (const step of steps) expect(step).toMatch(/\n\s+Expect: .+/);
    expect(steps[0]).toContain(`tests/assignments/${name}.test.ts`);
    expect(steps.at(-1)).toContain(`tests/assignments/${name}.test.ts`);
  });

  it.each(names)("%s asks a question and a Principal one", (name) => {
    const discussion = body(brief(name), "Discussion");
    expect(discussion).toMatch(/^[^-].*\?$/m);
    expect(discussion).toMatch(/^- \*\*Principal:\*\* .+\?$/m);
  });

  it.each(names)("%s files itself from this file", (name) => {
    expect(body(brief(name), "File it")).toContain(`--body-file assignments/${name}.md`);
  });
});

describe("assignments/README.md", () => {
  it("has one row per brief, linked, in the same set", () => {
    const readme = readFileSync("assignments/README.md", "utf8");
    const linked = [...readme.matchAll(/^\| \[[^\]]+\]\(([a-z-]+)\.md\) \|/gm)].map((m) => m[1]);
    expect([...linked].sort()).toEqual(names);
  });
});

describe("issue templates", () => {
  it("hold no assignment, because assignments are briefs", () => {
    const left = readdirSync(".github/ISSUE_TEMPLATE").filter((f) => f.startsWith("assignment-"));
    expect(left).toEqual([]);
  });
});
