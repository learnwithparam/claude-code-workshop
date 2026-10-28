import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkBand, renderWorksheet, worksheetSchema } from "@workshop/shared";

type Fixture = { prompt: string; worksheet: unknown };
export type Proof = { level: string; claim: string; passed: boolean; detail: string };

// claim: the hand-built app renders every band into a valid HyperFrames still, with zero API calls.
export function proveHandBuilt(): Proof {
  const fixtures: Fixture[] = JSON.parse(readFileSync("fixtures/worksheets.json", "utf8"));
  const dir = mkdtempSync(join(tmpdir(), "l0-"));
  const problems: string[] = [];

  for (const [index, fixture] of fixtures.entries()) {
    const sheet = worksheetSchema.parse(fixture.worksheet);
    const verdict = checkBand(sheet);
    if (!verdict.ok) problems.push(`${sheet.band}: ${verdict.problems.join("; ")}`);
    const project = join(dir, String(index));
    mkdirSync(project);
    writeFileSync(join(project, "index.html"), renderWorksheet(sheet));
    // lint exits 1 when it finds errors, so read stdout from the thrown error too.
    let out: string;
    try {
      out = execFileSync("npx", ["hyperframes", "lint", "--json", project], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch (error) {
      out = String((error as { stdout?: string }).stdout ?? "{}");
    }
    const report = JSON.parse(out) as { errorCount?: number };
    if (report.errorCount) problems.push(`${sheet.band}: ${report.errorCount} lint errors`);
  }

  const source = ["bands", "check", "render", "schema"]
    .map((name) => readFileSync(`shared/src/${name}.ts`, "utf8"))
    .join("\n");
  if (/fetch\(|api\.anthropic/.test(source)) problems.push("the render path makes a network call");

  return {
    level: "hand-built",
    claim: "every band renders, lints clean, and the app calls no API",
    passed: problems.length === 0,
    detail: problems.length === 0 ? `${fixtures.length} bands ok` : problems.join(" | "),
  };
}
