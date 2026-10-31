import { createHash } from "node:crypto";
import { artifactPath, isGateOwned } from "./artifacts.ts";
import { classify } from "./risk.ts";
import type { Host } from "./types.ts";

export const AMENDMENT_STAGE = "plan-amendment";
export const amendmentDigest = (text: string) => createHash("sha256").update(text).digest("hex");

// One bullet per path, then a colon and the reason: `- shared/src/b.ts: why the plan missed it`.
const LINE = /^\s*[-*]\s+`?([^`\s:]+)`?\s*:\s*(\S.*)$/;

export const parseAmendment = (text: string) =>
  text.split("\n").flatMap((l) => {
    const m = LINE.exec(l);
    return m?.[1] && m[2] ? [{ path: m[1], reason: m[2] }] : [];
  });

export type Amendment = { paths: string[]; problem?: string };

// Paths the builder may add to the plan. A gate-owned path voids the whole amendment, and so does any
// edit after approval, because the approval binds to the digest of the text the reviewer read.
export async function approvedAmendment(host: Host, n: number): Promise<Amendment> {
  const text = await host.read(artifactPath(n, "plan-amendment.md"));
  if (text === null) return { paths: [] };
  const paths = parseAmendment(text).map((e) => e.path);
  if (!paths.length) return { paths: [], problem: "plan-amendment.md lists no path with a reason" };
  const owned = paths.filter(isGateOwned);
  if (owned.length)
    return { paths: [], problem: `gate-owned paths cannot be amended: ${owned.join(", ")}` };
  // Auto-approval needs the diff to be low risk too; anything else waits for a person.
  const auto = classify(await host.changedFiles()) === "low";
  const digest = amendmentDigest(text);
  if (auto || (await host.approved(n, AMENDMENT_STAGE, digest))) return { paths };
  return { paths: [], problem: "plan-amendment.md is not approved for its current text" };
}
