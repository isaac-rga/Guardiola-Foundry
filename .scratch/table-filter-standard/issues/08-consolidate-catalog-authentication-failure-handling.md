# 08 — Consolidate catalog authentication failure handling

**What to build:** After the table-filter migration, consolidate the repeated handling of `401` responses from authenticated catalog queries. Give the authenticated app one shared action for clearing the local session and returning to sign-in. Use it from the affected catalog surfaces while preserving the interaction verified in issue 07, including whether each surface redirects automatically or offers a sign-in link. This follows [PRD story 47](../PRD.md#user-stories).

**Blocked by:** [06 — Standardize Product Variant filters](06-standardize-product-variant-filters.md) and [07 — Verify and close the unified filter migration](07-verify-and-close-the-unified-filter-migration.md).

**Status:** ready-for-agent

- [ ] Review the `401` handling in Products, Sources, Bills of Materials, Pattern Sets, and the embedded Product Variants table after issue 07. Identify where each surface invokes the session-expiration flow and reuse the parent Product flow where it already handles the embedded table.
- [ ] Affected catalogs use the shared session-expiration action. Remove duplicated session clearing and sign-in navigation from catalog routes and pages, along with callbacks passed through components solely to reach that action.
- [ ] After a catalog query returns `401`, the user can sign in again and reopen the catalog successfully. A cached `401` from the previous session cannot redirect the newly authenticated user back to sign-in.
- [ ] A catalog `403` preserves the session and continues to offer **Clear all** where applicable. Recovery in the embedded Product Variants table leaves the parent Product page usable.
- [ ] Focused tests cover the shared session-expiration flow, including sign-in after a cached `401`, and any catalog-specific interaction that changes as part of the refactor.
