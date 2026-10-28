import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildLedger } from "./cost-ledger.ts";
import { writeRunFiles } from "./run-files.ts";

// One slow mkdtemp (a crowded system temp dir can take seconds) instead of one per test.
let base = "";
let count = 0;
const fresh = () => {
  const dir = join(base, String(count++));
  mkdirSync(dir);
  return dir;
};
beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), "runs-"));
}, 60_000);
afterAll(() => rmSync(base, { recursive: true, force: true }));

describe("run files", () => {
  it("writes cost.json and run.log under the ticket's folder", () => {
    const root = fresh();
    const ledger = buildLedger([], {}, "m");
    const dir = writeRunFiles(root, 7, ledger, ["triage haiku $0.01", "outcome pr-ready"]);
    expect(dir).toBe(join(root, ".factory", "runs", "7"));
    expect(JSON.parse(readFileSync(join(dir, "cost.json"), "utf8")).totalUsd).toBe(0);
    expect(readFileSync(join(dir, "run.log"), "utf8")).toContain("outcome pr-ready");
  });

  it("refuses to write through a symlink planted in the runs folder", () => {
    const root = fresh();
    const elsewhere = fresh();
    mkdirSync(join(root, ".factory", "runs"), { recursive: true });
    symlinkSync(elsewhere, join(root, ".factory", "runs", "7"));
    expect(() => writeRunFiles(root, 7, buildLedger([], {}, "m"), [])).toThrow(/symlink/);
    expect(existsSync(join(elsewhere, "cost.json"))).toBe(false);
  });

  it("refuses a symlinked file and leaves its target alone", () => {
    const root = fresh();
    const target = join(fresh(), "victim");
    const dir = join(root, ".factory", "runs", "7");
    mkdirSync(dir, { recursive: true });
    symlinkSync(target, join(dir, "run.log"));
    expect(() => writeRunFiles(root, 7, buildLedger([], {}, "m"), ["x"])).toThrow(/symlink/);
    expect(existsSync(target)).toBe(false);
  });
});
