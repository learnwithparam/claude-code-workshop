export type StripSlot = { label: string; current: boolean; skeleton: boolean };

// A loading strip reserves this many slots so the row does not jump as pages arrive.
export const SKELETON_SLOTS = 3;

export function pageLabel(index: number, total: number): string {
  return `Page ${index + 1} of ${total}`;
}

// Hidden means no box and no gap. One page still shows a thumbnail: it confirms what is previewed
// and keeps the strip's place stable when a second page arrives.
export function stripSlots(pageCount: number, active: number, loading: boolean): StripSlot[] {
  const received = Math.max(0, Math.floor(pageCount));
  const total = loading ? Math.max(received, SKELETON_SLOTS) : received;
  const current = Math.min(Math.max(active, 0), Math.max(received - 1, 0));
  return Array.from({ length: total }, (_, i) => ({
    label: i < received ? pageLabel(i, total) : `Page ${i + 1} loading`,
    current: i < received && i === current,
    skeleton: i >= received,
  }));
}
