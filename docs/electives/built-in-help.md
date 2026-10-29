# Elective: Built in help

**Extends:** hand-built. **Proof:** Ask the built-in help instead of searching the web.

## Goal

Docs go stale and a search finds an old answer.

## The problem

Docs go stale and a search finds an old answer.

## Without

Search the web for how a Claude Code setting works and check the date of what you find.

## The config

- `/help` lists the commands of the version you run.
- `/doctor` checks the install and the settings.
- The `claude-code-guide` agent answers questions about Claude Code, the Agent SDK and the API, and can fetch the current docs.

## With

Ask the guide agent the same question and compare the answer with what you found.

## Run it

1. Type `/help` and read the list.
2. Type `/doctor`.
3. Ask the `claude-code-guide` agent how permission modes differ.

## Prove it

There is no offline proof. `make doctor` checks the tools this repo needs.

## Exercise

Track A: answer three questions with the guide agent. Track B: find one answer it got wrong and say how you checked.

## Discussion

Which source do you trust when two disagree?
