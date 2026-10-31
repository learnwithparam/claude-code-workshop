// Data for lab-solutions.test.ts: one honest way to finish each lab, and one lazy artifact that
// has the right shape but no real content. Claude-powered steps are replaced by their output,
// because a proof reads the artifact, not how it was made.
const W = ".labs/work";
const BLOCK_ENV = `import{readFileSync as r}from"node:fs";const i=JSON.parse(r(0,"utf8"));if((i.tool_input?.file_path??"").endsWith(".env")){console.error("blocked: .env is off limits");process.exit(2)}`;
const KEBAB = `import{readdirSync as d}from"node:fs";const bad=d(process.argv[2],{recursive:true}).filter(f=>!/^[a-z0-9.-]+$/.test(String(f).split("/").pop()));bad.forEach(f=>console.log(f));process.exitCode=bad.length?1:0`;
// Same command the lab gives, so the saved file is true and only push-route.md can be lazy.
const GUARDS = `node -e 'const s=require("./.claude/settings.json");console.log(s.permissions.deny);console.log(Object.keys(s.hooks))'`;
const LAZY_KEBAB = `process.exit(process.argv[2]==="docs"?0:1)`;
export const sh = (...lines: string[]) => lines.join("\n");
const file = (path: string, body: string) => `cat > ${path} <<'EOF'\n${body}\nEOF`;

export const SOLUTIONS: Record<string, string> = {
  "start-01": sh(
    `mkdir -p ${W}`,
    `printf 'A worksheet maker.\\nThe shared folder draws each page.\\nThe api folder talks to the model.\\n' > ${W}/repo-tour.md`,
  ),
  "start-02": sh(
    `mkdir -p ${W}`,
    `printf ' ✓ shared/src/bands.test.ts (3 tests) 5ms\\n Test Files  1 passed (1)\\n      Tests  3 passed (3)\\n' > ${W}/gate.log`,
  ),
  "start-03": sh(
    `mkdir -p ${W}`,
    `printf 'Plan\\n1. Add the band to shared/src/bands.ts\\n2. Test it in shared/src/bands.test.ts\\n3. Check the render\\n4. Update the fixtures\\n5. Verify with make check\\n' > ${W}/plan.md`,
  ),
  "start-04": sh(
    `echo '- lab-note: explain each change in two plain sentences.' > CLAUDE.local.md`,
  ),
  "daily-01": sh(
    `mkdir -p ${W}`,
    `echo '{"type":"result","session_id":"3f2b8c1e-9d4a-4b7e-8a61-0c5d2e7f9a10","result":"Noted."}' > ${W}/session.json`,
    `echo tangerine > ${W}/recall.md`,
  ),
  "daily-02": sh(
    `mkdir -p ${W}/rules`,
    `printf -- '---\\npaths:\\n  - api/**\\n---\\n- a\\n- b\\n' > ${W}/rules/api-errors.md`,
  ),
  "daily-03": sh(
    `mkdir -p ${W}/skills/commit-message`,
    file(
      `${W}/skills/commit-message/SKILL.md`,
      sh(
        "---",
        "name: commit-message",
        "description: Use when you are about to commit staged changes",
        "---",
        "1. Read the staged diff with git diff --staged.",
        "2. Write a subject under 60 characters.",
        "3. Say why in the body, not what.",
      ),
    ),
  ),
  "daily-04": sh(`mkdir -p ${W}/hooks`, file(`${W}/hooks/block-env.mjs`, BLOCK_ENV)),
  "team-01": sh(
    `mkdir -p ${W}`,
    `echo '{"permissions":{"deny":["Read(./.env)","Read(./.env.*)"]}}' > ${W}/settings.json`,
  ),
  "team-02": sh(
    `mkdir -p ${W}`,
    `printf '# Review\\n- Flag a default export outside web/src/pages\\n- Flag an error that names the model\\n- Flag a file over 300 lines\\n' > ${W}/REVIEW.md`,
  ),
  "team-03": sh(`mkdir -p ${W}`, `make prove LEVEL=hand-built > ${W}/prove.txt`),
  "team-04": sh(
    `mkdir -p ${W}/plugin/.claude-plugin ${W}/plugin/skills/commit-message`,
    `echo '{"name":"my-team-kit","version":"0.1.0","description":"Our commit habit as a skill"}' > ${W}/plugin/.claude-plugin/plugin.json`,
    `echo '---' > ${W}/plugin/skills/commit-message/SKILL.md`,
  ),
  "factory-01": sh(
    `mkdir -p ${W}/specs/1`,
    `printf '## Problem\\nNo grade band for university.\\n## Done when\\n- \`make check\` exits 0\\n- \`npm test\` exits 0\\n## Out of scope\\nThe web page.\\n' > ${W}/specs/1/intent.md`,
  ),
  "factory-02": sh(
    `mkdir -p ${W}/specs/1`,
    `printf 'Given a university prompt\\nWhen the agent builds the worksheet\\nThen the worksheet band is university\\nGiven an empty prompt\\nWhen the agent builds the worksheet\\nThen the api returns status 400\\n' > ${W}/specs/1/acceptance.md`,
  ),
  "factory-03": sh(`mkdir -p ${W}`, `make factory ISSUE=1 FLAGS=--dry-run > ${W}/dry-run.txt`),
  "factory-04": sh(
    `mkdir -p ${W}`,
    `printf ' ✓ tests/contract/sse-events.test.ts (2 tests) 4ms\\n Test Files  1 passed (1)\\n      Tests  2 passed (2)\\n' > ${W}/contract.log`,
  ),
  "advanced-01": sh(
    `mkdir -p ${W}/agents`,
    file(
      `${W}/agents/reviewer.md`,
      sh(
        "---",
        "name: reviewer",
        "description: Reviews a diff for bugs. Use after any code change.",
        "tools: Read, Grep, Glob",
        "model: haiku",
        "---",
        "Read the diff and report each bug with its file and line. Never edit a file.",
      ),
    ),
  ),
  "advanced-02": sh(
    `mkdir -p ${W}`,
    `echo '{"type":"result","total_cost_usd":0.0134}' > ${W}/call.json`,
    `node -e "console.log(require('./${W}/call.json').total_cost_usd)" > ${W}/cost.txt`,
  ),
  "advanced-03": sh(`mkdir -p ${W}`, `git worktree add ${W}/wt -b lab/parallel`),
  "advanced-04": sh(`mkdir -p ${W}`, file(`${W}/check-kebab.mjs`, KEBAB)),
  "advanced-05": sh(
    `mkdir -p ${W}`,
    `${GUARDS} > ${W}/cloud-guards.txt`,
    `printf 'Keep the deny, a person ships.\\nA push is the step that needs a human.\\n' > ${W}/push-route.md`,
  ),
};

// What a learner in a hurry types: the keyword, the right count, the right shape, nothing true.
export const LAZY: Record<string, string> = {
  "start-01": sh(`mkdir -p ${W}`, `printf 'a\\nb\\nc\\n' > ${W}/repo-tour.md`),
  "start-02": sh(`mkdir -p ${W}`, `echo 'Tests 3 passed' > ${W}/gate.log`),
  "start-03": sh(
    `mkdir -p ${W}`,
    `printf 'one\\ntwo shared/nope.ts\\nthree\\nfour\\nVerify it\\n' > ${W}/plan.md`,
  ),
  "start-04": sh(`echo '- lab-note:' > CLAUDE.local.md`),
  "daily-01": sh(
    `mkdir -p ${W}`,
    `echo '{"session_id":"s"}' > ${W}/session.json`,
    `echo tangerine > ${W}/recall.md`,
  ),
  "daily-02": sh(
    `mkdir -p ${W}/rules`,
    `printf -- '---\\npaths:\\n  - nowhere/**\\n---\\n- a\\n- b\\n' > ${W}/rules/api-errors.md`,
  ),
  "daily-03": sh(
    `mkdir -p ${W}/skills/commit-message`,
    `printf 'name: commit-message\\ndescription: Use when x\\nTODO\\nTODO\\nTODO\\nTODO\\nTODO\\nTODO\\n' > ${W}/skills/commit-message/SKILL.md`,
  ),
  "daily-04": sh(
    `mkdir -p ${W}/hooks`,
    file(
      `${W}/hooks/block-env.mjs`,
      `import{readFileSync as r}from"node:fs";const i=JSON.parse(r(0,"utf8"));if(i.tool_input?.file_path===".env")process.exit(2)`,
    ),
  ),
  "team-01": sh(
    `mkdir -p ${W}`,
    `echo '{"permissions":{"deny":["Read(./.env)","Read(./.env.*)","Read(./**)"]}}' > ${W}/settings.json`,
  ),
  "team-02": sh(
    `mkdir -p ${W}`,
    `printf '# Review\\n- Flag a\\n- Flag b\\n- Flag c\\n' > ${W}/REVIEW.md`,
  ),
  "team-03": sh(`mkdir -p ${W}`, `echo 'PASS hand-built: ok' > ${W}/prove.txt`),
  "team-04": sh(
    `mkdir -p ${W}/plugin/.claude-plugin`,
    `echo '{"name":"kit","version":"0.1.0","description":"d"}' > ${W}/plugin/.claude-plugin/plugin.json`,
  ),
  "factory-01": sh(
    `mkdir -p ${W}/specs/1`,
    `printf '## Problem\\n## Done when\\n- a\\n- b\\n## Out of scope\\n' > ${W}/specs/1/intent.md`,
  ),
  "factory-02": sh(
    `mkdir -p ${W}/specs/1`,
    `printf 'Given a\\nWhen b\\nThen c\\nGiven d\\nWhen e\\nThen f\\n' > ${W}/specs/1/acceptance.md`,
  ),
  "factory-03": sh(
    `mkdir -p ${W}`,
    `printf 'stages that would run\\nreview loop\\n' > ${W}/dry-run.txt`,
  ),
  "factory-04": sh(`mkdir -p ${W}`, `echo 'Tests 4 passed' > ${W}/contract.log`),
  "advanced-01": sh(
    `mkdir -p ${W}/agents`,
    `printf -- '---\\nname: reviewer\\ndescription: d\\ntools: Read, Grep, Glob\\nmodel: haiku\\n---\\n' > ${W}/agents/reviewer.md`,
  ),
  "advanced-02": sh(
    `mkdir -p ${W}`,
    `echo '{"total_cost_usd":0.01}' > ${W}/call.json`,
    `echo 0.012 > ${W}/cost.txt`,
  ),
  "advanced-03": sh(`mkdir -p ${W}/wt`, `echo 'gitdir: /x' > ${W}/wt/.git`),
  "advanced-04": sh(`mkdir -p ${W}`, file(`${W}/check-kebab.mjs`, LAZY_KEBAB)),
  "advanced-05": sh(
    `mkdir -p ${W}`,
    `${GUARDS} > ${W}/cloud-guards.txt`,
    `printf 'hook\\nbecause\\n' > ${W}/push-route.md`,
  ),
};
