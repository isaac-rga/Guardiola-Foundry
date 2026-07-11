
## Layered vs Hexagonal Decision Policy

### Default

Use a layered approach by default for:

- Data ingress and egress
- Basic reporting
- Simple CRUD workflows
- Thin MVP slices where business logic is shallow

In these cases, optimize for small diffs, direct implementations, and low structural overhead.

### Escalate To Hexagonal Or DDD

Prefer a hexagonal or DDD-style structure when one or more of these conditions is true:

- A flow contains three or more meaningful business rules that interact
- The flow depends on strict state transitions or lifecycle rules
- The logic is financially, operationally, or logistically core to the product
- An external API, SDK, broker, or persistence provider is likely to change and should be insulated

### Layered Constraints

- Direct ORM or framework usage inside services is acceptable when the use case is operationally simple and the coupling is intentional.
- Avoid abstraction for its own sake. A concrete service is preferred over an interface-plus-implementation pair unless polymorphism is already required.

### Hexagonal And DDD Constraints

- Keep aggregates, entities, and value objects inside a pure domain area with no framework, ORM, transport, or vendor dependencies.
- Define outbound and inbound boundaries as ports at the application or domain edge.
- Place concrete integrations such as vendor clients, queues, and brokers in an `infrastructure/` layer.
- Core business logic must be unit-testable with fakes or in-memory adapters and without infrastructure dependencies.

### Guardrails

- If an issue is ambiguous, default to the smallest design that preserves future extension points without speculative abstraction.
- Do not introduce ports and adapters for generic tables or simple data pipelines.
- Do not place dense business logic, multiple external integrations, or state tracking into a single controller script or transaction script.
- When the architecture choice is unclear, start layered unless the cost of later extraction is obviously high.
