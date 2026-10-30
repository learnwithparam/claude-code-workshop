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
  "constitution.md",
  "clarify.md",
  "tasks.md",
  "analyze.md",
] as const;
export const AGENT_ARTIFACTS = [
  "intent.md",
  "spec.md",
  "plan.md",
  "constitution.md",
  "clarify.md",
  "tasks.md",
  "analyze.md",
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
export const planLines = (plan: string) =>
  plan
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*]\s+)?`?|`?\s*$/g, ""))
    .filter(Boolean);

// The runner already allows specs/<n>/, so a planner that lists those files is not wrong enough to refuse its plan.
export const dropSpecLines = (plan: string, n: number) =>
  plan
    .split("\n")
    .filter((l) => !planLines(l).some((p) => p.startsWith(`specs/${n}/`)))
    .join("\n");

// A visual change regenerates the golden snapshots, and the gate owns that folder so a plan cannot list it.
// The feedback gate shows a human the changed files, so the snapshots are reviewed there, not by the plan.
const SNAPSHOT = /^specs\/\d+\/golden\/__snapshots__\/[A-Za-z0-9_-]+\.(html|snap)$/;

export function planDrift(plan: string, changed: string[], n: number): string[] {
  const listed = new Set(planLines(plan));
  return changed.filter((f) => !f.startsWith(`specs/${n}/`) && !SNAPSHOT.test(f) && !listed.has(f));
}

// The plan is the allowlist, and a model writes it, so it may name only ordinary repo files: no prose, globs,
// absolute or parent paths, and nothing the gate itself is made of.
const PLAN_PATH = /^[A-Za-z0-9_][A-Za-z0-9_.@/-]*$/;
// A plan may list an older spec's golden test (a hand fix to a test that contradicts the ticket); the
// lock check already fails any later edit to it. Snapshots and other golden files stay gate-owned.
// levels.json is not here: a new source file needs an owner entry there, so a plan must be able to list it.
const GATE_OWNED =
  /^((\.github|\.claude|\.factory|factory|scripts)\/|specs\/[^/]+\/golden\/(?![^/]+\.test\.ts$))|(^|\/)(makefile|package(-lock)?\.json|biome\.json|\.npmrc|stryker[^/]*|vitest[^/]*|tsconfig[^/]*|playwright\.config[^/]*)$/i;
const MANIFEST = /(^|\/)package(-lock)?\.json$/;
// A dependency update must edit the manifests, so that workflow alone may list them; the manifest-deps
// check then holds the edit to dependency fields.
export function badPlanLines(plan: string, manifests = false): string[] {
  return planLines(plan).filter(
    (l) =>
      !PLAN_PATH.test(l) ||
      l.split("/").includes("..") ||
      (GATE_OWNED.test(l) && !(manifests && MANIFEST.test(l))),
  );
}

// The hash a human approval binds to: the stage, the spec artifacts and every other file the stage
// changed, so the reviewer's approval covers all they were shown.
export async function artifactDigest(host: Host, n: number, stage: string): Promise<string> {
  // The spec and plan gates sign only the documents written so far. Hashing the whole tree meant any later
  // build or a plan edit made the earlier approval stale, so every resume re-ran approved stages (run 34).
  const docs =
    stage === "spec" || stage === "decide"
      ? ["intent.md", "spec.md"]
      : ["intent.md", "spec.md", "plan.md"];
  const names = new Set<string>(docs.map((a) => `specs/${n}/${a}`));
  // Spec Kit documents join the hash only when a run wrote them, so earlier approvals keep their digest.
  for (const extra of ["constitution.md", "clarify.md", "tasks.md", "analyze.md"])
    if ((await host.read(`specs/${n}/${extra}`)) !== null) names.add(`specs/${n}/${extra}`);
  if (stage !== "spec" && stage !== "decide" && stage !== "plan")
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
