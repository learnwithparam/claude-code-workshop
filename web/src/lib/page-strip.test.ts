import { describe, expect, it } from "vitest";
import { pageLabel, SKELETON_SLOTS, stripSlots } from "./page-strip.ts";

describe("page strip", () => {
  it("is empty with no pages and no load", () => {
    expect(stripSlots(0, 0, false)).toEqual([]);
  });

  it("shows one thumbnail for one page", () => {
    expect(stripSlots(1, 0, false)).toEqual([
      { label: "Page 1 of 1", current: true, skeleton: false },
    ]);
  });

  it("marks exactly the active page", () => {
    const slots = stripSlots(4, 1, false);
    expect(slots.filter((s) => s.current).map((s) => s.label)).toEqual(["Page 2 of 4"]);
  });

  it("clamps an out-of-range active page", () => {
    expect(stripSlots(2, 9, false).map((s) => s.current)).toEqual([false, true]);
  });

  it("keeps received pages and adds skeletons while loading", () => {
    const slots = stripSlots(1, 0, true);
    expect(slots).toHaveLength(SKELETON_SLOTS);
    expect(slots.map((s) => s.skeleton)).toEqual([false, true, true]);
  });

  it("names a page by position", () => {
    expect(pageLabel(1, 4)).toBe("Page 2 of 4");
  });
});
