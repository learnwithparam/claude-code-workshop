import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const file = "docs/when-to-use-what.md";
const links = [...readFileSync(file, "utf8").matchAll(/\]\(([^)#]+)\)/g)].map((m) => m[1] ?? "");

// A pointer to a file that moved is worse than no pointer.
describe("when to use what", () => {
  it("links at least one file per row", () => {
    expect(links.length).toBeGreaterThanOrEqual(10);
  });
  it.each(links)("%s exists", (link) => {
    expect(existsSync(join(dirname(file), link))).toBe(true);
  });
});
