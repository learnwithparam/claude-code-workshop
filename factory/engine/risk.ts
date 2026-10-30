import { posix } from "node:path";

export type Tier = "low" | "medium" | "high";

// Anything that steers an agent or the pipeline is high, markdown included: CLAUDE.md, skills and agent
// prompts are .md files, so a blanket "markdown is docs" rule would let a prompt change ship unreviewed.
const HIGH = [
  /^\.github\//,
  /^\.claude\//,
  /^\.factory\//,
  /^factory\//,
  /^scripts\//,
  /^(claude|agents|review)\.md$/,
  /^makefile$/,
  /^package(-lock)?\.json$/,
  /(^|\/)migrations?\//,
];
const LOW = [/^docs\//, /^fixtures\//];

const norm = (f: string) =>
  posix.normalize(f.replaceAll("\\", "/")).replace(/^\.\//, "").toLowerCase();

const RUN_ARTIFACT =
  /^specs\/\d+\/(intent\.md|spec\.md|plan\.md|constitution\.md|clarify\.md|tasks\.md|analyze\.md|run\.log|review\.json|lock\.json|incident\.md)$/;

// The tier comes from the paths in the diff, never from who wrote it. The worst path sets it, and
// HIGH is checked before LOW. specs/<n>/ holds the run's own artifacts and says nothing about risk.
export function classify(changed: string[]): Tier {
  // Only the run's own artifact files are exempt; any other file under specs/ is classified.
  const files = changed.map(norm).filter((f) => !RUN_ARTIFACT.test(f));
  if (!files.length) return "medium";
  if (files.some((f) => f.startsWith("../") || HIGH.some((r) => r.test(f)))) return "high";
  if (files.every((f) => LOW.some((r) => r.test(f)))) return "low";
  return "medium";
}

export const APPROVALS: Record<Tier, number> = { low: 0, medium: 1, high: 2 };
export type Approval = { by: string; kind: "human" | "agent"; commit: string };

// An agent's approval never counts, and an approval covers one commit: a push after it voids it.
export function approvalsMet(tier: Tier, approvals: Approval[], head: string): boolean {
  const humans = new Set(
    approvals.filter((a) => a.kind === "human" && a.commit === head).map((a) => a.by),
  );
  return humans.size >= APPROVALS[tier];
}
