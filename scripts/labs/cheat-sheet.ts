import { pathToFileURL } from "node:url";
import { LANES, type Lab, loadLabs } from "./catalog.ts";

export const CHEAT_SHEET_COMMAND = "npx tsx scripts/labs/cheat-sheet.ts > docs/labs/cheat-sheet.md";

// One line per lab that teaches a trick, grouped by lane. Generated, so a trick is edited in its lab.
export function renderCheatSheet(labs: Lab[]): string {
  const sections = LANES.flatMap((lane) => {
    const tricks = labs.filter((l) => l.lane === lane && l.trick);
    if (tricks.length === 0) return [];
    return [`## ${lane}`, "", ...tricks.map((l) => `- **${l.id}** ${l.title}: ${l.trick}`), ""];
  });
  return [
    "# Cheat sheet",
    "",
    `Generated from the \`## Trick\` of each lab. Regenerate with \`${CHEAT_SHEET_COMMAND}\`.`,
    "",
    ...sections,
  ].join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.stdout.write(renderCheatSheet(loadLabs("labs")));
}
