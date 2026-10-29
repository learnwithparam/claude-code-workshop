import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Context-level `.claude` files. A guard on the later-level files keeps this test valid in every snapshot.
const ignored = readFileSync(".gitignore", "utf8").split("\n");

describe("context files", () => {
  it("has a teaching output style with a name and description", () => {
    const text = readFileSync(".claude/output-styles/teaching.md", "utf8");
    expect(text).toMatch(/^name: Teaching$/m);
    expect(text).toMatch(/^description: .+$/m);
  });

  it("ships a CLAUDE.local.md example and ignores the real one", () => {
    expect(existsSync("docs/examples/CLAUDE.local.md")).toBe(true);
    // Anchored to the root, so the committed example under docs/ is not ignored with it.
    expect(ignored).toContain("/CLAUDE.local.md");
  });

  it("copies only gitignored files into a worktree, never a secrets file", () => {
    const lines = readFileSync(".worktreeinclude", "utf8")
      .split("\n")
      .filter((l) => l && !l.startsWith("#"));
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line).not.toMatch(/\.env/);
      expect(ignored.some((g) => g.replace(/^\//, "") === line)).toBe(true);
    }
  });
});
