import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

// Teaching order: a learner who finishes one lane is ready for the next.
export const LANES = ["start", "daily", "team", "factory", "advanced"] as const;
export type Lane = (typeof LANES)[number];

// How much the brief gives away: every command, the goal with hints on request, or the goal alone.
export const HELP = ["guided", "hinted", "goal"] as const;
export type Help = (typeof HELP)[number];

// One workshop, one path. The lanes match the lists in docs/labs/README.md (a test checks).
export const PATHS = {
  pro: ["start", "daily", "team", "advanced"],
  factory: ["start", "daily", "factory"],
} as const satisfies Record<string, readonly Lane[]>;
export type PathId = keyof typeof PATHS;
export const PATH_IDS = Object.keys(PATHS) as PathId[];

const oneLine = z
  .string()
  .min(1)
  .max(240)
  .regex(/^[^\n]+$/, "must be one line");

// One question and the reason behind its answer, so a learner commits to a guess before running.
const predictSchema = z.object({ question: oneLine, answer: z.string().min(1).max(400) });

const proofItem = z.object({ text: oneLine, command: z.string().min(1) });
export type ProofItem = z.infer<typeof proofItem>;

export const labSchema = z.object({
  id: z.string().regex(/^[a-z]+-\d{2}$/),
  lane: z.enum(LANES),
  title: oneLine,
  pairs: z.string().min(1),
  help: z.enum(HELP),
  goal: oneLine,
  predict: predictSchema,
  steps: z.array(z.string().min(1)).min(1),
  // Each item says one thing that must be true and checks only that, so a red item names the missing part.
  proof: z.array(proofItem).min(1),
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

// "Question?" then a line "Answer: reason". A missing Answer line leaves the answer empty and fails the schema.
function predictOf(body: string): { question: string; answer: string } {
  const at = body.search(/^Answer:/m);
  if (at < 0) return { question: body.trim().replace(/\s*\n\s*/g, " "), answer: "" };
  return {
    question: body
      .slice(0, at)
      .trim()
      .replace(/\s*\n\s*/g, " "),
    answer: body
      .slice(at + "Answer:".length)
      .trim()
      .replace(/\s*\n\s*/g, " "),
  };
}

// "1. Sentence." then an indented sh block. A missing block gives an empty command, which zod rejects.
function proofOf(body: string): ProofItem[] {
  return listItems(body).map((item) => {
    const [first = "", ...rest] = item.split(/\n\s*```sh\n/);
    const block = rest.join("").split(/\n\s*```/)[0] ?? "";
    const command = block
      .split("\n")
      .map((line) => line.replace(/^ {3}/, ""))
      .join("\n")
      .trim();
    return { text: first.trim(), command };
  });
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
    predict: predictOf(parts.get("predict") ?? ""),
    steps: listItems(parts.get("steps") ?? ""),
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
