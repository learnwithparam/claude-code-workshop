.PHONY: factory-maintain lab next progress prove-homework doctor dev check check-affected prove levels claude smoke hooks eval factory exercise

doctor:
	@node -v | grep -qE '^v2[2-9]' && echo "ok node $$(node -v)" || (echo "need Node 22+" && exit 1)
	@claude --version 2>/dev/null || echo "warn: claude not on PATH (need 2.1.302 or newer)"
	@command -v gitleaks >/dev/null && echo "ok gitleaks" || echo "warn: gitleaks missing, make hooks will not scan commits"
	@gh auth status >/dev/null 2>&1 && echo "ok gh" || echo "warn: gh not logged in, the factory needs it"

dev:
	npm run dev -w web

# The gate. Every proof is wired in here, so an unwired check cannot exist.
check:
	npm run lint
	npm run typecheck
	npm test
	npm run build -w web
	npm run e2e
	npm run prove

# Only the checks the change reaches, from the impact map in repo.json. BASE=origin/main before a PR.
check-affected:
	npx tsx scripts/check-affected.ts $(if $(BASE),--base $(BASE))

prove:
	npm run prove -- $(LEVEL)

# The take-home. Red until your factory run builds multi-page worksheets; skipped in make check.
prove-homework:
	HOMEWORK=1 npx vitest run tests/take-home

smoke:
	npx tsx api/src/smoke.ts

hooks:
	cp scripts/git/pre-commit .git/hooks/pre-commit

eval:
	npx tsx api/src/eval.ts

factory:
	npx tsx factory/main.ts $(ISSUE) $(FLAGS)

# Judges the recorded run metrics against .factory/bands.yaml. ISSUE=<n> is where a 3 sigma breach writes intent.md.
factory-maintain:
	npx tsx factory/engine/main.ts --maintain $(or $(ISSUE),0)

# PASS or FAIL for one level's proof. TRACK=a adds the hint; TRACK=b prints only the failing line.
exercise:
	npx tsx scripts/exercise.ts $(LEVEL) $(TRACK)

levels:
	npx tsx scripts/levels.ts $(LEVEL)

# A session that ignores your own ~/.claude, so a demo shows only this repo's config.
claude:
	CLAUDE_CONFIG_DIR=$(CURDIR)/.workshop-home claude

# Hands-on labs, start to advanced. HINT=1 reveals one hint; WATCH=1 reruns the proof on each save; PATH_ID=pro|factory picks your workshop; ID=<lab> picks a lab; GUESS="..." saves your answer to the Predict question (make exports it to the script as an environment variable); progress is in .labs/ (gitignored).
lab:
	npx tsx scripts/labs/main.ts lab $(ID) $(if $(PATH_ID),--path=$(PATH_ID)) $(if $(HINT),--hint) $(if $(WATCH),--watch)

next:
	npx tsx scripts/labs/main.ts next

progress:
	npx tsx scripts/labs/main.ts progress
