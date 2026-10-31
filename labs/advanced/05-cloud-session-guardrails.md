# Check the guardrails a cloud session inherits

**Pairs with:** `docs/factory/f11-cloud-sessions.md`
**Help:** goal

## Goal

Show which guardrails a cloud session inherits from this repo, and predict what happens when it tries to push.

## Steps

1. Read the section "What a cloud session reads from the repo" in `docs/factory/f11-cloud-sessions.md`. A cloud session clones the repo, so what is committed in `.claude/` travels with it.
   Expect: The section explains that a cloud session clones the repo and reads `.claude/`. You are reading, so nothing prints.
2. Make the folder: `mkdir -p .labs/work`.
   Expect: No output. The folder `.labs/work` now exists.
3. Run the command from that section and save what it prints: `node -e 'const s=require("./.claude/settings.json");console.log(s.permissions.deny);console.log(Object.keys(s.hooks))' > .labs/work/cloud-guards.txt`.
   Expect: No output on screen, because it goes to `cloud-guards.txt`. The file lists the deny rules, including the push rule, then a line of hook names that includes `PreToolUse`.
4. Read the file. Find the push deny and the `PreToolUse` hook, and say to yourself what a cloud session does when it runs a push.
   Expect: You see the push deny in the first list and `PreToolUse` in the second. Nothing is printed for this step.
5. Write `.labs/work/push-route.md`: name one route from the section "Know why `git push` fails" (a person ships, teleport, or a tested hook) and give one reason you chose it.
   Expect: No output from a command, since you are writing the file. Afterwards `push-route.md` names one route and one reason.
6. Optional: start a real session with `claude --cloud` and ask it to run a push and show the exact result, then read the transcript. This needs a claude.ai login, so the proof does not ask for it.
   Expect: The session starts in the cloud and its push attempt is refused. The exact wording will differ. Skip this step if you have no claude.ai login.

## Proof

1. cloud-guards.txt matches the deny list and hook names that `.claude/settings.json` holds now.

   ```sh
   f=.labs/work/cloud-guards.txt
   node -e 'const s=require("./.claude/settings.json");console.log(s.permissions.deny);console.log(Object.keys(s.hooks))' | diff -q - $f >/dev/null
   ```
2. cloud-guards.txt lists the push deny and the PreToolUse hook.

   ```sh
   f=.labs/work/cloud-guards.txt
   grep -qF 'Bash(git push *)' $f || exit 1
   grep -q PreToolUse $f
   ```
3. push-route.md gives a route and a reason on separate lines.

   ```sh
   r=.labs/work/push-route.md
   grep -qiE 'person ships|teleport|hook' $r || exit 1
   test "$(grep -c . $r)" -ge 2
   ```

## Hints

1. The command prints two things: the deny list, then the names of the hooks. Redirect both into the file with `>`. The commands are `mkdir -p .labs/work` and `node -e 'const s=require("./.claude/settings.json");console.log(s.permissions.deny);console.log(Object.keys(s.hooks))' > .labs/work/cloud-guards.txt`. For the optional step, run `claude --cloud` and ask it to run `git push`.
2. The proof compares your file with what `.claude/settings.json` holds right now, so save it again after any change to that file.
3. `push-route.md` needs a route and a reason on separate lines, for example: "Keep the deny, a person ships." then "A push is the step that needs a human."

## What you just learned

The guardrails travel with the clone, so a cloud session cannot push here, and a saved copy of them goes stale the moment the settings change.
