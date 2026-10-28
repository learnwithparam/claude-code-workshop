import { describe, expect, it } from "vitest";
import { filesFor, LEVEL_ORDER, pruneHooks } from "../../scripts/levels.ts";

const all = [
  "shared/src/bands.ts",
  "api/src/server.ts",
  "AGENTS.md",
  "factory/run.ts",
  "Makefile",
  ".claude/hooks/stop-gate.mjs",
];

// Levels are derived from trunk, so a fix on main reaches every later snapshot with no tag to move.
describe("level snapshots", () => {
  it("each level contains everything the earlier level had", () => {
    let previous = new Set<string>();
    for (const name of LEVEL_ORDER) {
      const now = new Set(filesFor(name, all));
      for (const file of previous) expect(now.has(file), `${name} lost ${file}`).toBe(true);
      previous = now;
    }
  });

  it("hand-built has no API, context or factory yet", () => {
    expect(filesFor("hand-built", all)).toEqual(["shared/src/bands.ts", "Makefile"]);
  });

  it("drops hooks whose script the level does not have yet", () => {
    const settings = {
      hooks: {
        Stop: [{ hooks: [{ command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-gate.mjs"' }] }],
      },
    };
    expect(pruneHooks(structuredClone(settings), () => false).hooks).toEqual({});
    expect(pruneHooks(structuredClone(settings), () => true).hooks).toEqual(settings.hooks);
  });
});
