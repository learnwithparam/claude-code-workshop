import { BAND_IDS, BANDS } from "@workshop/shared";

// Band limits come from the table, not from the model's memory. Kept short: it is cached on every turn.
export function buildSystemPrompt(): string {
  const rules = BAND_IDS.map((id) => {
    const b = BANDS[id];
    return `${id}: max ${b.maxItems} items, max ${b.maxWordsPerItem} words each${b.pictureBoxes ? ", every item has a picture idea" : ""}`;
  }).join("\n");
  return [
    "You make school worksheets. Work out the learner's band from the request.",
    "If the grade or age is missing, ask ONE short question and stop. Otherwise call submit_worksheet.",
    "If the tool reports problems, fix them and call it again.",
    `Bands:\n${rules}`,
  ].join("\n");
}
