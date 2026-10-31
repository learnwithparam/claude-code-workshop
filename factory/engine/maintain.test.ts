import { describe, expect, it } from "vitest";
import { fakeHost } from "./fake-host.ts";
import { maintain } from "./maintain.ts";

const BANDS =
  "ci-failure-rate: { direction: up-is-bad, window: 7 }\neval-pass-rate: { direction: down-is-bad, window: 7 }\n";
const calm = [10, 11, 9, 10, 10, 11, 9];
const series = (o: Record<string, number[]>) => JSON.stringify(o);

describe("maintain", () => {
  it("writes specs/<n>/intent.md for a 3 sigma breach", async () => {
    const { host, files } = fakeHost({
      files: {
        ".factory/bands.yaml": BANDS,
        ".factory/series.json": series({ "ci-failure-rate": [...calm, 30] }),
      },
    });
    const r = await maintain(host, 9);
    expect(r.wrote).toBe(true);
    const intent = files.get("specs/9/intent.md") ?? "";
    expect(intent).toContain("ci-failure-rate is outside its band");
    expect(intent).toContain("3 sigma");
  });
  it("only logs at 2 sigma and writes nothing", async () => {
    // history mean 10, sd about 0.85; 12.4 is about 2.8 sigma, 11.9 about 2.2
    const { host, files } = fakeHost({
      files: {
        ".factory/bands.yaml": BANDS,
        ".factory/series.json": series({ "ci-failure-rate": [...calm, 11.9] }),
      },
    });
    const r = await maintain(host, 9);
    expect(r.wrote).toBe(false);
    expect(files.has("specs/9/intent.md")).toBe(false);
    expect(r.lines.join("\n")).toMatch(/ci-failure-rate.*2 sigma/);
  });
  it("treats a drop in a down-is-bad metric as a breach", async () => {
    const { host, files } = fakeHost({
      files: {
        ".factory/bands.yaml": BANDS,
        ".factory/series.json": series({ "eval-pass-rate": [90, 91, 89, 90, 90, 91, 89, 40] }),
      },
    });
    expect((await maintain(host, 3)).wrote).toBe(true);
    expect(files.get("specs/3/intent.md")).toContain("eval-pass-rate");
  });
  it("does nothing inside the band, and skips a series shorter than its window", async () => {
    const { host, files } = fakeHost({
      files: {
        ".factory/bands.yaml": BANDS,
        ".factory/series.json": series({
          "ci-failure-rate": [...calm, 10],
          "eval-pass-rate": [90, 10],
        }),
      },
    });
    const r = await maintain(host, 9);
    expect(r.wrote).toBe(false);
    expect(files.has("specs/9/intent.md")).toBe(false);
    expect(r.lines.join("\n")).toContain("eval-pass-rate: not enough history");
  });
  it("fails loudly when there is no series to read", async () => {
    const { host } = fakeHost({ files: { ".factory/bands.yaml": BANDS } });
    await expect(maintain(host, 9)).rejects.toThrow(".factory/series.json");
  });
});
