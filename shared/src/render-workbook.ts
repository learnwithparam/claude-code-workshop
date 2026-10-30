import { BANDS } from "./bands";
import { escapeHtml } from "./escape-html";
import { GEIST_FONT_FACE } from "./geist-font-face";
import { ART_HEIGHT, renderHeaderArt } from "./render-header-art";
import { renderItem } from "./render-item";
import { type PlannedPage, planWorkbook } from "./workbook-plan";
import type { Workbook } from "./workbook-schema";

const PAGE_HEIGHT = 1056;

// Workbook JSON in, print-ready HTML out. One .workbook-page per planned page, so the PDF count matches the plan.
export function renderWorkbook(wb: Workbook): string {
  const band = BANDS[wb.band];
  const { theme } = band;
  const plan = planWorkbook(wb);

  const firstOnChapter = new Map<number, number>();
  const startOf = (page: Extract<PlannedPage, { kind: "chapter" }>) => {
    const start = firstOnChapter.get(page.chapter) ?? 0;
    firstOnChapter.set(page.chapter, start + page.items.length);
    return start;
  };

  const body = (page: PlannedPage): string => {
    if (page.kind === "cover") {
      return `${renderHeaderArt(theme)}<h1>${escapeHtml(wb.cover.title)}</h1><p class="meta">${escapeHtml(wb.cover.subtitle)} &middot; ${escapeHtml(band.label)} &middot; ${escapeHtml(wb.subject)}</p>`;
    }
    if (page.kind === "contents") {
      const rows = plan.contents
        .map((c) => `<tr><td>${escapeHtml(c.title)}</td><td class="num">${c.page}</td></tr>`)
        .join("");
      return `<h2>Contents</h2><table class="contents">${rows}</table>`;
    }
    if (page.kind === "chapter") {
      const start = startOf(page);
      const title = wb.chapters[page.chapter]?.title ?? "";
      const items = page.items.map((item, i) => renderItem(item, start + i, band.pictureBoxes));
      return `<h2>${escapeHtml(title)}</h2><ol>${items.join("")}</ol>`;
    }
    const entries = page.entries
      .map((e) => `<li>Chapter ${e.chapter + 1}, item ${e.item + 1}: ${escapeHtml(e.answer)}</li>`)
      .join("");
    return `<h2>Answer key</h2><ul class="key-list">${entries}</ul>`;
  };

  const pages = plan.pages
    .map(
      (page) =>
        `<section class="workbook-page" data-page-kind="${page.kind}" data-page="${page.number}">${body(page)}<p class="folio">${page.number}</p></section>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(wb.title)}</title>
<style>
  ${GEIST_FONT_FACE}
  @page { size: 816px ${PAGE_HEIGHT}px; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: ${theme.paper}; color: ${theme.ink}; font-family: "Geist", "${band.font}", sans-serif; font-size: ${band.fontPx}px; line-height: 1.45; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  /* A fixed sheet: pagination is the plan's job, so a page that overflowed would add a PDF page the plan never counted. */
  .workbook-page { position: relative; width: 816px; height: ${PAGE_HEIGHT}px; padding: 40px 64px 56px; overflow: hidden; background: ${theme.paper}; }
  .workbook-page + .workbook-page { break-before: page; page-break-before: always; }
  .workbook-page .art { display: block; width: 100%; height: ${ART_HEIGHT}px; margin: 0 0 12px; overflow: hidden; border-bottom: 2px solid ${theme.rule}; }
  h1 { overflow-wrap: anywhere; border-left: 8px solid ${theme.accent}; padding-left: 12px; font-size: ${Math.round(band.fontPx * 1.6)}px; margin: 0 0 4px; }
  h2 { font-size: ${Math.round(band.fontPx * 1.15)}px; margin: 0 0 12px; }
  .meta { color: ${theme.muted}; font-size: ${Math.max(12, Math.round(band.fontPx * 0.6))}px; }
  ol { margin: 0; padding-left: 1.6em; }
  li { margin-bottom: 0.5em; }
  .picture { display: inline-block; vertical-align: middle; min-width: 3.2em; border: 2px dashed ${theme.rule}; border-radius: 8px; margin-right: 0.6em; padding: 0.2em 0.4em; text-align: center; }
  .picture svg { display: block; width: 2.2em; height: 2.2em; max-width: 100%; margin: 0 auto; }
  .line { display: inline-block; min-width: 4em; border-bottom: 2px solid ${theme.ink}; margin-left: 0.6em; }
  table.contents { width: 100%; border-collapse: collapse; }
  table.contents td { padding: 6px 0; border-bottom: 1px solid ${theme.rule}; }
  table.contents td.num { text-align: right; width: 4em; }
  .key-list { margin: 0; padding: 0; list-style: none; font-size: ${Math.min(band.fontPx, 16)}px; }
  .folio { position: absolute; bottom: 20px; left: 0; right: 0; margin: 0; text-align: center; color: ${theme.muted}; font-size: 14px; }
</style>
</head>
<body>
${pages}
</body>
</html>
`;
}
