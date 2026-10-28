import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// A learner who falls behind lands on any level doc, so every one has the same steps.
const ALWAYS = ["Goal", "The problem", "Without", "Run it", "Prove it", "Exercise", "Discussion"];
const dir = "docs/levels";

describe("walkthrough docs", () => {
  const docs = readdirSync(dir).filter((f) => f.endsWith(".md"));

  it.each(docs)("%s has every step, in order, and no L-number label", (doc) => {
    const text = readFileSync(`${dir}/${doc}`, "utf8");
    const headings = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1] ?? "");
    const missing = ALWAYS.filter((h) => !headings.includes(h));
    expect(missing).toEqual([]);
    const order = ALWAYS.map((h) => headings.indexOf(h));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(headings.some((h) => h === "The config" || h === "The code")).toBe(true);
    expect(text).not.toMatch(/\bL[0-6]\b/);
  });
});
