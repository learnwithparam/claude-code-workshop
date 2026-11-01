# Tier a diff and count its approvals

**Pairs with:** `docs/factory/f6-deploy.md`
**Help:** goal

## Warm-up

What does the factory do with a metric that sits three sigma outside its band?
From: factory-07
Answer: It writes an intent.md for a new run. Arithmetic decides, no model does.

## Goal

Write .labs/work/tier.ts, which prints the risk tier and approval count for the paths you pass it, and .labs/work/approve.ts, which says whether a high tier gate is open. The proof must pass.

## Predict

A pull request changes one file in docs/ and one file in api/src/. How many approvals does it need, and does the author's name change the answer?

Answer: One approval, because the worst path sets the tier and api/ is medium. The author never changes it. Only the paths do.

## Steps

1. Run `make lab` and read why it is red. It is red because the work is not done yet; this is the state the steps will change.
   Expect: A red result that names the proof items not true yet, then a hint to reveal. Nothing has changed yet.
2. Read the deploy stage doc.
3. Make the lab work folder.
4. [editor] Write .labs/work/tier.ts. It takes paths from the command line and prints the tier and its approval count on one line.
5. Run it on a docs file and on a workflow file.
   Expect: `low 0` for the docs file and `high 2` for the workflow file. Both words come from the engine, not from your script.
6. [editor] Write .labs/work/approve.ts. It takes names from the command line, treats each as a human approval of the same commit, and prints whether a high tier gate is open.
7. Run it with one person named twice, then with two people.
   Expect: `false` for the same person twice and `true` for two different people.

## Proof

1. tier.ts gives the tier and count for three diffs the lab does not show you.

   ```sh
   test "$(npx tsx .labs/work/tier.ts .github/workflows/check.yml)" = "high 2"
   test "$(npx tsx .labs/work/tier.ts fixtures/a.json)" = "low 0"
   test "$(npx tsx .labs/work/tier.ts web/src/x.astro)" = "medium 1"
   ```
2. The worst path sets the tier.

   ```sh
   test "$(npx tsx .labs/work/tier.ts docs/README.md api/src/x.ts)" = "medium 1"
   ```
3. One person approving twice does not open a high tier gate, two people do.

   ```sh
   test "$(npx tsx .labs/work/approve.ts ann ann)" = "false"
   test "$(npx tsx .labs/work/approve.ts ann bo)" = "true"
   ```

## Hints

1. `classify` and `APPROVALS` are exported by `factory/engine/risk.ts`. `classify` takes a list of paths.
2. `approvalsMet(tier, approvals, head)` counts distinct humans whose approval names the head commit. Each approval is `{ by, kind: "human", commit }`.
3. Print the engine's answer. A script that types `high 2` passes one diff and fails the others.
4. Commands: `cat docs/factory/f6-deploy.md`, `mkdir -p .labs/work`, `npx tsx .labs/work/tier.ts docs/README.md`, `npx tsx .labs/work/tier.ts .github/workflows/check.yml`, `npx tsx .labs/work/approve.ts ann ann`, `npx tsx .labs/work/approve.ts ann bo`. The first script is `import { APPROVALS, classify } from "../../factory/engine/risk.ts"; const t = classify(process.argv.slice(2)); console.log(t, APPROVALS[t]);` and the second is `import { approvalsMet } from "../../factory/engine/risk.ts"; const a = process.argv.slice(2).map((by) => ({ by, kind: "human" as const, commit: "h1" })); console.log(approvalsMet("high", a, "h1"));`.

## What you just learned

The tier comes from the paths and the count comes from the tier. Approvals count distinct humans on one commit, so the same person twice is still one.
