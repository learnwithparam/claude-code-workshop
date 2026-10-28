import { describe, expect, it } from "vitest";
import { changelogEntry, nextVersion, prependEntry } from "./release.ts";

describe("release helpers", () => {
  it("bumps the minor version and rejects a non-plain one", () => {
    expect(nextVersion("0.1.0")).toBe("0.2.0");
    expect(nextVersion("1.4.7")).toBe("1.5.0");
    expect(() => nextVersion("1.0.0-rc1")).toThrow();
  });
  it("writes a dated entry and puts it above older ones", () => {
    const first = prependEntry("", changelogEntry("0.2.0", "2026-10-28", "Epic", ["a"]));
    expect(first).toContain("## 0.2.0 (2026-10-28)");
    const second = prependEntry(first, changelogEntry("0.3.0", "2026-11-01", "Epic 2", ["b"]));
    expect(second.indexOf("0.3.0")).toBeLessThan(second.indexOf("0.2.0"));
    expect(second.startsWith("# Changelog")).toBe(true);
  });
});
