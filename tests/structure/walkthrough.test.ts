import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LANES, loadLabs } from "../../scripts/labs/catalog";

// A learner who falls behind lands on any level doc, so every one has the same steps.
const ALWAYS = ["Goal", "The problem", "Without", "Run it", "Prove it", "Exercise", "Discussion"];
// Levels, electives and the agent track all use the same steps. A snapshot only has the folders it owns.
const dirs = ["docs/levels", "docs/electives", "docs/agent"].filter((d) => existsSync(d));
const docs = dirs.flatMap((d) =>
  readdirSync(d)
    .filter((f) => f.endsWith(".md"))
    .map((f) => `${d}/${f}`),
);

describe("walkthrough docs", () => {
  it.each(docs)("%s has every step, in order, and no L-number label", (doc) => {
    const text = readFileSync(doc, "utf8");
    const headings = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1] ?? "");
    const missing = ALWAYS.filter((h) => !headings.includes(h));
    expect(missing).toEqual([]);
    const order = ALWAYS.map((h) => headings.indexOf(h));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(headings.some((h) => h === "The config" || h === "The code")).toBe(true);
    expect(text).not.toMatch(/\bL[0-6]\b/);
  });
});

// A lane walkthrough has one `## <id>: <title>` section per lab, so a new lab cannot ship without one.
describe("lane walkthroughs", () => {
  const labs = loadLabs("labs");
  it.each(LANES)("%s walkthrough has a section for exactly its labs", (lane) => {
    const text = readFileSync(`docs/labs/walkthrough-${lane}.md`, "utf8");
    const found = [...text.matchAll(/^## ([a-z]+-\d{2}): /gm)].map((m) => m[1]);
    const want = labs.filter((l) => l.lane === lane).map((l) => l.id);
    expect(found.sort()).toEqual(want.sort());
  });
});
