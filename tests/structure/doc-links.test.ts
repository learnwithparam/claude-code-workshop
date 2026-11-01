import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { fullRepo } from "./repo-roots.ts";

// Every relative markdown link must reach a file, and every #anchor a heading in that file.
const walk = (dir: string): string[] =>
  (existsSync(dir) ? readdirSync(dir) : []).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : [];
  });
const docs = ["README.md", ...walk("docs"), ...walk("assignments")];

const withoutFences = (text: string) => text.replace(/^```[\s\S]*?^```/gm, "");

// GitHub's slug: lowercase, spaces to dashes, everything but letters, digits, dashes and underscores dropped.
const slug = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[`*_~]/g, (c) => (c === "_" ? "_" : ""))
    .replace(/[^\w\- ]/g, "")
    .replace(/ /g, "-");

const anchorsOf = (file: string): Set<string> =>
  new Set(
    [...withoutFences(readFileSync(file, "utf8")).matchAll(/^#{1,6} +(.+?) *#*$/gm)].map((m) =>
      slug(m[1] ?? ""),
    ),
  );

function brokenLinks(file: string, text: string): string[] {
  const bad: string[] = [];
  for (const [, target = ""] of withoutFences(text).matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    if (/^(https?:|mailto:)/.test(target)) continue;
    const [path = "", anchor] = target.split("#");
    const resolved = path === "" ? file : join(dirname(file), path);
    if (!existsSync(resolved)) bad.push(`${file}: ${target}`);
    else if (anchor && resolved.endsWith(".md") && !anchorsOf(resolved).has(anchor)) {
      bad.push(`${file}: ${target}`);
    }
  }
  return bad;
}

describe.skipIf(!fullRepo)("doc links", () => {
  it("reach a file and, when they name one, a heading in it", () => {
    expect(docs.flatMap((f) => brokenLinks(f, readFileSync(f, "utf8")))).toEqual([]);
  });

  it("catches a missing file and a missing anchor", () => {
    const text = "[a](f99.md) and [b](f6-deploy.md#nope) and [c](f6-deploy.md).";
    expect(brokenLinks("docs/factory/x.md", text)).toEqual([
      "docs/factory/x.md: f99.md",
      "docs/factory/x.md: f6-deploy.md#nope",
    ]);
  });

  it("slugs a heading the way GitHub does", () => {
    expect(slug("Where to go after this lane")).toBe("where-to-go-after-this-lane");
    expect(slug("F6: Deploy (the `release` stage)")).toBe("f6-deploy-the-release-stage");
  });
});
