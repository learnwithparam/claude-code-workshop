import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

// A Story quotes real run records, test names and commit titles. Each double-quoted phrase must
// occur in a file the Story cites, a factory test, the retro, or an assignment brief. Case and line breaks do not
// count. Levels may lack some files.
const dir = "docs/factory";
const flat = (t: string) => t.replace(/\s+/g, " ").toLowerCase();
const read = (p: string) =>
  existsSync(p) && statSync(p).isFile() ? flat(readFileSync(p, "utf8")) : "";

const walk = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`],
  );
const factoryTests = existsSync("factory")
  ? walk("factory")
      .filter((f) => f.endsWith(".test.ts"))
      .map(read)
      .join("\n")
  : "";
const retro = read(`${dir}/harness-retro.md`);
const briefs = existsSync("assignments")
  ? readdirSync("assignments")
      .map((f) => read(`assignments/${f}`))
      .join("\n")
  : "";

const stories = readdirSync(dir)
  .filter((f) => /^f\d.*\.md$/.test(f))
  .map((f) => {
    const text = readFileSync(`${dir}/${f}`, "utf8");
    const story = text.split(/^## Story$/m)[1]?.split(/^## /m)[0] ?? "";
    const cited = [...story.matchAll(/`([\w][\w./-]*\.\w+)`/g)].map((m) => read(m[1] ?? ""));
    const quotes = [...story.matchAll(/"([^"]{12,})"/g)].map((m) => flat(m[1] ?? ""));
    return { f, quotes, pool: [...cited, factoryTests, retro, briefs].join("\n") };
  })
  .filter((s) => s.quotes.length > 0);

describe("story quotes", () => {
  it("finds quoted phrases to hold", () => {
    expect(stories.length).toBeGreaterThan(0);
  });

  it.each(stories)("$f quotes only text that exists", ({ quotes, pool }) => {
    expect(quotes.filter((q) => !pool.includes(q))).toEqual([]);
  });
});
