import { BANDS, type BandId, type Worksheet } from "@workshop/shared";

const MAX_ENTRIES = 500;

export function normalisePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ").toLowerCase();
}

// "grade 3" and "grade 4" share a band, so the grade phrase is not part of the text half of the key.
// Longest alias first so "grade 10" is removed whole.
function withoutGrade(prompt: string, band: BandId): string {
  const words = ` ${normalisePrompt(prompt)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
  const aliases = [...BANDS[band].aliases].sort((a, b) => b.length - a.length);
  const stripped = aliases.reduce((text, alias) => text.replaceAll(` ${alias} `, " "), words);
  return stripped.trim();
}

// Exact cache: same normalised prompt and band, same sheet, zero tokens.
export function createPromptCache() {
  const entries = new Map<string, Worksheet>();
  const keyOf = (prompt: string, band: BandId) => `${band}\n${withoutGrade(prompt, band)}`;
  return {
    get: (prompt: string, band: BandId) => entries.get(keyOf(prompt, band)),
    set(prompt: string, band: BandId, sheet: Worksheet) {
      const key = keyOf(prompt, band);
      entries.delete(key);
      entries.set(key, sheet);
      const oldest = entries.keys().next().value;
      if (entries.size > MAX_ENTRIES && oldest !== undefined) entries.delete(oldest);
    },
    delete: (prompt: string, band: BandId) => entries.delete(keyOf(prompt, band)),
    size: () => entries.size,
  };
}
