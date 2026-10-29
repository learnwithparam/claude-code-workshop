import { createHash } from "node:crypto";
import type { Host } from "./types.ts";

// What each stage commits for the next one to read. The commit chain is the audit trail.
export const ARTIFACTS = [
  "intent.md",
  "spec.md",
  "plan.md",
  "review.json",
  "run.log",
  "incident.md",
  "lock.json",
] as const;
export type ArtifactName = (typeof ARTIFACTS)[number];

export const artifactPath = (n: number, name: ArtifactName) => `specs/${n}/${name}`;

export const writeArtifact = (host: Host, n: number, name: ArtifactName, text: string) =>
  host.write(artifactPath(n, name), text);

// A stage reads only what an earlier stage committed; a missing artifact is an error, not an empty string.
export async function readArtifact(host: Host, n: number, name: ArtifactName): Promise<string> {
  const text = await host.read(artifactPath(n, name));
  if (text === null)
    throw new Error(`${artifactPath(n, name)} is missing; the earlier stage did not commit it`);
  return text;
}

// A diff may touch only files the plan names, plus the plan itself and anything under specs/<n>/.
// Updating plan.md in the same change is how a plan is allowed to grow.
export function planDrift(plan: string, changed: string[], n: number): string[] {
  const ownArtifacts = (f: string) => f.startsWith(`specs/${n}/`);
  if (changed.includes(artifactPath(n, "plan.md"))) return [];
  return changed.filter((f) => !ownArtifacts(f) && !plan.includes(f));
}

// The hash a human approval binds to: the stage, the spec artifacts and every other file the stage
// changed, so the reviewer's approval covers all they were shown.
export async function artifactDigest(host: Host, n: number, stage: string): Promise<string> {
  const h = createHash("sha256");
  h.update(`stage ${stage}\n`);
  const names = new Set<string>(["intent.md", "spec.md", "plan.md"].map((a) => `specs/${n}/${a}`));
  for (const f of await host.changedFiles()) names.add(f);
  for (const f of [...names].sort()) h.update(`${f}\n${(await host.read(f)) ?? ""}\n`);
  return h.digest("hex");
}
