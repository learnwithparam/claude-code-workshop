import { z } from "zod";
import type { BandId } from "./bands";
import { type Item, type Section, type Worksheet, worksheetSchema } from "./schema";

// A good sheet with its item text cut out. Layout and structure stay; one slot per item.
export type TemplateSection = {
  heading: string;
  instruction: string;
  pictures?: Array<Item["picture"]>;
  activity?: Section["activity"];
};

export type Template = {
  band: BandId;
  title: string;
  subject: string;
  // Words of the prompt that produced the sheet. A request matches when it contains all of them.
  topic: string[];
  slots: string[];
  sections: TemplateSection[];
};

export function fillSlotsSchema(template: Pick<Template, "slots">) {
  return z.object({ values: z.array(z.string().min(1)).length(template.slots.length) });
}

// A slot value is "prompt => answer". Without the arrow the whole value is both.
const SPLIT = " => ";

export function fillTemplate(template: Template, values: string[]): Worksheet {
  if (values.length !== template.slots.length) {
    throw new Error(`expected ${template.slots.length} slot values, got ${values.length}`);
  }
  let next = 0;
  const sections = template.sections.map((section) => {
    const { pictures, ...rest } = section;
    if (!pictures) return rest;
    const items = pictures.map((picture) => {
      const value = values[next++] ?? "";
      const at = value.indexOf(SPLIT);
      const prompt = at < 0 ? value : value.slice(0, at);
      const answer = at < 0 ? value : value.slice(at + SPLIT.length);
      return picture ? { prompt, answer, picture } : { prompt, answer };
    });
    return { ...rest, items };
  });
  return worksheetSchema.parse({
    title: template.title,
    band: template.band,
    subject: template.subject,
    sections,
  });
}
