import { describe, expect, it } from "vitest";
import { loadLabs } from "../../scripts/labs/catalog.ts";
import { LAZY, NEEDS, SOLUTIONS } from "./lab-artifacts.ts";

// The proofs themselves run per lane in lab-solutions-<lane>.test.ts. This holds the artifact
// tables to the lab catalog, so a lab cannot lose its solution and a deleted lab cannot leave one.
describe("lab proof artifacts", () => {
  const ids = loadLabs("labs")
    .map((l) => l.id)
    .sort();

  it("has a solution and a lazy artifact for every lab and none extra", () => {
    expect(Object.keys(SOLUTIONS).sort()).toEqual(ids);
    expect(Object.keys(LAZY).sort()).toEqual(ids);
  });

  it("needs files only for labs that exist", () => {
    expect(Object.keys(NEEDS).filter((id) => !ids.includes(id))).toEqual([]);
  });
});
