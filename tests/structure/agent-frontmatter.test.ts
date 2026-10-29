import { existsSync, globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const field = (agent: string, key: string) =>
  new RegExp(`^${key}: (.+)$`, "m").exec(readFileSync(`.claude/agents/${agent}.md`, "utf8"))?.[1];

// Frontmatter is config the runner and Claude Code both obey, so it gets a test like code does.
describe("agent frontmatter", () => {
  it("gives the verifier plan mode, so it cannot edit what it checks", () => {
    expect(field("verifier", "permissionMode")).toBe("plan");
  });
  it("runs the builder in its own worktree", () => {
    expect(field("builder", "isolation")).toBe("worktree");
  });
  it("gives the reviewer project memory and a seeded memory file", () => {
    expect(field("reviewer", "memory")).toBe("project");
    expect(existsSync(".claude/agent-memory/reviewer/MEMORY.md")).toBe(true);
  });
  it.each(globSync(".claude/agents/*.md"))("%s names itself and bounds its turns", (file) => {
    const text = readFileSync(file, "utf8");
    expect(text).toMatch(/^name: [a-z-]+$/m);
    expect(text).toMatch(/^maxTurns: \d+$/m);
  });
});

describe(".mcp.json", () => {
  it("reads its token from the environment, never inline", () => {
    const text = readFileSync(".mcp.json", "utf8");
    expect(text).toContain(["$", "{GITHUB_MCP_TOKEN}"].join(""));
    expect(text).not.toMatch(/gh[pousr]_[A-Za-z0-9]{20,}/);
  });
});
