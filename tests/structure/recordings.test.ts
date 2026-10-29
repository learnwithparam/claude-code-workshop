import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LEVEL_ORDER } from "../../scripts/levels.ts";

// A proof nobody can watch is a claim. Each level page shows its own recording.
describe("recordings", () => {
  // A snapshot holds only the levels up to its own, so test the pages that are there.
  for (const level of LEVEL_ORDER.filter((l) => existsSync(`docs/levels/${l}.md`))) {
    it(`${level} shows a recording of its proof passing`, () => {
      const doc = readFileSync(`docs/levels/${level}.md`, "utf8");
      const prove = /## Prove it\n([\s\S]*?)(?=\n## )/.exec(doc)?.[1] ?? "";
      expect(prove).toContain(`](../recordings/${level}.gif)`);
      expect(existsSync(`docs/recordings/${level}.gif`)).toBe(true);
      expect(readFileSync(`docs/recordings/${level}.cast`, "utf8")).toContain(`PASS ${level}`);
    });
  }
});
