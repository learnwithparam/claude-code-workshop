import { describe, expect, it } from "vitest";
import type { BandId } from "../../../shared/src/bands.ts";
import { BANDS, checkBand, renderWorksheet, worksheetSchema } from "../../../shared/src/index.ts";
import { ACTIVITY_KIND_LIST, rawSheet, sectionOf, textOf } from "./activity-fixtures.ts";

// One test per scenario in specs/28/spec.md. Each fails on the base commit because activities do not exist.
const draw = (activity: unknown, band: BandId = "grade-6-8") =>
  sectionOf(renderWorksheet(worksheetSchema.parse(rawSheet(band, activity))));
const count = (html: string, re: RegExp) => html.match(re)?.length ?? 0;
const bandWith = (kind: string) =>
  Object.values(BANDS).find((b) => b.kinds.some((k) => k === kind));
const bandWithout = (kind: string) =>
  Object.values(BANDS).find((b) => !b.kinds.some((k) => k === kind));

describe("activity kinds", () => {
  it("Background: the eleven kinds exist and the band table lists them", async () => {
    const { ACTIVITY_KINDS } = await import("../../../shared/src/activity-kinds.ts");
    expect([...ACTIVITY_KINDS]).toEqual([...ACTIVITY_KIND_LIST]);
    for (const band of Object.values(BANDS)) {
      expect(band.kinds.length).toBeGreaterThan(0);
      for (const kind of band.kinds) expect(ACTIVITY_KIND_LIST).toContain(kind);
    }
    for (const kind of ACTIVITY_KIND_LIST) expect(bandWith(kind), kind).toBeDefined();
  });

  it("Count renders its items", () => {
    const html = draw({ kind: "count", items: [{ object: "apple", count: 5 }] });
    expect(count(html, /class="mark"/g)).toBe(5);
    expect(count(html, /class="line"/g)).toBe(1);
  });

  it("Match renders two columns", () => {
    const html = draw({
      kind: "match",
      items: [
        { left: "cat", right: "meow" },
        { left: "dog", right: "woof" },
        { left: "cow", right: "moo" },
      ],
    });
    const [, left = "", right = ""] = html.split('class="col"');
    expect(count(left, /class="entry"/g)).toBe(3);
    expect(count(right, /class="entry"/g)).toBe(3);
    for (const word of ["cat", "dog", "cow"]) expect(textOf(left)).toContain(word);
    for (const word of ["meow", "woof", "moo"]) expect(textOf(right)).toContain(word);
  });

  it("Circle renders choices", () => {
    const html = draw({
      kind: "circle",
      prompt: "Circle the even number greater than 3",
      items: [{ label: "2" }, { label: "4" }, { label: "6" }],
    });
    expect(count(html, /class="circle-target"/g)).toBe(3);
    expect(html).toContain("Circle the even number greater than 3");
  });

  it("Fill-blank renders one blank", () => {
    const html = draw({ kind: "fill-blank", items: [{ sentence: "3 + _ = 7" }] });
    expect(count(html, /class="blank"/g)).toBe(1);
    const text = textOf(html);
    expect(text).toContain("3 +");
    expect(text).toContain("= 7");
    expect(text).not.toContain("_");
  });

  it("Trace renders a tracing guide", () => {
    const html = draw({ kind: "trace", items: [{ text: "cat" }] });
    expect(html).toMatch(/class="trace"[^>]*>\s*cat\s*</);
    expect(count(html, /class="practice-line"/g)).toBeGreaterThanOrEqual(1);
    // The guide is dotted in the page style, not just a plain rule.
    expect(
      renderWorksheet(
        worksheetSchema.parse(rawSheet("grade-6-8", { kind: "trace", items: [{ text: "cat" }] })),
      ),
    ).toContain("dotted");
  });

  // The scenario also says "with the start at 3". The schema has no marker field to pin that to,
  // so only the range, ticks and labels are asserted here.
  it("Number-line renders its range", () => {
    const html = draw({ kind: "number-line", items: [{ start: 0, end: 10, step: 1 }] });
    expect(count(html, /class="tick"/g)).toBe(11);
    const labels = [...html.matchAll(/class="tick-label"[^>]*>\s*(\d+)\s*</g)].map((m) => m[1]);
    expect(labels).toEqual(Array.from({ length: 11 }, (_, i) => String(i)));
  });

  it("Ten-frame renders filled cells", () => {
    const html = draw({ kind: "ten-frame", items: [{ value: 7 }] });
    expect(count(html, /class="cell/g)).toBe(10);
    expect(count(html, /class="cell filled"/g)).toBe(7);
    expect(count(html, /class="cell"/g)).toBe(3);
  });

  it("Fraction-bar renders shaded parts", () => {
    const html = draw({ kind: "fraction-bar", items: [{ numerator: 3, denominator: 4 }] });
    expect(count(html, /class="part/g)).toBe(4);
    expect(count(html, /class="part shaded"/g)).toBe(3);
  });

  it("Table renders rows and columns", () => {
    const html = draw({
      kind: "table",
      headers: ["Item", "Cost", "Qty"],
      items: [{ cells: ["pen", "2", "1"] }, { cells: ["book", "9", "3"] }],
    });
    const head = /<thead>([\s\S]*)<\/thead>/.exec(html)?.[1] ?? "";
    expect(count(head, /<tr[ >]/g)).toBe(1);
    expect(count(head, /<th[ >]/g)).toBe(3);
    const rows = (/<tbody>([\s\S]*)<\/tbody>/.exec(html)?.[1] ?? "").split("<tr").slice(1);
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(count(row, /<td[ >]/g)).toBe(3);
  });

  it("Steps renders numbered steps", () => {
    const html = draw({
      kind: "steps",
      items: [{ text: "Mix" }, { text: "Heat" }, { text: "Cool" }],
    });
    const text = textOf(html);
    const at = ["1. Mix", "2. Heat", "3. Cool"].map((s) => text.indexOf(s));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("Short renders an answer space", () => {
    const html = draw({ kind: "short", items: [{ question: "Why is the sky blue?" }] });
    expect(html).toContain("Why is the sky blue?");
    expect(count(html, /class="answer-line"/g)).toBeGreaterThanOrEqual(1);
  });

  it("checkBand accepts an allowed kind", () => {
    const band = bandWith("count");
    expect(band).toBeDefined();
    const items = [{ object: "ball", count: 2 }];
    const sheet = worksheetSchema.parse(rawSheet(band?.id as BandId, { kind: "count", items }));
    expect(checkBand(sheet)).toEqual({ ok: true, problems: [] });
  });

  it("checkBand rejects a disallowed kind", () => {
    const band = bandWithout("table");
    expect(band).toBeDefined();
    const sheet = worksheetSchema.parse(
      rawSheet(band?.id as BandId, {
        kind: "table",
        headers: ["a", "b"],
        items: [{ cells: ["1", "2"] }],
      }),
    );
    const result = checkBand(sheet);
    expect(result.ok).toBe(false);
    expect(
      result.problems.some(
        (p) => p.includes("table") && (p.includes(band?.id ?? "") || p.includes(band?.label ?? "")),
      ),
    ).toBe(true);
  });

  it("Unknown kind fails schema validation", () => {
    // Control: the same shape with a real kind parses, so the failure below is about the kind.
    const control = rawSheet("grade-6-8", { kind: "steps", items: [{ text: "x" }] });
    expect(worksheetSchema.safeParse(control).success).toBe(true);
    const parsed = worksheetSchema.safeParse(
      rawSheet("grade-6-8", { kind: "puzzle", items: [{ text: "x" }] }),
    );
    expect(parsed.success).toBe(false);
  });

  it("Kind choice is the only layout input from the model", () => {
    const clean = rawSheet("grade-6-8", { kind: "steps", items: [{ text: "Mix" }] }) as {
      sections: Record<string, unknown>[];
    };
    const [first] = clean.sections;
    const noisy = {
      ...clean,
      fontSize: 99,
      sections: [
        {
          ...first,
          style: "position:absolute",
          activity: { kind: "steps", items: [{ text: "Mix" }], fontSize: 99, position: "absolute" },
        },
      ],
    };
    // Control: the clean input parses, so "rejected" below is about the layout fields.
    expect(worksheetSchema.safeParse(clean).success).toBe(true);
    const parsed = worksheetSchema.safeParse(noisy);
    if (!parsed.success) return; // rejected is allowed by the scenario
    const html = renderWorksheet(parsed.data);
    expect(html).toBe(renderWorksheet(worksheetSchema.parse(clean)));
    expect(html).toContain(`font-size: ${BANDS["grade-6-8"].fontPx}px`);
    expect(html).not.toContain("font-size: 99px");
    expect(html).not.toContain("absolute");
  });
});
