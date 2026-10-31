import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

// Teaching order: a learner who finishes one lane is ready for the next.
export const LANES = ["start", "daily", "team", "factory", "advanced"] as const;
export type Lane = (typeof LANES)[number];

const oneLine = z
  .string()
  .min(1)
  .max(240)
  .regex(/^[^\n]+$/, "must be one line");

// Where a step is typed. A learner keeps Claude Code and a shell side by side; an untagged step is a shell step.
export const WINDOWS = ["shell", "claude", "editor"] as const;
export type Window = (typeof WINDOWS)[number];
export const stepSchema = z.object({ where: z.enum(WINDOWS), text: z.string().min(1) });
export type Step = z.infer<typeof stepSchema>;

export const labSchema = z.object({
  id: z.string().regex(/^[a-z]+-\d{2}$/),
  lane: z.enum(LANES),
  title: oneLine,
  pairs: z.string().min(1),
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

export function parseStep(raw: string): Step {
  const tag = /^\[([a-z]+)\] ?/.exec(raw);
  if (!tag) return { where: "shell", text: raw };
  const where = WINDOWS.find((w) => w === tag[1]);
  if (!where) throw new Error(`unknown window tag [${tag[1]}], use ${WINDOWS.join(", ")}`);
  return { where, text: raw.slice(tag[0].length) };
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
    goal: parts.get("goal"),
    steps: listItems(parts.get("steps") ?? "").map(parseStep),
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
