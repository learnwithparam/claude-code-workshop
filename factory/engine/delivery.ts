import { decideDelivery, type SubIssue } from "../delivery.ts";
import { type Result, runWorkflow } from "./interpret.ts";
import type { Host } from "./types.ts";
import type { Workflow } from "./workflow.ts";

export type Delivered = { delivery: string; results: Record<number, Result>; stoppedAt?: number };

// Order sub-issues so each comes after what it depends on. A cycle never resolves, so it is refused.
export function dependencyOrder(subs: SubIssue[]): SubIssue[] | { error: string } {
  const done = new Set<number>();
  const out: SubIssue[] = [];
  while (out.length < subs.length) {
    const next = subs.find((s) => !done.has(s.number) && s.dependsOn.every((d) => done.has(d)));
    if (!next) return { error: "sub-issues depend on each other in a cycle" };
    done.add(next.number);
    out.push(next);
  }
  return out;
}

// Runs one child workflow per sub-issue, in dependency order. `separate-prs` leaves each child to open its
// own PR; `single-pr-commits` makes one commit per sub-issue on the epic's branch. Either way the first
// child that does not finish stops the epic, because later ones may build on it.
export async function deliver(
  host: Host,
  wf: Workflow,
  subs: SubIssue[],
  ticketOf: (n: number) => string,
): Promise<Delivered | { error: string }> {
  const decision = decideDelivery(subs);
  if ("error" in decision) return decision;
  const ordered = dependencyOrder(subs);
  if ("error" in ordered) return ordered;
  const results: Record<number, Result> = {};
  for (const sub of ordered) {
    const r = await runWorkflow(host, wf, sub.number, ticketOf(sub.number));
    results[sub.number] = r;
    if (r.outcome !== "done")
      return { delivery: decision.delivery, results, stoppedAt: sub.number };
    if (decision.delivery === "single-pr-commits") await host.commit(`#${sub.number}`);
  }
  return { delivery: decision.delivery, results };
}
