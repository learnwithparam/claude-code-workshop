import { describe, expect, it } from "vitest";
import { overlaps, schedule, touches } from "./schedule.ts";

const t = (number: number, files?: string) => ({
  number,
  title: `t${number}`,
  body: files ? `Fix it.\ntouches: ${files}` : "Fix it.",
});

describe("schedule", () => {
  it("never runs two overlapping tickets together", () => {
    const { now, queued } = schedule([t(1, "shared/src/**"), t(2, "shared/src/render.ts")]);
    expect(now.map((x) => x.number)).toEqual([1]);
    expect(queued.map((x) => x.number)).toEqual([2]);
  });

  it("runs disjoint tickets together, up to the cap", () => {
    const all = [t(1, "web/**"), t(2, "api/**"), t(3, "docs/**"), t(4, "factory/**")];
    expect(schedule(all).now.map((x) => x.number)).toEqual([1, 2, 3]);
    expect(schedule(all).queued.map((x) => x.number)).toEqual([4]);
  });

  it("runs a ticket with no touches line alone", () => {
    const { now, queued } = schedule([t(1), t(2, "web/**")]);
    expect(now.map((x) => x.number)).toEqual([1]);
    expect(queued.map((x) => x.number)).toEqual([2]);
  });

  it("reads the touches line and compares by path stem", () => {
    expect(touches(t(1, "web/**, api/src/a.ts"))).toEqual(["web/**", "api/src/a.ts"]);
    expect(overlaps(["web/**"], ["api/**"])).toBe(false);
    expect(overlaps(["web/src/a.ts"], ["web/**"])).toBe(true);
  });
});
