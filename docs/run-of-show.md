# Run of show

Two workshops share this repo. Pick the one you teach. Every block has one live command and a fallback if it misbehaves.

Before the room fills: `make doctor`, `npm ci`, `make check`. Fallback for a slow laptop: `make levels LEVEL=<name>` writes a finished copy to `supplied/<name>/`.

## Claude Code, beginner to pro

Learners run `make lab PATH_ID=pro` once. Lanes: `start`, `daily`, `team`, `advanced`.

| Block    | Teach                              | Live command              | Fallback                                             |
| -------- | ---------------------------------- | ------------------------- | ---------------------------------------------------- |
| Open     | the app and the gate               | `make check`              | read `docs/README.md` aloud                          |
| Start    | ask, plan first, local memory      | `make lab ID=start-01`    | [walkthrough-start](labs/walkthrough-start.md)       |
| Daily    | rules, skills, hooks               | `make lab ID=daily-01`    | [walkthrough-daily](labs/walkthrough-daily.md)       |
| Team     | deny rules, review rules, plugin   | `make lab ID=team-01`     | [walkthrough-team](labs/walkthrough-team.md)         |
| Advanced | reviewer subagent, cost, worktrees | `make lab ID=advanced-01` | [walkthrough-advanced](labs/walkthrough-advanced.md) |
| Close    | what to take home                  | `make progress`           | [take-home](take-home.md)                            |

Individuals work at their own pace with `make next`. A team splits by lane and compares `make progress`.

## Software Factory

Learners run `make lab PATH_ID=factory` once. Lanes: `start`, `daily`, `factory`.

| Block    | Teach                                | Live command                           | Fallback                                           |
| -------- | ------------------------------------ | -------------------------------------- | -------------------------------------------------- |
| Open     | the path from ticket to merged PR    | `make factory ISSUE=1 FLAGS=--dry-run` | [F0](factory/f0-overview.md)                       |
| Contract | intent, acceptance first             | `make lab ID=factory-01`               | [walkthrough-factory](labs/walkthrough-factory.md) |
| Checks   | evidence the model cannot argue with | `make lab ID=factory-05`               | read [F4](factory/f4-test.md)                      |
| Review   | three voters, two needed             | `make lab ID=factory-06`               | read [F5](factory/f5-review.md)                    |
| Maintain | a metric outside its band            | `make lab ID=factory-07`               | read [F7](factory/f7-maintain.md)                  |
| Spend    | caps, keys, hooks                    | `make factory ISSUE=1 FLAGS=--dry-run` | [F13](factory/f13-spend-and-safety.md)             |
| Close    | pick an assignment                   | `make progress`                        | [F10](factory/f10-assignments.md)                  |

Individuals use the dry run and never need a key. A team that runs live uses a workspace API key with a spend limit, and reads [when a CI agent fails at zero dollars](factory/f13-spend-and-safety.md#when-a-ci-agent-fails-at-zero-dollars) first.
