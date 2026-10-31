# Labs: one line from first prompt to a running factory

The levels explain. The labs make you do it. Take them in order, one command at a time. Each lab has one goal, steps, a proof that is red until you finish, hints that appear one at a time, and a line on what you just learned.

Two workshops use the same path.

- **Claude Code, beginner to pro:** the `start`, `daily`, `team` and `advanced` lanes.
- **Software Factory:** the `factory` lane, after `start` and `daily`.

## Help fades as you go

Every lab declares `**Help:** guided`, `hinted` or `goal`, and the path gets harder on purpose.

- **guided** (`start`): the brief shows every command.
- **hinted** (`daily`, `team`): the steps say what to do but not which command. Each command appears as "(command in hints)" and you reveal it with `make lab HINT=1`.
- **goal** (`factory`, `advanced`): the brief is the goal and the proof, nothing else. Hints are there when you are stuck.

Help never goes down from one lane to the next, and every `advanced` lab is goal only.

## Commands

```
make progress          the lane map with a bar per lane
make next              show the next lab without running anything
make lab               show the current lab, run its proof, record a pass
make lab HINT=1        reveal the next hint, one per call
make lab ID=daily-03   work on any lab, in any order
```

Colour turns off when `NO_COLOR` is set or output is not a terminal. Progress sits in `.labs/progress.json`, which git ignores. Your work for each lab goes under `.labs/work/`, so a lab never changes tracked files.

Run Claude Code in one terminal and `make lab` in a second one beside it.

## The path

| Lab           | Lane     | Goal                                          | Pairs with                                 |
| ------------- | -------- | --------------------------------------------- | ------------------------------------------ |
| `start-01`    | start    | Ask Claude about the repo                     | [hand-built](../levels/hand-built.md)      |
| `start-02`    | start    | Run the gate yourself                         | [hand-built](../levels/hand-built.md)      |
| `start-03`    | start    | Plan before you edit                          | [context](../levels/context.md)            |
| `start-04`    | start    | Teach Claude a personal habit                 | [context](../levels/context.md)            |
| `daily-01`    | daily    | Continue where you left off                   | [hand-built](../levels/hand-built.md)      |
| `daily-02`    | daily    | Write a rule that loads only where it applies | [context](../levels/context.md)            |
| `daily-03`    | daily    | Package a habit as a skill                    | [skills](../levels/skills.md)              |
| `daily-04`    | daily    | Block a mistake with a hook                   | [boundary](../levels/boundary.md)          |
| `team-01`     | team     | Deny what Claude must never read              | [boundary](../levels/boundary.md)          |
| `team-02`     | team     | Write the review rules                        | [verification](../levels/verification.md)  |
| `team-03`     | team     | Run a proof and keep the receipt              | [verification](../levels/verification.md)  |
| `team-04`     | team     | Package your setup as a plugin                | [sharing](../levels/sharing.md)            |
| `factory-01`  | factory  | Turn a ticket into an intent                  | [F1 Plan](../factory/f1-plan.md)           |
| `factory-02`  | factory  | Write acceptance before code                  | [F2 Design](../factory/f2-design.md)       |
| `factory-03`  | factory  | See what a run would do                       | [F3 Build](../factory/f3-build.md)         |
| `factory-04`  | factory  | Check the workflow contract                   | [F8 Workflows](../factory/f8-workflows.md) |
| `advanced-01` | advanced | Write a read-only reviewer subagent           | [execution](../levels/execution.md)        |
| `advanced-02` | advanced | Measure what a call costs                     | [agent SDK](../agent/agent-sdk.md)         |
| `advanced-03` | advanced | Work in a parallel worktree                   | [agent teams](../electives/agent-teams.md) |
| `advanced-04` | advanced | Write a check that walks the whole tree       | [workflows](../levels/workflows.md)        |

## How the labs are kept correct

- A test parses every lab and fails if one lacks a goal, a help level, steps, a proof or two hints. Another fails if help drops along the lanes or a hidden command is missing from the hints.
- A test runs every proof in an empty folder and expects red, then applies a known solution and expects green. A proof that passes with no work, or can never pass, fails the build.
- A test fails if a lab or its pairing is missing from the table above.
- `levels.json` gives every lab file to trunk, so every level copy carries the labs.

To add a lab: write `labs/<lane>/NN-kebab-name.md`, add its row here, add its solution to `tests/structure/lab-solutions.test.ts`, then run `make check`.
