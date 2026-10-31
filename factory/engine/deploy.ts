import { type Approval, approvalsMet, type Tier } from "./risk.ts";
import type { Host } from "./types.ts";

export type Env = "preview" | "production";

// Preview is free. Production needs the tier's human approvals on this exact commit,
// the playbook's RELEASE_APPROVAL gate. Anything else refuses before a command runs.
export async function release(
  host: Host,
  env: Env,
  tier: Tier,
  approvals: Approval[],
  head: string,
) {
  if (env === "production" && !approvalsMet(tier, approvals, head))
    return { ok: false, reason: `production needs ${tier} approvals on ${head}` };
  const r = await host.exec("make", ["deploy", `ENV=${env}`]);
  return { ok: r.code === 0, reason: r.code === 0 ? "released" : r.output };
}

// Rollback is one command: redeploy the previous tag.
export async function rollback(host: Host, env: Env, previousTag: string) {
  const r = await host.exec("make", ["deploy", `ENV=${env}`, `TAG=${previousTag}`]);
  return { ok: r.code === 0 };
}

// The merge queue: apply the change to the latest main and run the gate there, not on the stale branch.
export async function mergeQueue(host: Host) {
  const m = await host.exec("git", ["merge", "--no-commit", "origin/main"]);
  if (m.code !== 0) return { ok: false, reason: "does not merge cleanly with main" };
  const g = await host.exec("make", ["check"]);
  await host.exec("git", ["merge", "--abort"]);
  return { ok: g.code === 0, reason: g.code === 0 ? "gate green on latest main" : g.output };
}
