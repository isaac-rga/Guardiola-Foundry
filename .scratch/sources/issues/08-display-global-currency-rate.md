# 08 — Display the global Currency Conversion Rate

**What to build:** Display the application's single database-managed currency assumption above the Sources table so users can see the current USD/MXN context without implying that Source prices are converted or that the setting can be managed from this workflow.

**Blocked by:** 04 — Browse and filter the Source catalog.

**Status:** done

- [x] The application can persist one optional global `USD:MXN` Currency Conversion Rate and Effective Date independently of any Source.
- [x] Authenticated users can read the configured global rate through a dedicated contract.
- [x] The Sources view displays `USD:MXN`, the mathematically reciprocal `MXN:USD`, and the Effective Date above the table.
- [x] The two displayed directions derive from the same stored global value and cannot contradict each other.
- [x] Missing or invalid configuration produces a clear informational message rather than a misleading numeric value.
- [x] The Sources UI provides no control for creating or editing the global rate.
- [x] The rate is not used to convert Purchase Price or calculate Landed Unit Cost in this slice.
- [x] Missing configuration does not block Source browsing, creation, or editing.
- [x] Unauthenticated requests to the rate contract are rejected.
- [x] Focused API and route tests cover configured, missing, invalid, reciprocal, authorization, read-only, and non-blocking states.

## Comments

- 2026-09-02: Added a singleton `currency_conversion_rates` table, an authenticated read-only `GET /currency-conversion-rate` contract with configured/missing/invalid states, and a non-blocking informational panel above the Sources table. The reciprocal is derived from the stored USD:MXN value, no mutation route or UI is exposed, and no Source price or Landed Unit Cost calculation uses the rate.
- 2026-09-02: Added an idempotent development seed for `1 USD = 17 MXN`, effective `2026-09-02`; the setting remains database-managed and read-only in the Sources workflow.
