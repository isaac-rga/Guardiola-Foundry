# 04 — Browse and filter the Source catalog

**What to build:** Add a Sources sibling view within the Materials area where authenticated users can scan the complete operational Source catalog, find offerings through the approved search and filters, and understand link and attention state without opening every record.

**Blocked by:** 03 — Import Source details and Vendor Shades.

**Status:** done

- [x] Materials and Sources appear as sibling views while preserving their distinct row identities.
- [x] Source controlled values and public contracts are organized by domain in `packages/shared-types` and `packages/shared-validation`; API and web consume that single definition without redeclaring Textile Family, Purchase Presentation, Purchase Unit, Vendor Currency, or Source Status locally.
- [x] The Source list API returns a table-shaped projection rather than the complete technical Source payload.
- [x] Active Sources, including Unlinked Sources, appear by default and are ordered by Source Name then Vendor.
- [x] Search performs case-insensitive matching only against Source Name and Vendor.
- [x] Filters support Textile Family, authorized Source Status, Material link state, and attention state.
- [x] Search and filter state is synchronized with the URL and survives refresh.
- [x] Admins may include Retired Sources through the same table's Status filter; Operators cannot request or view Retired Source data.
- [x] The table shows Source ID, Source Name, Vendor, Textile Family, presentation and unit, Vendor Currency and Purchase Price, Landed Unit Cost, linked Material count, and attention indicators.
- [x] Technical detail fields remain outside the default table.
- [x] The complete known result set loads without pagination or infinite-scroll controls and remains responsive through efficient filtering and rendering.
- [x] The table supports horizontal scrolling when its operational columns do not fit.
- [x] Loading, empty, error, and permission states explain what the user can do next.
- [x] Every Source list endpoint rejects unauthenticated requests.
- [x] Focused API and route tests cover the list contract, authorization, default scope, search, filters, URL state, ordering, columns, responsive overflow, performance-oriented rendering behavior, and route states.
