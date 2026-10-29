import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { BandId } from "../../../shared/src/bands.ts";
import { BANDS, renderWorksheet, worksheetSchema } from "../../../shared/src/index.ts";
import {
  ACTIVITY_KIND_LIST,
  build,
  type Kind,
  occurrences,
  rawSheet,
} from "./activity-fixtures.ts";

const bandsFor = (kind: Kind) =>
  Object.values(BANDS)
    .filter((band) => band.kinds.includes(kind))
    .map((band) => band.id);

// "Once" for every kind: each token appears one time in the whole page, and data-item carries each
// index 0..n-1 one time, which also covers kinds whose items are numbers (ten-frame, number-line).
function expectEachOnce(band: BandId, kind: Kind, n: number, tag: string) {
  const { activity, tokens } = build(kind, n, tag);
  const html = renderWorksheet(worksheetSchema.parse(rawSheet(band, activity)));
  for (const token of tokens) expect(occurrences(html, token), `${kind} ${token}`).toBe(1);
  const indexes = [...html.matchAll(/data-item="(\d+)"/g)].map((m) => Number(m[1]));
  expect(indexes.sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
}

describe("every item appears exactly once", () => {
  const sizes: Record<Kind, number> = {
    count: 5,
    match: 4,
    circle: 3,
    "fill-blank": 4,
    trace: 3,
    "number-line": 2,
    "ten-frame": 2,
    "fraction-bar": 3,
    table: 3,
    steps: 4,
    short: 3,
  };
  for (const kind of ACTIVITY_KIND_LIST) {
    it(kind, () => {
      const band = bandsFor(kind)[0];
      expect(band, `no band allows ${kind}`).toBeDefined();
      expectEachOnce(band as BandId, kind, sizes[kind], "o");
    });
  }

  it("holds for any generated worksheet within its band", () => {
    const pair = fc.constantFrom(...ACTIVITY_KIND_LIST).chain((kind) => {
      const bands = bandsFor(kind);
      return fc.tuple(fc.constant(kind), fc.constantFrom(...bands), fc.nat());
    });
    fc.assert(
      fc.property(pair, fc.stringMatching(/^[a-z]{2,4}$/), ([kind, band, seed], tag) => {
        const n = 1 + (seed % BANDS[band].maxItems);
        expectEachOnce(band, kind, n, tag);
      }),
      { numRuns: 200 },
    );
  });
});
