# 12 — Retire and restore Sources safely

**What to build:** Let authorized users remove unavailable offerings from active purchasing decisions without erasing sourcing history or invalidating any Material's Preferred Source. Admins can later restore an offering without silently reinstating an old purchasing choice.

**Blocked by:** 11 — Replace the Preferred Source atomically.

**Status:** ready-for-agent

- [ ] Admins and Operators can retire an Unlinked Source after confirmation.
- [ ] Before retiring an alternate Source, the user sees every affected Active Material.
- [ ] Retiring an alternate preserves historical Material links while removing the Source from active alternate counts, new-link choices, and Preferred eligibility.
- [ ] Retirement is blocked when the Source is Preferred for any Active Material.
- [ ] A blocked Preferred retirement identifies every affected Active Material and explains that eligible replacements are required.
- [ ] The retirement operation cannot leave an Active Material without exactly one eligible Preferred Source.
- [ ] Admins can include Retired Sources through the Status filter and open their details in the same Source catalog workflow.
- [ ] Operators cannot request Retired results, open Retired detail, or restore a Source.
- [ ] Admins can restore a Retired Source while preserving its historical Material links.
- [ ] Restoration never reinstates Preferred status automatically.
- [ ] A restored Source is available for links immediately but becomes Preferred-eligible only when it has Landed Unit Cost.
- [ ] Lifecycle errors use business language and preserve the user's working context.
- [ ] Retirement and restoration endpoints reject unauthenticated requests.
- [ ] Focused API and route tests cover permissions, impact previews, preserved history, selection exclusions, Preferred blocking, restoration, cost-based eligibility, and failure states.
