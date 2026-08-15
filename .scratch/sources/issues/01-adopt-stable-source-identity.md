# 01 — Adopt stable Source identity

**What to build:** Expand the existing minimal Source persistence shell in place into the canonical Source identity foundation. Existing Materials must continue working while Source records move from provisional `MS-` identifiers to stable sequential `S-` identifiers, legacy spreadsheet provenance becomes optional and immutable, and Material–Source relationship constraints become safe for later mutations. Do not create a parallel Source model or table.

**Blocked by:** None — can start immediately.

Status: done

- [x] Existing Source records receive stable sequential public IDs using the `S-0001` convention, and existing `MS-` identifiers are no longer exposed as the routing contract.
- [x] Source public-ID allocation is independent of spreadsheet row order and does not reassign an existing Source during reruns.
- [x] Legacy Source ID is optional for app-created records, remains available as immutable provenance when imported, and is not used as application identity.
- [x] The existing minimal Source persistence shell is expanded in place; no competing Source model or duplicate Source table is introduced.
- [x] Database rules continue preventing duplicate Material–Source links and prevent more than one Preferred Source link for the same Material.
- [x] The authenticated Materials list continues returning Preferred Source references, derived cost, and alternate counts after the identity migration.
- [x] Existing Materials UI behavior remains operational with the new `S-` Source references.
- [x] Focused migration, API, and web tests cover ID conversion, stable allocation, nullable legacy provenance, relationship uniqueness, and preservation of the Materials experience.

## Comments

- Added an in-place PostgreSQL migration that converts existing Source IDs to `S-####`, installs a database-owned sequence/default for future allocation, makes legacy provenance nullable, protects Source identity fields from updates, and enforces one Preferred Source per Material with a partial unique index.
- Updated the existing Materials importer to preserve an existing Source's identity and let the database allocate IDs only for newly inserted Sources. Reordered imports therefore update by immutable legacy provenance without reassigning public IDs.
- Kept the authenticated Materials summary contract and lean Materials screen intact while changing Preferred Source references from `MS-####` to `S-####`.
- Review follow-up clarified that an app-created Source may receive Legacy Source ID once while it is empty. Source ID is always immutable, and a present Legacy Source ID cannot be replaced or removed. Both protections now have direct regression coverage.
- Verified with focused migration/importer tests, Materials API functional tests, the Materials web route test, migration application/status, and the repository-wide lint, typecheck, and test commands recorded in `changes.md`.
