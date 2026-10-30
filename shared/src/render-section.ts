import type { Band } from "./bands";
import { escapeHtml } from "./escape-html";
import { renderActivity } from "./render-activity";
import { renderItem } from "./render-item";
import { useGrid } from "./render-layout-css";
import type { Section } from "./schema";

export const renderSection = (section: Section, band: Band) => {
  const items = section.items ?? [];
  const body = section.activity
    ? renderActivity(section.activity, band.fontPx)
    : `<ol${useGrid(items, band) ? ' class="grid"' : ""}>${items.map((item, index) => renderItem(item, index, band.pictureBoxes)).join("")}</ol>`;
  return `<section class="card"><h2>${escapeHtml(section.heading)}</h2><p class="instruction">${escapeHtml(section.instruction)}</p>${body}</section>`;
};
