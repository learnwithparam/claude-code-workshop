---

name: release-notes
description: Write release notes from the merged pull requests since the last tag. Use when asked for a changelog, release notes or what shipped.
---

1. Find the last tag with `git describe --tags --abbrev=0`, then list merged PRs since it with `gh pr list --state merged --search "merged:>DATE"`.
2. Group them as Added, Changed and Fixed. One line each, in words a teacher would understand, linking the PR number.
3. Name any breaking change first, with what a reader must do about it.
4. Never invent a change. A PR you cannot place goes under Changed with its title unedited.
