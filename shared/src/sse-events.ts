import { z } from "zod";
import { worksheetSchema } from "./schema";

export const usageSchema = z.object({
  input: z.number(),
  cacheRead: z.number(),
  cacheWrite: z.number(),
  output: z.number(),
  costUsd: z.number(),
});

// One schema per event name the api writes. The web parses with this, so a changed shape stops
// at the client boundary instead of reaching the page half-formed.
export const eventSchemas = {
  question: z.object({ text: z.string() }),
  worksheet: z.object({ sheet: worksheetSchema, html: z.string(), sheetId: z.string().optional() }),
  usage: usageSchema,
  error: z.object({ message: z.string() }),
} as const;

export type Usage = z.infer<typeof usageSchema>;
export type ChatEvent = {
  [K in keyof typeof eventSchemas]: { event: K; data: z.infer<(typeof eventSchemas)[K]> };
}[keyof typeof eventSchemas];
