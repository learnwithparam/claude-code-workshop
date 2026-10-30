import { BANDS } from "./bands";
import { planWorkbook } from "./workbook-plan";
import type { Workbook } from "./workbook-schema";

export type WorkbookCheck = { ok: boolean; problems: string[] };

// Deterministic, like checkBand: the proof asserts this, never a model's opinion of itself.
export function checkWorkbook(wb: Workbook): WorkbookCheck {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const [c, chapter] of wb.chapters.entries()) {
    for (const item of chapter.items) {
      if (seen.has(item.prompt)) problems.push(`item "${item.prompt.slice(0, 24)}" appears twice`);
      seen.add(item.prompt);
    }
    if (chapter.items.length === 0) problems.push(`chapter ${c} has no items`);
  }

  const wanted = new Set(wb.chapters.flatMap((ch, c) => ch.items.map((_, i) => `${c}.${i}`)));
  const keyed = new Set<string>();
  for (const entry of wb.answerKey) {
    const id = `${entry.chapter}.${entry.item}`;
    if (!wanted.has(id)) problems.push(`answer key entry ${id} has no item`);
    if (keyed.has(id)) problems.push(`answer key entry ${id} appears twice`);
    keyed.add(id);
  }
  for (const id of wanted) if (!keyed.has(id)) problems.push(`item ${id} has no answer key entry`);

  const max = BANDS[wb.band].maxItemsPerPage;
  for (const page of planWorkbook(wb).pages) {
    const count =
      page.kind === "chapter"
        ? page.items.length
        : page.kind === "answer-key"
          ? page.entries.length
          : 0;
    if (count > max) problems.push(`page ${page.number} has ${count} items, band allows ${max}`);
  }
  return { ok: problems.length === 0, problems };
}
