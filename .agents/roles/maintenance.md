# Maintenance

Repository-wide instructions remain in `../../AGENTS.md`. Load `.agents/roles/development.md` when maintenance work also changes implementation.

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
