import { z } from "zod";
import { artifactPath } from "./artifacts.ts";
import type { Host } from "./types.ts";

export const findingSchema = z.object({
  file: z.string(),
  line: z.number().int().positive(),
  severity: z.enum(["important", "nit", "pre-existing"]),
  claim: z.string(),
  // The input that breaks it. No evidence, no finding (REVIEW.md).
  evidence: z.string().min(1),
});
export type Finding = z.infer<typeof findingSchema>;
export const reviewSchema = z.object({
  round: z.number().int().min(1),
  findings: z.array(findingSchema.extend({ votes: z.number().int() })),
  dropped: z.number().int(),
});

export const VOTERS = 3;
export const NEEDED = 2;
export const MAX_NITS = 3;
export const MAX_ROUNDS = 3;
const key = (f: Finding) => `${f.file}:${f.line}:${f.claim}`;

function parseFindings(text: string): Finding[] {
  try {
    return z.array(findingSchema).parse(JSON.parse(text));
  } catch {
    return [];
  }
}

// One round: each lens hunts in parallel, then three cheap verifiers vote on every finding and only
// a finding with 2 votes survives. A finding already reported in an earlier round is not repeated.
export async function reviewRound(
  host: Host,
  n: number,
  round: number,
  lenses: string[],
  seen: Set<string> = new Set(),
) {
  const scope = round === 1 ? "the whole diff" : "only what changed since the last round";
  const hunts = await Promise.all(
    lenses.map((lens) =>
      host.agent(lens, `Review ${scope}. Reply with a JSON array of findings.`, {
        stage: "review",
      }),
    ),
  );
  const fresh = new Map<string, Finding>();
  for (const f of hunts.flatMap((h) => parseFindings(h.text)))
    if (!seen.has(key(f))) fresh.set(key(f), f);

  const kept: (Finding & { votes: number })[] = [];
  let dropped = 0;
  for (const f of fresh.values()) {
    const ballots = await Promise.all(
      Array.from({ length: VOTERS }, () =>
        host.agent("verifier", `Is this finding real? Answer yes or no.\n${JSON.stringify(f)}`, {
          stage: "review-vote",
        }),
      ),
    );
    const votes = ballots.filter((b) => /^\s*yes/i.test(b.text)).length;
    if (votes >= NEEDED) kept.push({ ...f, votes });
    else dropped++;
  }
  // Nits are capped so a long list of style notes cannot bury the one real bug.
  const nits = kept.filter((f) => f.severity === "nit").slice(0, MAX_NITS);
  const findings = [...kept.filter((f) => f.severity !== "nit"), ...nits];
  for (const f of findings) seen.add(key(f));
  const review = { round, findings, dropped };
  await host.write(artifactPath(n, "review.json"), JSON.stringify(review, null, 2));
  return review;
}

// Rounds repeat until no Important finding survives or the cap is reached; the cap hands the rest to a human.
export async function reviewLoop(
  host: Host,
  n: number,
  lenses: string[],
  fixer: () => Promise<void>,
) {
  const seen = new Set<string>();
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const r = await reviewRound(host, n, round, lenses, seen);
    if (!r.findings.some((f) => f.severity === "important")) return { clean: true, rounds: round };
    if (round < MAX_ROUNDS) await fixer();
  }
  return { clean: false, rounds: MAX_ROUNDS };
}
