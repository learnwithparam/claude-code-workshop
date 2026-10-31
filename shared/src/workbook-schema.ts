import { z } from "zod";
import { bandIdSchema } from "./bands";
import { itemSchema } from "./schema";

export const chapterSchema = z.object({
  title: z.string().min(1),
  items: z.array(itemSchema).min(1),
});

// The only thing the model writes for a workbook. Contents, answer key and pages come from code.
export const workbookContentSchema = z.object({
  title: z.string().min(1),
  band: bandIdSchema,
  subject: z.string().min(1),
  cover: z.object({ title: z.string().min(1), subtitle: z.string().min(1) }),
  chapters: z.array(chapterSchema).min(1),
});

export const answerKeyEntrySchema = z.object({
  chapter: z.number().int().nonnegative(),
  item: z.number().int().nonnegative(),
  answer: z.string().min(1),
});

export const workbookSchema = workbookContentSchema.extend({
  contents: z.array(z.object({ title: z.string().min(1) })).min(1),
  answerKey: z.array(answerKeyEntrySchema).min(1),
});

export type Chapter = z.infer<typeof chapterSchema>;
export type WorkbookContent = z.infer<typeof workbookContentSchema>;
export type Workbook = z.infer<typeof workbookSchema>;

export function buildWorkbook(content: WorkbookContent): Workbook {
  return {
    ...content,
    contents: content.chapters.map((chapter) => ({ title: chapter.title })),
    answerKey: content.chapters.flatMap((chapter, c) =>
      chapter.items.map((item, i) => ({ chapter: c, item: i, answer: item.answer })),
    ),
  };
}
