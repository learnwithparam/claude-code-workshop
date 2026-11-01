import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const makefile = readFileSync("Makefile", "utf8");

// The tab-indented lines of one target's recipe.
function recipe(target: string): string[] {
  const lines = makefile.split("\n");
  const start = lines.indexOf(`${target}:`);
  if (start < 0) return [];
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith("\t")) break;
    body.push(line.trim());
  }
  return body;
}

describe("make fast", () => {
  it("is declared phony", () => {
    const phony = makefile.split("\n").find((l) => l.startsWith(".PHONY:")) ?? "";
    expect(phony.split(/\s+/)).toContain("fast");
  });

  it("runs lint, typecheck, then the affected checks against origin/main", () => {
    expect(recipe("fast")).toEqual([
      "npm run lint",
      "npm run typecheck",
      "npx tsx scripts/check-affected.ts --base origin/main",
    ]);
  });

  it("is not called from check, which stays the gate", () => {
    const check = recipe("check");
    expect(check.length).toBeGreaterThan(0);
    expect(check.join("\n")).not.toMatch(/\bfast\b/);
  });
});
