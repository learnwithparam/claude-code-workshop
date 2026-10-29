import type { BandId } from "../../../shared/src/bands";

// Raw model tool input, typed unknown on purpose: the schema under test is what gives it a type.
// Contract for the builder: a section carries `activity` instead of `items`, and the renderer puts
// data-item="<index>" on exactly one element per item, so "once" is countable for every kind.
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

export const rawSheet = (band: BandId, activity: unknown): unknown => ({
  title: "Activity sheet",
  band,
  subject: "Mixed",
  sections: [{ heading: "Part one", instruction: "Do each one.", activity }],
});

export type Built = { activity: unknown; tokens: string[] };

// n distinct items; `tag` keeps tokens unique across items and never a substring of another token.
export function build(kind: Kind, n: number, tag = "k"): Built {
  const id = (i: number) => `${tag}x${String.fromCharCode(97 + (i % 26))}${Math.floor(i / 26)}z`;
  const ids = Array.from({ length: n }, (_, i) => id(i));
  switch (kind) {
    case "count":
      return {
        activity: { kind, items: ids.map((t, i) => ({ object: t, count: (i % 5) + 1 })) },
        tokens: ids,
      };
    case "match":
      return {
        activity: { kind, items: ids.map((t) => ({ left: `${t}L`, right: `${t}R` })) },
        tokens: ids.flatMap((t) => [`${t}L`, `${t}R`]),
      };
    case "circle":
      return {
        activity: { kind, prompt: `${tag}promptz`, items: ids.map((t) => ({ label: t })) },
        tokens: ids,
      };
    case "fill-blank":
      return {
        activity: { kind, items: ids.map((t) => ({ sentence: `${t} sat on the ___` })) },
        tokens: ids,
      };
    case "trace":
      return { activity: { kind, items: ids.map((t) => ({ text: t })) }, tokens: ids };
    case "number-line":
      return {
        activity: { kind, items: ids.map(() => ({ start: 0, end: 10, step: 1 })) },
        tokens: [],
      };
    case "ten-frame":
      return {
        activity: { kind, items: ids.map((_, i) => ({ value: (i % 10) + 1 })) },
        tokens: [],
      };
    case "fraction-bar":
      return {
        activity: { kind, items: ids.map((_, i) => ({ numerator: (i % 4) + 1, denominator: 5 })) },
        tokens: [],
      };
    case "table":
      return {
        activity: {
          kind,
          headers: [`${tag}hAz`, `${tag}hBz`],
          items: ids.map((t) => ({ cells: [`${t}A`, `${t}B`] })),
        },
        tokens: ids.flatMap((t) => [`${t}A`, `${t}B`]),
      };
    case "steps":
      return { activity: { kind, items: ids.map((t) => ({ text: t })) }, tokens: ids };
    case "short":
      return { activity: { kind, items: ids.map((t) => ({ question: t })) }, tokens: ids };
  }
}

export const occurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;

export const sectionOf = (html: string) => /<section[\s\S]*<\/section>/.exec(html)?.[0] ?? "";

export const textOf = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
