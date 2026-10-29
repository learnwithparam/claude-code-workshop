import type { ArtId, BandTheme } from "./band-theme";

export const ART_WIDTH = 688;
export const ART_HEIGHT = 56;

const repeat = (count: number, draw: (i: number) => string) =>
  Array.from({ length: count }, (_, i) => draw(i)).join("");

// Shapes only, no text, so nothing can collide with the title or fail contrast.
const SHAPES: Record<ArtId, (fill: string, line: string) => string> = {
  balloons: (fill, line) =>
    repeat(
      9,
      (i) =>
        `<ellipse cx="${40 + i * 76}" cy="${24 + (i % 2) * 6}" rx="14" ry="18" fill="${fill}"/><path d="M${40 + i * 76} ${42 + (i % 2) * 6}v14" stroke="${line}" stroke-width="2"/>`,
    ),
  blocks: (fill, line) =>
    repeat(
      8,
      (i) =>
        `<rect x="${12 + i * 86}" y="${i % 2 ? 14 : 22}" width="34" height="34" rx="6" fill="${fill}" stroke="${line}" stroke-width="2"/>`,
    ),
  leaves: (fill, line) =>
    repeat(
      10,
      (i) =>
        `<path d="M${30 + i * 68} 50q-4-32 26-40q4 32-26 40z" fill="${fill}" stroke="${line}" stroke-width="2"/>`,
    ),
  waves: (fill, line) =>
    repeat(
      3,
      (i) =>
        `<path d="M0 ${24 + i * 12}q43-18 86 0t86 0t86 0t86 0t86 0t86 0t86 0t86 0" fill="none" stroke="${i ? line : fill}" stroke-width="4"/>`,
    ),
  hexagons: (fill, line) =>
    repeat(
      11,
      (i) =>
        `<path d="M${30 + i * 62} ${i % 2 ? 40 : 18}l14 8v16l-14 8l-14-8v-16z" fill="${i % 3 ? "none" : fill}" stroke="${line}" stroke-width="2" transform="translate(0 -14)"/>`,
    ),
  grid: (fill, line) =>
    `${repeat(13, (i) => `<path d="M${i * 56} 0v56" stroke="${line}" stroke-width="1"/>`)}${repeat(
      3,
      (i) => `<path d="M0 ${14 + i * 14}h688" stroke="${line}" stroke-width="1"/>`,
    )}<circle cx="560" cy="28" r="10" fill="${fill}"/>`,
  arches: (fill, line) =>
    repeat(
      8,
      (i) =>
        `<path d="M${14 + i * 86} 56v-28a30 30 0 0 1 60 0v28" fill="none" stroke="${i % 4 ? line : fill}" stroke-width="4"/>`,
    ),
};

// Fixed-height decorative strip above the title, so a sheet never reflows and art never sits behind text.
export function renderHeaderArt(theme: BandTheme): string {
  return `<svg class="art" data-art="${theme.art}" aria-hidden="true" focusable="false" viewBox="0 0 ${ART_WIDTH} ${ART_HEIGHT}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${SHAPES[theme.art](theme.accent, theme.rule)}</svg>`;
}
