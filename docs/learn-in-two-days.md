# Learn it in two days

Pick the track that matches the job you do. Each track has two days and uses only the pieces in this repo: labs you run, docs you read, and one page of patterns to keep. Start a lab with `make lab ID=<id>`. The [patterns](patterns.md) page lists the ideas worth taking home, each pointing at the file where it lives.

## New to Claude Code

### Day 1

- Labs: [start-01](labs/walkthrough-start.md) to start-04.
- Read: [hand-built](levels/hand-built.md), [boundary](levels/boundary.md) and [context](levels/context.md).
- You leave with: a first prompt, a gate you can run, a plan before code, and a memory file that is yours.

### Day 2

- Labs: [daily-01](labs/walkthrough-daily.md) to daily-04.
- Read: [skills](levels/skills.md), [execution](levels/execution.md) and [F0 overview](factory/f0-overview.md).
- You leave with: a resumed session, a path-scoped rule, a first skill and a first hook.

## Senior engineer

### Day 1

- Labs: the daily lane, then [team-01](labs/walkthrough-team.md) to team-04.
- Read: [verification](levels/verification.md) and [delivery](levels/delivery.md).
- You leave with: deny rules for secrets, review rules, a proof with a receipt, and a plugin you can hand to a teammate.

### Day 2

- Labs: [factory-01](labs/walkthrough-factory.md) to factory-05.
- Read: [F0](factory/f0-overview.md), [F1 plan](factory/f1-plan.md), [F2 design](factory/f2-design.md), [F3 build](factory/f3-build.md) and [F4 test](factory/f4-test.md).
- You leave with: an intent, acceptance before code, a dry run, a workflow contract and the checks that stop a bad test.

## Staff and principal

### Day 1

- Read: [patterns](patterns.md) first, then [F0](factory/f0-overview.md), [F3 build](factory/f3-build.md), [F5 review](factory/f5-review.md), [F6 deploy](factory/f6-deploy.md) and [F7 maintain](factory/f7-maintain.md).
- Labs: factory-06 to factory-10 in the [factory walkthrough](labs/walkthrough-factory.md).
- You leave with: how votes, risk tiers, bands, model routing and a spend cap each change a decision, and a printed value for every one.

### Day 2

- Audit one module of your choice: for every backticked name, number and quoted phrase in its doc, find the file and line that proves it, and fix the doc or the code where it does not. The structure tests under `tests/structure` hold the same line for this repo.
- Read the Principal prompts in [F5](factory/f5-review.md), [F6](factory/f6-deploy.md), [F12](factory/f12-model-routing.md) and [F13](factory/f13-spend-and-safety.md), and write one paragraph for each on what your team would do.
- Do one assignment at level principal: [approvers](../assignments/approvers.md), [label machine](../assignments/label-machine.md) or [three sigma incident](../assignments/three-sigma-incident.md).

## Team lead

### Day 1

- Read: [sharing](levels/sharing.md), [auth modes](factory/auth-modes.md), [F11 cloud sessions](factory/f11-cloud-sessions.md) and [F13 spend and safety](factory/f13-spend-and-safety.md).
- Labs: [team-01](labs/walkthrough-team.md) to team-04.
- You leave with: what a plugin spreads, whose credentials a cloud run uses, and what a run is allowed to cost.

### Day 2

- Plan the rollout: managed settings (the team lane and auth modes), a review policy ([F5](factory/f5-review.md)) and a spend limit ([F13](factory/f13-spend-and-safety.md)).
- Hand out assignments at level senior from the [assignments](../assignments/README.md) table.
- You leave with: one written rollout, one policy per risk, and two assignments out to the team.
