import { BANDS } from "./bands";
import type { Item, Section, Worksheet } from "./schema";

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const renderItem = (item: Item, index: number, pictureBoxes: boolean) => {
  const picture = pictureBoxes
    ? `<div class="picture">${escapeHtml(item.picture ?? "")}</div>`
    : "";
  return `<li value="${index + 1}">${picture}<span class="prompt">${escapeHtml(item.prompt)}</span><span class="line"></span></li>`;
};

const renderSection = (section: Section, pictureBoxes: boolean) =>
  `<section><h2>${escapeHtml(section.heading)}</h2><p class="instruction">${escapeHtml(section.instruction)}</p><ol>${section.items
    .map((item, index) => renderItem(item, index, pictureBoxes))
    .join("")}</ol></section>`;

const renderAnswerKey = (sheet: Worksheet) =>
  `<section class="key"><h2>Answer key</h2><ol>${sheet.sections
    .flatMap((section) => section.items)
    .map((item, index) => `<li value="${index + 1}">${escapeHtml(item.answer)}</li>`)
    .join("")}</ol></section>`;

// Worksheet JSON in, HyperFrames still composition out. No model writes markup.
export function renderWorksheet(sheet: Worksheet): string {
  const band = BANDS[sheet.band];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(sheet.title)}</title>
<style>
  #worksheet { width: 816px; height: 1056px; box-sizing: border-box; padding: 56px 64px; background: #fff; color: #171717; font-family: "${band.font}", sans-serif; font-size: ${band.fontPx}px; line-height: 1.45; overflow: hidden; }
  #worksheet h1 { font-size: ${Math.round(band.fontPx * 1.6)}px; margin: 0 0 4px; }
  #worksheet .meta { color: #5c5c5c; font-size: ${Math.max(12, Math.round(band.fontPx * 0.6))}px; margin: 0 0 20px; }
  #worksheet h2 { font-size: ${Math.round(band.fontPx * 1.15)}px; margin: 18px 0 4px; }
  #worksheet .instruction { margin: 0 0 10px; color: #5c5c5c; }
  #worksheet ol { margin: 0; padding-left: 1.6em; }
  #worksheet li { margin-bottom: 0.5em; }
  #worksheet .picture { display: inline-block; min-width: 3.2em; min-height: 3.2em; border: 2px dashed #bdbdbd; border-radius: 8px; margin-right: 0.6em; padding: 0.2em 0.4em; text-align: center; }
  #worksheet .line { display: inline-block; min-width: 4em; border-bottom: 2px solid #171717; margin-left: 0.6em; }
  #worksheet .key { margin-top: 16px; border-top: 1px solid #d4d4d4; font-size: ${Math.min(band.fontPx, 16)}px; }
  #worksheet .key h2 { font-size: ${Math.min(band.fontPx, 16)}px; margin: 8px 0 2px; }
  #worksheet .key li { margin-bottom: 0.15em; }
</style>
</head>
<body>
<div id="worksheet" data-composition-id="worksheet" data-start="0" data-duration="1" data-width="816" data-height="1056" data-no-timeline>
<h1>${escapeHtml(sheet.title)}</h1>
<p class="meta">${escapeHtml(band.label)} &middot; ${escapeHtml(sheet.subject)} &middot; Name: ____________</p>
${sheet.sections.map((section) => renderSection(section, band.pictureBoxes)).join("\n")}
${renderAnswerKey(sheet)}
</div>
</body>
</html>
`;
}
