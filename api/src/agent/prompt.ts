import { BAND_IDS, BANDS, ICON_IDS } from "@workshop/shared";

// Band limits come from the table, not from the model's memory. Kept short: it is cached on every turn.
export function buildSystemPrompt(): string {
  const rules = BAND_IDS.map((id) => {
    const b = BANDS[id];
    return `${id}: max ${b.maxItems} items, max ${b.maxWordsPerItem} words each${b.pictureBoxes ? ", every item has a picture" : ""}, activity kinds: ${b.kinds.join("/")}`;
  }).join("\n");
  return [
    "You make school worksheets. Work out the learner's band from the request.",
    "If the grade or age is missing, ask ONE short question and stop. Otherwise call submit_worksheet.",
    "Default to 6 items and short answers unless the user asks for more; the limits below are ceilings.",
    "A section may carry an activity (kind plus content) instead of items; code draws it, so only name a kind the band allows.",
    "If the tool reports problems, fix them and call it again.",
    `A picture is one icon id, nothing else. Ids: ${ICON_IDS.join(", ")}. Pick the closest one.`,
    `Bands:\n${rules}`,
  ].join("\n");
}

export function buildWorkbookPrompt(): string {
  return [
    "You turn one finished worksheet into a workbook: a cover and several chapters.",
    "Group the worksheet's items into chapters by topic and write more items in the same style so each chapter is worth a chapter.",
    "Keep the worksheet's band exactly. Never repeat a prompt. Give every item a short answer.",
    "You write content only. Pages, contents and the answer key are made by code. Call submit_workbook.",
    "If the tool reports problems, fix them and call it again.",
    `A picture is one icon id, nothing else. Ids: ${ICON_IDS.join(", ")}.`,
  ].join("\n");
}
