import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadLabs } from "../../scripts/labs/catalog.ts";
import { fullRepo } from "./repo-roots.ts";

// docs/patterns.md points at real code. Each row names a file, a word in it and the lab and module that teach it.
const strip = (cell: string) => cell.replace(/`/g, "").trim();
const rows = readFileSync("docs/patterns.md", "utf8")
  .split("\n")
  .filter((l) => l.startsWith("| ") && !l.startsWith("| Pattern") && !l.startsWith("| ---"))
  .map((l) => l.split("|").slice(1, -1).map(strip));
const labIds = new Set(loadLabs("labs").map((l) => l.id));

describe.skipIf(!fullRepo)("patterns table", () => {
  it("has a row per pattern", () => {
    expect(rows.length).toBeGreaterThanOrEqual(15);
  });

  it.each(rows)(
    "%s points at real code, a real lab and a real module",
    (name, _p, path, anchor, lab, mod) => {
      expect(existsSync(path ?? ""), `${name}: ${path}`).toBe(true);
      expect(readFileSync(path ?? "", "utf8"), `${name}: anchor ${anchor}`).toContain(anchor);
      expect(lab === "-" || labIds.has(lab ?? ""), `${name}: lab ${lab}`).toBe(true);
      expect(existsSync(mod ?? ""), `${name}: ${mod}`).toBe(true);
    },
  );
});
