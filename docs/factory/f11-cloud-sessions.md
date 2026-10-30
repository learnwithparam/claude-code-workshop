# F11. Cloud sessions: run the factory away from your laptop

**Stage:** all of them. **Layer:** execution, moved off your machine. **Prerequisite:** F3 (the builder works in its own worktree) and F7 (the factory runs on a schedule you do not watch).

## Goal

Start several Claude Code cloud sessions on one repo, keep keys out of every prompt, understand why a cloud session cannot `git push` here, hand the push to a person or a gated step, and read what the sessions cost.

## Cloud or a local worktree

Both give each task its own checkout. They differ in who owns the machine.

|                      | Local worktree       | Cloud session                             |
| -------------------- | -------------------- | ----------------------------------------- |
| Where it runs        | your laptop          | an isolated VM Anthropic manages          |
| Laptop closed        | the work stops       | the work continues                        |
| What it clones       | your working tree    | the GitHub remote, at the branch you name |
| Secrets              | your shell and files | the cloud environment                     |
| Load on your machine | memory and CPU       | none                                      |
| Parallel limit       | your RAM             | your plan's rate limits                   |

Pick a local worktree for work you want to watch, and a cloud session for work you can describe in a ticket and review later. The factory already assumes this split: the builder agent has `isolation: worktree` in `.claude/agents/builder.md`, so a local run never touches your main tree either.

Source: [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web).

## What a cloud session reads from the repo

A cloud session clones the repo, so everything committed under `.claude/` comes with it: `settings.json` (hooks and permission rules, for a session with one repository), `rules/`, `skills/`, `agents/` and `commands/`. Your own `~/.claude` does not come, and neither do plugins that only your user settings turn on. Source: [Configure cloud environments](https://code.claude.com/docs/en/cloud-environments.md).

So the factory's guardrails travel with the clone. Check that before you rely on them:

```bash
node -e 'const s=require("./.claude/settings.json");console.log(s.permissions.deny);console.log(Object.keys(s.hooks))'
```

The deny list prints `Bash(git push *)` and the hook list includes `PreToolUse` and `Stop`.

## Steps

### 1. Connect GitHub and make an environment

1. In a terminal signed in to claude.ai, run `claude auth login`. An API key or Console sign-in does not work for cloud sessions.
2. Connect GitHub with the Claude GitHub App, or run `/web-setup` to send your local `gh` token to your account. The docs list the trade-off: the App reaches only repos it is installed on, `/web-setup` reaches whatever your token reaches.
3. At claude.ai/code, open the environment dialog and keep the **Default** environment, or add one named for this repo. Set its network access level, and add a setup script only if the tests need a tool that is not pre-installed. Source: [Configure cloud environments](https://code.claude.com/docs/en/cloud-environments.md).

For this repo the setup script is `npm ci`. The docs say a setup script is cached only when it finishes in roughly five minutes, so keep it to installs.

### 2. Keep secrets out of prompts

A prompt is stored in the session and can be shared with your team. Treat it as public.

- Environment variables on the environment are readable by anyone who uses it, and by any command Claude runs. The docs say not to put secrets in a shared environment's variables.
- A **network secret** is the supported route for an API key: you store it on the environment with the hosts it applies to, and Anthropic's proxy adds it to matching requests after they leave the VM. The key is not in the VM's environment or files, and you cannot read it back after saving. Source: [Add network secrets](https://code.claude.com/docs/en/cloud-environments.md#add-network-secrets).
- The proxy never attaches a secret to GitHub, `api.anthropic.com` or the public package registries. A key for those has to stay an environment variable, which is a reason to keep the factory's Anthropic key out of cloud sessions altogether.
- GitHub credentials stay on Anthropic's servers, and the VM holds a scoped credential that the GitHub proxy swaps for the real one.

This repo says the same at its own boundary. `.claude/hooks/pretooluse-secrets.mjs` blocks a Bash command that names a `.env` file, and `factory/main.ts` loads `api/.env` inside its own process so the key never appears on a command line. Do the same in a cloud prompt: write "the key is in the environment", never the key.

### 3. Start parallel sessions

Each `--cloud` command is its own session, and they run at the same time:

```bash
git push origin HEAD
claude --cloud "Run the bug-tdd workflow on issue 41. Read specs/41 first."
claude --cloud "Run the docs workflow on issue 42."
claude --cloud "Run the deps workflow on issue 43."
```

Push first: the VM clones the remote at your branch, not your local checkout. If the CLI prints `Branch <name> is not on GitHub`, the session did not start from your branch.

Give each session one ticket, one workflow and one branch. Two sessions that edit the same files recreate the problem F3 solved with worktrees, and the plan-drift check will not save you across sessions. Choose tickets whose plans list disjoint files.

### 4. Know why `git push` fails, and what the team does

`.claude/settings.json` in this repo denies `Bash(git push *)`. A cloud session reads that file from the clone, so the session's agent cannot push by running `git push`. This is on purpose: the agents hold no GitHub token in the factory (`approvalIn` in `factory/engine/real-host.ts` counts only a human's comment), and a push is the step that needs a person.

The GitHub proxy is a different layer. By the docs it rejects branch deletions and tag pushes, and it does not limit which branch a push may update, so protect `main` with a branch rule on GitHub. The proxy will not do that for you.

Three ways a team handles the deny. Pick one and write it in `AGENTS.md`:

1. **Keep the deny, a person ships.** Open the session, read the diff on the **Changes** card, and create the branch or PR from claude.ai/code yourself. Safest, and the default here.
2. **Keep the deny, teleport.** Pull the session with `claude --teleport <session-id>` into a checkout of the same repo, run `make check`, and push from your terminal. Teleport needs a clean working tree and the same account.
3. **Narrow the deny, with a hook.** Replace the blanket deny with a `PreToolUse` hook that allows `git push origin HEAD:refs/heads/factory/*` and exits 2 for anything else. Do this only after the hook has a test, and note that `.claude/settings.json` and `.claude/hooks/` are protected paths in `pretooluse-file-guard.mjs`, so a person makes the change, not an agent.

Do not delete the deny to get a session unstuck. A session that cannot push is the system working.

### 5. Poll and supervise

You do not watch a cloud session, you check on it.

```bash
claude --teleport                         # picker of your cloud sessions
claude -p "Status in one line, then stop." --cloud <session-id>
```

- `/tasks` in a local session lists background sessions, and `t` teleports into one.
- A follow-up queues into the session and returns at once. It does not wait for a reply, so poll the session list or the PR, not the command.
- A session that asks a question and sits idle can still be answered until its environment expires. After that, reopen it from claude.ai/code and the history returns, but shell commands and subagents that were running do not.
- Auto-fix (`/autofix-pr` on the PR branch) lets a cloud session react to CI failures and review comments. It posts as you, so read the docs warning about comment-triggered automation before turning it on.

Supervise by artifact, not by chat. The factory already writes them: `specs/<issue>/run.log` and `.factory/runs/<issue>/metrics.json` say which check capped out. A run that ended `needs-human` is a ticket for you, whatever the chat says.

### 6. Read the cost

- Cloud sessions count toward your plan's usage limits alongside all your other Claude usage. There is no separate charge for the VM.
- Parallel sessions share one set of rate limits and use them in proportion, so three sessions drain a window about three times as fast.
- `/usage` inside a session shows tokens by model. The dollar figure is an estimate at list price, so the Console usage page or the admin spend report is the bill.
- Agent teams inside a session multiply this again; the cost page puts it at roughly seven times a standard session in plan mode.

Source: [Manage costs effectively](https://code.claude.com/docs/en/costs.md). F13 covers caps, and F12 covers choosing a cheaper model per stage.

## Proof that bites

The deny is the control, so prove it exists and prove it fails closed.

1. Run `npx vitest run tests/structure/hooks.test.ts` and read which hooks it asserts.
2. Start a cloud session on a throwaway branch and send: "Run `git push origin HEAD` and show me the exact result." The permission rule should refuse it. Read the transcript, not a summary.
3. Remove `"Bash(git push *)"` from the deny list in a scratch copy, start another session with the same message, and see whether the push goes through. If it does, you have seen why the line exists. Delete the scratch branch afterwards.
4. Restore the line and run `make check`.

If step 2 pushes, stop. A different settings file is winning, and the docs list which settings reach a session with several repositories.

## Discussion

- Which tickets in your backlog have disjoint file lists, and so are safe to run as three sessions at once?
- The deny makes every cloud run end with a person. Is that a cost or the point?
- What does a network secret protect against that an environment variable does not?
- Your plan's limits are shared. What should wait for the night, when you are not using them?

## Sources

- [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Configure cloud environments](https://code.claude.com/docs/en/cloud-environments.md)
- [Manage costs effectively](https://code.claude.com/docs/en/costs.md)
