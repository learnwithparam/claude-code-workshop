import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import levels from "../../levels.json" with { type: "json" };
import { LANES, loadLabs } from "../../scripts/labs/catalog.ts";

// A lab without a goal, steps, a proof or hints is a doc, not a lab. loadLabs parses with zod and throws.
const labs = loadLabs("labs");
// A level snapshot holds only its own docs, so a pairing doc counts when some level owns it.
const owned = (Object.values(levels) as string[][]).flat();
const isOwned = (f: string) =>
  owned.some((g) => g === f || (g.endsWith("/**") && f.startsWith(g.slice(0, -2))));
const readme = readFileSync("docs/labs/README.md", "utf8");

describe("labs", () => {
  it("every lane has labs, noob to advanced", () => {
    for (const lane of LANES) expect(labs.filter((l) => l.lane === lane).length).toBeGreaterThan(0);
  });

  it("no stray files in a lane", () => {
    const stray = LANES.flatMap((lane) =>
      readdirSync(`labs/${lane}`)
        .filter((f) => !/^\d{2}-[a-z0-9-]+\.md$/.test(f))
        .map((f) => `${lane}/${f}`),
    );
    expect(stray).toEqual([]);
  });

  it.each(labs)("$id pairs with a doc that exists and is listed in the path table", (lab) => {
    expect(existsSync(lab.pairs) || isOwned(lab.pairs), `${lab.pairs} is missing`).toBe(true);
    const row = readme.split("\n").find((line) => line.includes(`\`${lab.id}\``));
    expect(row, `${lab.id} is not in docs/labs/README.md`).toBeDefined();
    const target = lab.pairs.replace(/^docs\//, "../");
    expect(row).toContain(`(${target})`);
  });
});
