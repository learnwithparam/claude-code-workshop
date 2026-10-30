import { z } from "zod";

export const ACTIVITY_KINDS = [
  "count",
  "match",
  "circle",
  "fill-blank",
  "trace",
  "number-line",
  "ten-frame",
  "fraction-bar",
  "table",
  "steps",
  "short",
] as const;
export const activityKindSchema = z.enum(ACTIVITY_KINDS);
export type ActivityKind = z.infer<typeof activityKindSchema>;

const text = z.string().min(1);

// Caps keep a page drawable: the code lays out every mark, tick and cell the model asks for.
const numberLineItem = z
  .object({ start: z.number(), end: z.number(), step: z.number().positive() })
  .refine((n) => n.end > n.start && (n.end - n.start) / n.step <= 40, {
    message: "number-line needs end above start and at most 40 steps",
  });

const fractionItem = z
  .object({
    numerator: z.number().int().min(0),
    denominator: z.number().int().min(1).max(12),
  })
  .refine((f) => f.numerator <= f.denominator, { message: "numerator exceeds denominator" });

export const activitySchema = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("count"),
      items: z.array(z.object({ object: text, count: z.number().int().min(1).max(20) })).min(1),
    }),
    z.object({
      kind: z.literal("match"),
      items: z.array(z.object({ left: text, right: text })).min(1),
    }),
    z.object({
      kind: z.literal("circle"),
      prompt: text,
      items: z.array(z.object({ label: text })).min(1),
    }),
    z.object({
      kind: z.literal("fill-blank"),
      items: z.array(z.object({ sentence: text })).min(1),
    }),
    z.object({ kind: z.literal("trace"), items: z.array(z.object({ text })).min(1) }),
    z.object({ kind: z.literal("number-line"), items: z.array(numberLineItem).min(1) }),
    z.object({
      kind: z.literal("ten-frame"),
      items: z.array(z.object({ value: z.number().int().min(0).max(10) })).min(1),
    }),
    z.object({ kind: z.literal("fraction-bar"), items: z.array(fractionItem).min(1) }),
    z.object({
      kind: z.literal("table"),
      headers: z.array(text).min(1),
      items: z.array(z.object({ cells: z.array(z.string()).min(1) })).min(1),
    }),
    z.object({ kind: z.literal("steps"), items: z.array(z.object({ text })).min(1) }),
    z.object({
      kind: z.literal("short"),
      items: z.array(z.object({ question: text })).min(1),
    }),
  ])
  .refine(
    (a) => a.kind !== "table" || a.items.every((row) => row.cells.length === a.headers.length),
    { message: "every table row needs one cell per header" },
  );

export type Activity = z.infer<typeof activitySchema>;
