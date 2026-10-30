R1. When a workbook is requested, the system shall produce a workbook object, validated by a zod schema in `shared/`, that contains a cover, a contents list, one or more chapters, and an answer-key appendix.
R2. When a workbook object fails schema validation, the system shall reject it and return a generic error that names no model, token count or stack trace.
R3. When the model returns workbook content through its tool input, the system shall validate that input with zod before using it.
R4. When a grade band is resolved, the system shall supply a `maxItemsPerPage` value for that band from the band table in `shared/src/bands.ts`.
R5. When a workbook is planned, the system shall assign every item in every chapter to exactly one page.
R6. When a workbook is planned, the system shall place no more items on any page than the `maxItemsPerPage` of the workbook's band.
R7. When a chapter has more items than fit on one page, the system shall split its items across consecutive pages in their original order.
R8. When a workbook is planned, the system shall list each chapter in the contents with the page number on which that chapter starts.
R9. When a workbook is planned, the system shall put every answer-key entry in the appendix, one entry for each item that has an answer, and shall order them by chapter and then by item.
R10. When the workbook check runs, the system shall report an error if any item appears zero times or more than once in the plan.
R11. When the workbook check runs, the system shall report an error if any planned page exceeds `maxItemsPerPage`.
R12. When a workbook is rendered to PDF, the system shall produce a PDF whose page count equals the page count in the plan, counting the cover, contents, chapter pages and answer-key pages.
R13. When a workbook is rendered, the system shall have `shared/` decide the layout and page breaks, and the model shall supply content only.
R14. When a user activates the make-this-a-workbook action on the web page, the web app shall send the current worksheet request to the API at `PUBLIC_API_URL` and show the returned workbook.
R15. When the API receives a make-this-a-workbook request, the system shall validate the HTTP body with zod and return a validation error to the client for an invalid body.
R16. When the API calls the model for a workbook, the system shall use `ANTHROPIC_API_KEY` only inside `api/`, and the web app shall never read or receive it.
R17. When the grade is unclear in a make-this-a-workbook request, the agent shall ask one clarifying question before filling the workbook.
R18. When a workbook request is made without the make-this-a-workbook action, the system shall continue to produce a single worksheet with its existing behaviour unchanged.
R19. When the live smoke or eval run exercises workbooks, the system shall count its token spend toward the $60 live-run cap.
R20. When any bug in the workbook plan, check or render is fixed, the change shall include a test that fails without the fix.
R21. When the PDF page-count property test runs and the headless Chromium browser that Playwright needs is not installed, the system shall fail with an error that names the missing browser and the install step. It shall not report a page-count counterexample.
R22. When `make check` runs on the change, the system shall pass with zero errors and zero warnings, with the Playwright browser installed.
