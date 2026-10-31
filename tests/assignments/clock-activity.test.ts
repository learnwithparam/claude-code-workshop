import { describe, expect, it } from "vitest";
import { ACTIVITY_KINDS, activitySchema } from "../../shared/src/activity-kinds.ts";
import { BANDS } from "../../shared/src/bands.ts";
import { checkBand } from "../../shared/src/check.ts";
import { renderActivity } from "../../shared/src/render-activity.ts";
import type { Worksheet } from "../../shared/src/schema.ts";

// Assignment: a new activity kind. Skipped until you start: ASSIGNMENT=1 npx vitest run tests/assignments
const on = process.env.ASSIGNMENT === "1";
const clock = { kind: "clock", items: [{ hour: 3, minute: 30 }] };
const allowed = Object.values(BANDS).filter((b) => (b.kinds as string[]).includes("clock"));
const refused = Object.values(BANDS).filter((b) => !(b.kinds as string[]).includes("clock"));
const sheet = (band: string): Worksheet =>
  ({
    title: "Clocks",
    band,
    subject: "Time",
    sections: [{ heading: "Read the clock", instruction: "Write the time.", activity: clock }],
  }) as never;

describe.skipIf(!on)("assignment: clock activity", () => {
  it("lists clock as a kind and accepts it in the schema", () => {
    expect(ACTIVITY_KINDS).toContain("clock");
    expect(activitySchema.safeParse(clock).success).toBe(true);
  });

  it("draws a face with code, not model markup", () => {
    const html = renderActivity(clock as never, 16);
    expect(html).toContain("<svg");
    expect(html).not.toContain("<script");
  });

  it("is allowed in some bands, passes checkBand there and fails it in the others", () => {
    expect(allowed.length).toBeGreaterThan(0);
    expect(refused.length).toBeGreaterThan(0);
    for (const b of allowed) expect(checkBand(sheet(b.id)).ok, b.id).toBe(true);
    for (const b of refused) expect(checkBand(sheet(b.id)).ok, b.id).toBe(false);
  });
});
