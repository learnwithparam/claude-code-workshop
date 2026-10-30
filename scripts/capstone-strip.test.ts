import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CAPSTONE_CODE, stripCapstone } from "./capstone-strip.ts";

describe("capstone strip", () => {
  it("names only paths that exist in the finished tree", () => {
    const missing = CAPSTONE_CODE.filter((p) => !existsSync(p));
    expect(missing).toEqual([]);
  });

  it("removes the feature and leaves everything else", () => {
    const root = mkdtempSync(join(tmpdir(), "strip-"));
    mkdirSync(join(root, "api/src/cache"), { recursive: true });
    writeFileSync(join(root, "api/src/cache/prompt-cache.ts"), "x");
    writeFileSync(join(root, "api/src/server.ts"), "keep");
    expect(stripCapstone(root)).toEqual(["api/src/cache"]);
    expect(existsSync(join(root, "api/src/cache"))).toBe(false);
    expect(existsSync(join(root, "api/src/server.ts"))).toBe(true);
  });
});
