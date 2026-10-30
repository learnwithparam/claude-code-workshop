import { z } from "zod";
import { iconIdSchema } from "./art/icon-ids";
import { bandIdSchema } from "./bands";

export const itemSchema = z.object({
  prompt: z.string().min(1),
  answer: z.string().min(1),
  // An id from the fixed icon set. Never free text or markup, so the renderer only injects registry SVG.
  picture: iconIdSchema.optional(),
});

export const sectionSchema = z.object({
  heading: z.string().min(1),
  instruction: z.string().min(1),
  items: z.array(itemSchema).min(1),
});

// The only thing the model writes. Layout, fonts and limits come from the band table.
export const worksheetSchema = z.object({
  title: z.string().min(1),
  band: bandIdSchema,
  subject: z.string().min(1),
  sections: z.array(sectionSchema).min(1),
});

export type Item = z.infer<typeof itemSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Worksheet = z.infer<typeof worksheetSchema>;
