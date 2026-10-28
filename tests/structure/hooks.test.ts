import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { typeErrorFor } from "../../.claude/hooks/posttooluse-typecheck.mjs";
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
