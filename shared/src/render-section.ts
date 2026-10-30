import { escapeHtml } from "./escape-html";
import { renderActivity } from "./render-activity";
import { renderItem } from "./render-item";
import type { Section } from "./schema";

export const renderSection = (section: Section, pictureBoxes: boolean, fontPx: number) => {
  const body = section.activity
    ? renderActivity(section.activity, fontPx)
    : `<ol>${(section.items ?? []).map((item, index) => renderItem(item, index, pictureBoxes)).join("")}</ol>`;
  return `<section><h2>${escapeHtml(section.heading)}</h2><p class="instruction">${escapeHtml(section.instruction)}</p>${body}</section>`;
};
