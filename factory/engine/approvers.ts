export type Comment = {
  body: string;
  authorAssociation: string;
  author?: { login: string; is_bot?: boolean };
};

const CAN_WRITE = new Set(["write", "maintain", "admin"]);

// Who may approve on this issue: comment authors the repo says can write. An app or bot account never
// counts, whatever permission it holds, so an agent cannot sign off its own work.
export async function writersFrom(
  comments: Comment[],
  permissionOf: (login: string) => Promise<string>,
): Promise<string[]> {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of comments) {
    const login = c.author?.login;
    if (!login || seen.has(login)) continue;
    seen.add(login);
    if (c.author?.is_bot || /\[bot\]$/i.test(login)) continue;
    if (CAN_WRITE.has(await permissionOf(login))) out.push(login);
  }
  return out;
}

// Only a person with write access counts. The agents hold no GitHub token, so they cannot approve.
export function approvalIn(
  comments: Comment[],
  stage: string,
  digest: string,
  approvers?: string[],
  need = 1,
): boolean {
  const line = `approve ${stage} ${digest}`;
  // Distinct people: one person commenting twice is still one approval.
  const who = new Set(
    comments
      .filter(
        (c) =>
          ["OWNER", "MEMBER", "COLLABORATOR"].includes(c.authorAssociation) &&
          (!approvers || approvers.includes(c.author?.login ?? "")) &&
          c.body.split("\n").some((l) => l.trim() === line),
      )
      .map((c) => c.author?.login ?? ""),
  );
  return who.size >= need;
}
