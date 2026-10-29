import { BANDS } from "./bands";
import type { Worksheet } from "./schema";

export type BandCheck = { ok: boolean; problems: string[] };

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

// Deterministic compliance check: the proof asserts this, never a model's opinion of itself.
export function checkBand(sheet: Worksheet): BandCheck {
  const band = BANDS[sheet.band];
  const problems: string[] = [];
  const items = sheet.sections.flatMap((section) => section.items ?? []);
  const activities = sheet.sections.flatMap((section) => section.activity ?? []);
  for (const activity of activities) {
    if (!band.kinds.includes(activity.kind)) {
      problems.push(`kind ${activity.kind} not allowed for ${band.id}`);
    }
  }
  const total = items.length + activities.reduce((sum, a) => sum + a.items.length, 0);
  if (total > band.maxItems) {
    problems.push(`${total} items, band allows ${band.maxItems}`);
  }
  for (const item of items) {
    const words = wordCount(item.prompt);
    if (words > band.maxWordsPerItem) {
      problems.push(
        `item "${item.prompt.slice(0, 24)}" has ${words} words, band allows ${band.maxWordsPerItem}`,
      );
    }
    if (band.pictureBoxes && !item.picture) {
      problems.push(`item "${item.prompt.slice(0, 24)}" needs a picture for ${band.label}`);
    }
  }
  return { ok: problems.length === 0, problems };
}
