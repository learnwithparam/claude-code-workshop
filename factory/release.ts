// Minor bump: a release exists because the API a user sees changed (NG-2: no patch-level releases).
export function nextVersion(current: string): string {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!m) throw new Error(`not a plain version: ${current}`);
  return `${m[1]}.${Number(m[2]) + 1}.0`;
}

export function changelogEntry(
  version: string,
  date: string,
  title: string,
  lines: string[],
): string {
  return `## ${version} (${date})\n\n${title}\n\n${lines.map((l) => `- ${l}`).join("\n")}\n`;
}

// New entries go under the top heading, newest first.
export function prependEntry(changelog: string, entry: string): string {
  const head = "# Changelog\n\n";
  return head + entry + (changelog.startsWith(head) ? `\n${changelog.slice(head.length)}` : "");
}
