
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

## General DRY & Architecture Standards

You must enforce a healthy DRY (Don't Repeat Yourself) strategy. DRY is not just about avoiding duplicate lines of code; it is about ensuring every piece of system knowledge has a single, authoritative home. Follow these rules to keep our architecture clean and maintainable.

### 1. Abstract Knowledge, Not Just Syntax
* **Rule:** Only abstract code if it represents the exact same business rule or system knowledge.
* **Instruction:** If two different features happen to use similar-looking logic today, but they could change for different reasons tomorrow, **do not abstract them**. Duplication is cheaper than the wrong abstraction.

### 2. Isolate Cross-Cutting Concerns
* **Rule:** Do not scatter systemic logic (like Authentication, Logging, Error Handling, or Caching) across individual business files or controllers.
* **Instruction:** Handle these behaviors at the architectural boundaries using structural patterns. Use HTTP Middleware, Interceptors, Decorators, or Aspect-Oriented Programming (AOP) to keep core business logic clean.

### 3. Share Data Behaviors via Composition
* **Rule:** Do not duplicate database filters, state manipulation, or universal data traits across multiple models or tables.
* **Instruction:** Use composition over inheritance. Utilize ORM Mixins, Plugins, or Traits to inject shared behaviors (like Soft Delete, Multi-Tenancy filtering, or Automatic Audit Logs) into data models.

### 4. Separate Data Fetching from UI Layout
* **Rule:** Never embed raw API calls, data fetching states, or cache mutations directly inside UI presentation components.
* **Instruction:** Isolate data syncing into a dedicated state management or data-fetching layer (e.g., Custom Hooks, Repositories, or Services). Presentation components should only receive clean data and trigger actions.

### 5. The "Rule of Three" for Refactoring
* **Rule:** Do not write abstractions prematurely for code that is only written twice.
* **Instruction:** Write code inline the first time. Copy and modify it the second time. By the third time you write the exact same logic, refactor it into a reusable function, component, or class.
