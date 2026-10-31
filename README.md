# Claude Code workshop: Worksheet Studio

A chat agent that turns a prompt into a printable worksheet for any grade, from early reader to university. You build it, then you build the factory that builds it.

```
make doctor      check your machine
npm ci
make check       the gate: lint, types, tests, build, every level's proof
make prove LEVEL=boundary
```

## Learning map

Go top to bottom. The full map with every link is [docs/README.md](docs/README.md).

1. Levels, hand-built to capstone: [hand-built](docs/levels/hand-built.md), [boundary](docs/levels/boundary.md), [context](docs/levels/context.md), [skills](docs/levels/skills.md), [execution](docs/levels/execution.md), [verification](docs/levels/verification.md), [delivery](docs/levels/delivery.md), [sharing](docs/levels/sharing.md), [workflows](docs/levels/workflows.md), [capstone](docs/levels/capstone.md). Each ends with `make prove LEVEL=<name>`.
2. Software Factory modules, F0 overview to F13 spend and safety: start at [f0-overview](docs/factory/f0-overview.md), then follow F1 to F13 in [docs/README.md](docs/README.md#2-software-factory-modules-f0-to-f13). Try it with `make factory ISSUE=1 FLAGS=--dry-run`.
3. Labs, noob to advanced, lanes `start`, `daily`, `team`, `factory`, `advanced`: `make next` shows the next lab, `make lab` runs its proof, `make lab HINT=1` reveals a hint, `make progress` shows the lane map. See [docs/labs/README.md](docs/labs/README.md).
4. Cloud sessions: [F11](docs/factory/f11-cloud-sessions.md) runs the factory away from your laptop, then [F12 model routing](docs/factory/f12-model-routing.md) and [F13 spend and safety](docs/factory/f13-spend-and-safety.md).
5. Agent track and electives: [docs/README.md](docs/README.md#5-agent-track).
6. After the workshop: [take-home](docs/take-home.md).

## Install the factory in your own repo

```
claude plugin marketplace add learnwithparam/claude-code-workshop
claude plugin install factory-kit@claude-code-workshop --scope project
```

## Keeping it correct

Fix things on `main`. `levels.json` lists the files each level owns, and `make levels` derives each level's copy from it.
