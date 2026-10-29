import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { format, formattable } from "../../.claude/hooks/posttooluse-format.mjs";
import { warningFor } from "../../.claude/hooks/posttooluse-length-warn.mjs";
import { leaked } from "../../.claude/hooks/posttooluse-output-scan.mjs";
import { changed, hashes } from "../../.claude/hooks/sessionstart-integrity.mjs";
import { hintFor } from "../../.claude/hooks/userpromptsubmit-route.mjs";

// One hook per pattern in the catalogue, each fed one bad input.
describe("prompt routing", () => {
  it("hints the skill that fits and stays quiet otherwise", () => {
    expect(hintFor("what grade is this for")).toContain("worksheet-bands");
    expect(hintFor("good morning")).toBeNull();
  });
});

describe("integrity hash", () => {
  it("watches every hook, not only the secrets guard", () => {
    const files = Object.keys(hashes(() => "a"));
    expect(files).toContain(".claude/hooks/pretooluse-secrets.mjs");
    expect(files).toContain(".claude/settings.json");
  });
  it("names the file whose hash moved and says nothing on the first run", () => {
    const before = hashes(() => "a");
    const after = hashes((f: string) => (f.endsWith("settings.json") ? "b" : "a"));
    expect(changed(null, after)).toEqual([]);
    expect(changed(before, after)).toEqual([".claude/settings.json"]);
  });
});

describe("output scan", () => {
  it("flags a key shape in any output", () => {
    expect(leaked(`key ${"sk-ant-"}${"a".repeat(30)}`)).toEqual(["an Anthropic key"]);
    expect(leaked({ stdout: "all clear" })).toEqual([]);
  });
});

describe("length warning", () => {
  it("warns over the limit and never on other file types", () => {
    expect(warningFor("a.ts", "x\n".repeat(301))).toContain("limit is 300");
    expect(warningFor("a.ts", "x\n".repeat(10))).toBeNull();
    expect(warningFor("a.md", "x\n".repeat(400))).toBeNull();
  });
});

describe("auto format", () => {
  it("swallows a failing formatter so the edit stands", () => {
    const boom = () => {
      throw new Error("biome missing");
    };
    expect(format("a.ts", boom)).toBe(false);
    expect(format("a.ts", () => Buffer.from(""))).toBe(true);
    expect(formattable("node_modules/x/a.ts")).toBe(false);
  });
});

describe("wiring", () => {
  it("registers each catalogue hook in settings.json", () => {
    const text = readFileSync(".claude/settings.json", "utf8");
    for (const hook of [
      "userpromptsubmit-route",
      "sessionstart-integrity",
      "posttooluse-output-scan",
      "posttooluse-format",
      "posttooluse-length-warn",
    ])
      expect(text).toContain(`${hook}.mjs`);
  });
});

describe("managed settings example", () => {
  it("denies the secrets file and a force push", () => {
    const deny = JSON.parse(readFileSync("docs/managed-settings.example.json", "utf8")).permissions
      .deny as string[];
    expect(deny).toContain("Read(**/.env*)");
    expect(deny.some((d) => d.includes("--force"))).toBe(true);
  });
});
