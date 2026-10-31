import { describe, expect, it } from "vitest";
import { parseProposal } from "./retro.ts";

const ok = (file: string) =>
  `PROPOSAL: ${JSON.stringify({ file, change: "add a rule", why: "two review rounds" })}`;

describe("parseProposal", () => {
  it("accepts one change inside skills, agents, rules or config", () => {
    for (const f of [
      ".claude/skills/handoff/SKILL.md",
      ".claude/rules/api.md",
      ".factory/config.json",
    ])
      expect(parseProposal(ok(f))).toMatchObject({ file: f });
  });
  it("accepts none", () => expect(parseProposal("PROPOSAL: none")).toBe("none"));
  it.each([
    ".claude/settings.json",
    ".claude/hooks/stop-gate.mjs",
    "factory/run.ts",
    "api/src/server.ts",
    ".claude/skills/../settings.json",
  ])("rejects %s", (f) => expect(parseProposal(ok(f))).toHaveProperty("error"));
  it("rejects two proposals and bad json", () => {
    expect(
      parseProposal(`${ok(".claude/rules/a.md")}\n${ok(".claude/rules/b.md")}`),
    ).toHaveProperty("error");
    expect(parseProposal("PROPOSAL: {nope")).toHaveProperty("error");
    expect(parseProposal("no line")).toHaveProperty("error");
  });
});
