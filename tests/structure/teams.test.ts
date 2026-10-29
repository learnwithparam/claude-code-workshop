import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { teammateName } from "../../.claude/hooks/teammateidle-log.mjs";

const json = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const WRITE_TOOLS = /\b(Edit|Write|MultiEdit|NotebookEdit|Bash)\b/;

describe("agent teams elective", () => {
  it("turns teams on in the session file only", () => {
    expect(json(".claude/teams.json").env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe("1");
    // A team inside a factory run would multiply its cost, so the shared settings never set it.
    expect(JSON.stringify(json(".claude/settings.json"))).not.toContain("AGENT_TEAMS");
  });

  it.each(["security-reviewer", "test-reviewer"])(
    "%s can read and cannot change anything",
    (name) => {
      const head = /^---\s*\n([\s\S]*?)\n---/.exec(
        readFileSync(`.claude/agents/${name}.md`, "utf8"),
      );
      const tools = /^tools:\s*(.+)$/m.exec(head?.[1] ?? "")?.[1] ?? "";
      expect(tools).toContain("Read");
      expect(tools).not.toMatch(WRITE_TOOLS);
    },
  );

  it("logs a teammate name and rejects anything else", () => {
    expect(teammateName({ teammate_name: "security-reviewer" })).toBe("security-reviewer");
    expect(teammateName({ teammate_name: "a\nrm -rf /" })).toBeNull();
    expect(teammateName({})).toBeNull();
  });
});
