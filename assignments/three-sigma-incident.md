# Assignment: seed a 3-sigma breach and run the incident workflow

## Brief

Seed a CI-failure spike in `.factory/bands.yaml` metrics, let `--maintain` write `intent.md`, then run `incident` to a PR.

How to run it: `make factory ISSUE=<this issue> FLAGS=--workflow=incident --auth=api-key`. Read `docs/factory/f8-workflows.md`.

## Level

principal

## Acceptance

- `fixtures/incidents/breach.json` holds a `metric`, a `direction`, a `history` and a `latest` value.
- `detect` reports at least 3 sigma for it and `actionFor` answers `intent`.
- The `intent.md` your run wrote under `specs/<issue>/` names the metric.
- `make check` passes with zero warnings and the new check is wired in.

## Workflow

`incident`. Workflows are listed in [F8](../docs/factory/f8-workflows.md).

## Red test

```sh
ASSIGNMENT=1 npx vitest run tests/assignments/three-sigma-incident.test.ts
```

It is skipped unless `ASSIGNMENT=1`, so `make check` stays green until you start.

## Walkthrough

1. Run the red test: `ISSUE=<n> ASSIGNMENT=1 npx vitest run tests/assignments/three-sigma-incident.test.ts`.
   Expect: It fails because `fixtures/incidents/breach.json` does not exist.
2. File the issue: `gh issue create --title "Assignment: seed a 3-sigma breach and run the incident workflow" --body-file assignments/three-sigma-incident.md --label assignment`.
   Expect: It prints the new issue URL.
3. Write `fixtures/incidents/breach.json`.
   Expect: The red test now fails on behaviour, not on a missing file.
4. Run the factory: `make factory ISSUE=<issue> FLAGS=--workflow=incident`.
   Expect: The run ends `awaiting-approval` or `needs-human`, and `specs/<issue>/run.log` says which.
5. Run the gate: `make check`.
   Expect: Zero errors and zero warnings.
6. Run the red test again: `ISSUE=<n> ASSIGNMENT=1 npx vitest run tests/assignments/three-sigma-incident.test.ts`.
   Expect: It passes.

## Discussion

Which number in your history decides whether the latest value is a breach?

- **Principal:** A three-sigma rule fires on noise at a known rate. What would you change so a team trusts the alerts, and what would you give up?

## File it

```sh
gh issue create --title "Assignment: seed a 3-sigma breach and run the incident workflow" --body-file assignments/three-sigma-incident.md --label assignment
```
