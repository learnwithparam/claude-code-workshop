import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

// Teaching order: a learner who finishes one lane is ready for the next.
export const LANES = ["start", "daily", "team", "factory", "advanced"] as const;
export type Lane = (typeof LANES)[number];

// How much the brief gives away: every command, the goal with hints on request, or the goal alone.
export const HELP = ["guided", "hinted", "goal"] as const;
export type Help = (typeof HELP)[number];

const oneLine = z
  .string()
  .min(1)
  .max(240)
  .regex(/^[^\n]+$/, "must be one line");

// A step may carry an indented `Expect:` line: what the learner sees if it worked.
export const stepSchema = z.object({
  text: z.string().min(1),
  expect: z.string().min(1).optional(),
});
export type Step = z.infer<typeof stepSchema>;

export const labSchema = z.object({
  id: z.string().regex(/^[a-z]+-\d{2}$/),
  lane: z.enum(LANES),
  title: oneLine,
  pairs: z.string().min(1),
  help: z.enum(HELP),
  goal: oneLine,
  steps: z.array(stepSchema).min(1),
  proof: z.string().min(1),
  // Two or more, so the first nudges and the last gives the answer away.
  hints: z.array(z.string().min(1)).min(2),
  learned: oneLine,
});
export type Lab = z.infer<typeof labSchema>;

function sections(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of text.split(/^## /m).slice(1)) {
    const [heading = "", ...rest] = part.split("\n");
    map.set(heading.trim().toLowerCase(), rest.join("\n").trim());
  }
  return map;
}

// "1. text" starts an item; lines indented under it belong to it.
function listItems(body: string): string[] {
  const items: string[] = [];
  for (const line of body.split("\n")) {
    if (/^\d+\. /.test(line)) items.push(line.replace(/^\d+\. /, ""));
    else if (items.length > 0 && /^\s+\S/.test(line)) items[items.length - 1] += `\n${line}`;
  }
  return items;
}

function stepOf(item: string): Step {
  const [text = "", ...rest] = item.split(/\n\s+Expect: /);
  const expect = rest
    .join(" ")
    .replace(/\s*\n\s*/g, " ")
    .trim();
  return expect ? { text: text.trim(), expect } : { text: text.trim() };
}

function proofOf(body: string): string {
  return /```sh\n([\s\S]*?)\n```/.exec(body)?.[1]?.trim() ?? "";
}

export function parseLab(lane: string, file: string, text: string): Lab {
  const number = /^(\d{2})-[a-z0-9]+(-[a-z0-9]+)*\.md$/.exec(file)?.[1];
  if (!number) throw new Error(`${lane}/${file}: file name must be NN-kebab-case.md`);
  const parts = sections(text);
  return labSchema.parse({
    id: `${lane}-${number}`,
    lane,
    title: /^# (.+)$/m.exec(text)?.[1],
    pairs: /^\*\*Pairs with:\*\* `([^`]+)`/m.exec(text)?.[1],
    help: /^\*\*Help:\*\* (\w+)\s*$/m.exec(text)?.[1],
    goal: parts.get("goal"),
    steps: listItems(parts.get("steps") ?? "").map(stepOf),
    proof: proofOf(parts.get("proof") ?? ""),
    hints: listItems(parts.get("hints") ?? ""),
    learned: parts.get("what you just learned"),
  });
}

export function loadLabs(root: string): Lab[] {
  return LANES.flatMap((lane) =>
    readdirSync(join(root, lane))
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => parseLab(lane, f, readFileSync(join(root, lane, f), "utf8"))),
  );
}
