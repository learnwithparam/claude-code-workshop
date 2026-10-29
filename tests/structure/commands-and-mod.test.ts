import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("commands", () => {
  const files = readdirSync(".claude/commands").filter((f) => f.endsWith(".md"));
  it("has at least one single-file command with a description", () => {
    expect(files.length).toBeGreaterThan(0);
    for (const f of files)
      expect(readFileSync(`.claude/commands/${f}`, "utf8")).toMatch(/^---\n+description: .+/);
  });
});

describe("factory-status mod", () => {
  const dir = "plugins/factory-status";
  it("ships the three files a mod needs, plus a README", () => {
    for (const f of [
      ".claude-plugin/plugin.json",
      "hooks/hooks.json",
      "hooks/register.tsx",
      "README.md",
    ])
      expect(existsSync(`${dir}/${f}`), f).toBe(true);
  });
  it("passes claude plugin validate", () => {
    // Skips where the claude CLI is absent (a bare CI runner); the local gate runs it.
    try {
      execFileSync("claude", ["--version"], { stdio: "ignore" });
    } catch {
      return;
    }
    expect(() =>
      execFileSync("claude", ["plugin", "validate", dir], { stdio: "pipe" }),
    ).not.toThrow();
  });
});
