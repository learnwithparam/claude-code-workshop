import { createHash } from "node:crypto";
import { artifactPath } from "../artifacts.ts";
import type { Check } from "../types.ts";

const TEST = /(\.test\.[cm]?[jt]sx?$|\.e2e\.[jt]s$|\.feature$|(^|\/)tests\/)/i;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

// The first call records a hash of every test file in the repo in runner state, which the agent cannot
// write; later calls fail if one was edited or removed. New tests may be added, an old one may not move:
// the tests are the spec the fix has to meet. specs/<n>/lock.json is a copy for the audit trail only.
export const lock: Check = {
  size: "small",
  async run({ host, n }) {
    const files = (await host.list("")).filter((f) => TEST.test(f));
    const now: Record<string, string> = {};
    for (const f of files) now[f] = hash((await host.read(f)) ?? "");
    const key = `lock:${n}`;
    const saved = await host.recall(key);
    if (saved === null) {
      await host.remember(key, JSON.stringify(now));
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
