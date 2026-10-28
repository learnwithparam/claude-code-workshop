import { describe, expect, it } from "vitest";
import { ADR_PATH, nextAdrFile, parseAdr, renderAdr } from "./adr.ts";

const adr = { slug: "use-zod", title: "Use zod", context: "c", decision: "d", consequences: "q" };
const line = (o: object) => `CRITICALITY: C2\nADR: ${JSON.stringify(o)}`;

describe("parseAdr", () => {
  it("writes nothing for C1", () => expect(parseAdr("CRITICALITY: C1")).toBe("none"));
  it("parses a C2 record", () => expect(parseAdr(line(adr))).toEqual(adr));
  it.each([
    ["no criticality", "hello"],
    ["C3 without a record", "CRITICALITY: C3"],
    ["empty consequences", line({ ...adr, consequences: " " })],
    ["a path in the slug", line({ ...adr, slug: "../x" })],
    ["bad json", "CRITICALITY: C2\nADR: {nope}"],
  ])("errors on %s", (_n, text) => expect(parseAdr(text)).toHaveProperty("error"));
});

describe("nextAdrFile", () => {
  it("starts at 0001 and continues from the highest", () => {
    expect(nextAdrFile([], "a")).toBe("docs/adr/0001-a.md");
    expect(nextAdrFile(["docs/adr/0002-x.md", "docs/adr/0007-y.md"], "z")).toBe(
      "docs/adr/0008-z.md",
    );
  });
  it("only ever produces a path the PR step accepts", () =>
    expect(ADR_PATH.test(nextAdrFile(["docs/adr/0001-x.md"], "ok-1"))).toBe(true));
});

describe("renderAdr", () => {
  it("has all three sections and the criticality", () => {
    const md = renderAdr(adr, "C2");
    for (const h of ["## Context", "## Decision", "## Consequences", "Criticality: C2"])
      expect(md).toContain(h);
  });
});
