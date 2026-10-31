# Auth modes: API key or Claude subscription

The factory engine (`factory/engine/main.ts`) runs its agents with one of two credentials: an Anthropic API key, billed per token, or a Claude Pro or Max subscription token, which draws from the plan's usage limits. This page says how each works, what the terms allow, and what was tested here versus read in the docs.

## Pick a mode

Set `auth` in `.factory/config.yaml`, or pass `--auth=` on one run. The flag wins.

| Value            | What the agents get                                                                  |
| ---------------- | ------------------------------------------------------------------------------------ |
| `api-key`        | the variable named in `keySource.env`, from the environment or from `keySource.file` |
| `subscription`   | `CLAUDE_CODE_OAUTH_TOKEN` from the environment; the key file is never opened         |
| `auto` (default) | the token when it is set, else the key                                               |

```
npx tsx factory/engine/main.ts <issue> --workflow=typo --auth=subscription
```

One resolver decides this: `resolveAuth` in `factory/engine/auth.ts`. The agent gets exactly the chosen credential and never both (`agentEnv`, same file). The checks that run code the agent wrote get neither (`SAFE_ENV` in `factory/engine/real-host.ts`). `factory/engine/auth.test.ts` and `factory/engine/real-host.test.ts` assert both rules, and `make check` runs them through `npm test`.

## Set up subscription mode

1. Run `claude setup-token` once, in a terminal of your own. It opens the browser, asks you to approve, and prints a token that lasts one year. It needs a Pro, Max, Ultra, Team or Enterprise plan.
2. Store the token where your shell can export it without typing it on a command line, such as your password manager's CLI or a file only you can read that your shell profile sources.
3. Run the engine with `--auth=subscription`, or leave `auth: auto` and the token is chosen first.

Why a token and not your logged-in CLI: every agent runs with a throwaway `HOME`, so a build cannot read or change your real Claude config. Your `/login` session lives in the macOS Keychain or in `~/.claude/.credentials.json`, both tied to your real config, so the isolated agent cannot see it. The engine says so: with only a stored login and no token, `auto` stops with a message that names `claude setup-token`, and `subscription` stops with the same instruction.

## Set up API-key mode

Put `ANTHROPIC_API_KEY` in `api/.env` (the `keySource` in `.factory/config.yaml`) or export it. The engine reads that one variable inside its own process, so the key is never on a command line. With a token also exported, pass `--auth=api-key` or set `auth: api-key`, because `auto` prefers the token.

## How a run is capped

| Mode           | Cap                                                                                                | Where it is set                             |
| -------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `api-key`      | dollars: each agent call has `maxBudgetUsd`, and the run stops at `spend.stopAt` of `spend.capUsd` | `.factory/config.json`                      |
| `subscription` | agent calls and tokens: the next call is refused once either is reached                            | `subscriptionCap` in `.factory/config.yaml` |

A subscription run sets no `maxBudgetUsd`, because no dollar bill exists to cap. Its cap protects the plan's shared limits instead: the same limits cover your chat on claude.ai, Claude Code in a terminal and the factory. The run summary that `main.ts` prints names the mode and the cap that applied.

## How cost is reported

The SDK's `total_cost_usd` is an estimate the client computes from a bundled price table. It is not what Anthropic bills. Under a subscription you pay the plan price, so the engine records:

- `costUsd: 0` in `cost.json`, `metrics.json` and the run summary, so the factory's spend cap and the `--report` roll-up never count list-price dollars you were not charged;
- `usage.estimatedUsd` with the SDK's estimate, `usage.tokens` summed from `modelUsage` (which includes subagents), and `usage.calls`;
- `auth` as `api-key` or `subscription`, so a roll-up can tell the two apart.

Metrics written before this change have no `auth` field and still parse.

## What the terms say

These are quotes and summaries of Anthropic's published pages as read on 31 Oct 2026. Read the pages themselves before you rely on them; they change.

- Pro, Max and Ultra plans are under the Consumer Terms. "Advertised usage limits for Pro, Max, and Ultra plans assume ordinary, individual usage of Claude Code and the Agent SDK." ([Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance))
- OAuth is "designed to support ordinary use of Claude Code and other native Anthropic applications". Developers who build products or services on the Agent SDK should use API keys. Third parties may not offer a claude.ai login or route requests through plan credentials on behalf of their users. (same page, and the [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview.md))
- "When you're signed in with your Claude plan, the Claude Agent SDK and claude -p still draw from your subscription limits." Pro and Max share five-hour and weekly limits across Claude apps. ([Use the Claude Agent SDK with your Claude plan](https://support.claude.com/articles/15036540))

What this means for the workshop: running the factory on your own repo, on your own machine, with your own plan, is individual use. Sharing one token across a team, running the factory as a service for others, or putting a personal token in an org-wide CI secret is not. Use an API key for those. The GitHub Action docs say the same about org-shared secrets. ([GitHub Actions](https://code.claude.com/docs/en/github-actions))

## Verified here versus documented

Verified by running it on 31 Oct 2026, Claude CLI 2.1.314, Agent SDK 0.3.312, on a Mac logged in to a claude.ai plan, with no token and no key in the environment:

- An SDK `query` with a throwaway `HOME` and no credential returned "Not logged in · Please run /login", `apiKeySource: none`, cost 0.
- The same query with `CLAUDE_CONFIG_DIR` pointed at the real `~/.claude` and a throwaway `HOME` also returned "Not logged in". A stored login does not reach an isolated agent.
- The resolver, the agent env, the call and token cap and the metrics fields, through the tests named above, with a stand-in for the SDK.

Documented, not tested here, because no token and no key were available on the machine that wrote this:

- That `CLAUDE_CODE_OAUTH_TOKEN` authenticates an agent under a throwaway `HOME`. ([Authentication: generate a long-lived token](https://code.claude.com/docs/en/authentication.md#generate-a-long-lived-token))
- The precedence order: cloud provider, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, `apiKeyHelper`, `CLAUDE_CODE_OAUTH_TOKEN`, then the `/login` session. The engine passes only one of these, so the order never decides a run. ([Authentication](https://code.claude.com/docs/en/authentication))
- That the token can only make model requests and is not read in `--bare` mode. (same page)
- That `total_cost_usd` is a client estimate. ([Cost tracking](https://code.claude.com/docs/en/agent-sdk/cost-tracking))

To close the first gap, run one tiny real call yourself:

```
claude setup-token
read -rs CLAUDE_CODE_OAUTH_TOKEN && export CLAUDE_CODE_OAUTH_TOKEN   # paste at the silent prompt, so it stays out of history
npx tsx factory/engine/main.ts <a docs issue> --workflow=typo --auth=subscription
```

Expect a summary with `"auth": "subscription"`, `"costUsd": 0` and a `usage` block with calls and tokens above zero.

## Left out

The older runner (`factory/main.ts` and `factory/stages.ts`) still takes the API key only. It passes the real `HOME` to its stages, so it would see a stored login; changing that is a separate ticket.
