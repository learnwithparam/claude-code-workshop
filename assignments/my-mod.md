# Assignment: a mod of your own

## Brief

Add a mod under `plugins/<name>` that shows <something about the run> above the prompt.

Run the test with `MOD=<name>`.

## Level

senior

## Acceptance

- `.claude-plugin/plugin.json`, `hooks/hooks.json` and `hooks/register.tsx` exist.
- `claude plugin validate` passes.
- `hooks/register.test.tsx` feeds it a fixed state and checks what it draws.

## Workflow

`feature-atdd`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/my-mod.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `MOD=<name> ASSIGNMENT=1 npx vitest run tests/assignments/my-mod.test.ts`.
   Expect: It fails because `MOD` is not set, so there is no mod folder to check.
2. File the issue: `gh issue create --title "Assignment: a mod of your own" --body-file assignments/my-mod.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `plugins/<name>/.claude-plugin/plugin.json`, `plugins/<name>/hooks/hooks.json`, `plugins/<name>/hooks/register.tsx`, `plugins/<name>/hooks/register.test.tsx`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=feature-atdd`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `MOD=<name> ASSIGNMENT=1 npx vitest run tests/assignments/my-mod.test.ts`.
   Expect: It passes.

## Discussion

What fixed state do you feed the mod, and what must it draw?

- **Principal:** A mod runs inside every engineer's session. What is your review and rollout policy for one, and how do you pull a bad one back?

## File it

```sh
gh issue create --title "Assignment: a mod of your own" --body-file assignments/my-mod.md --label assignment
```
