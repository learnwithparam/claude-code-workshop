import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildLedger } from "./cost-ledger.ts";
import { writeRunFiles } from "./run-files.ts";

describe("run files", () => {
  it("writes cost.json and run.log under the ticket's folder", () => {
    const root = mkdtempSync(join(tmpdir(), "runs-"));
    const ledger = buildLedger([], {}, "m");
    const dir = writeRunFiles(root, 7, ledger, ["triage haiku $0.01", "outcome pr-ready"]);
    expect(dir).toBe(join(root, ".factory", "runs", "7"));
    expect(JSON.parse(readFileSync(join(dir, "cost.json"), "utf8")).totalUsd).toBe(0);
    expect(readFileSync(join(dir, "run.log"), "utf8")).toContain("outcome pr-ready");
  });
});
