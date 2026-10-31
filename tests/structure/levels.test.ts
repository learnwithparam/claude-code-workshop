import { execFileSync } from "node:child_process";
import { matchesGlob } from "node:path";
import { describe, expect, it } from "vitest";
import levels from "../../levels.json" with { type: "json" };

// Every file belongs to exactly one level, so a fix on trunk reaches the right snapshot.
describe("levels.json", () => {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);

  it("owns every file exactly once", () => {
    const bad = files.flatMap((file) => {
      const owners = Object.entries(levels)
        .filter(([, globs]) => globs.some((g) => matchesGlob(file, g)))
        .map(([name]) => name);
      return owners.length === 1 ? [] : [`${file}: ${owners.join(",") || "no owner"}`];
    });
    expect(bad).toEqual([]);
  }, 30_000);
});
