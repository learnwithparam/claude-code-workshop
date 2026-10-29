# Workshop map

Levels, one app. Each level adds one layer of the software factory and ends with a proof you can run.

| Level                                  | Layer              | Stage   | Proof                           |
| -------------------------------------- | ------------------ | ------- | ------------------------------- |
| [hand-built](levels/hand-built.md)     | audit              | audit   | `make prove LEVEL=hand-built`   |
| [boundary](levels/boundary.md)         | boundary           | design  | `make prove LEVEL=boundary`     |
| [context](levels/context.md)           | context and memory | design  | `make prove LEVEL=context`      |
| [skills](levels/skills.md)             | skills             | build   | `make prove LEVEL=skills`       |
| [execution](levels/execution.md)       | execution          | build   | `make prove LEVEL=execution`    |
| [verification](levels/verification.md) | verification       | deploy  | `make prove LEVEL=verification` |
| [delivery](levels/delivery.md)         | delivery           | improve | `make prove LEVEL=delivery`     |
| [sharing](levels/sharing.md)           | sharing            | iterate | `make prove LEVEL=sharing`      |

Take the levels in order. Each doc follows the same steps: the problem, the run without the config, the config, the run with it, a proof, an exercise.

## Start

1. `make doctor` checks your machine.
2. `npm ci`
3. `make check` runs the whole gate. It needs no API key.

If you fall behind, `make levels LEVEL=<name>` writes a finished copy of that level to `supplied/<name>/`. Open it and carry on from there.

## Official docs behind each level

- Context, rules and skills: [the .claude directory](https://code.claude.com/docs/en/claude-directory).
- Prompting, verification and context habits: [best practices](https://code.claude.com/docs/en/best-practices).

## Beyond the levels

- **Agent track**, to learn the loop under the product and under Claude Code: [one call](agent/one-call.md), [manual loop](agent/manual-loop.md), [tool runner](agent/tool-runner.md), [mini Claude Code](agent/mini-claude.md), [Agent SDK](agent/agent-sdk.md).
- **Electives**, each extends a level: [agent teams](electives/agent-teams.md), [status line](electives/status-line.md), [fast mode](electives/fast-mode.md), [chrome](electives/chrome.md), [screenshots](electives/screenshots.md), [ide](electives/ide.md), [built-in help](electives/built-in-help.md), [loop and routines](electives/loop-and-routines.md).
- **Pick the right tool**: [when to use what](when-to-use-what.md). **Every command**: [commands by level](commands-by-level.md). **Which Claude Code**: [versions](versions.md).
- **Stuck on an exercise**: `make exercise LEVEL=<name> TRACK=a` prints PASS or FAIL with a hint, and `TRACK=b` prints only the failing line.

## How the levels are kept correct

Levels are not branches and not moving tags. They are derived.

- Everyone edits `main`. That is the only copy.
- `levels.json` says which files each level adds. A test fails if any file has no owner or two owners.
- `make levels` builds each level's copy from `main`, and drops any hook that points at a script the level does not have yet.
- CI generates every level, installs it, and runs its full gate. A fix on `main` that breaks a level fails the build.
- Learners clone a dated release tag, such as `workshop-2026-10`. A tag never moves. A fix lands as a new release with a changelog, so the room always shares one version.

To fix something: change it on `main`, give new files an owner in `levels.json`, run `make check`, and release.

## After the workshop

[take-home.md](take-home.md) is the assignment: multi-page worksheets, built through your own factory.
