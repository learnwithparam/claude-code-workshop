# F0.1 Anatomy: every file the factory reads

**Stage:** setup. **Layers:** context, boundary, skills, execution, sharing. **Workflows:** all of them use these files.

## Goal

Know what each file in `.claude/`, `.factory/` and the repo root does, which one wins when two disagree, and which hook pattern guards what. By the end you can open an unfamiliar repo and say which file would change a given behaviour.

## The `.claude` files in this repo

| File or folder                           | Does                                                                    | Look at                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `AGENTS.md`, loaded by `CLAUDE.md`       | facts every session needs: commands, map, standards, done               | `CLAUDE.md` is `@AGENTS.md` plus a compaction line                    |
| `.claude/rules/*.md`                     | a rule that loads only when a file matching its `paths` is touched      | `.claude/rules/api.md` has `paths: api/**`                            |
| `.claude/settings.json`                  | permissions, sandbox, hooks, shared with the team                       | denies reading `.env` files and `.factory/holdout/**`, and `git push` |
| `.claude/settings.local.json`            | your own overrides, gitignored                                          | listed in `.gitignore` and `.worktreeinclude`                         |
| `CLAUDE.local.md`                        | your own notes, gitignored                                              | example in `docs/examples/CLAUDE.local.md`                            |
| `.claude/skills/<name>/SKILL.md`         | a procedure Claude chooses to run, from its description                 | `issue-triage`, `test-driven-development`, `factory-retro`            |
| `.claude/commands/*.md`                  | a prompt you run by name, one file                                      | `/gate` runs `make check`                                             |
| `.claude/agents/*.md`                    | a worker with its own tools and cap                                     | see the frontmatter below                                             |
| `.claude/agent-memory/<agent>/MEMORY.md` | notes an agent keeps between sessions                                   | `reviewer/MEMORY.md`                                                  |
| `.claude/output-styles/*.md`             | how replies read                                                        | `teaching.md`                                                         |
| `.claude/workflows/factory.js`           | a scripted order of stages inside a session                             | pinned by `tests/structure/factory-workflow.test.ts`                  |
| `.claude/hooks/*.mjs`                    | code the harness runs on an event                                       | registered in `settings.json`                                         |
| `.claude/teams.json`                     | agent-team settings and the `TeammateIdle` hook                         | `teammateMode: in-process`                                            |
| `.mcp.json`                              | an MCP server; here GitHub, with the token read from `GITHUB_MCP_TOKEN` | no secret in the file                                                 |
| `.worktreeinclude`                       | gitignored files a new worktree still gets                              | `CLAUDE.local.md`, `.claude/settings.local.json`                      |
| `REVIEW.md`                              | what a failure looks like here, read by the reviewer first              | nit cap, `file:line` evidence, round rules                            |
| `docs/managed-settings.example.json`     | rules nobody on the team can override                                   | an example, not installed by this repo                                |

`docs/when-to-use-what.md` is the same table by job, and `tests/structure/when-to-use-what.test.ts` keeps it honest.

### Agent frontmatter used here

- `builder`: `isolation: worktree`, `permissionMode: acceptEdits`, `maxTurns: 40`, tools `Read, Edit, Write, Bash, Grep, Glob`.
- `verifier`: `permissionMode: plan`, no `Edit` or `Write` in its tools.
- `reviewer`: `memory: project`, and no `Edit` or `Write` in its tools.
- `planner`: tools `Read, Grep, Glob` only.

A workflow step names an agent from this folder, so these fields are what limit a stage. `tests/structure/agent-frontmatter.test.ts` asserts the verifier's `permissionMode`, the builder's `isolation`, the reviewer's `memory` and a `maxTurns` on every agent. The tool lists are not asserted.

## Precedence

When two settings files disagree, Claude Code's documentation orders them: managed settings, then command-line flags, then `settings.local.json`, then project `settings.json`, then your user settings. A `deny` rule in any layer wins over an `allow`. This repo does not test precedence, so treat the order as the docs' claim and check it with `/permissions` in a session. `CLAUDE.local.md` is read after `CLAUDE.md`, so a local note can add to a team rule but should not be relied on to cancel one.

## `.factory/`

- `config.yaml`: what a repo supplies so the engine runs on it unchanged: the gate command, the test commands (`unit`, `e2e`, `eval`, `prose`, `prepush`, `mutation`), the `contract`, `holdout` and `source` paths, the name of the key variable and the file that may define it, the globs a plan may never list, and the one plan brief every plan step uses. `factory/engine/portable.ts` validates it with zod. It holds no key value. The CLI calls `pinPortable()` before the first agent runs, so a build that edits the file cannot change the commands the gate runs: the working tree is not read for it again.
- `config.json`: per stage model, `maxTurns`, `maxBudgetUsd` and `permissionMode`; which stage each workflow step takes its model from (`stepStages`); `routes` by ticket type; the run's spend cap (`spend.capUsd`, `spend.stopAt`); the allowed model list; prices; the review round cap; the labels (`factory:ready`, `plan:approved`, `needs-human`). `factory/config.ts` holds the schema, and F12 covers how the engine reads it. `runIssue` in `factory/engine/cli.ts` loads it once and hands the object to the run, so an edit during the run changes nothing.
- `workflows/<name>.yaml`: one workflow each, parsed by `factory/engine/workflow.ts`.
- `bands.yaml`: metrics with a direction and a window, read by `factory/engine/bands.ts`. Tests exercise it; no real run reads it yet.
- `holdout/<n>/`: cases the builder must not read. `settings.json` denies reading them, but no `.factory/holdout/` folder is committed in this checkout, so the deny is wiring waiting for a case.
- `runs/<n>/`: `metrics.json` per engine run, and `cost.json` from the older runner. Gitignored. The engine writes its own `run.log` and `cost.json` to `specs/<n>/`.

## Hook patterns

Each hook in `.claude/hooks/` is one pattern, and `tests/structure/hooks.test.ts` and `hook-catalogue.test.ts` feed each one bad input.

| Pattern                    | Hook                                                         | Behaviour                                                                            |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Block before the tool runs | `pretooluse-secrets.mjs`, `pretooluse-file-guard.mjs`        | refuses the call, with a reason                                                      |
| Block tests during a fix   | `pretooluse-test-lock.mjs`                                   | active only when `FACTORY_PHASE=fix`                                                 |
| Gate the finish            | `stop-gate.mjs`                                              | blocks stopping while the gate fails; lets the second stop through so it cannot loop |
| Warn only                  | `posttooluse-length-warn.mjs`, `posttooluse-output-scan.mjs` | tells the model, never blocks                                                        |
| Fail safe                  | `posttooluse-format.mjs`                                     | a missing formatter does not fail the edit                                           |
| Integrity hash             | `sessionstart-integrity.mjs`                                 | names a hook or settings file whose hash moved since last session                    |
| Route a prompt             | `userpromptsubmit-route.mjs`                                 | adds a skill hint, never blocks                                                      |
| Log                        | `posttooluse-session-log.mjs`, `teammateidle-log.mjs`        | records, changes nothing                                                             |

Hooks are code the harness runs, so they enforce what a line in `AGENTS.md` can only ask for.

## Mods

`plugins/factory-status` is a mod: it draws the newest `.factory/runs/<n>` ticket, spend and last log line above the prompt, and shows nothing when no run exists. Its `register(on)` handles `session.start`, `turn.complete` and `ui.render`. Its README gives `claude plugin validate plugins/factory-status` and `claude plugin test plugins/factory-status`. `plugins/factory-kit` packages agents, skills and a secrets guard for other repos.

## Steps you run

1. `cat .claude/settings.json` and match each hook entry to a file in `.claude/hooks/`.
2. Start `claude` in this repo and run `/memory`, then `/context`. Expect `AGENTS.md` loaded through `CLAUDE.md`.
3. Open `.claude/agents/verifier.md` and `builder.md` side by side and list which tools each lacks.
4. `npx vitest run tests/structure` runs every structural test.
5. `claude plugin validate plugins/factory-status`.

## Proof that bites

In `.claude/hooks/pretooluse-test-lock.mjs`, change `FACTORY_PHASE !== "fix"` to `FACTORY_PHASE !== "never"` and run:

```
npx vitest run tests/structure/review-and-test-lock.test.ts
```

Expect `test lock > blocks an edit to api/src/a.test.ts during a fix` to fail, because the hook now lets the edit through. Restore it and the test passes. It runs in `make check` through `npm test`.

## See it on a real run

`specs/26/` ran `bug-tdd`. Its `reproduce` step wrote `specs/26/golden/font-face.golden.test.ts`, and `specs/26/lock.json` lists the hash of that file. The `fix` step has `phase: fix`, which sets `FACTORY_PHASE=fix` for the hook above, and `specs/26/fix.md` says the locked test "passes", with no edit to it. The same note records that `make check` lint still failed on `specs/26/lock.json` formatting, a runner-owned file the agent left alone. The run commits its own `run.log` as an audit artifact; `.gitignore` excludes `*.log` but keeps `specs/*/run.log`, so runs made before that exception have none.

## Discussion

1. Which of your team's rules sit only in a doc, and which file type above would make each one a check?
2. The test lock is a hook and `lock` is a check. What does each catch that the other misses?
3. Who in your org should own managed settings, and what would you put in the deny list first?
