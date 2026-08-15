# 08 — Display the global Currency Conversion Rate

**What to build:** Display the application's single database-managed currency assumption above the Sources table so users can see the current USD/MXN context without implying that Source prices are converted or that the setting can be managed from this workflow.

**Blocked by:** 04 — Browse and filter the Source catalog.

**Status:** ready-for-agent

- [ ] The application can persist one optional global `USD:MXN` Currency Conversion Rate and Effective Date independently of any Source.
- [ ] Authenticated users can read the configured global rate through a dedicated contract.
- [ ] The Sources view displays `USD:MXN`, the mathematically reciprocal `MXN:USD`, and the Effective Date above the table.
- [ ] The two displayed directions derive from the same stored global value and cannot contradict each other.
- [ ] Missing or invalid configuration produces a clear informational message rather than a misleading numeric value.
- [ ] The Sources UI provides no control for creating or editing the global rate.
- [ ] The rate is not used to convert Purchase Price or calculate Landed Unit Cost in this slice.
- [ ] Missing configuration does not block Source browsing, creation, or editing.
- [ ] Unauthenticated requests to the rate contract are rejected.
- [ ] Focused API and route tests cover configured, missing, invalid, reciprocal, authorization, read-only, and non-blocking states.
