# Functional Test Organization Guidelines

Organize functional tests around stable business capabilities so related behavior is easy to find, change, and verify together. A test belongs to the capability that owns its principal behavior; requests to other endpoints are setup or observation and do not determine ownership.

## File boundaries

- Prefer capability-oriented files over monolithic domain suites, endpoint-by-endpoint files, or files named after delivery tickets.
- Add a new file when behavior has a distinct reason to change and no existing capability owns it.
- Use cohesion rather than a line-count limit. Files around 250–600 lines may be a useful signal, but size alone does not justify a split.
- Keep a cross-capability scenario in the file responsible for the behavior named by its assertions and principal action.
- Keep historical issue numbers out of filenames, group names, and permanent test comments. Preserve traceability through descriptive test names and reviewer evidence.

## Shared test support

- Extract shared setup when the same business or infrastructure knowledge appears at least three times.
- Give support modules a small interface that describes the scenario or capability they provide while hiding incidental request choreography.
- Keep test-specific values and assertions visible in the test.
- Keep specialized assertions beside the capability that owns them.
- Avoid a configurable catch-all builder whose interface is as complicated as the setup it replaces.

## Structural refactors

Separate structural movement from behavioral cleanup:

1. Establish a passing baseline and record the existing test names.
2. Move tests intact, preserving their names and observable assertions.
3. Relocate existing shared helpers with minimal changes.
4. Run every resulting file independently.
5. Run the complete affected functional-test directory.
6. Run focused lint and type checks when imports or helper types move.
7. Commit the verified structural split as one focused checkpoint.
8. Evaluate test consolidation and deeper scenario helpers as a separate change.

The repository-wide `pnpm quality` gate belongs to the human and CI and is run only when explicitly requested.

## Bills of Materials refactor

Split `apps/api/tests/functional/bills_of_materials/bills_of_materials.spec.ts` into:

```text
bills_of_materials/
├── catalog.spec.ts
├── creation.spec.ts
├── template_application.spec.ts
├── template_derivation.spec.ts
├── lifecycle.spec.ts
├── whole_bom_update.spec.ts
├── product_relationships.spec.ts
├── lines_costs_and_verification.spec.ts
└── support/
    └── bom_test_support.ts
```

The first checkpoint covers only the API suite and preserves all 52 existing tests and their assertions. Move the existing reusable helpers into `bom_test_support.ts` without redesigning their parameters. Keep candidate-specific assertions in `product_relationships.spec.ts`, repeat the short database cleanup hooks in each group, and leave long individual scenarios intact.

After the structural checkpoint passes, consider helper improvements only where at least three files repeat the same setup knowledge. Treat the web Bills of Materials test suite as a separate refactor with its own seams and verification evidence.

Keep the checkpoint local unless the user explicitly asks to push it.
