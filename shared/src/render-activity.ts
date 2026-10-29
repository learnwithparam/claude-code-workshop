import type { Activity } from "./activity-kinds";
import { escapeHtml } from "./escape-html";

const e = escapeHtml;
const lines = (n: number, cls: string) => `<span class="${cls}"></span>`.repeat(n);
const frame = (index: number, cls: string, inner: string) =>
  `<div class="${cls}" data-item="${index}">${inner}</div>`;
const each = <T>(items: T[], draw: (item: T, index: number) => string) => items.map(draw).join("");

const numberLine = (start: number, end: number, step: number) => {
  const count = Math.floor((end - start) / step + 1e-9) + 1;
  return Array.from({ length: count }, (_, i) => {
    const label = Number((start + i * step).toFixed(6));
    return `<span class="tick-cell"><span class="tick"></span><span class="tick-label">${label}</span></span>`;
  }).join("");
};

// Every kind marks each item with one data-item element, so "each item once" is countable.
export function renderActivity(activity: Activity, fontPx: number): string {
  switch (activity.kind) {
    case "count":
      return each(activity.items, (item, i) =>
        frame(
          i,
          "count-group",
          `<span class="label">${e(item.object)}</span><span class="marks">${lines(item.count, "mark")}</span>${lines(1, "line")}`,
        ),
      );
    case "match": {
      // Right column is rotated one place so the pairs are not already side by side.
      const rights = activity.items.map((_, i) => activity.items[(i + 1) % activity.items.length]);
      return `<div class="match"><div class="col">${each(activity.items, (item, i) =>
        frame(i, "entry", `<span class="dot"></span>${e(item.left)}`),
      )}</div><div class="col">${each(
        rights,
        (item) => `<div class="entry">${e(item?.right ?? "")}<span class="dot"></span></div>`,
      )}</div></div>`;
    }
    case "circle":
      return `<p class="circle-prompt">${e(activity.prompt)}</p><div class="choices">${each(
        activity.items,
        (item, i) => `<span class="circle-target" data-item="${i}">${e(item.label)}</span>`,
      )}</div>`;
    case "fill-blank":
      return each(activity.items, (item, i) =>
        frame(i, "sentence", item.sentence.split("___").map(e).join('<span class="blank"></span>')),
      );
    case "trace":
      return each(activity.items, (item, i) =>
        frame(
          i,
          "trace-row",
          `<span class="trace" style="font-size:${fontPx}px">${e(item.text)}</span>${lines(2, "practice-line")}`,
        ),
      );
    case "number-line":
      return each(activity.items, (item, i) =>
        frame(i, "number-line", numberLine(item.start, item.end, item.step)),
      );
    case "ten-frame":
      return each(activity.items, (item, i) =>
        frame(
          i,
          "ten-frame",
          Array.from(
            { length: 10 },
            (_, c) => `<span class="cell${c < item.value ? " filled" : ""}"></span>`,
          ).join(""),
        ),
      );
    case "fraction-bar":
      return each(activity.items, (item, i) =>
        frame(
          i,
          "fraction-bar",
          Array.from(
            { length: item.denominator },
            (_, p) => `<span class="part${p < item.numerator ? " shaded" : ""}"></span>`,
          ).join(""),
        ),
      );
    case "table":
      return `<table><thead><tr>${activity.headers
        .map((h) => `<th>${e(h)}</th>`)
        .join("")}</tr></thead><tbody>${each(
        activity.items,
        (row, i) =>
          `<tr data-item="${i}">${row.cells.map((c) => `<td>${e(c)}</td>`).join("")}</tr>`,
      )}</tbody></table>`;
    case "steps":
      return each(activity.items, (item, i) =>
        frame(i, "step", `<span class="num">${i + 1}.</span> ${e(item.text)}`),
      );
    case "short":
      return each(activity.items, (item, i) =>
        frame(i, "short", `<p>${e(item.question)}</p>${lines(3, "answer-line")}`),
      );
  }
}

export const ACTIVITY_CSS = `
  #worksheet .count-group, #worksheet .sentence, #worksheet .trace-row, #worksheet .number-line, #worksheet .ten-frame, #worksheet .fraction-bar, #worksheet .step, #worksheet .short { margin-bottom: 0.6em; }
  #worksheet .marks { margin-left: 0.6em; }
  #worksheet .mark { display: inline-block; width: 0.8em; height: 0.8em; border-radius: 50%; background: #171717; margin-right: 0.25em; }
  #worksheet .match { display: flex; justify-content: space-between; }
  #worksheet .match .col { width: 40%; }
  #worksheet .entry { margin-bottom: 0.6em; }
  #worksheet .dot { display: inline-block; width: 0.6em; height: 0.6em; border-radius: 50%; border: 2px solid #171717; margin: 0 0.5em; }
  #worksheet .choices { display: flex; gap: 0.8em; flex-wrap: wrap; }
  #worksheet .circle-target { border: 2px solid #171717; border-radius: 999px; padding: 0.2em 0.9em; }
  #worksheet .blank { display: inline-block; min-width: 4em; border-bottom: 2px solid #171717; margin: 0 0.3em; }
  #worksheet .trace { color: transparent; -webkit-text-stroke: 1px #171717; letter-spacing: 0.15em; }
  #worksheet .practice-line { display: block; height: 1.6em; border-bottom: 2px dotted #bdbdbd; }
  #worksheet .number-line { display: flex; border-top: 2px solid #171717; padding-top: 0.2em; }
  #worksheet .tick-cell { flex: 1; display: flex; flex-direction: column; align-items: flex-start; }
  #worksheet .tick { width: 2px; height: 0.6em; background: #171717; }
  #worksheet .tick-label { font-size: 0.7em; }
  #worksheet .ten-frame { display: grid; grid-template-columns: repeat(5, 1.6em); gap: 2px; }
  #worksheet .cell { width: 1.6em; height: 1.6em; border: 2px solid #171717; box-sizing: border-box; }
  #worksheet .cell.filled { background: #171717; }
  #worksheet .fraction-bar { display: flex; width: 12em; border: 2px solid #171717; }
  #worksheet .part { flex: 1; height: 1.6em; border-right: 2px solid #171717; }
  #worksheet .part:last-child { border-right: 0; }
  #worksheet .part.shaded { background: #bdbdbd; }
  #worksheet table { border-collapse: collapse; width: 100%; }
  #worksheet th, #worksheet td { border: 1px solid #171717; padding: 0.3em 0.6em; text-align: left; }
  #worksheet .answer-line { display: block; height: 1.6em; border-bottom: 2px solid #171717; }`;
