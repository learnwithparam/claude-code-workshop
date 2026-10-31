import { checkBand, type Template, type Worksheet } from "@workshop/shared";
import { normalisePrompt } from "../cache/prompt-cache.ts";

export type Distilled = { ok: true; template: Template } | { ok: false; problems: string[] };

// Keeps structure, drops item text. A sheet that fails the shared check never becomes a template.
export function distillTemplate(sheet: Worksheet, prompt = ""): Distilled {
  const verdict = checkBand(sheet);
  if (!verdict.ok) return { ok: false, problems: verdict.problems };
  const slots: string[] = [];
  const sections = sheet.sections.map(({ heading, instruction, items, activity }) => {
    if (!items) return { heading, instruction, activity };
    for (const _ of items) slots.push(`slot-${slots.length + 1}`);
    return { heading, instruction, pictures: items.map((item) => item.picture) };
  });
  const topic = normalisePrompt(prompt).split(" ").filter(Boolean);
  return {
    ok: true,
    template: {
      band: sheet.band,
      title: sheet.title,
      subject: sheet.subject,
      topic,
      slots,
      sections,
    },
  };
}
