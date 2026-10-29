import { escapeHtml } from "./escape-html";
import type { Item } from "./schema";

export const renderItem = (item: Item, index: number, pictureBoxes: boolean) => {
  const picture = pictureBoxes
    ? `<div class="picture">${escapeHtml(item.picture ?? "")}</div>`
    : "";
  return `<li value="${index + 1}">${picture}<span class="prompt">${escapeHtml(item.prompt)}</span><span class="line"></span></li>`;
};
