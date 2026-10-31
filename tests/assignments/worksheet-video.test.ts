import { describe, expect, it } from "vitest";
import fixtures from "../../fixtures/worksheets.json" with { type: "json" };

// Assignment: a worksheet video. Skipped until you start: ASSIGNMENT=1 npx vitest run tests/assignments
const on = process.env.ASSIGNMENT === "1";
const MODULE = "../../shared/src/render-video.ts";
const sheet = fixtures[0]?.worksheet as { sections: { items?: unknown[] }[] };
const itemCount = sheet.sections.flatMap((s) => s.items ?? []).length;

describe.skipIf(!on)("assignment: worksheet video", () => {
  it("renders one scene per item plus the answer key, key last", async () => {
    const { renderWorksheetVideo } = await import(MODULE);
    const scenes: string[] = renderWorksheetVideo(sheet).match(/data-scene="[^"]*"/g) ?? [];
    expect(scenes).toHaveLength(itemCount + 1);
    expect(scenes.at(-1)).toContain("answer-key");
    expect(scenes.slice(0, -1).every((s) => !s.includes("answer-key"))).toBe(true);
  });
});
