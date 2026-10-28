import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("web/src/pages/index.astro", "utf8");

// A grid child with no min-width: 0 grows past a 375px phone and the page scrolls sideways.
describe("page layout", () => {
  it("lets the preview shrink inside the grid", () => {
    expect(page).toMatch(/\.preview \{[^}]*min-width: 0/);
  });

  it("collapses to one column on a phone", () => {
    expect(page).toMatch(/@media \(max-width: 760px\) \{ main \{ grid-template-columns: 1fr/);
  });
});
