# 01 — Establish remote Product search and URL state

**What to build:** Move Product name search to the server and make the Products catalog's effective search and filter configuration durable in the route URL while preserving the existing visible controls for this slice. Users should receive partial, case-insensitive Product name matches, keep the prior rows while a debounced request refreshes, and navigate meaningful filter configurations with browser history. Lifecycle Status, Product Status, Product Category, and Collection continue to filter locally over the server-returned search result.

**Blocked by:** None — can start immediately.

**Status:** complete

- [x] The Products endpoint accepts a validated optional Product name search together with Include deleted, returns partial case-insensitive matches, and rejects explicit unauthorized historical inclusion with `403`.
- [x] Products search updates the input immediately, applies the effective remote query after 250 ms, retains previous rows while refreshing, and exposes an accessible updating status.
- [x] Search and all Product catalog criteria hydrate from and synchronize to validated URL parameters, with defaults omitted and invalid values canonicalized.
- [x] Search typing replaces browser history, while discrete add, edit, remove, and clear operations create navigable entries whose complete configurations are restored by Back and Forward.
- [x] Product query identity and mutation invalidation account for effective search and Include deleted so cached result sets remain correct.
- [x] Focused API and web tests prove remote search, URL/history behavior, authorization, retained rows, and accessible refresh feedback without changing the approved filter UI yet.
