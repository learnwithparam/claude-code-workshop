import { z } from "zod";

const section = z.string().trim().min(1);
const adrSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: section,
  context: section,
  decision: section,
  consequences: section,
});
export type Adr = z.infer<typeof adrSchema>;

export const ADR_PATH = /^docs\/adr\/\d{4}-[a-z0-9-]+\.md$/;

// The stage ends with `CRITICALITY: C1|C2|C3`, and for C2 and C3 an `ADR: {json}` line.
// C1 (a bug fix, a copy change) needs no record. Anything unparseable is an error, never a skip.
export function parseAdr(text: string): Adr | "none" | { error: string } {
  const level = /^CRITICALITY:\s*(C[123])\b/im.exec(text)?.[1]?.toUpperCase();
  if (!level) return { error: "no CRITICALITY line" };
  if (level === "C1") return "none";
  const line = /^ADR:\s*(\{.*\})\s*$/im.exec(text)?.[1];
  if (!line) return { error: `${level} needs an ADR line` };
  try {
    const parsed = adrSchema.safeParse(JSON.parse(line));
    return parsed.success
      ? parsed.data
      : { error: "ADR needs a slug, title, context, decision and consequences" };
  } catch {
    return { error: "ADR is not valid JSON" };
  }
}

// Highest existing number plus one, from file names like docs/adr/0003-x.md.
export function nextAdrFile(existing: string[], slug: string): string {
  const numbers = existing.map((f) => Number(/(\d{4})-/.exec(f)?.[1] ?? 0));
  const next = String(Math.max(0, ...numbers) + 1).padStart(4, "0");
  return `docs/adr/${next}-${slug}.md`;
}

export function renderAdr(adr: Adr, level: string): string {
  return `# ${adr.title}\n\nCriticality: ${level}\n\n## Context\n\n${adr.context}\n\n## Decision\n\n${adr.decision}\n\n## Consequences\n\n${adr.consequences}\n`;
}
