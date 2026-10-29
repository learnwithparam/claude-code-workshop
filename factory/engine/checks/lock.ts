import { createHash } from "node:crypto";
import { artifactPath } from "../artifacts.ts";
import type { Check } from "../types.ts";

const TEST = /(\.test\.[cm]?[jt]sx?$|\.e2e\.[jt]s$|\.feature$)/i;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

// The first call records a hash of every test file in the change; later calls fail if one was edited or removed.
// New tests may be added, an old one may not move: the tests are the spec the fix has to meet.
export const lock: Check = {
  size: "small",
  async run({ host, n }) {
    const files = (await host.changedFiles()).filter((f) => TEST.test(f));
    const now: Record<string, string> = {};
    for (const f of files) now[f] = hash((await host.read(f)) ?? "");
    const saved = await host.read(artifactPath(n, "lock.json"));
    if (saved === null) {
      await host.write(artifactPath(n, "lock.json"), JSON.stringify(now, null, 2));
      return { ok: true, evidence: `locked ${files.length} test file(s)` };
    }
    const before = JSON.parse(saved) as Record<string, string>;
    const moved = Object.keys(before).filter((f) => now[f] !== before[f]);
    return moved.length
      ? { ok: false, evidence: `locked tests changed or removed: ${moved.join(", ")}` }
      : { ok: true, evidence: "locked tests unchanged" };
  },
};
