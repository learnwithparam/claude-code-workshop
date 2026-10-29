export type Tier = "low" | "medium" | "high";

const HIGH = [
  /^\.github\//,
  /^\.claude\/settings/,
  /^\.claude\/hooks\//,
  /^\.factory\/config/,
  /^package(-lock)?\.json$/,
  /(^|\/)migrations?\//,
];
const LOW = [/^docs\//, /\.md$/, /^fixtures\//];

// The tier comes from the paths in the diff, never from who wrote it. The worst path sets it.
export function classify(changed: string[]): Tier {
  if (changed.some((f) => HIGH.some((r) => r.test(f)))) return "high";
  if (changed.length > 0 && changed.every((f) => LOW.some((r) => r.test(f)))) return "low";
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
