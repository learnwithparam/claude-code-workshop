import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(p, "utf8");
const newer = (a: string, b: string) => {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 3; i++)
    if ((x?.[i] ?? 0) !== (y?.[i] ?? 0)) return (x?.[i] ?? 0) > (y?.[i] ?? 0);
  return false;
};

describe("version stamp", () => {
  const stamp = /Checked against Claude Code (\d+\.\d+\.\d+) on \d{4}-\d{2}-\d{2}/.exec(
    read("docs/versions.md"),
  )?.[1];

  it("names the version CI installs and the dev container installs", () => {
    expect(stamp).toBeDefined();
    expect(read(".github/workflows/check.yml")).toContain(`claude-code@${stamp}`);
    expect(read(".devcontainer/devcontainer.json")).toContain(`claude-code@${stamp}`);
  });

  it("is not older than the minimum make doctor asks for", () => {
    const min = /need (\d+\.\d+\.\d+) or newer/.exec(read("Makefile"))?.[1] ?? "";
    expect(min).not.toBe("");
    expect(newer(min, stamp ?? "0.0.0"), `stamp ${stamp} is below doctor minimum ${min}`).toBe(
      false,
    );
  });
});
