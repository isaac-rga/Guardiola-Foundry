# Functional Test Organization

Organize functional tests around stable business capabilities. A test belongs to the capability that owns its principal action and assertions; calls to other capabilities are setup or observation.

## File boundaries

- Prefer capability-oriented files over monolithic suites, endpoint groupings, or ticket-based files.
- Split when behavior has a distinct reason to change; use cohesion, not line count.
- Place cross-capability scenarios with the capability that owns the principal behavior.
- Keep issue numbers out of permanent test names and structure.

## Shared support

- Extract setup after the same business or infrastructure knowledge appears three times.
- Give helpers a small capability-oriented interface that hides incidental request choreography.
- Keep case-specific values and assertions visible in the test, and specialized assertions with their owning capability.
- Avoid configurable catch-all builders.
