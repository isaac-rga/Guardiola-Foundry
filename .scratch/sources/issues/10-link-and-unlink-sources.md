# 10 — Link and unlink Sources with Vendor Shades

**What to build:** Let Admins and Operators maintain alternate Source relationships from the Material Dialog. They can link an existing eligible Source, select the applicable Vendor Shade when known, and remove an obsolete alternate without deleting the Source or risking the Material's Preferred Source.

**Blocked by:** 07 — Edit Source data and Vendor Shades; 09 — Open the Material relationship Dialog.

**Status:** done

- [x] Admins and Operators can link an existing Active Source to a Material from the Material Dialog.
- [x] Source creation remains unavailable inside the Material Dialog.
- [x] Retired Sources are unavailable for new links.
- [x] Linking an Unlinked Source updates both its relationship state in the catalog and its linked-Material context on Source detail.
- [x] A relationship may select one Vendor Shade owned by the linked Source or omit the shade when none is known.
- [x] The API rejects a Vendor Shade belonging to another Source.
- [x] Duplicate Material–Source links are rejected without creating duplicate persisted records.
- [x] Admins and Operators can unlink an alternate Source after explicit confirmation.
- [x] Direct unlinking of the Preferred Source is blocked and directs the user toward replacement instead.
- [x] Link and unlink failures use business-language messages and preserve the open Dialog state.
- [x] Every relationship mutation endpoint rejects unauthenticated requests.
- [x] Focused API and route tests cover linking, duplicate rejection, shade ownership, optional shade selection, confirmation, alternate unlinking, Preferred protection, resulting catalog counts, and failure messages.

## Comments

- 2026-09-03: Added authenticated Material-owned link and unlink endpoints plus Material Dialog controls for selecting an existing Active Source and optional owned Vendor Shade. Alternate unlinking requires confirmation, Preferred Sources direct users to replacement, Source creation remains catalog-only, and relationship mutations refresh Material and Source contexts without closing the Dialog on failure.
