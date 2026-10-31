import { z } from "zod";

// Facts the stage reports about each sub-issue. The stage never picks the outcome; decideDelivery does.
const factsSchema = z.array(
  z.object({
    number: z.number().int().positive(),
    apiChange: z.boolean(),
    small: z.boolean(),
    dependsOn: z.array(z.number().int().positive()),
  }),
);
export type SubIssue = z.infer<typeof factsSchema>[number];
export type Delivery = "release" | "separate-prs" | "single-pr-commits";

export function parseFacts(text: string): SubIssue[] | { error: string } {
  const json = /^FACTS:\s*(\[.*\])\s*$/im.exec(text)?.[1];
  if (!json) return { error: "no FACTS line" };
  try {
    const parsed = factsSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : { error: "FACTS does not match the sub-issue shape" };
  } catch {
    return { error: "FACTS is not valid JSON" };
  }
}

// A user-visible API change ships as a release; independent work goes as separate PRs;
// coupled work stays together as one PR with a commit per sub-issue.
export function decideDelivery(
  subs: SubIssue[],
): { delivery: Delivery; reasons: string[] } | { error: string } {
  if (!subs.length) return { error: "an epic with no sub-issues has nothing to deliver" };
  const numbers = new Set(subs.map((s) => s.number));
  const stranger = subs.find((s) => s.dependsOn.some((d) => !numbers.has(d)));
  if (stranger) return { error: `#${stranger.number} depends on an issue outside the epic` };
  const api = subs.filter((s) => s.apiChange).map((s) => s.number);
  if (api.length)
    return {
      delivery: "release",
      reasons: [`user-visible API change in ${api.map((n) => `#${n}`).join(", ")}`],
    };
  if (subs.every((s) => s.dependsOn.length === 0))
    return { delivery: "separate-prs", reasons: ["no sub-issue depends on another"] };
  return {
    delivery: "single-pr-commits",
    reasons: [
      subs.every((s) => s.small)
        ? "coupled and small"
        : "coupled; kept together so they land in order",
    ],
  };
}

// The sub-issue numbers an epic lists as a checklist: "- [ ] #12 title".
export function subIssueNumbers(body: string): number[] {
  return [...body.matchAll(/^\s*-\s*\[[ xX]\]\s*#(\d+)/gm)].map((m) => Number(m[1]));
}
