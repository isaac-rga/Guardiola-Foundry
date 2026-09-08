# 16 — Harden Material and Pattern Set selection

**What to build:** Make the Material and Pattern Set dialogs dependable against large production catalogs. Search stays bounded and deterministic, retained unavailable references remain recoverable, and every loading, failure, accessibility, and stale-selection state preserves the User's current draft.

**Blocked by:** 09 — Use Pattern Sets in BOM Lines.

**Status:** ready-for-agent

- [ ] Both dialogs remain idle with empty text and issue normalized searches only after approximately 250 milliseconds of unchanged non-empty input.
- [ ] Newer queries cancel prior requests where possible, ignore late superseded responses, and clearing text returns the dialog to idle.
- [ ] Matching ignores case, accents, surrounding whitespace, and repeated internal whitespace and uses order-independent AND semantics for multiple words.
- [ ] Material matching covers Material ID, name, color, Material Use, and visible Preferred Source context while ranking Material identity above Source-only matches.
- [ ] Pattern Set matching covers stable ID and name; proposal count remains display context rather than a search field.
- [ ] Results rank by exact ID, exact primary name, ID prefix, primary-name prefix, word match, and partial secondary context, with primary name and stable identity as deterministic tie-breakers.
- [ ] Each response returns at most 25 items plus `hasMore`, determined from at most 26 ordered matches, and the UI asks the User to refine rather than offering pagination or Load more.
- [ ] Identical searches may reuse a 30-second session-local cache, and relevant Material, Source, Pattern Set, or BOM mutations invalidate only the affected search family.
- [ ] Persisted references resolve by stable identity; retained unavailable records remain visible and removable, and missing details fall back to stable identity plus `Details unavailable`.
- [ ] Newly selected Materials deleted before Save and Pattern Sets retired before Save are rejected with field-level reasons while unchanged retained references remain saveable.
- [ ] Idle, debouncing, loading, results, more-matches, empty, recoverable failure, authentication failure, authorization failure, retained-unavailable, and details-unavailable states never silently clear the current selection.
- [ ] Successful selection closes the dialog, restores focus to the trigger, and announces the result; native controls support Tab, Enter or Space, and Escape with a discreet live region.
- [ ] Narrow screens use the same workflow in a near-full-screen vertically stacked dialog.
- [ ] A repeatable performance check demonstrates server-response p95 at or below 500 milliseconds for each catalog against at least 10,000 active records, measured separately from debounce.
- [ ] Focused database-backed search and route tests cover normalization, ranking, bounds, caching, invalidation, stale references, all UI states, keyboard and focus behavior, live announcements, and performance.
