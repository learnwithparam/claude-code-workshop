import { escapeHtml } from "./escape-html";
import type { Worksheet } from "./schema";

export const renderAnswerKey = (sheet: Worksheet) =>
  `<section class="key"><h2>Answer key</h2><ol>${sheet.sections
    .flatMap((section) => section.items)
    .map((item, index) => `<li value="${index + 1}">${escapeHtml(item.answer)}</li>`)
    .join("")}</ol></section>`;
