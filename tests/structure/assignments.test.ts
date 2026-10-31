import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// docs/factory/f10-assignments.md names an issue template and a red test for every assignment.
// This test holds the page to the files: a section without both, or a test that is not gated, fails.
const doc = readFileSync("docs/factory/f10-assignments.md", "utf8");
const sections = doc
  .split(/^## /m)
  .filter((s) => /^\d+\. /.test(s))
  .map((s) => ({
    title: s.split("\n")[0] ?? "",
    template: s.match(/Issue template:\*\* `([^`]+)`/)?.[1],
    test: s.match(/Red test:\*\* `([^`]+)`/)?.[1],
  }));
const listOrEmpty = (dir: string) => (existsSync(dir) ? readdirSync(dir) : []);

describe("f10 assignments", () => {
  it("lists assignments", () => {
    expect(sections.length).toBeGreaterThan(0);
  });

  it("gives every section an issue template that exists and carries the assignment label", () => {
    const bad = sections.flatMap(({ title, template }) => {
      if (!template || !existsSync(template)) return [`${title}: template missing`];
      return /^labels: assignment$/m.test(readFileSync(template, "utf8"))
        ? []
        : [`${title}: no assignment label`];
    });
    expect(bad).toEqual([]);
  });

  it("gives every section a red test that exists and is skipped unless ASSIGNMENT=1", () => {
    const bad = sections.flatMap(({ title, test }) => {
      if (!test || !existsSync(test)) return [`${title}: test missing`];
      const text = readFileSync(test, "utf8");
      return /describe\.skipIf\(!on\)/.test(text) && /ASSIGNMENT === "1"/.test(text)
        ? []
        : [`${title}: not gated on ASSIGNMENT`];
    });
    expect(bad).toEqual([]);
  });

  it("has no template or test the page does not name", () => {
    const named = new Set(sections.flatMap((s) => [s.template, s.test]));
    const files = [
      ...listOrEmpty(".github/ISSUE_TEMPLATE").map((f) => `.github/ISSUE_TEMPLATE/${f}`),
      ...listOrEmpty("tests/assignments").map((f) => `tests/assignments/${f}`),
    ];
    expect(files.filter((f) => !named.has(f))).toEqual([]);
  });

  it("does not call any test proposed", () => {
    expect(doc).not.toMatch(/proposed/i);
  });
});
