# Elective: Loop and routines

**Extends:** delivery. **Proof:** Run the same check by hand each time.

## Goal

A queue that nobody watches fills up.

## The problem

A queue that nobody watches fills up.

## Without

Open the `factory:triage` issue list yourself every morning and forget on a busy day.

## The config

- `/loop 30m <prompt>` repeats a prompt on an interval inside a session.
- `/schedule` creates a routine that runs on a cron schedule in the cloud, with the repo you name.
- `.github/workflows/` already holds the jobs that must run without you.

## With

Start `/loop 30m check the factory:triage queue and list new issues`. For a nightly job, ask `/schedule` to run the retro skill on the latest run.

## Run it

1. Type `/loop 30m check the factory:triage queue`.
2. Let two rounds pass.
3. Type `/schedule` and describe the nightly retro.

## Prove it

There is no offline proof. Anything that must run reliably belongs in a workflow under `.github/workflows/`, which `make check` does lint.

## Exercise

Track A: loop a read-only check. Track B: schedule a routine and read its first report.

## Discussion

What deserves a loop in your session, and what deserves a real workflow?
