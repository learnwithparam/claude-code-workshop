import { z } from "zod";

// The only places a lesson may land. Settings, hooks, product code and the runner stay with a human.
const ALLOWED =
  /^(\.claude\/(skills|agents|rules)\/[A-Za-z0-9][A-Za-z0-9/_.-]*|\.factory\/config\.json)$/;

const proposalSchema = z.object({
  file: z
    .string()
    .refine(
      (f) => ALLOWED.test(f) && !f.includes(".."),
      "retro may only touch skills, agents, rules or config",
    ),
  change: z.string().min(1),
  why: z.string().min(1),
});
export type Proposal = z.infer<typeof proposalSchema>;

// The stage ends with `PROPOSAL: {json}` or `PROPOSAL: none`. More than one line is more than one change.
export function parseProposal(text: string): Proposal | "none" | { error: string } {
  const lines = [...text.matchAll(/^PROPOSAL:\s*(.+)$/gim)].map((m) => (m[1] ?? "").trim());
  if (lines.length !== 1)
    return { error: `expected exactly one PROPOSAL line, got ${lines.length}` };
  if (lines[0]?.toLowerCase() === "none") return "none";
  try {
    const parsed = proposalSchema.safeParse(JSON.parse(lines[0] ?? ""));
    return parsed.success ? parsed.data : { error: parsed.error.issues[0]?.message ?? "invalid" };
  } catch {
    return { error: "PROPOSAL is not valid JSON" };
  }
}
