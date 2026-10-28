import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { logLine } from "../../.claude/hooks/posttooluse-session-log.mjs";
import { typeErrorFor } from "../../.claude/hooks/posttooluse-typecheck.mjs";
import { guardFor } from "../../.claude/hooks/pretooluse-file-guard.mjs";
import { decide } from "../../.claude/hooks/stop-gate.mjs";

const red = () => ({ ok: false, output: "a\nb\nerror TS2322" });
const green = () => ({ ok: true, output: "" });

describe("stop gate", () => {
  it("blocks the stop when the gate is red", () => {
    expect(decide({}, red).block).toBe(true);
  });
  it("lets the second stop through, or the hook would loop forever", () => {
    expect(decide({ stop_hook_active: true }, red).block).toBe(false);
  });
  it("lets a green gate finish", () => {
    expect(decide({}, green).block).toBe(false);
  });
});

describe("typecheck hook", () => {
  it("reports a type error for a source file", () => {
    expect(typeErrorFor("web/src/a.ts", red)).toContain("TS2322");
  });
  it("ignores files that are not source", () => {
    expect(typeErrorFor("README.md", red)).toBeNull();
  });

  it("runs the impact-mapped checks, not a fixed loop", () => {
    const src = readFileSync(".claude/hooks/stop-gate.mjs", "utf8");
    expect(src).toContain("scripts/check-affected.ts");
    expect(src).not.toContain('["lint", "typecheck", "test"]');
  });
});

describe("file guard", () => {
  it.each([
    "package-lock.json",
    "web/package-lock.json",
    ".github/workflows/check.yml",
    "skills.lock",
  ])("blocks an edit to %s", (file) => expect(guardFor(file, {})).toContain("protected"));
  it("lets unprotected files through", () => {
    expect(guardFor("web/src/a.ts", {})).toBeNull();
    expect(guardFor("package.json", {})).toBeNull();
  });
  it("lets a protected file through when the runner set the override", () => {
    expect(guardFor("package-lock.json", { FACTORY_ALLOW_PROTECTED: "1" })).toBeNull();
  });
});

describe("session log", () => {
  it("writes one parseable line per call, with no command text or output", () => {
    const calls = [
      { tool_name: "Edit", tool_input: { file_path: "a.ts" } },
      { tool_name: "Bash", tool_input: { command: "echo hush" }, tool_response: "hush" },
      { tool_name: "Read", tool_input: { file_path: "b.ts" } },
    ];
    const lines = calls.map((c) => logLine(c, new Date(0)));
    expect(lines.map((l) => JSON.parse(l).tool)).toEqual(["Edit", "Bash", "Read"]);
    expect(lines.join("")).not.toContain("hush");
  });
});

describe("settings", () => {
  it("wires the file guard before edits and the session log after every tool", () => {
    const hooks = JSON.parse(readFileSync(".claude/settings.json", "utf8")).hooks;
    expect(JSON.stringify(hooks.PreToolUse)).toContain("pretooluse-file-guard.mjs");
    expect(JSON.stringify(hooks.PostToolUse)).toContain("posttooluse-session-log.mjs");
  });
});
