# Elective: Chrome

**Extends:** verification. **Proof:** Compare a Chrome review with the design reviewer by hand.

## Goal

Your own browser holds the state a headless test never sees, such as a logged-in session.

## The problem

Your own browser holds the state a headless test never sees, such as a logged-in session.

## Without

Review a page that needs a login with the headless design reviewer. It cannot sign in.

## The config

- `/chrome` connects Claude to your real Chrome through the Claude in Chrome extension, with your sign-ins.
- `.claude/agents/design-reviewer.md` is the headless alternative: it builds the app and opens it at 375 and 1280 px.

## With

Connect with `/chrome`, then ask Claude to open the running app and report overflow at a narrow window.

## Run it

1. Type `make dev`.
2. Type `/chrome` in a session and follow the prompts.
3. Ask for a layout review of the page.

## Prove it

There is no offline proof, because it needs your browser. The headless route is covered by `tests/e2e/layout.e2e.ts`.

## Exercise

Track A: compare the two reviewers on one band. Track B: list what only the real browser can see.

## Discussion

What does a headless check miss that you would catch by eye?
