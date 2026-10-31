# F9 Capstone: rebuild the workbook and template features through your factory

**Stage:** all of them. **Layer:** every level. **Workflows:** `feature-bdd` for the cache and templates, `feature-sdd` for the workbook, `bug-tdd` for the template id boundary.

## Goal

You do not write the workbook, template or cache code. Your factory does. You supply the red suites, the factory builds until they are green, and you compare its tree with the reference answer. The score is whether the gates held, not whether code appeared.

## What is built and what is design

- Built and tested: the red suites in `specs/34`, `specs/35` and `specs/37`, the workflows that run them, and the reference code the capstone level owns (see `docs/levels/capstone.md` for the paths).
- Built, not run for you: the factory runs against your own GitHub issues and your own API key. This guide gives the steps. No run log from a capstone is committed, so do not expect one in this repo.
- Design: the order of tickets below is a suggestion. Any order works if each ticket's red suite fails first.

## The setup

1. Generate the two snapshots:

   ```
   make levels LEVEL=workflows
   make levels LEVEL=capstone
   ```

2. Work in a stripped copy of `supplied/workflows`. The copy keeps the engine, the workflows, the specs and the golden tests, and loses the workbook, template and cache code.
3. Install and confirm the suites are red:

   ```
   cp -R supplied/workflows /tmp/capstone-start
   npx tsx scripts/capstone-strip.ts /tmp/capstone-start
   cd /tmp/capstone-start
   npm ci
   npx vitest run specs/34 specs/35 specs/37
   ```

   Every file fails to import code that is not there yet. That is the starting line. If a suite is already green, stop: the strip did not run.

4. Keep `supplied/capstone` closed. It is the reference answer, and reading it first turns the capstone into copying.

## The tickets

File one GitHub issue per row. The issue names the spec folder and says nothing about how to build it.

| Ticket                               | Spec folder                                | Workflow      | First red                            |
| ------------------------------------ | ------------------------------------------ | ------------- | ------------------------------------ |
| Workbook plan, schema, check and PDF | `specs/34`                                 | `feature-sdd` | a property test over any plan        |
| Exact-prompt cache                   | `specs/35/golden/cache.golden.test.ts`     | `feature-bdd` | a repeat prompt spends zero tokens   |
| Templates from good renders          | `specs/35/golden/templates.golden.test.ts` | `feature-bdd` | a matching request fills only slots  |
| Template id boundary                 | `specs/37`                                 | `bug-tdd`     | an id with a path meaning is refused |

Run them in this order. The template tickets use the cache, and the id ticket guards the route the templates ticket adds.

## Run each ticket

```
npx tsx factory/engine/main.ts <issue> --workflow=feature-bdd
```

Use the workflow named in the table. Then read, in order:

1. `specs/<issue>/run.log` for each step and round, with the model each round ran on, and `specs/<issue>/cost.json` for what each call cost against the cap.
2. The `red` result: it must say the golden test failed on the base commit.
3. The `lock` result: it must say no test file changed during the build.
4. The `plan-drift` result: it must say the diff stayed inside `plan.md`.

A ticket is done only when all three held and the spec folder is green.

Expect the run to stop and wait. The workbook ticket runs `feature-sdd`, which writes a constitution, the spec, a clarify list, the plan, tasks and an analysis. It stops at the `spec` gate and again at the `plan` gate with `awaiting-approval`; comment `approve <stage> <digest>` on the issue as the logged-in `gh` user, then run the same command again, and the engine skips the stages you already signed. The review step of these workflows runs lenses and three voting verifiers, and a surviving Important finding ends the run as `needs-human`. If the spend cap is reached first, the run ends `needs-human` with the reason `spend cap` in `run.log`. Read those lines before you call a ticket stuck.

## What the red suites teach

- **Zero model calls on a hit.** The golden test counts calls to a fake client. A cache that returns early but still calls the model fails it.
- **Slots only.** A template holds slots and no filled content. The test checks the schema the model is offered, so a template that stores a whole sheet fails.
- **Layout is code.** A template fill is rendered with the band rules. A model that returns more items than the band allows is stopped by the check, not by the prompt.
- **Customer errors are generic.** A provider overload never reaches the response body.
- **A strict id.** The mark-good route takes the id the api issued and nothing else. A traversal id is refused before any lookup.

## Compare with the reference

When all four tickets are done, in the repo you worked in:

```
diff -r shared/src <this repo>/supplied/capstone/shared/src
diff -r api/src <this repo>/supplied/capstone/api/src
make prove LEVEL=capstone
```

Differences are expected. A different name or file split is fine. A missing guard is not: for each boundary the golden tests cover, find where your tree enforces it, and where the reference does.

## Proof that bites

Pick one guard and break it in your tree.

- In the cache key, drop the band. A golden test named for the band fails.
- In the id schema, allow any string. The traversal cases in `specs/37` fail.
- In the template store, save the filled sheet. The slots-only test fails.

Restore each one and confirm the suite is green again. A guard you broke without seeing a failure is a guard no test holds, which means your build has a hole the reference does not.

## Exercise

Track A: run all four tickets and record, for each, how many rounds the loop took, what it cost in `cost.json`, and where it stopped for a person. Track B: delete the `lock` check from one workflow, run the template ticket, and read whether the builder edited a golden test to get green.

## Discussion

1. Which ticket needed a person, and which gate told you so?
2. Your tree is green and differs from the reference. What evidence would make you trust it anyway?
3. Which red suite would you write first for the next feature, before any code exists?
