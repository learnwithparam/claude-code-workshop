# Assignments

Pick one, read the whole brief, then file it as an issue with the command in its `## File it` section. The briefs are markdown files, not issue templates, so you can read the walkthrough before you commit to the task.

Every assignment has a test that is skipped unless `ASSIGNMENT=1`. Run it red first, then make your factory turn it green. [F10](../docs/factory/f10-assignments.md) explains the steps shared by all of them.

| Assignment | Module | Level | Workflow | Red test |
| --- | --- | --- | --- | --- |
| [name the approvers for a high-risk gate](approvers.md) | F6 | principal | `feature-atdd` | `tests/assignments/approvers.test.ts` |
| [canary prompt with rollback](canary.md) | F7 | senior | `llm-eval` | `tests/assignments/canary.test.ts` |
| [add the clock activity kind](clock-activity.md) | F2 | noob | `feature-bdd` | `tests/assignments/clock-activity.test.ts` |
| [fuzz the worksheet tool input](fuzz-tool-input.md) | F4 | senior | `security` | `tests/assignments/fuzz-tool-input.test.ts` |
| [an opt-in LLM-judge hook](judge-hook.md) | F13 | senior | `feature-atdd` | `tests/assignments/judge-hook.test.ts` |
| [specify the label state machine](label-machine.md) | F1 | principal | `feature-atdd` | `tests/assignments/label-machine.test.ts` |
| [a mod of your own](my-mod.md) | F3 | senior | `feature-atdd` | `tests/assignments/my-mod.test.ts` |
| [a workflow from your own company](own-workflow.md) | F8 | senior | `feature-atdd` | `tests/assignments/own-workflow.test.ts` |
| [record each factory module from a real run log](recording-from-run-log.md) | F0 | senior | `docs` | `tests/assignments/recording-from-run-log.test.ts` |
| [add a performance review lens](review-lens.md) | F5 | senior | `llm-eval` | `tests/assignments/review-lens.test.ts` |
| [a model for every stage name](stage-names.md) | F12 | noob | `llm-eval` | `tests/assignments/stage-names.test.ts` |
| [move worksheet templates into a database](template-db.md) | F8 | senior | `spike` | `tests/assignments/template-db.test.ts` |
| [seed a 3-sigma breach and run the incident workflow](three-sigma-incident.md) | F7 | principal | `incident` | `tests/assignments/three-sigma-incident.test.ts` |
| [render a worksheet as a HyperFrames video](worksheet-video.md) | F8 | senior | `ui-visual` | `tests/assignments/worksheet-video.test.ts` |

Levels: `noob` needs only the start and daily lanes, `senior` the team and factory lanes, `principal` a design decision that has a cost.
