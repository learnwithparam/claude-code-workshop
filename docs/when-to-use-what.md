# When to use what

Pick by the job, then open the file that does it in this repo.

| You need                                     | Use                                     | Look at                                                 |
| -------------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| Facts every session must know                | `AGENTS.md`, loaded through `CLAUDE.md` | [AGENTS.md](../AGENTS.md)                               |
| A rule for one part of the code              | a path-scoped rule                      | [.claude/rules](../.claude/rules)                       |
| A repeatable procedure Claude chooses to run | a skill                                 | [issue-triage](../.claude/skills/issue-triage/SKILL.md) |
| A check Claude cannot skip                   | a hook                                  | [stop-gate.mjs](../.claude/hooks/stop-gate.mjs)         |
| A focused worker with its own tools and cap  | a subagent                              | [reviewer](../.claude/agents/reviewer.md)               |
| Independent lenses on one question           | an agent team                           | [agent teams](electives/agent-teams.md)                 |
| A fixed order of stages with budgets         | the factory runner                      | [.factory/config.json](../.factory/config.json)         |
| A scripted order inside a session            | a workflow                              | [factory.js](../.claude/workflows/factory.js)           |
| One answer from a script or CI job           | `claude -p`                             | [delivery](levels/delivery.md)                          |
| The same setup in other repos                | a plugin                                | [sharing](levels/sharing.md)                            |
| A review on every pull request               | a GitHub workflow                       | [review.yml](../.github/workflows/review.yml)           |
