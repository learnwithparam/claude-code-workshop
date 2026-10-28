# Skills: the agent hits every band under a token budget

**Layer:** skills. **Proof:** `make prove LEVEL=skills`.

## Goal

Package know-how as a skill, pin it, and prove the agent that uses it is both correct and cheap.

## The problem

An agent that writes the whole worksheet as HTML spends about 6,000 tokens and gets the band wrong. An agent that fills a JSON schema, with layout decided by `shared/`, spends about 1,100 and is right.

## Without

Ask the model for finished HTML for a kindergarten worksheet. Count the output tokens and run `checkBand`. It fails.

## The config

- `api/src/agent/agent.ts` uses the Messages API tool runner with one tool, `submit_worksheet`. The tool runs `checkBand` and returns problems to the model.
- `api/src/agent/prompt.ts` is short, marked for caching, and defaults to six items.
- `.claude/skills/worksheet-bands/SKILL.md` is the repo's own skill. Three more are vendored from `addyosmani/agent-skills` and pinned by hash in `skills.lock`.
- `fixtures/eval.json` is a recorded run of seven prompts on Claude Haiku 5.5.

**Which SDK?** The Messages API tool runner is for an agent inside your product: one tool, one model, no extra system context. The Agent SDK is for an agent that works on your codebase, so the factory uses it.

## With

Run `make eval` and compare. Seven of seven worksheets pass their band, median 1,098 output tokens.

## Run it

1. Type `make smoke`. Say "a worksheet". Expect exactly one question about the grade.
2. Answer "grade 3 maths". Expect a worksheet and a usage line.
3. Type `make eval`. Expect 7/7 on band. This spends about two cents.

## Prove it

`make prove LEVEL=skills` checks each skill has a name and description, verifies the hashes in `skills.lock`, and replays `fixtures/eval.json`: 7/7 on band and a median under 1,200 tokens. It costs nothing.

## Exercise

Track A: change a skill file and watch the lock fail. Track B: add an eighth eval prompt and re-record the fixture.

## Discussion

What would you package as a skill in your own team, and who reviews changes to it?
