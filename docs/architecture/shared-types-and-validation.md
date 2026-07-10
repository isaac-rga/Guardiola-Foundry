# Shared Types And Validation

Shared types, schemas, and validation rules in Guardiola Foundry are architectural contracts. They define cross-boundary domain language between apps and packages, so they should be organized for business clarity and long-term discoverability rather than technical convenience.

## Core rules

- **Organize by domain:** Shared code must be organized by business domain, not by technical category. Each domain owns its own types, schemas, constants, and related artifacts. Developers should rarely need to leave a domain directory while implementing a feature.
- **Optimize for discoverability:** A developer or agent should be able to locate any shared type or schema by knowing only the business domain it belongs to. If finding something requires searching across unrelated folders, the organization should be reconsidered.
- **Shared code defines contracts:** Only place types, schemas, enums, constants, and other cross-boundary contracts in `shared`. Keep implementation details within the owning domain.
- **Keep Common small:** The `common` directory is reserved for concepts that are truly cross-domain. Do not move something into `common` simply because it is used twice.
- **Prefer intention-revealing names:** Names should describe their purpose. Avoid vague or generic names.
- **Separate models by responsibility:** Different layers often require different models. Avoid creating one large domain object that attempts to satisfy every use case.
- **Treat schemas as the source of truth:** Define schemas first, derive TypeScript types from them whenever practical, and compose larger schemas from smaller reusable ones instead of duplicating definitions.
- **Keep files focused:** When a shared file starts becoming difficult to navigate, evaluate whether multiple concepts have been combined and split it by responsibility. File size is a signal, not a rule.
- **Comments explain why, not what:** Use comments to document intent, business rules, or architectural decisions. Avoid comments that merely restate the code.

## Scope

These rules apply whenever creating or modifying shared types, schemas, or validation logic in:

- `packages/shared-types`
- `packages/shared-validation`

They also apply to any future shared contract package added to the monorepo.
