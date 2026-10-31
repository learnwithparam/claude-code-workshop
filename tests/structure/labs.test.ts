import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import levels from "../../levels.json" with { type: "json" };
import { LANES, loadLabs, PATHS } from "../../scripts/labs/catalog.ts";
import { isCommand } from "../../scripts/labs/render.ts";

// A lab without a goal, steps, a proof or hints is a doc, not a lab. loadLabs parses with zod and throws.
const labs = loadLabs("labs");
// A level snapshot holds only its own docs, so a pairing doc counts when some level owns it.
const owned = (Object.values(levels) as string[][]).flat();
const isOwned = (f: string) =>
  owned.some((g) => g === f || (g.endsWith("/**") && f.startsWith(g.slice(0, -2))));
const RANK = { guided: 0, hinted: 1, goal: 2 } as const;
const readme = readFileSync("docs/labs/README.md", "utf8");

describe("labs", () => {
  it("every lane has labs, noob to advanced", () => {
    for (const lane of LANES) expect(labs.filter((l) => l.lane === lane).length).toBeGreaterThan(0);
  });

  it("each path's lanes match the lane list in docs/labs/README.md", () => {
    for (const [id, lanes] of Object.entries(PATHS)) {
      const line = readme
        .split("\n")
        .find((l) => l.startsWith("- ") && l.includes(`PATH_ID=${id}`));
      expect(line, `README has no line for PATH_ID=${id}`).toBeDefined();
      const listed = [...(line ?? "").matchAll(/`([a-z]+)`/g)]
        .map((m) => m[1])
        .filter((w) => (LANES as readonly (string | undefined)[]).includes(w));
      expect(listed).toEqual([...lanes]);
    }
  });

  it("no stray files in a lane", () => {
    const stray = LANES.flatMap((lane) =>
      readdirSync(`labs/${lane}`)
        .filter((f) => !/^\d{2}-[a-z0-9-]+\.md$/.test(f))
        .map((f) => `${lane}/${f}`),
    );
    expect(stray).toEqual([]);
  });

  it.each(labs)("$id opens by running make lab to see the proof red", (lab) => {
    expect(lab.steps[0], `${lab.id} step 1 must say to run make lab`).toContain("`make lab`");
  });

  it("help never decreases along the lane order", () => {
    const ranks = labs.map((l) => RANK[l.help]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("every advanced lab is goal only", () => {
    for (const l of labs.filter((x) => x.lane === "advanced")) expect(l.help).toBe("goal");
  });

  // A hidden command must still be reachable, or the learner is stuck with no way forward.
  it.each(labs.filter((l) => l.help !== "guided"))(
    "$id keeps every step command in its hints",
    (lab) => {
      const hints = lab.hints.join("\n");
      const missing = lab.steps
        .flatMap((s) => [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "").filter(isCommand))
        .filter((c) => c !== "make lab" && !hints.includes(c));
      expect(missing).toEqual([]);
    },
  );

  it.each(labs)("$id pairs with a doc that exists and is listed in the path table", (lab) => {
    expect(existsSync(lab.pairs) || isOwned(lab.pairs), `${lab.pairs} is missing`).toBe(true);
    const row = readme.split("\n").find((line) => line.includes(`\`${lab.id}\``));
    expect(row, `${lab.id} is not in docs/labs/README.md`).toBeDefined();
    const target = lab.pairs.replace(/^docs\//, "../");
    expect(row).toContain(`(${target})`);
  });
});
