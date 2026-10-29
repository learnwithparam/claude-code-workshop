# Claude Code workshop: Worksheet Studio

A chat agent that turns a prompt into a printable worksheet for any grade, from early reader to university. You build it, then you build the factory that builds it.

```
make doctor      check your machine
make check       the gate: lint, types, tests, build, every level's proof
make prove LEVEL=boundary
```

| Level        | Layer              | What it proves                                                                 |
| ------------ | ------------------ | ------------------------------------------------------------------------------ |
| `hand-built` | audit              | every band renders and lints clean, no API calls                               |
| `boundary`   | boundary           | the API key exists only in `api/`, never in the bundle, image or shell         |
| `context`    | context and memory | `AGENTS.md` and path-scoped rules load, and the repo obeys them                |
| `skills`     | skills             | skills are pinned and intact; the agent hits every band under the token budget |
| `execution`  | execution          | every agent and stage has a model, turn cap, tools and budget                  |
| `delivery`   | delivery           | tickets flow triage to verify, the review loop is capped, a human merges       |
| `sharing`    | sharing            | the factory installs from a marketplace as one plugin built from `.claude/`    |

Install the factory in your own repo:

```
claude plugin marketplace add learnwithparam/claude-code-workshop
claude plugin install factory-kit@claude-code-workshop --scope project
```

Start at [docs/README.md](docs/README.md). Levels are listed in `levels.json`. Fix things on `main`; `make levels` derives each level's copy from it.
