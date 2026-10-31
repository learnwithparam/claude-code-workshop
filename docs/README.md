# Workshop map

One app, Worksheet Studio, learned in a straight line: the levels, then the Software Factory modules, then the labs that make you do each step. Take each part in order.

## Set up

1. `make doctor` checks your machine.
2. `npm ci`
3. `make check` runs the whole gate. It needs no API key.

Behind on a level? `make levels LEVEL=<name>` writes a finished copy to `supplied/<name>/`. Open it and carry on.

## 1. Levels, hand-built to capstone

Each level adds one layer and ends with a proof: `make prove LEVEL=<name>`. Each doc runs the same steps: the problem, the run without the config, the config, the run with it, the proof, an exercise.

| Level                                  | What you learn                                              | Run                             |
| -------------------------------------- | ----------------------------------------------------------- | ------------------------------- |
| [hand-built](levels/hand-built.md)     | the app before any AI helps: every band renders and lints   | `make prove LEVEL=hand-built`   |
| [boundary](levels/boundary.md)         | a secret lives in one process, enforced by hooks            | `make prove LEVEL=boundary`     |
| [context](levels/context.md)           | `AGENTS.md` and path-scoped rules give Claude the standards | `make prove LEVEL=context`      |
| [skills](levels/skills.md)             | pinned skills hit every band under a token budget           | `make prove LEVEL=skills`       |
| [execution](levels/execution.md)       | every agent and stage has a model, turn cap and budget      | `make prove LEVEL=execution`    |
| [verification](levels/verification.md) | a fix is real only if its test bites                        | `make prove LEVEL=verification` |
| [delivery](levels/delivery.md)         | tickets flow to a pull request, a human merges              | `make prove LEVEL=delivery`     |
| [sharing](levels/sharing.md)           | the factory installs in any repo as one plugin              | `make prove LEVEL=sharing`      |
| [workflows](levels/workflows.md)       | one engine, a workflow per kind of task                     | `make prove LEVEL=workflows`    |
| [capstone](levels/capstone.md)         | rebuild a feature through your own factory                  | `make prove LEVEL=capstone`     |

## 2. Software Factory modules, F0 to F13

The same path as a ticket-to-merge pipeline. Questions: [factory FAQ](factory/faq.md).

| Module                                                  | What you learn                                        | Open or run                            |
| ------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------- |
| [F0 Overview](factory/f0-overview.md)                   | the whole path from a ticket to a merged pull request | `make factory ISSUE=1 FLAGS=--dry-run` |
| [F0.1 Anatomy](factory/f0-1-anatomy.md)                 | every file the factory reads                          | `docs/factory/f0-1-anatomy.md`         |
| [F1 Plan](factory/f1-plan.md)                           | intent, triage and the risk tier                      | `docs/factory/f1-plan.md`              |
| [F2 Design](factory/f2-design.md)                       | the spec is the first test                            | `docs/factory/f2-design.md`            |
| [F3 Build](factory/f3-build.md)                         | explore, plan, code inside a fence                    | `docs/factory/f3-build.md`             |
| [F4 Test](factory/f4-test.md)                           | evidence the model cannot talk its way past           | `docs/factory/f4-test.md`              |
| [F5 Review](factory/f5-review.md)                       | lenses, voting verifiers and a capped loop            | `docs/factory/f5-review.md`            |
| [F6 Deploy](factory/f6-deploy.md)                       | risk tiers, merge queue, CI and release               | `docs/factory/f6-deploy.md`            |
| [F7 Maintain](factory/f7-maintain.md)                   | bands, incident to eval, retro and metrics            | `docs/factory/f7-maintain.md`          |
| [F8 Workflows](factory/f8-workflows.md)                 | write a workflow and choose one per task              | `docs/factory/f8-workflows.md`         |
| [F9 Capstone](factory/f9-capstone.md)                   | rebuild the workbook and template features            | `docs/factory/f9-capstone.md`          |
| [F10 Assignments](factory/f10-assignments.md)           | pick an assignment, file it, run it                   | `docs/factory/f10-assignments.md`      |
| [F11 Cloud sessions](factory/f11-cloud-sessions.md)     | run the factory away from your laptop                 | `docs/factory/f11-cloud-sessions.md`   |
| [F12 Model routing](factory/f12-model-routing.md)       | the right model for each stage                        | `docs/factory/f12-model-routing.md`    |
| [F13 Spend and safety](factory/f13-spend-and-safety.md) | caps, credit, keys and hooks                          | `docs/factory/f13-spend-and-safety.md` |

## 3. Labs, noob to advanced

The labs are hands-on, one goal and one proof each. Full table and rules: [labs](labs/README.md). Progress sits in `.labs/`, which git ignores.

```
make progress          the lane map with a bar per lane
make next              show the next lab without running anything
make lab               show the current lab, run its proof, record a pass
make lab HINT=1        reveal the next hint, one per call
make lab ID=daily-03   work on any lab, in any order
```

| Lane       | What you learn                                                 | Run                       |
| ---------- | -------------------------------------------------------------- | ------------------------- |
| `start`    | ask about the repo, run the gate, plan first, local memory     | `make lab ID=start-01`    |
| `daily`    | resume work, scoped rules, skills, hooks                       | `make lab ID=daily-01`    |
| `team`     | deny rules, review rules, proof receipts, plugin packaging     | `make lab ID=team-01`     |
| `factory`  | ticket to intent, acceptance first, dry run, workflow contract | `make lab ID=factory-01`  |
| `advanced` | reviewer subagent, cost per call, worktrees, tree-wide checks  | `make lab ID=advanced-01` |

## 4. Cloud sessions

- [F11 Cloud sessions](factory/f11-cloud-sessions.md): connect GitHub, make an environment, run a session, pull it back with `claude --teleport <session-id>`.
- [F12 Model routing](factory/f12-model-routing.md) and [F13 Spend and safety](factory/f13-spend-and-safety.md): pick the model per stage, then cap spend before you leave a session unattended.

## 5. Agent track

Learn the loop under the product and under Claude Code: [one call](agent/one-call.md), [manual loop](agent/manual-loop.md), [tool runner](agent/tool-runner.md), [mini Claude Code](agent/mini-claude.md), [Agent SDK](agent/agent-sdk.md).

## 6. Electives

Each extends a level: [agent teams](electives/agent-teams.md), [status line](electives/status-line.md), [fast mode](electives/fast-mode.md), [chrome](electives/chrome.md), [screenshots](electives/screenshots.md), [ide](electives/ide.md), [built-in help](electives/built-in-help.md), [loop and routines](electives/loop-and-routines.md).

## Reference

- [When to use what](when-to-use-what.md), [commands by level](commands-by-level.md), [versions](versions.md), [managed settings example](managed-settings.example.json).
- Official docs: [the .claude directory](https://code.claude.com/docs/en/claude-directory) and [best practices](https://code.claude.com/docs/en/best-practices).
- Stuck on an exercise: `make exercise LEVEL=<name> TRACK=a` prints PASS or FAIL with a hint, and `TRACK=b` prints only the failing line.

## How the levels are kept correct

Levels are derived, not branches.

- Everyone edits `main`. That is the only copy.
- `levels.json` says which files each level adds. A test fails if any file has no owner or two owners.
- `make levels` builds each level's copy from `main` and drops any hook that points at a script the level does not have yet.
- CI generates every level, installs it, and runs its full gate.
- Learners clone a dated release tag, such as `workshop-2026-10`. A tag never moves.

To fix something: change it on `main`, give new files an owner in `levels.json`, run `make check`, and release.

## After the workshop

[take-home.md](take-home.md) is the assignment: multi-page worksheets, built through your own factory. `make prove-homework` stays red until your run builds them.
