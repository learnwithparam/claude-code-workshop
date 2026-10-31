import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { pinPortable, pinPortableAt, portable } from "./portable.ts";

afterEach(() => pinPortable());

describe("config from the base commit", () => {
  it("pins the committed gate even when the working tree file was edited", () => {
    const dir = mkdtempSync(join(tmpdir(), "cfg-base-"));
    const run = (...a: string[]) => execFileSync("git", a, { cwd: dir, encoding: "utf8" });
    const good = readFileSync(".factory/config.yaml", "utf8");
    mkdirSync(join(dir, ".factory"));
    writeFileSync(join(dir, ".factory/config.yaml"), good);
    run("init", "-q");
    run("add", ".");
    run("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "base");
    const evil = good.replace(/^gate:.*$/m, "gate: [true]");
    expect(evil).not.toBe(good);
    writeFileSync(join(dir, ".factory/config.yaml"), evil);

    const pinned = pinPortableAt("HEAD", dir);
    expect(pinned.gate).toEqual(["make", "check"]);
    expect(portable().gate).toEqual(["make", "check"]);
  });

  it("is what runIssue pins, from the merge base and before the first agent", () => {
    const cli = readFileSync("factory/engine/cli.ts", "utf8");
    expect(cli).toContain("pinPortableAt(base)");
    expect(cli).not.toMatch(/pinPortable\(\)/);
  });
});
