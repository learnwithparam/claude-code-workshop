import { BANDS } from "./bands";
import { escapeHtml } from "./escape-html";
import { GEIST_FONT_FACE } from "./geist-font-face";
import { ACTIVITY_CSS } from "./render-activity";
import { renderAnswerKey } from "./render-answer-key";
import { ART_HEIGHT, renderHeaderArt } from "./render-header-art";
import { layoutCss } from "./render-layout-css";
import { renderSection } from "./render-section";
import type { Worksheet } from "./schema";

// Worksheet JSON in, HyperFrames still composition out. No model writes markup.
export function renderWorksheet(sheet: Worksheet): string {
  const band = BANDS[sheet.band];
  const { theme } = band;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(sheet.title)}</title>
<style>
  ${GEIST_FONT_FACE}
  #worksheet { width: 816px; box-sizing: border-box; padding: 40px 64px 56px; background: ${theme.paper}; color: ${theme.ink}; font-family: "Geist", "${band.font}", sans-serif; font-size: ${band.fontPx}px; line-height: 1.45; }
  #worksheet .art { display: block; width: 100%; height: ${ART_HEIGHT}px; margin: 0 0 12px; overflow: hidden; border-bottom: 2px solid ${theme.rule}; }
  #worksheet h1 { overflow-wrap: anywhere; border-left: 8px solid ${theme.accent}; padding-left: 12px; font-size: ${Math.round(band.fontPx * 1.6)}px; margin: 0 0 4px; }
  #worksheet .meta { color: ${theme.muted}; font-size: ${Math.max(12, Math.round(band.fontPx * 0.6))}px; margin: 0 0 20px; }
  #worksheet h2 { font-size: ${Math.round(band.fontPx * 1.15)}px; margin: 18px 0 4px; }
  #worksheet .instruction { margin: 0 0 10px; color: ${theme.muted}; }
  #worksheet ol { margin: 0; padding-left: 1.6em; }
  #worksheet li { margin-bottom: 0.5em; }
  #worksheet .picture { display: inline-block; vertical-align: middle; min-width: 3.2em; border: 2px dashed ${theme.rule}; border-radius: 8px; margin-right: 0.6em; padding: 0.2em 0.4em; text-align: center; }
  /* The icon is smaller than the old 3.2em box height: four rows at 30px type must still fit one Letter page. */
  #worksheet .picture svg { display: block; width: 2.2em; height: 2.2em; max-width: 100%; margin: 0 auto; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  #worksheet .line { display: inline-block; min-width: 4em; border-bottom: 2px solid ${theme.ink}; margin-left: 0.6em; }
  #worksheet .key { margin-top: 16px; border-top: 1px solid ${theme.rule}; font-size: ${Math.min(band.fontPx, 16)}px; }
  #worksheet .key h2 { font-size: ${Math.min(band.fontPx, 16)}px; margin: 8px 0 2px; }
  #worksheet .key li { margin-bottom: 0.15em; }
  ${layoutCss(band)}${sheet.sections.some((section) => section.activity) ? ACTIVITY_CSS : ""}
</style>
</head>
<body>
<div id="worksheet" data-composition-id="worksheet" data-start="0" data-duration="1" data-width="816" data-height="1056" data-no-timeline>
${renderHeaderArt(theme)}
<h1>${escapeHtml(sheet.title)}</h1>
<p class="meta">${escapeHtml(band.label)} &middot; ${escapeHtml(sheet.subject)} &middot; Name: ____________</p>
${sheet.sections.map((section) => renderSection(section, band)).join("\n")}
${renderAnswerKey(sheet)}
</div>
</body>
</html>
`;
}
