# 10 — Link and unlink Sources with Vendor Shades

**What to build:** Let Admins and Operators maintain alternate Source relationships from the Material Dialog. They can link an existing eligible Source, select the applicable Vendor Shade when known, and remove an obsolete alternate without deleting the Source or risking the Material's Preferred Source.

**Blocked by:** 07 — Edit Source data and Vendor Shades; 09 — Open the Material relationship Dialog.

**Status:** ready-for-agent

- [ ] Admins and Operators can link an existing Active Source to a Material from the Material Dialog.
- [ ] Source creation remains unavailable inside the Material Dialog.
- [ ] Retired Sources are unavailable for new links.
- [ ] Linking an Unlinked Source updates both its relationship state in the catalog and its linked-Material context on Source detail.
- [ ] A relationship may select one Vendor Shade owned by the linked Source or omit the shade when none is known.
- [ ] The API rejects a Vendor Shade belonging to another Source.
- [ ] Duplicate Material–Source links are rejected without creating duplicate persisted records.
- [ ] Admins and Operators can unlink an alternate Source after explicit confirmation.
- [ ] Direct unlinking of the Preferred Source is blocked and directs the user toward replacement instead.
- [ ] Link and unlink failures use business-language messages and preserve the open Dialog state.
- [ ] Every relationship mutation endpoint rejects unauthenticated requests.
- [ ] Focused API and route tests cover linking, duplicate rejection, shade ownership, optional shade selection, confirmation, alternate unlinking, Preferred protection, resulting catalog counts, and failure messages.
