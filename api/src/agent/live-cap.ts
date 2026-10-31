// The $60 live-run cap is shared by every eval and smoke run.
export const LIVE_CAP_USD = 60;

export function withinLiveCap(spent: number, next: number, cap: number): boolean {
  return spent + next <= cap;
}
