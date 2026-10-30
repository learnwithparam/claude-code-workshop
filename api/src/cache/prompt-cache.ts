import type { BandId, Worksheet } from "@workshop/shared";

const MAX_ENTRIES = 500;

export function normalisePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ").toLowerCase();
}

// Exact cache: same normalised prompt and band, same sheet, zero tokens.
export function createPromptCache() {
  const entries = new Map<string, Worksheet>();
  const keyOf = (prompt: string, band: BandId) => `${band}\n${normalisePrompt(prompt)}`;
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
