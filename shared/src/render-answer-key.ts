import { escapeHtml } from "./escape-html";
import type { Worksheet } from "./schema";

// No items means no key: an empty page break would print a blank sheet.
export const renderAnswerKey = (sheet: Worksheet) => {
  const items = sheet.sections.flatMap((section) => section.items ?? []);
  if (items.length === 0) return "";
  return `<section class="key"><h2>Answer key</h2><ol>${items
    .map((item, index) => `<li value="${index + 1}">${escapeHtml(item.answer)}</li>`)
    .join("")}</ol></section>`;
};
