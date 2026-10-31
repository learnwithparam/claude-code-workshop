The gate is red, but this stage didn't cause it, and I haven't fixed it. The intent stage wrote no code, and plan mode blocks me from editing anything except the plan file.

**Cause.** `shared/src/workbook-pdf.test.ts:34` calls `renderWorkbookPdf`, which launches headless Chromium through Playwright. The browser isn't installed under this session's temporary `HOME`:

`/var/folders/57/…/factory-home-VMqf5k/Library/Caches/ms-playwright/chromium_headless_shell-1248/…`

This is a missing environment dependency, not a logic failure in the workbook code. The test that exercises the "PDF page count equals the plan" property can't run until a browser exists.

**What I did not do.** I didn't run `npx playwright install`. It downloads a browser from the network into a path outside what this session was given, and it changes the machine, which plan mode doesn't allow. I also didn't edit or skip the test, because that would hide the property it checks.

**To unblock, pick one:**
- Run `npx playwright install chromium` in the runner's environment, or set `PLAYWRIGHT_BROWSERS_PATH` to a directory that already has the browser.
- Approve the install during the build stage, and I'll run it then and re-run `make check`.

My intent reply above stands unchanged. It states the outcome and the three properties the epic must meet.
