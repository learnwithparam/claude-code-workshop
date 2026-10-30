import type { BandId } from "../../../shared/src/bands";

// Raw model tool input, typed unknown on purpose: the schema under test is what gives it a type.
// Contract: a section carries `activity` ({ kind, items, ... }) instead of `items`, and the renderer
// puts data-item="<index>" on exactly one element per item, so "once" is countable for every kind.
export const ACTIVITY_KIND_LIST = [
  "count",
  "match",
  "circle",
  "fill-blank",
  "trace",
  "number-line",
  "ten-frame",
  "fraction-bar",
  "table",
  "steps",
  "short",
] as const;
export type Kind = (typeof ACTIVITY_KIND_LIST)[number];

export const section = (activity: unknown, heading = "Part one") => ({
  heading,
  instruction: "Do each one.",
  activity,
});

export const rawSheet = (band: BandId, ...activities: unknown[]): unknown => ({
  title: "Activity sheet",
  band,
  subject: "Mixed",
  sections: activities.map((a, i) => section(a, `Part ${i + 1}`)),
});

// One item of `kind`, identified by `id`. `tokens` are the strings that must show up once on the
// page; the kinds drawn from numbers only (number-line, ten-frame, fraction-bar) have none and are
// counted through data-item instead.
export function oneItem(kind: Kind, id: string): { activity: unknown; tokens: string[] } {
  switch (kind) {
    case "count":
      return { activity: { kind, items: [{ object: id, count: 2 }] }, tokens: [id] };
    case "match":
      return {
        activity: { kind, items: [{ left: `${id}-L`, right: `${id}-R` }] },
        tokens: [`${id}-L`, `${id}-R`],
      };
    case "circle":
      return {
        activity: { kind, prompt: `Pick ${id}P`, items: [{ label: id }] },
        tokens: [id],
      };
    case "fill-blank":
      return { activity: { kind, items: [{ sentence: `${id} is _` }] }, tokens: [id] };
    case "trace":
      return { activity: { kind, items: [{ text: id }] }, tokens: [id] };
    case "number-line":
      return { activity: { kind, items: [{ start: 0, end: 5, step: 1 }] }, tokens: [] };
    case "ten-frame":
      return { activity: { kind, items: [{ value: 3 }] }, tokens: [] };
    case "fraction-bar":
      return { activity: { kind, items: [{ numerator: 1, denominator: 3 }] }, tokens: [] };
    case "table":
      return {
        activity: {
          kind,
          headers: [`${id}-H1`, `${id}-H2`],
          items: [{ cells: [`${id}-A`, `${id}-B`] }],
        },
        tokens: [`${id}-A`, `${id}-B`],
      };
    case "steps":
      return { activity: { kind, items: [{ text: id }] }, tokens: [id] };
    case "short":
      return { activity: { kind, items: [{ question: id }] }, tokens: [id] };
  }
}

// Whole-token count, so "ida" is not found inside "ida-L".
export const occurrences = (haystack: string, needle: string) =>
  haystack.match(new RegExp(`(?<![\\w-])${needle}(?![\\w-])`, "g"))?.length ?? 0;

export const sectionOf = (html: string) => /<section[\s\S]*<\/section>/.exec(html)?.[0] ?? "";

export const textOf = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
