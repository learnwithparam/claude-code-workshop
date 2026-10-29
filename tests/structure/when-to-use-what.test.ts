import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const file = "docs/when-to-use-what.md";
const links = [...readFileSync(file, "utf8").matchAll(/\]\(([^)#]+)\)/g)].map((m) => m[1] ?? "");

// A pointer to a file that moved is worse than no pointer.
describe("when to use what", () => {
  it("links at least one file per row", () => {
    expect(links.length).toBeGreaterThanOrEqual(10);
  });
  it.each(links)("%s exists", (link) => {
    expect(existsSync(join(dirname(file), link))).toBe(true);
  });
});

// Every kind of .claude file the docs list has a row here, so a file type cannot be taught without a place to find it.
describe("file types", () => {
  const text = readFileSync(file, "utf8");
  it.each([
    "CLAUDE.local.md",
    "output style",
    "settings.json",
    "managed settings",
    ".mcp.json",
    ".worktreeinclude",
    "a command",
    "agent memory",
    "REVIEW.md",
    "a mod",
    "a skill",
    "a hook",
    "a subagent",
    "a path-scoped rule",
    "a workflow",
    "a plugin",
  ])("has a row for %s", (kind) => {
    expect(text).toContain(kind);
  });
});
