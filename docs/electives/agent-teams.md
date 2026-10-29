# Elective: agent teams

**Extends:** execution. **Proof:** `make check` runs `tests/structure/teams.test.ts`. The live run is recorded by hand.

## Goal

Several Claude sessions work on one question at once, each through its own lens, and a lead session merges what they report.

## The problem

One reviewer reads a diff with one mind. A security flaw and a missing test need different attention, and a single pass tends to find the kind it started with. Subagents can split the work, but they only report back to the caller and never see each other.

## Without

Ask one session to review a saved diff for security, tests and layout in a single prompt. Note which lens got the longest paragraph and which got one line.

## The config

- `.claude/teams.json` is a session-only settings file. It sets `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, `teammateMode: in-process` and a `TeammateIdle` hook.
- `.claude/agents/security-reviewer.md` and `test-reviewer.md` are read-only: `Read, Grep, Glob` and no shell.
- `.claude/hooks/teammateidle-log.mjs` appends each teammate name to `.claude/logs/teams.log`. It is a logger and never blocks.
- The shared `.claude/settings.json` does not set the teams variable. A test fails if it ever does, so a factory run never starts a team by accident.

## With

Start a session with the team file: `claude --settings .claude/teams.json`. Save a factory pull request diff to a file and ask for a team of three teammates, one each with the security, test and design lenses. The lead merges their verdicts into one report.

## Run it

1. Type `claude --settings .claude/teams.json` and ask for the team on a saved diff.
2. Wait for the lead to report. Expect one verdict per lens.
3. Type `sort -u .claude/logs/teams.log`. Expect the teammate names.

## Prove it

`make check` asserts that the team file turns the feature on, that the shared settings do not, that both reviewers hold no write or shell tool, and that the hook logs a clean name and rejects anything else. Teams do not form in `claude -p`, so the live run is a recording, not a CI step.

## Exercise

Track A: run the team on one saved diff and compare its report with the single prompt from Without. Track B: give two teammates rival explanations for the Kindergarten band bug and have the lead record which one survived. No tracked file may change.

## Discussion

A team costs several times one session, and teammates share the working tree. Use a team for lenses that must stay independent, and a subagent when you only need a result back.
