import type { Band } from "./bands";
import type { Item } from "./schema";

const MIN_GRID_ITEMS = 4;
// Two columns are ~300px wide, so a prompt must be short whatever the band allows.
const MAX_GRID_WORDS = 8;

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

// Layout is decided here from section data, never by the model. Picture bands use large type and stay single column.
export const useGrid = (items: Item[], band: Band) =>
  !band.pictureBoxes &&
  items.length >= MIN_GRID_ITEMS &&
  items.every((item) => words(item.prompt) <= Math.min(MAX_GRID_WORDS, band.maxWordsPerItem));

// Height is a minimum: a fixed height with overflow hidden would clip a multi-page sheet.
export const layoutCss = (band: Band) => {
  const { theme } = band;
  return `#worksheet { min-height: 1056px; }
  #worksheet section.card { margin: 14px 0; padding: 4px 16px 10px; border: 1px solid ${theme.rule}; border-left: 6px solid ${theme.accent}; border-radius: 10px; }
  #worksheet section.card h2 { margin: 10px 0 4px; break-after: avoid; break-inside: avoid; }
  #worksheet section.card .instruction { break-after: avoid; }
  #worksheet :is(section.card, section.key) li { break-inside: avoid; }
  #worksheet ol.grid { column-count: 2; column-gap: 32px; }
  #worksheet .key { break-before: page; page-break-before: always; }
  #worksheet section.key h2 { break-after: avoid; }
  @media print { #worksheet { min-height: 0; } }`;
};
