# 12 — Retire and restore Sources safely

**What to build:** Let authorized users remove unavailable offerings from active purchasing decisions without erasing sourcing history or invalidating any Material's Preferred Source. Admins can later restore an offering without silently reinstating an old purchasing choice.

**Blocked by:** 11 — Replace the Preferred Source atomically.

**Status:** done

- [x] Admins and Operators can retire an Unlinked Source after confirmation.
- [x] Before retiring an alternate Source, the user sees every affected Active Material.
- [x] Retiring an alternate preserves historical Material links while removing the Source from active alternate counts, new-link choices, and Preferred eligibility.
- [x] Retirement is blocked when the Source is Preferred for any Active Material.
- [x] A blocked Preferred retirement identifies every affected Active Material and explains that eligible replacements are required.
- [x] The retirement operation cannot leave an Active Material without exactly one eligible Preferred Source.
- [x] Admins can include Retired Sources through the Status filter and open their details in the same Source catalog workflow.
- [x] Operators cannot request Retired results, open Retired detail, or restore a Source.
- [x] Admins can restore a Retired Source while preserving its historical Material links.
- [x] Restoration never reinstates Preferred status automatically.
- [x] A restored Source is available for links immediately but becomes Preferred-eligible only when it has Landed Unit Cost.
- [x] Lifecycle errors use business language and preserve the user's working context.
- [x] Retirement and restoration endpoints reject unauthenticated requests.
- [x] Focused API and route tests cover permissions, impact previews, preserved history, selection exclusions, Preferred blocking, restoration, cost-based eligibility, and failure states.

## Comments

- 2026-09-03: Added authenticated Source retirement and Admin-only restoration. The Source detail workflow confirms retirement against every affected Active Material, blocks Preferred relationships with replacement guidance, preserves historical links, and keeps conflict details visible in place. Lifecycle mutations refresh Source and Material views; Source-row locks synchronize retirement with link and Preferred mutations so an Active Material cannot be left with an ineligible Preferred Source.
