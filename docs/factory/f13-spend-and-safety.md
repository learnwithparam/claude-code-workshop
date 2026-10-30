# F13. Spend and safety: caps, credit, keys and hooks

**Stage:** all of them. **Layer:** boundary, with a price on it. **Prerequisite:** F11 (cloud sessions) and F12 (model routing).

## Goal

Know which limits actually stop a run, say plainly what the tool cannot control about credit, keep the API key out of every place a model or a log can read it, and use hooks as guardrails that fail closed.

## What stops a run from spending

These limits exist in code. One more does not, and you should say so out loud.

| Limit                                                  | Where                                                 | What it stops                                          |
| ------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------ |
| `maxBudgetUsd` per stage                               | `.factory/config.json`, passed in `factory/stages.ts` | one stage of the config runner                         |
| `maxBudgetUsd` per agent call, `o.maxUsdPerAgent ?? 3` | `factory/engine/real-host.ts`                         | one agent call of the workflow engine                  |
| `maxTurns`                                             | the stage config, or the agent's frontmatter          | a call that wanders                                    |
| loop `max` of 1 to 5, and `reviewLoop.maxRounds`       | `factory/engine/workflow.ts`, `config.json`           | a fix that never converges; the run ends `needs-human` |
| `withinLiveCap` and `LIVE_CAP_USD`                     | `api/src/agent/live-cap.ts`                           | live eval and smoke runs, shared                       |

Not in the list: a cap on the total of one workflow run. `docs/factory/faq.md` says the same. The sum of many capped calls is capped only by how many calls the loops allow, so the real ceiling of a run is the per-call budget times the rounds times the steps. Work it out for your workflow before you leave it overnight.

## Credit: what the tool cannot choose

Anthropic accounts can hold more than one kind of credit: credit you bought, and promotional credit you were given. They behave differently:

- Promotional credits expire at the time stated when they were issued, or after one calendar year if none is stated. Purchased usage credits expire one calendar year after the confirmation notice. Credits are non-refundable and have no cash value. Source: [Anthropic credit terms](https://www.anthropic.com/legal/credit-terms).
- The credit terms page does not say which credit is spent first. Secondary write-ups say promotional credit goes first, and one issue report suggests a promotional balance can show as available while requests are blocked. Treat both as unverified until Anthropic's billing documents say so.
- Claude Code uses either a claude.ai plan or an API key. Plan usage is a seat allowance with optional usage credits and spend limits. API usage is billed per token to a Console workspace, where you set workspace spend limits. Source: [Manage costs effectively](https://code.claude.com/docs/en/costs.md).

Say this to a room plainly: **the factory cannot choose which credit pays.** `maxBudgetUsd` limits what a call may spend. It does not pick a balance. Nothing in `factory/` reads a balance, a credit type or an invoice, and `cost.json` is the SDK's own estimate from token counts at the prices in `config.json`, not a bill. Which credit is drawn down is decided by Anthropic's billing, not by this repo.

What a team can do:

1. Put factory work on its own Console workspace and set a workspace spend limit there. That is the only hard stop outside the code.
2. Check the balance and expiry dates in the Console before a long run, and note when promotional credit lapses.
3. Reconcile `cost.json` against the Console usage page after a run. They should agree in order of magnitude, not to the cent.

## Steps

### 1. Print the budgets you have

```bash
npx tsx factory/main.ts 1 --dry-run
```

Read the budget column. Then answer for your workflow: how many calls can it make, and what is the per-call cap? Write the product in your notes.

### 2. Cap one stage, and watch it end

In a scratch branch, set `stages.build.maxBudgetUsd` to a very small value such as `0.05` in `.factory/config.json`. Run a docs ticket through the config runner. A build that exceeds the cap comes back failed, and `run.ts` turns a failed build into `STAGE ERROR` with a blocking verdict, so the review loop is capped by `reviewLoop.maxRounds` and the issue is labelled `needs-human`. Read `run.log` and find the line for the failed stage. Restore the value.

### 3. Handle the key

The rules, each with the file that enforces it:

- The key lives in `api/.env`, and `api/` is the only process that holds `ANTHROPIC_API_KEY` (`AGENTS.md`).
- `factory/main.ts` calls `process.loadEnvFile` inside its own process, so the key never appears on a command line, in shell history or in `ps`.
- `.gitignore` lists `.env` and `.env.*`, and `.claude/settings.json` denies `Read(**/.env*)` and `Edit(**/.env*)`, with the sandbox also denying reads of the same paths.
- In `real-host.ts` the agent gets `ANTHROPIC_API_KEY` and a short allow-list of other variables, a throwaway `HOME` and `GIT_CONFIG_GLOBAL=/dev/null`. The checks that run code the agent wrote get none of the key, no GitHub token and no global git config.
- A key in a cloud session follows F11: an environment variable is readable by anyone who uses the environment, so keep the factory key out of cloud sessions or put the run behind a network secret where the host allows it.

If a key leaks, rotate it. Do not rely on deleting the message.

### 4. Hooks are guardrails, and each fails closed

A hook is a script the harness runs on an event. Exit code 2 blocks the action. The hooks here, from `.claude/settings.json`:

| Hook                          | Event          | What it guards                                                                                                                                       |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pretooluse-secrets.mjs`      | before Bash    | a command that names a `.env` file                                                                                                                   |
| `pretooluse-file-guard.mjs`   | before an edit | `package-lock.json`, `.github/`, `.claude/hooks/` and `.claude/settings*.json`, unless the runner set `FACTORY_ALLOW_PROTECTED` for a labelled issue |
| `pretooluse-test-lock.mjs`    | before an edit | any test file while `FACTORY_PHASE=fix`                                                                                                              |
| `posttooluse-output-scan.mjs` | after any tool | key shapes in output; it warns, because the output is already shown                                                                                  |
| `stop-gate.mjs`               | stop           | finishing while the affected checks are red                                                                                                          |
| `sessionstart-integrity.mjs`  | session start  | a hook file whose hash moved                                                                                                                         |

Two properties to teach. First, the secrets hook and the test lock treat input they cannot parse as a block. Second, the secrets hook is a best-effort text match: its own header says a command that builds the name at run time slips past, and that the sandbox is the real fix. A hook is a fence, and the permission deny and sandbox are the wall. Use both.

Also: `Bash(git push *)` is denied in the same settings file. F11 explains what that does in a cloud session.

### 5. Add your own guard

Pick one thing no agent should do in your repo, such as running `npm publish`. Write a `PreToolUse` hook for Bash that reads the JSON on stdin and exits 2 with a message on stderr when the command matches. Put the match in an exported function, write a test beside it in `tests/structure/`, and register the hook in `.claude/settings.json`. Rule 0 applies: a hook that is not wired and tested did not ship. Because `.claude/hooks/` and `.claude/settings.json` are protected paths, a person makes this change, not an agent.

## Proof that bites

```bash
npx vitest run tests/structure/hooks.test.ts tests/structure/hook-catalogue.test.ts
```

Now unwire one: in a scratch copy, remove the `pretooluse-file-guard.mjs` entry from `.claude/settings.json` and run the same command. The "wires the file guard before edits" test fails. Restore it. Then run `make check`; the gate runs the same tests, so an unwired guard cannot reach `main`.

For the key: print the first line of the hook's reason by piping a fake Bash call into it from a file, not from your shell, since the hook will block a command in your own session that names the file:

```bash
printf '%s' '{"tool_input":{"command":"cat .env"}}' > /tmp/call.json && node .claude/hooks/pretooluse-secrets.mjs < /tmp/call.json; echo "exit $?"
```

Expect the "Blocked" message and `exit 2`. Your own Claude Code session may refuse to run this line for the same reason. If so, run it in a plain terminal.

## Discussion

- Your per-call cap, rounds and steps give a worst case. Is it an amount you would accept losing on a bad night?
- A promotional balance runs out on a date. What does your team do the week before?
- The output scan only warns. When is a warning the right strength, and when must a hook block?
- Which of the hooks above would you remove first, and which test would tell you it mattered?

## Sources

- [Anthropic credit terms](https://www.anthropic.com/legal/credit-terms)
- [Manage costs effectively](https://code.claude.com/docs/en/costs.md)
- [Configure cloud environments](https://code.claude.com/docs/en/cloud-environments.md)
