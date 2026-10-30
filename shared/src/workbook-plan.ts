import { BANDS } from "./bands";
import type { Item } from "./schema";
import type { Workbook } from "./workbook-schema";

type KeyEntry = Workbook["answerKey"][number];

export type PlannedPage =
  | { kind: "cover"; number: number }
  | { kind: "contents"; number: number }
  | { kind: "chapter"; number: number; chapter: number; items: Item[] }
  | { kind: "answer-key"; number: number; entries: KeyEntry[] };

export type WorkbookPlan = {
  pages: PlannedPage[];
  totalPages: number;
  contents: { title: string; page: number }[];
};

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

// Pagination, page order and numbering are decided here so the model never touches layout.
export function planWorkbook(wb: Workbook): WorkbookPlan {
  const max = BANDS[wb.band].maxItemsPerPage;
  const unnumbered: Omit<PlannedPage, "number">[] = [
    { kind: "cover" },
    { kind: "contents" },
    ...wb.chapters.flatMap((chapter, index) =>
      chunk(chapter.items, max).map((items) => ({
        kind: "chapter" as const,
        chapter: index,
        items,
      })),
    ),
    ...chunk(wb.answerKey, max).map((entries) => ({ kind: "answer-key" as const, entries })),
  ];
  const pages = unnumbered.map((page, i) => ({ ...page, number: i + 1 }) as PlannedPage);
  const contents = wb.chapters.map((chapter, index) => ({
    title: chapter.title,
    page: pages.find((p) => p.kind === "chapter" && p.chapter === index)?.number ?? 0,
  }));
  return { pages, totalPages: pages.length, contents };
}
