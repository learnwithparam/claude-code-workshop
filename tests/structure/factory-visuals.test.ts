import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The house style in docs/factory/visual-guide.md, as far as a test can hold it. A level snapshot
// may lack some modules, so only the files present are read.
const dir = "docs/factory";
const MAX_SVG_BYTES = 40_000;
const docs = readdirSync(dir).filter((f) => f.endsWith(".md"));
const modules = docs.filter((f) => /^f\d/.test(f));
const svgs = existsSync(`${dir}/img`)
  ? readdirSync(`${dir}/img`).filter((f) => f.endsWith(".svg"))
  : [];
const images = (file: string) =>
  [...readFileSync(`${dir}/${file}`, "utf8").matchAll(/!\[([^\]]*)\]\((img\/[^)]+)\)/g)].map(
    ([, alt, path]) => ({ alt, path }),
  );

describe("factory docs visuals", () => {
  it("embeds at least one picture in every module", () => {
    expect(modules.filter((f) => images(f).length === 0)).toEqual([]);
  });

  it("points every picture at a file that exists, with alt text", () => {
    const bad = docs.flatMap((f) =>
      images(f)
        .filter(({ alt, path }) => !alt.trim() || !existsSync(`${dir}/${path}`))
        .map(({ path }) => `${f}: ${path}`),
    );
    expect(bad).toEqual([]);
  });

  it("gives every SVG a title, a description and an image role, under the size cap", () => {
    const bad = svgs.flatMap((f) => {
      const s = readFileSync(`${dir}/img/${f}`, "utf8");
      const missing = [
        !/<title[\s>]/.test(s) && "title",
        !/<desc[\s>]/.test(s) && "desc",
        !/role="img"/.test(s) && 'role="img"',
        statSync(`${dir}/img/${f}`).size > MAX_SVG_BYTES && "size",
      ].filter(Boolean);
      return missing.length ? [`${f}: ${missing.join(", ")}`] : [];
    });
    expect(bad).toEqual([]);
  });
});
