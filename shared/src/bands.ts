import { z } from "zod";

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
};

// Truth outside the model: the band table decides layout and limits, the model only fills content.
export const BANDS: Record<BandId, Band> = {
  "early-reader": {
    id: "early-reader",
    label: "Early reader",
    aliases: ["early reader", "pre-k", "prek", "preschool", "age 3", "age 4"],
    font: "Nunito",
    fontPx: 30,
    maxItems: 6,
    maxWordsPerItem: 6,
    pictureBoxes: true,
  },
  kindergarten: {
    id: "kindergarten",
    label: "Kindergarten",
    aliases: ["kindergarten", "kinder", "grade k", "k", "age 5"],
    font: "Nunito",
    fontPx: 26,
    maxItems: 8,
    maxWordsPerItem: 8,
    pictureBoxes: true,
  },
  "grade-1-2": {
    id: "grade-1-2",
    label: "Grades 1 to 2",
    aliases: ["grade 1", "grade 2", "1st grade", "2nd grade", "first grade", "second grade"],
    font: "Nunito",
    fontPx: 22,
    maxItems: 10,
    maxWordsPerItem: 14,
    pictureBoxes: true,
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
