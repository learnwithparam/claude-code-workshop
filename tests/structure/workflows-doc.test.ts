import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The F8 table maps a kind of task to a workflow. This holds it to the yaml files that exist.
const doc = readFileSync("docs/factory/f8-workflows.md", "utf8");

const listed = [...doc.matchAll(/^\| [^|]+ \| `([a-z-]+)` +\|/gm)].map((m) => m[1]).sort();
const defined = readdirSync(".factory/workflows")
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => f.replace(/\.yaml$/, ""))
  .sort();

describe("f8 workflow table", () => {
  it("lists every workflow file, and nothing that has no file", () => {
    expect(defined.length).toBeGreaterThan(0);
    expect(listed).toEqual(defined);
  });
});
