import { z } from "zod";
import type { ActivityKind } from "./activity-kinds";
import type { BandTheme } from "./band-theme";

export const bandIdSchema = z.enum([
  "early-reader",
  "kindergarten",
  "grade-1-2",
  "grade-3-5",
  "grade-6-8",
  "grade-9-12",
  "university",
]);
export type BandId = z.infer<typeof bandIdSchema>;

export type Band = {
  id: BandId;
  label: string;
  aliases: string[];
  font: "Nunito" | "Inter" | "EB Garamond";
  fontPx: number;
  maxItems: number;
  maxWordsPerItem: number;
  pictureBoxes: boolean;
  kinds: ActivityKind[];
  theme: BandTheme;
};

// Truth outside the model: the band table decides layout and limits, the model only fills content.
export const BANDS: Record<BandId, Band> = {
  "early-reader": {
    id: "early-reader",
    label: "Early reader",
    aliases: [
      "early reader",
      "pre-k",
      "prek",
      "preschool",
      "age 3",
      "age 4",
      "3 year old",
      "4 year old",
    ],
    font: "Nunito",
    fontPx: 30,
    maxItems: 6,
    maxWordsPerItem: 6,
    pictureBoxes: true,
    kinds: ["count", "circle", "trace", "match"],
    theme: {
      paper: "#fffaf0",
      ink: "#1f1a14",
      muted: "#5c4a1a",
      accent: "#ffd166",
      accentInk: "#1f1a14",
      rule: "#d9a62e",
      art: "balloons",
    },
  },
  kindergarten: {
    id: "kindergarten",
    label: "Kindergarten",
    aliases: ["kindergarten", "kinder", "grade k", "k", "age 5", "5 year old"],
    font: "Nunito",
    fontPx: 26,
    maxItems: 8,
    maxWordsPerItem: 8,
    pictureBoxes: true,
    kinds: ["count", "circle", "ten-frame", "trace", "match"],
    theme: {
      paper: "#fff7f9",
      ink: "#2a1520",
      muted: "#7a2e4d",
      accent: "#ff9fb8",
      accentInk: "#2a1520",
      rule: "#d9738f",
      art: "blocks",
    },
  },
  "grade-1-2": {
    id: "grade-1-2",
    label: "Grades 1 to 2",
    aliases: [
      "grade 1",
      "grade 2",
      "1st grade",
      "2nd grade",
      "first grade",
      "second grade",
      "year 1",
      "year 2",
    ],
    font: "Nunito",
    fontPx: 22,
    maxItems: 10,
    maxWordsPerItem: 14,
    pictureBoxes: true,
    kinds: ["count", "match", "fill-blank", "number-line", "ten-frame", "short", "steps"],
    theme: {
      paper: "#f4fbf6",
      ink: "#12261a",
      muted: "#2f5f42",
      accent: "#8fd9a8",
      accentInk: "#12261a",
      rule: "#4fa36f",
      art: "leaves",
    },
  },
  "grade-3-5": {
    id: "grade-3-5",
    label: "Grades 3 to 5",
    aliases: ["grade 3", "grade 4", "grade 5", "3rd grade", "4th grade", "5th grade"],
    font: "Inter",
    fontPx: 18,
    maxItems: 12,
    maxWordsPerItem: 24,
    pictureBoxes: false,
    kinds: ["fill-blank", "number-line", "fraction-bar", "steps", "short", "table", "match"],
    theme: {
      paper: "#f5f9ff",
      ink: "#111c33",
      muted: "#3a527a",
      accent: "#2a63cf",
      accentInk: "#ffffff",
      rule: "#7fa3e6",
      art: "waves",
    },
  },
  "grade-6-8": {
    id: "grade-6-8",
    label: "Grades 6 to 8",
    aliases: [
      "grade 6",
      "grade 7",
      "grade 8",
      "middle school",
      "6th grade",
      "7th grade",
      "8th grade",
    ],
    font: "Inter",
    fontPx: 16,
    maxItems: 14,
    maxWordsPerItem: 36,
    pictureBoxes: false,
    kinds: ["fill-blank", "fraction-bar", "table", "steps", "short"],
    theme: {
      paper: "#faf7ff",
      ink: "#1c1433",
      muted: "#5a4a8a",
      accent: "#6a45c9",
      accentInk: "#ffffff",
      rule: "#a894e0",
      art: "hexagons",
    },
  },
  "grade-9-12": {
    id: "grade-9-12",
    label: "Grades 9 to 12",
    aliases: ["grade 9", "grade 10", "grade 11", "grade 12", "high school", "freshman", "senior"],
    font: "Inter",
    fontPx: 15,
    maxItems: 16,
    maxWordsPerItem: 50,
    pictureBoxes: false,
    kinds: ["fill-blank", "table", "steps", "short"],
    theme: {
      paper: "#f7f8f8",
      ink: "#14202b",
      muted: "#4a5a68",
      accent: "#0f766e",
      accentInk: "#ffffff",
      rule: "#7fb5af",
      art: "grid",
    },
  },
  university: {
    id: "university",
    label: "University",
    aliases: ["university", "college", "undergraduate", "undergrad", "graduate", "bachelor"],
    font: "EB Garamond",
    fontPx: 15,
    maxItems: 20,
    maxWordsPerItem: 80,
    pictureBoxes: false,
    kinds: ["fill-blank", "table", "steps", "short"],
    theme: {
      paper: "#fbf8f3",
      ink: "#1b1b1b",
      muted: "#5a5247",
      accent: "#7a1f2b",
      accentInk: "#ffffff",
      rule: "#b58a8f",
      art: "arches",
    },
  },
};

export const BAND_IDS = Object.keys(BANDS) as BandId[];

// Whole-word match against every alias, longest alias first, so "grade 1" never swallows "grade 10".
const normalize = (text: string) =>
  ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;

export function parseBand(text: string): BandId | null {
  const padded = normalize(text);
  const hits = BAND_IDS.flatMap((id) =>
    BANDS[id].aliases.map((alias) => ({ id, alias: normalize(alias) })),
  ).sort((a, b) => b.alias.length - a.alias.length);
  return hits.find((hit) => padded.includes(hit.alias))?.id ?? null;
}
