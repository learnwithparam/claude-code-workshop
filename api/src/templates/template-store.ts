import type { BandId, Template } from "@workshop/shared";

// Templates by band. Adding the same template twice keeps one.
export function createTemplateStore() {
  const byKey = new Map<string, Template>();
  return {
    add(template: Template) {
      byKey.set(JSON.stringify(template), template);
    },
    size: () => byKey.size,
    find(band: BandId, promptWords: string[]): Template | undefined {
      const words = new Set(promptWords);
      return [...byKey.values()].find(
        (t) => t.band === band && t.topic.every((word) => words.has(word)),
      );
    },
  };
}
