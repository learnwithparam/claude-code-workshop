# Red notes, issue 35

No test or source changed this stage. `specs/35/golden` (33 tests) already covers every scenario in `spec.md`; the titles predate the spec rewrite, so the map below is the link.

Checked on `main` in a throwaway worktree: 31 of 33 fail, 2 pass. The two that pass are guards that hold on base and after: "A request with no matching template offers the full worksheet schema" and "Customer errors never expose a 529". On this branch all 33 pass because the build is already here, so the `red` check must run with `ref: base`.

| Spec scenario                                                           | Golden test                                                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| repeat prompt spends zero tokens; cache hit returns identical worksheet | cache: A repeat prompt is served from the exact cache                                                  |
| case and spacing                                                        | cache: The cache key ignores case and surrounding whitespace                                           |
| trailing punctuation                                                    | boundaries: Trailing punctuation does not change the cache key                                         |
| another band / different prompt miss                                    | cache: key includes the band; A different prompt in the same band misses the cache                     |
| unclear grade, one question, no cache                                   | cache: A clarifying question is not cached                                                             |
| failed generation not cached                                            | cache: An invalid model reply is not cached                                                            |
| marking good stores template; same twice; unknown sheet; body validated | cache: marking a sheet good (4 tests)                                                                  |
| slots, no filled content; failing check 422; zod 400                    | boundaries: edges (3 tests)                                                                            |
| fills only the slots; full schema when no match                         | boundaries: model is offered a schema of only the slots; no matching template offers the full schema   |
| rendered with template layout                                           | boundaries: A template fill is rendered with the template's layout                                     |
| missing slot rejected                                                   | templates: Slot output that fails validation is rejected                                               |
| item limit; other band                                                  | boundaries: over the band's item limit; templates: another band                                        |
| exact hit beats template; fill cached                                   | boundaries: exact cache hit wins; templates: template-filled worksheet is cached                       |
| eval fewer tokens; reports both counts; cap                             | boundaries: eval compares output tokens; Live eval refuses; templates: eval and cap                    |
| customer errors; browser sees no key                                    | boundaries: never expose a 529; templates: Customer errors reveal no internals, stores stay on the api |

Weakly pinned: "reports both token counts" is asserted only through `runTemplateEval`'s `without` and `withTemplate` fields, not through what `eval.ts` prints.
