import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);

export const artIdSchema = z.enum([
  "balloons",
  "blocks",
  "leaves",
  "waves",
  "hexagons",
  "grid",
  "arches",
]);
export type ArtId = z.infer<typeof artIdSchema>;

// Tokens come from the band table only. The model never picks colours or art.
export const bandThemeSchema = z.object({
  paper: hex,
  ink: hex,
  muted: hex,
  accent: hex,
  accentInk: hex,
  rule: hex,
  art: artIdSchema,
});
export type BandTheme = z.infer<typeof bandThemeSchema>;

const channel = (value: number) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (color: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(Number.parseInt(color.slice(i, i + 2), 16)));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
};

// WCAG 2.x contrast ratio, 1 to 21.
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

export const MIN_TEXT_CONTRAST = 4.5;

// Every pair a worksheet draws text on.
export const textPairs = (theme: BandTheme): [string, string][] => [
  [theme.ink, theme.paper],
  [theme.muted, theme.paper],
  [theme.accentInk, theme.accent],
];
