import { z } from "zod";

// Constants, not model output: picking one only fills the input, so it never spends tokens.
export const examplePromptsSchema = z
  .array(z.string().trim().min(1).max(120))
  .min(4)
  .max(6)
  .refine((all) => new Set(all).size === all.length, "examples must be unique");

export const EXAMPLE_PROMPTS = examplePromptsSchema.parse([
  "A worksheet for a 4 year old learning the letter B",
  "Fractions practice for grade 4, with an answer key",
  "Ten spelling words for a 7 year old, with picture boxes",
  "A grade 6 worksheet on the water cycle",
  "Counting to 20 for a kindergartener",
]);
