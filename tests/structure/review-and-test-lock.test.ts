import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { testLockFor } from "../../.claude/hooks/pretooluse-test-lock.mjs";

describe("test lock", () => {
  it.each(["api/src/a.test.ts", "tests/e2e/layout.e2e.ts", "specs/1/x.feature"])(
    "blocks an edit to %s during a fix",
    (file) => expect(testLockFor(file, { FACTORY_PHASE: "fix" })).toContain("is a test"),
  );
  it("lets the code under test change during a fix", () => {
    expect(testLockFor("api/src/a.ts", { FACTORY_PHASE: "fix" })).toBeNull();
  });
  it("lets tests change in any other phase", () => {
    expect(testLockFor("api/src/a.test.ts", { FACTORY_PHASE: "build" })).toBeNull();
    expect(testLockFor("api/src/a.test.ts", {})).toBeNull();
  });
  it("is wired before edits", () => {
    expect(readFileSync(".claude/settings.json", "utf8")).toContain("pretooluse-test-lock.mjs");
  });
});

describe("REVIEW.md", () => {
  const text = readFileSync("REVIEW.md", "utf8");
  it("asks for the count first, file:line evidence and a nit cap", () => {
    expect(text).toMatch(/count/i);
    expect(text).toContain("file:line");
    expect(text).toMatch(/At most 3 nits/);
  });
  it("names the paths the reviewer skips", () => {
    expect(text).toContain("supplied/");
  });
});
