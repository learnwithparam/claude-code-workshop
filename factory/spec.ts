import { z } from "zod";

export type Criterion = { id: string; tests: { file: string; name: string }[] };
export type TestResult = { file: string; name: string; status: string };

const unquote = (s: string) => s.replace(/`/g, "").trim();

// A plan line "AC-n | test file | test name" (or the same as a table row) maps a criterion to a test.
// A criterion with no such mapping is kept with an empty list, so it is reported, not dropped.
export function parseSpec(plan: string): Criterion[] {
  const byId = new Map<string, Criterion>();
  for (const line of plan.split("\n")) {
    const m = /^[\s|*>-]*\**(AC-\d+)\b(.*)$/.exec(line);
    if (!m?.[1]) continue;
    const entry = byId.get(m[1]) ?? { id: m[1], tests: [] };
    byId.set(m[1], entry);
    const cells = (m[2] ?? "").split("|").map(unquote).filter(Boolean);
    const [file, name] = cells.slice(-2);
    if (cells.length >= 2 && file && name) entry.tests.push({ file, name });
  }
  return [...byId.values()];
}

// What vitest --reporter=json prints; anything else is refused rather than guessed at.
const vitestJson = z.object({
  testResults: z.array(
    z.object({
      name: z.string(),
      assertionResults: z.array(z.object({ fullName: z.string(), status: z.string() })),
    }),
  ),
});

export function parseVitestJson(text: string): TestResult[] {
  const start = text.indexOf("{");
  const parsed = vitestJson.parse(JSON.parse(text.slice(start)));
  return parsed.testResults.flatMap((f) =>
    f.assertionResults.map((a) => ({ file: f.name, name: a.fullName, status: a.status })),
  );
}

// One problem per bad criterion. Only "a mapped test exists and passed" is checked, not what it asserts.
export function checkSpec(acs: Criterion[], results: TestResult[]): string[] {
  if (!acs.length) return ["the plan has no AC-n lines, so nothing can be verified"];
  const problems: string[] = [];
  for (const ac of acs) {
    if (!ac.tests.length) {
      problems.push(`${ac.id} has no "AC-n | test file | test name" mapping`);
      continue;
    }
    for (const t of ac.tests) {
      const hit = results.find((r) => r.file.endsWith(t.file) && r.name.endsWith(t.name));
      if (!hit) problems.push(`${ac.id}: test "${t.name}" in ${t.file} did not run`);
      else if (hit.status !== "passed")
        problems.push(`${ac.id}: test "${t.name}" in ${t.file} is ${hit.status}`);
    }
  }
  return problems;
}
