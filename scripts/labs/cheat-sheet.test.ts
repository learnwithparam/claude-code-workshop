import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadLabs } from "./catalog.ts";
import { CHEAT_SHEET_COMMAND, renderCheatSheet } from "./cheat-sheet.ts";

const labs = loadLabs("labs");

describe("cheat sheet", () => {
  it("is the render of the lab tricks, so no trick was edited without regenerating", () => {
    expect(readFileSync("docs/labs/cheat-sheet.md", "utf8")).toBe(renderCheatSheet(labs));
  });

  it("has a trick for every start and daily lab", () => {
    const missing = labs.filter((l) => ["start", "daily"].includes(l.lane) && !l.trick);
    expect(missing.map((l) => l.id)).toEqual([]);
  });

  it("names the command that regenerates it", () => {
    expect(renderCheatSheet(labs)).toContain(CHEAT_SHEET_COMMAND);
  });
});
