import { describe, expect, it } from "vitest";
import { commandsTable, committed } from "./commands.ts";

// The formatter pads table cells, so compare the cells and not the spacing.
const cells = (t: string) => t.replace(/[ -]{2,}/g, " ");

describe("commands by level", () => {
  it("matches the level list, so regenerate it when a level is added", () => {
    expect(cells(committed()), "run: npx tsx scripts/commands.ts").toBe(cells(commandsTable()));
  });
});
