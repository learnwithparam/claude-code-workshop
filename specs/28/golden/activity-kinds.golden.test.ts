import { describe, expect, it } from "vitest";
import type { BandId } from "../../../shared/src/bands.ts";
import { BANDS, checkBand, renderWorksheet, worksheetSchema } from "../../../shared/src/index.ts";
import { ACTIVITY_KIND_LIST, rawSheet, sectionOf, textOf } from "./activity-fixtures.ts";

// One test per scenario in specs/28/spec.md. Each fails on the base commit because activities do not exist.
const draw = (band: BandId, activity: unknown) => {
  const sheet = worksheetSchema.parse(rawSheet(band, activity));
  return sectionOf(renderWorksheet(sheet));
};
const count = (html: string, re: RegExp) => html.match(re)?.length ?? 0;

describe("activity kinds", () => {
  it("lists the eleven kinds", async () => {
    const { ACTIVITY_KINDS } = await import("../../../shared/src/activity-kinds.ts");
    expect([...ACTIVITY_KINDS]).toEqual([...ACTIVITY_KIND_LIST]);
  });

  it("Background: every band lists kinds, and every kind is allowed somewhere", () => {
    for (const band of Object.values(BANDS)) {
      expect(band.kinds.length).toBeGreaterThan(0);
      for (const kind of band.kinds) expect(ACTIVITY_KIND_LIST).toContain(kind);
    }
    for (const kind of ACTIVITY_KIND_LIST) {
      expect(Object.values(BANDS).some((band) => band.kinds.includes(kind))).toBe(true);
    }
  });

  it("Count draws one picture group per item", () => {
    const html = draw("kindergarten", {
      kind: "count",
      items: [
        { object: "apple", count: 3 },
        { object: "star", count: 5 },
      ],
    });
    const groups = html.split('class="count-group"').slice(1);
    expect(groups).toHaveLength(2);
    expect(count(groups[0] ?? "", /class="mark"/g)).toBe(3);
    expect(count(groups[1] ?? "", /class="mark"/g)).toBe(5);
    expect(count(groups[0] ?? "", /class="line"/g)).toBe(1);
    expect(count(groups[1] ?? "", /class="line"/g)).toBe(1);
  });

  it("Match pairs a left column with a right column", () => {
    const html = draw("grade-1-2", {
      kind: "match",
      items: [
        { left: "cat", right: "meow" },
        { left: "dog", right: "woof" },
      ],
    });
    const text = textOf(html);
    expect(text.indexOf("cat")).toBeGreaterThan(-1);
    expect(text.indexOf("cat")).toBeLessThan(text.indexOf("dog"));
    expect(text).toContain("meow");
    expect(text).toContain("woof");
    expect(count(html, /class="dot"/g)).toBe(4);
  });

  it("Circle marks the choices to pick from", () => {
    const html = draw("kindergarten", {
      kind: "circle",
      prompt: "Circle the red one",
      items: [{ label: "red ball" }, { label: "blue ball" }, { label: "green ball" }],
    });
    expect(count(html, /class="circle-target"/g)).toBe(3);
    expect(html.indexOf("Circle the red one")).toBeGreaterThan(-1);
    expect(html.indexOf("Circle the red one")).toBeLessThan(html.indexOf("circle-target"));
  });

  it("Fill-blank renders a blank where the marker is", () => {
    const html = draw("grade-3-5", {
      kind: "fill-blank",
      items: [{ sentence: "The cat sat on the ___" }],
    });
    expect(textOf(html)).toContain("The cat sat on the");
    expect(count(html, /class="blank"/g)).toBe(1);
    expect(html).not.toContain("___");
  });

  it("Trace draws dotted letters", () => {
    const html = draw("early-reader", { kind: "trace", items: [{ text: "A" }] });
    expect(html).toMatch(/class="trace"[^>]*>\s*A\s*</);
    expect(html).toContain("30px");
    expect(count(html, /class="practice-line"/g)).toBeGreaterThanOrEqual(1);
  });

  it("Number-line draws ticks between start and end", () => {
    const html = draw("grade-1-2", {
      kind: "number-line",
      items: [{ start: 0, end: 10, step: 1 }],
    });
    expect(count(html, /class="tick"/g)).toBe(11);
    const labels = [...html.matchAll(/class="tick-label"[^>]*>\s*(\d+)\s*</g)].map((m) => m[1]);
    expect(labels).toEqual(Array.from({ length: 11 }, (_, i) => String(i)));
  });

  it("Ten-frame shades the given count", () => {
    const html = draw("kindergarten", {
      kind: "ten-frame",
      items: [{ value: 4 }, { value: 7 }],
    });
    const frames = html.split('class="ten-frame"').slice(1);
    expect(frames).toHaveLength(2);
    expect(count(frames[0] ?? "", /class="cell/g)).toBe(10);
    expect(count(frames[0] ?? "", /class="cell filled"/g)).toBe(4);
    expect(count(frames[1] ?? "", /class="cell/g)).toBe(10);
    expect(count(frames[1] ?? "", /class="cell filled"/g)).toBe(7);
  });

  it("Fraction-bar shades the numerator", () => {
    const html = draw("grade-3-5", {
      kind: "fraction-bar",
      items: [{ numerator: 3, denominator: 4 }],
    });
    expect(count(html, /class="part/g)).toBe(4);
    expect(count(html, /class="part shaded"/g)).toBe(3);
  });

  it("Table renders headers and rows", () => {
    const html = draw("grade-6-8", {
      kind: "table",
      headers: ["Item", "Cost"],
      items: [{ cells: ["pen", "2"] }, { cells: ["book", "9"] }, { cells: ["bag", "20"] }],
    });
    expect(count(html, /<th[ >]/g)).toBe(2);
    const body = /<tbody>([\s\S]*)<\/tbody>/.exec(html)?.[1] ?? "";
    const rows = body.split("<tr").slice(1);
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(count(row, /<td[ >]/g)).toBe(2);
  });

  it("Steps numbers the lines in order", () => {
    const html = draw("grade-6-8", {
      kind: "steps",
      items: [{ text: "Mix" }, { text: "Heat" }, { text: "Cool" }],
    });
    const text = textOf(html);
    const at = ["1. Mix", "2. Heat", "3. Cool"].map((s) => text.indexOf(s));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("Short gives a short-answer box", () => {
    const html = draw("grade-9-12", {
      kind: "short",
      items: [{ question: "Why did the Roman Republic fall?" }],
    });
    expect(html).toContain("Why did the Roman Republic fall?");
    expect(count(html, /class="answer-line"/g)).toBe(3);
  });

  it("A band refuses a kind it does not allow", () => {
    const sheet = worksheetSchema.parse(
      rawSheet("early-reader", {
        kind: "table",
        headers: ["a", "b"],
        items: [{ cells: ["1", "2"] }],
      }),
    );
    const result = checkBand(sheet);
    expect(result.ok).toBe(false);
    expect(result.problems.some((p) => p.includes("table") && p.includes("early-reader"))).toBe(
      true,
    );
  });

  it("A band accepts a kind it allows", () => {
    const items = Array.from({ length: 4 }, (_, i) => ({ object: `ball${i}`, count: 2 }));
    const sheet = worksheetSchema.parse(rawSheet("early-reader", { kind: "count", items }));
    expect(checkBand(sheet)).toEqual({ ok: true, problems: [] });
  });

  it("An unknown kind is rejected at the boundary", () => {
    // Control: the same shape with a real kind parses, so the rejection below is about the kind.
    const control = rawSheet("grade-3-5", { kind: "steps", items: [{ text: "x" }] });
    expect(worksheetSchema.safeParse(control).success).toBe(true);
    const parsed = worksheetSchema.safeParse(
      rawSheet("grade-3-5", { kind: "crossword", items: [{ text: "x" }] }),
    );
    expect(parsed.success).toBe(false);
  });

  it("Item count over the band limit is still reported", () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ object: `ball${i}`, count: 1 }));
    const sheet = worksheetSchema.parse(rawSheet("kindergarten", { kind: "count", items }));
    expect(checkBand(sheet).problems).toContain("9 items, band allows 8");
  });
});
