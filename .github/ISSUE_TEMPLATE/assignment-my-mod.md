---

name: "Assignment: a mod of your own"
about: "Workshop assignment. Run it with the feature-atdd workflow."
title: "Assignment: a mod of your own"
labels: assignment
---

Add a mod under `plugins/<name>` that shows <something about the run> above the prompt.

Acceptance:
- `.claude-plugin/plugin.json`, `hooks/hooks.json` and `hooks/register.tsx` exist.
- `claude plugin validate` passes.
- `hooks/register.test.tsx` feeds it a fixed state and checks what it draws.

Run the test with `MOD=<name>`.

Workflow: feature-atdd
Red test: `tests/assignments/my-mod.test.ts`. Run it with `ASSIGNMENT=1 npx vitest run tests/assignments/my-mod.test.ts`; it must fail for the reason above before any work.
