import { z } from "zod";
import { bandIdSchema } from "./bands";

export const itemSchema = z.object({
  prompt: z.string().min(1),
  answer: z.string().min(1),
  picture: z.string().optional(),
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
