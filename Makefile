.PHONY: doctor dev check check-affected prove levels claude smoke hooks eval factory

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
	npm run prove

# Only the checks the change reaches, from the impact map in repo.json. BASE=origin/main before a PR.
check-affected:
	npx tsx scripts/check-affected.ts $(if $(BASE),--base $(BASE))

prove:
	npm run prove -- $(LEVEL)

smoke:
	npx tsx api/src/smoke.ts

hooks:
	cp scripts/git/pre-commit .git/hooks/pre-commit

eval:
	npx tsx api/src/eval.ts

factory:
	npx tsx factory/main.ts $(ISSUE) $(FLAGS)

levels:
	npx tsx scripts/levels.ts $(LEVEL)

# A session that ignores your own ~/.claude, so a demo shows only this repo's config.
claude:
	CLAUDE_CONFIG_DIR=$(CURDIR)/.workshop-home claude
