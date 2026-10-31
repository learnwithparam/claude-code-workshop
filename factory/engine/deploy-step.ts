import { artifactDigest } from "./artifacts.ts";
import { mergeQueue, release } from "./deploy.ts";
import { APPROVALS, classify } from "./risk.ts";
import type { Host } from "./types.ts";
import type { Step } from "./workflow.ts";

// A workflow step with `deploy:` runs no agent. The merge queue gates on latest main, a preview is free,
// and production needs the tier's people to have approved this stage on this commit.
export async function runDeploy(
  host: Host,
  n: number,
  step: Step,
): Promise<{ ok: boolean; reason: string }> {
  if (step.deploy === "merge-queue") return mergeQueue(host);
  if (step.deploy === "preview") return release(host, "preview", "low", [], "");
  const head = (await host.exec("git", ["rev-parse", "HEAD"])).output.trim();
  const tier = classify(await host.changedFiles());
  // Production always needs a person, as the human gate does; the tier only raises the count.
  const need = Math.max(1, APPROVALS[tier]);
  const ok = await host.approved(n, step.stage, await artifactDigest(host, n, step.stage), need);
  // approved() has counted distinct writers; those same logins are the approvals release() checks.
  const writers = ok ? await host.writers(n) : [];
  const approvals = writers
    .slice(0, need)
    .map((by) => ({ by, kind: "human" as const, commit: head }));
  return release(host, "production", tier, approvals, head);
}
