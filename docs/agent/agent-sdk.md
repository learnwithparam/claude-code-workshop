# The Agent SDK: when the agent is Claude Code itself

**Track:** build the agent. **Proof:** `npx vitest run factory/run.test.ts`.

## Goal

Say which of the three agents in this repo you would use for a given job, and what each one costs you.

## The problem

You now have three ways to run an agent: the Messages API with a loop you wrote, the Messages API with the SDK's tool runner, and the Agent SDK, which starts the Claude Code program for you. They are not interchangeable.

## Without

Use the Agent SDK for the worksheet chat. Every request starts a program that loads its own system prompt, tools and project settings before your first word. The product pays for all of that on every message and gains nothing, because the worksheet agent needs one tool.

## The code

The worksheet agent is in `api/src/agent/agent.ts`. It sends the prompt you wrote and one tool.

The factory is in `factory/stages.ts`. `runStage` calls `query()` from `@anthropic-ai/claude-agent-sdk` with these options:

- `settingSources: ["project"]` loads this repo's `.claude/` folder, so the stage gets the skills, agents, rules and hooks you built in the earlier levels.
- `strictMcpConfig: true` ignores any MCP server that is not in the project.
- `maxTurns` and `maxBudgetUsd` end a run that goes on too long or costs too much.
- `env` is an allowlist, so the agent that reads an untrusted issue never receives the GitHub token.

## With

Use each where it fits. The product serves a customer a fixed job, so it takes the smallest request. The factory edits files, runs a shell, and needs hooks and skills, which are exactly what the Claude Code program already has. The mini agent from the last step shows how much of that you would write yourself.

## Run it

1. Open `factory/stages.ts` and find `runStage`. List the options that stop a runaway run.
2. Open `.factory/config.json`. Find the model for each stage.
3. Type `npx vitest run factory/run.test.ts`. Expect every test to pass. The factory runs there with a fake `runStage`, so no call is made.

## Prove it

`factory/run.test.ts` runs the whole factory with the stage runner replaced by a script. It proves the runner decides what happens next from each stage's result, not from the SDK. Measuring the extra input tokens the Claude Code program adds needs a real call, so it is not part of `make check`. Run one stage with `make factory ISSUE=<n>` and read `cost.json` in the run folder.

## Exercise

Track A: read `cost.json` from one run and write the cost of each stage next to its model. Track B: replace one stage with a direct Messages API call and say which of skills, hooks and rules you lost.

## Discussion

A customer-facing feature and an internal tool that edits code have different needs. Which parts of Claude Code would you have to rebuild to move the first one onto the Agent SDK, and would you want to?
