# 08 — Consolidate catalog authentication failure handling

**What to build:** After the table-filter migration, consolidate the repeated handling of `401` responses from authenticated catalog queries. Give the authenticated app one shared action for clearing the local session and returning to sign-in. Use it from the affected catalog surfaces while preserving the interaction verified in issue 07, including whether each surface redirects automatically or offers a sign-in link. This follows [PRD story 47](../PRD.md#user-stories).

**Blocked by:** [06 — Standardize Product Variant filters](06-standardize-product-variant-filters.md) and [07 — Verify and close the unified filter migration](07-verify-and-close-the-unified-filter-migration.md).

**Status:** done

- [x] Review the `401` handling in Products, Sources, Bills of Materials, Pattern Sets, and the embedded Product Variants table after issue 07. Identify where each surface invokes the session-expiration flow and reuse the parent Product flow where it already handles the embedded table.
- [x] Affected catalogs use the shared session-expiration action. Remove duplicated session clearing and sign-in navigation from catalog routes and pages, along with callbacks passed through components solely to reach that action.
- [x] After a catalog query returns `401`, the user can sign in again and reopen the catalog successfully. A cached `401` from the previous session cannot redirect the newly authenticated user back to sign-in.
- [x] A catalog `403` preserves the session and continues to offer **Clear all** where applicable. Recovery in the embedded Product Variants table leaves the parent Product page usable.
- [x] Focused tests cover the shared session-expiration flow, including sign-in after a cached `401`, and any catalog-specific interaction that changes as part of the refactor.

## Verification

- The Bills of Materials refresh regression reproduced the sign-in loop from a cached `401` and passed after the cache was scoped to the session. Routed tests also cover a late `401` from a previous session, the Product sign-in link when local credentials have already been cleared, and the unsaved Product draft confirmation before leaving from the Variants table.
- Browser checks used the running web app with an isolated API fixture. Bills of Materials and Pattern Sets redirected automatically. Products and Sources offered sign-in links, and the embedded Product Variants offered a sign-in button. Bills of Materials reopened after sign-in in the same browser tab. All five tables preserved the session on `403` and supported **Clear all**. The embedded Variants table restored the default rows while leaving the Product page usable.
- Ten focused web suites passed 155 tests. Web type checking, lint on the changed files, and independent standards and specification reviews passed.

The separately reproduced race involving an overlapping `/auth/me` verification and a newer sign-in is outside this issue's catalog-query scope.
