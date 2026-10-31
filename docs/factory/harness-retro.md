# Harness retro: friction and the fixes

**Stage:** all of them. **Layer:** delivery, made configurable. **Source:** the runs that built this repo, read from `git log` and the engine code.

## Goal

Know what went wrong when the factory built its own workshop, which test now keeps each failure from coming back, and which fix is still not done. A harness that only records its successes teaches nothing.

## How to read this

Each item has what happened, the guard, and a status. Status is fixed, open or unverified. Unverified means the history or the code in this repo does not show it, so it is not claimed.

The retro stage in `.claude/skills/factory-retro/SKILL.md` proposes one change per run and may not touch `factory/`. Everything below that changed `factory/engine/` was a hand fix, merged as a `Harness` or `Harness retro` commit or inside a feature PR.

## 1. A relaunch reran the plan and voided what was approved

**What happened.** A run that was stopped and launched again ran its steps from the top. Run 28 regenerated its scenarios stage on resume, the spec text changed, and the approval no longer matched the document. A later fix found a second cause: the approval hashed every changed file, so once the build touched code the approved spec hashed differently. A third form showed up in the plan itself. The regenerated plan listed `specs/<issue>/` files the runner already allows, or left out `levels.json` when a new file needed an owner, and `plan-drift` refused it.

**Fixes.**

- `88ec1ea` (#62): resume skips every step up to the last approved gate, and plan lines under `specs/<n>/` are dropped before the plan is checked.
- `2f5d84f` (#73): spec and plan gates hash their own documents only.
- `27e4355` (#58) and `febdaf7` (#59): the plan brief says not to list `specs/<issue>/` files and to list `levels.json`.

**Guards.**

- `factory/engine/engine.test.ts`: "on resume skips every step before the last approved gate" and "keeps a spec or plan approval valid after later stages change other files".
- `factory/engine/workflows.test.ts`: "tells the planner that files under specs/<issue>/ are not listed" and "tells the planner to list levels.json and to add no commentary".

**Status.** Fixed. One part is unverified: the exact wording "the plan forgets files" does not match a commit message. The nearest recorded cause is the regenerated plan omitting `levels.json` (run 31), which is what the brief test pins.

## 2. The approval went stale on relaunch because the digest changed

**What happened.** An approval is a comment that carries a stage and a hash of the artifacts. Anything that moved the hash after the person approved made the engine ask again, and then regenerate the approved stage. This is the same event as item 1 seen from the approval side. Run 34 is the recorded case: the build changed code, the spec hashed differently, and the resume regenerated the spec.

**Fix.** `2f5d84f` (#73), above.

**Guards.**

- `factory/engine/engine.test.ts`: "binds an approval to the artifact digest, so edited artifacts need a new one" keeps the binding. "digest tells a missing file from an empty one and a moved boundary from the same text" keeps the digest honest.
- `factory/engine/engine.test.ts`: "keeps a spec or plan approval valid after later stages change other files" keeps the narrow scope.

**Status.** Fixed. The tension is deliberate: the binding stays strict for the documents a person read, and only the unrelated files are left out of the hash.

## 3. The runner's `gh` was not logged in

**What happened.** The approval check calls `gh issue view` from the runner. Agents run with an allowlisted environment and an isolated home, so they never hold a login. The runner has to, and when `gh` has no login the call fails and `approved` returns false, which looks like "nobody approved".

**Code today.** `factory/engine/real-host.ts` calls `gh` in `approved()` with the real `process.env` and says why in a comment: `gh` needs the person's login and agents never see it. `factory/engine/cli.ts` runs `gh api user` to name the approver.

**Guard.** `factory/engine/real-host.test.ts` asserts that an agent's shell does not see `ANTHROPIC_API_KEY` or `GH_TOKEN`. That guards the agent side only.

**Status.** Unverified. No commit in this repo records a run failing on a missing login, and no test runs `approved()` with `gh` logged out. The failure as a silent "not approved" is read from the code, not from a log. Fixed since: `ghPreflight` in `factory/engine/gh-preflight.ts` runs `gh auth status` before the first agent, guarded by `gh-preflight.test.ts`.

## 4. Agent worktrees had no `node_modules`

**What happened.** Checks that run a test on the base commit need a second checkout, and a fresh worktree has no installed packages.

**Fix.** `7e80b70` (#23). The base run is created at `.factory-base` inside the repo, so Node finds `node_modules` by walking up the folders and no symlink is needed. `.factory-base/` is in `.gitignore`.

**Guard.** `factory/engine/real-host.test.ts` runs a command with `ref: "base"` and reads files from the base commit plus `specs/1/`. It does not import a package.

**Status.** Fixed in code. The guard is unverified for the exact failure: no test imports a dependency from the base run, so losing the walk-up would not fail a test. The agents' own working tree is the main checkout, so this applies to the base run only. A known gap is written in `factory/stages.ts`: gitignored files are not inspected and the gate runs in the working tree.

## 5. A human gate at tier low auto-passed

**What happened.** The risk tier sets how many people approve: `low` is 0, `medium` 1, `high` 2 (`APPROVALS` in `factory/engine/risk.ts`). A step marked `gate: human` on a docs-only change is tier low, so it needed 0 approvals and passed with nobody reading it.

**Fix.** `3d6cac4` (#87), "A human gate always needs a person". `gateMet` in `factory/engine/interpret.ts` uses `Math.max(1, APPROVALS[tier])`, so the tier can only raise the count.

**Guard.** `factory/engine/wiring.test.ts`: "still needs one person for a docs-only change".

**Status.** Fixed. `APPROVALS.low` is still 0 in `risk.ts`; a step with `gate: auto` relies on that, so the floor lives in the interpreter and not in the table.

## 6. Labs and capstone tests broke the per-level snapshots

**What happened.** Each level is a snapshot built from `main` by `levels.json` ownership. Splitting the cache, template and workbook files out to the capstone and labs levels left earlier snapshots importing files they no longer had. The api server imports those modules, so every earlier level failed to typecheck with TS2307. Docs owned by a later level caused the same break for tests that read them.

**Fixes.** `3b46a09` (#88) returned ownership of the shared and api code to `hand-built` and `boundary`, and added `scripts/capstone-strip.ts`, which lists the feature in one place and deletes it from a copy to give the capstone its red start. `6e7b698` (#78) made `workflows` own `docs/factory`, with `capstone` owning `f9-capstone.md`.

**Guards.**

- `scripts/capstone-strip.test.ts`: the stripped paths all exist in the finished tree, and the strip removes the feature and nothing else.
- `tests/structure/levels.test.ts`: every file has exactly one owner.
- `tests/structure/snapshots.test.ts`: each level contains everything the earlier level had.
- `.github/workflows/check.yml`: the `levels` job runs `make levels` for each level and its gate. This is the only guard that installs and typechecks a snapshot.

**Status.** Fixed. The structure tests prove ownership. They would not have caught the TS2307 failure alone; the CI snapshot job does, and it does not run in `make check`.

## 7. Config was read from the agent-writable tree

**What happened.** The engine read `.factory/config.yaml` lazily, the first time a check asked. By then an agent had run in the same tree. A build that edited the file could change the gate commands the engine then ran.

**Fix.** `e193fc7` (#89). `pinPortable()` in `factory/engine/portable.ts` loads the file once and `runIssue` in `factory/engine/cli.ts` calls it before the first agent. Later reads return the pinned copy.

**Guard.** `factory/engine/models.test.ts`: "keeps the commands it read at the start when the file changes later".

**Status.** Partly fixed, partly open. Pinning protects against an edit after the pin. It does not protect against a tree that was already changed before the run started, because the file is still read from the working tree. The fuller fix is to read the config from the base commit, as agents and the base run already are. That is not done and has no test yet.

## 8. A high-tier gate could not be met

**What happened.** A high-tier change needs two approvals. `factory/engine/cli.ts` builds `approvers` as a list of one login, the person running the CLI. `approvalIn` counts distinct people from that allowlist, so a high-tier gate could never reach two.

**Code today.** `cli.ts` on `main` still passes `[gh("api", "user", "-q", ".login").trim()]`.

**Guard.** `factory/engine/wiring.test.ts`: "needs one approval for a medium change and two for a high one" proves the interpreter asks for two when the host supplies two. It does not exercise the CLI. A test for the CLI's approver list does not exist yet.

**Status.** Open. A separate PR is changing the approver list. This retro does not claim that fix; check the merged PR before treating the item as closed.

## What this changes in practice

- A fix to the engine lands with the test that failed on the run, in the same commit.
- A snapshot failure is found by `make levels`, so run it after moving a file between levels.
- Anything marked unverified above is a place to add evidence before relying on it.
