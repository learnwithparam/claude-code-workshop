# Review guidance

The reviewer reads this file first. It says what a failure looks like in this repo.

## Report format

- Start with the count: `2 important, 1 nit, 0 pre-existing`.
- Every finding names `file:line` and the input that breaks it. No evidence, no finding.
- At most 3 nits. Say nothing about style the formatter already fixes.

## Important

- A route, tool input or env read that skips its zod schema.
- Text shown to a customer that names a model, a token count or a stack trace.
- A worksheet that passes `checkBand` but overflows its page, or a band limit moved without the band table.
- A bug fix with no test that fails without it.
- A permission, hook or CI workflow change that widens what a run may do.

## Skip

- `supplied/`, `test-results/`, `docs/recordings/` and lockfiles.
- Existing problems the diff does not touch: label them pre-existing and stop.

## Rounds

Round one reads the whole diff. Later rounds read only what changed since the last round and never repeat a finding.
