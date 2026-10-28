import { describe, expect, it } from "vitest";
import { checkSpec, parseSpec, parseVitestJson } from "./spec.ts";

const plan = `
| AC | Test file | Test name |
|---|---|---|
| AC-1 | \`factory/a.test.ts\` | parses it |
| AC-2 | \`factory/b.test.ts\` | refuses it |
- AC-3 | factory/c.test.ts | third thing
AC-4: prose with no mapping
`;

const ok = (file: string, name: string) => ({ file, name, status: "passed" });

describe("executable spec", () => {
  it("parses AC lines into AC to test pairs", () => {
    const acs = parseSpec(plan);
    expect(acs.map((a) => a.id)).toEqual(["AC-1", "AC-2", "AC-3", "AC-4"]);
    expect(acs[0]?.tests).toEqual([{ file: "factory/a.test.ts", name: "parses it" }]);
    expect(acs[2]?.tests).toEqual([{ file: "factory/c.test.ts", name: "third thing" }]);
    expect(acs[3]?.tests).toEqual([]);
  });

  it("flags a plan with a missing mapping", () => {
    const problems = checkSpec(parseSpec(plan), [
      ok("/r/factory/a.test.ts", "suite parses it"),
      ok("/r/factory/b.test.ts", "suite refuses it"),
      ok("/r/factory/c.test.ts", "third thing"),
    ]);
    expect(problems).toEqual(['AC-4 has no "AC-n | test file | test name" mapping']);
  });

  it("fails a plan with no AC lines instead of passing by default", () => {
    expect(checkSpec(parseSpec("just prose"), [])).toHaveLength(1);
  });

  it("flags a mapped test that did not run or failed", () => {
    const problems = checkSpec(parseSpec("AC-1 | a.test.ts | one\nAC-2 | b.test.ts | two"), [
      { file: "/r/b.test.ts", name: "x two", status: "failed" },
    ]);
    expect(problems).toEqual([
      'AC-1: test "one" in a.test.ts did not run',
      'AC-2: test "two" in b.test.ts is failed',
    ]);
  });

  it("matches a test name that vitest prefixed with its describe blocks", () => {
    const results = [ok("/r/a.test.ts", "suite nested parses it")];
    expect(checkSpec(parseSpec("AC-1 | a.test.ts | parses it"), results)).toEqual([]);
  });

  it("reads vitest json output, ignoring text before it", () => {
    const json = JSON.stringify({
      testResults: [
        { name: "/r/a.test.ts", assertionResults: [{ fullName: "x", status: "passed" }] },
      ],
    });
    expect(parseVitestJson(`noise\n${json}`)).toEqual([ok("/r/a.test.ts", "x")]);
    expect(() => parseVitestJson('{"nope":1}')).toThrow();
  });
});
