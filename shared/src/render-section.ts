import { escapeHtml } from "./escape-html";
import { renderItem } from "./render-item";
import type { Section } from "./schema";

export const renderSection = (section: Section, pictureBoxes: boolean) =>
  `<section><h2>${escapeHtml(section.heading)}</h2><p class="instruction">${escapeHtml(section.instruction)}</p><ol>${section.items
    .map((item, index) => renderItem(item, index, pictureBoxes))
    .join("")}</ol></section>`;
