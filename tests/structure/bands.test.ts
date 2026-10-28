import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BAND_IDS, BANDS, checkBand, parseBand, worksheetSchema } from "../../shared/src/index";

const fixtures = JSON.parse(readFileSync("fixtures/worksheets.json", "utf8")) as {
  prompt: string;
  worksheet: unknown;
}[];

// One test that walks every band and alias beats reviewing each parser case by hand.
describe("every band", () => {
  it.each(BAND_IDS)("%s parses from each of its own aliases", (id) => {
    for (const alias of BANDS[id].aliases) {
      expect(parseBand(`worksheet for ${alias}`), `${id} via "${alias}"`).toBe(id);
    }
  });

  it.each(BAND_IDS)("%s has exactly one passing fixture", (id) => {
    const matches = fixtures
      .map((fixture) => worksheetSchema.parse(fixture.worksheet))
      .filter((sheet) => sheet.band === id);
    expect(matches).toHaveLength(1);
    expect(checkBand(matches[0] as (typeof matches)[number]).problems).toEqual([]);
  });
});
