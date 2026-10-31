import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Assignment: a mod of your own. Skipped until you start: ASSIGNMENT=1 MOD=<folder> npx vitest run tests/assignments
// The render check runs under `claude plugin test`, as plugins/factory-status/hooks/register.test.tsx does.
const on = process.env.ASSIGNMENT === "1";
const dir = `plugins/${process.env.MOD ?? ""}`;

describe.skipIf(!on)("assignment: a mod of your own", () => {
  it("ships the files a mod needs, and is not the example", () => {
    expect(process.env.MOD, "set MOD=<folder under plugins/>").toBeTruthy();
    expect(process.env.MOD).not.toBe("factory-status");
    for (const f of [".claude-plugin/plugin.json", "hooks/hooks.json", "hooks/register.tsx"])
      expect(existsSync(`${dir}/${f}`), f).toBe(true);
  });

  it("has a manifest whose name is the folder", () => {
    const m = JSON.parse(readFileSync(`${dir}/.claude-plugin/plugin.json`, "utf8"));
    expect(m.name).toBe(process.env.MOD);
    expect(String(m.description).length).toBeGreaterThan(19);
  });

  it("has a test that feeds it a fixed state", () => {
    expect(existsSync(`${dir}/hooks/register.test.tsx`)).toBe(true);
  });
});
