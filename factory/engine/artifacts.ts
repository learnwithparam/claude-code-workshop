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

// A diff may touch only files the plan lists, one path per line (a bullet or backticks are fine), plus
// anything under specs/<n>/. Growing the plan means adding the path to plan.md. Editing plan.md is not
// itself a pass: it is part of every run's diff, so treating it as one would make this check vacuous.
export function planDrift(plan: string, changed: string[], n: number): string[] {
  const listed = new Set(plan.split("\n").map((l) => l.replace(/^\s*(?:[-*]\s+)?`?|`?\s*$/g, "")));
  return changed.filter((f) => !f.startsWith(`specs/${n}/`) && !listed.has(f));
}

// The hash a human approval binds to: the stage, the spec artifacts and every other file the stage
// changed, so the reviewer's approval covers all they were shown.
export async function artifactDigest(host: Host, n: number, stage: string): Promise<string> {
  const names = new Set<string>(["intent.md", "spec.md", "plan.md"].map((a) => `specs/${n}/${a}`));
  for (const f of await host.changedFiles()) names.add(f);
  // One hash per file, joined as JSON, so no path or content can shift a boundary; a missing file is null, not "".
  const entries: [string, string | null][] = [];
  for (const f of [...names].sort()) {
    const text = await host.read(f);
    entries.push([
      f,
      text === null || text === undefined ? null : createHash("sha256").update(text).digest("hex"),
    ]);
  }
  const h = createHash("sha256").update(JSON.stringify({ stage, entries }));
  return h.digest("hex");
}
