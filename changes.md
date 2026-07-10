# Tighten the Product list row layout for density and scannability

This slice still targets the existing `/app/products` surface, but it now includes one small shared UI cleanup as well: the products card has been stripped down to a cleaner body-only container, and the shared page header no longer carries eyebrow or badge chrome.

The Product workflows, filters, ordering, and navigation are unchanged. The work here is presentational only.

## Start at the Product list row

The main list change lives in [apps/web/src/features/products/product-management-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-management-page.tsx).

The visible row now reads across six columns:

- `Product`: Product name
- `Collection`: collection badge
- `Category`: category badge
- `Status`: deleted and Product Status badges
- `Lifecycle`: Lifecycle Status badge
- `Created`: creator and created date

The `Record` column remains hidden from the Product list.

That means the list now favors row-level scanning across explicit columns instead of stacking supporting metadata under the Product name.

## Then look at the cleaner card shell

The products list card in [product-management-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-management-page.tsx) no longer renders the `Product registrations` header block.

Previously, the card started with:

- a `CardTitle`
- a `CardDescription`

That content was visually redundant with the page-level context above it. The card now opens directly into status messages, filters, and the table content for a cleaner, less framed look.

## Follow the shared `PageHeader` refactor

The shared header cleanup lives in [apps/web/src/components/app/page-header.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/components/app/page-header.tsx).

`PageHeader` now accepts only:

- `title`
- `description`
- optional `action`
- optional `className`

It no longer supports:

- `eyebrow`
- `badges`

That change simplified the component markup and removed an extra decorative layer from page tops. The affected call sites were updated in:

- [apps/web/src/features/products/product-management-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-management-page.tsx)
- [apps/web/src/features/products/product-edit-page.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/products/product-edit-page.tsx)
- [apps/web/src/features/app-shell/workspace-pages.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/features/app-shell/workspace-pages.tsx)

## End at the focused regression coverage

The route-level verification remains in [apps/web/src/routes/-products.test.tsx](/Users/isaacruiz/Development/gub/Guardiola-Foundry/apps/web/src/routes/-products.test.tsx).

The Products route test still covers ordering, search, and filters. For this slice, it continues to assert the visible row contract:

- `Collection` and `Category` are separate table headers
- `Status` and `Lifecycle` are separate table headers
- `Record` is not a visible column header
- Product IDs and `Stable short ID` do not render in the list row

## Verification

Verification run for this slice:

- `pnpm --dir apps/web test -- src/routes/-products.test.tsx`
- `pnpm --dir apps/web typecheck`

## Scope note

This slice only adjusts the Product list presentation and simplifies the shared page-header chrome. It does not change Product data shape, list filtering behavior, route behavior, or introduce a new UI abstraction.
