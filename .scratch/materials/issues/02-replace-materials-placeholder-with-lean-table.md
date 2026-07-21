# Replace the Materials placeholder with the lean table

Status: done

## Parent

.scratch/materials/PRD.md

## What to build

Replace the authenticated Materials placeholder with the first real Materials table. The route should read the persisted Materials API and render one row per Material, keeping the table lean and Material-first. Source information should appear only as a quick Preferred Source reference and alternate Source count; Source technical fields and Source detail workflows remain deferred.

This issue should not add create, update, delete, restore, Source detail, search, filters, pagination, summary stats, charts, dashboards, bulk actions, or URL-synced table state.

## Acceptance criteria

- [ ] The authenticated Materials route renders a real Materials table instead of the placeholder page.
- [ ] The route reads Materials from the persisted Materials API rather than local mock data.
- [ ] The table renders one row per Material, not one row per Source.
- [ ] Visible columns include Material ID, name, Material Color, Material Use, Material Unit, Preferred Source reference, derived cost, alternate Source count, and compact comments.
- [ ] Source technical fields such as GSM, width, fiber, composition, finish, weave, and country of origin are not shown in the Materials table.
- [ ] Comments are compact through truncation or an indicator and do not substantially increase row height.
- [ ] The table is lean enough for normal desktop widths, with horizontal scroll only as a fallback for narrow viewports.
- [ ] The table loads the full active Materials list without pagination controls.
- [ ] The page exposes no create, edit, delete, restore, Source management, search, filter, summary-stat, dashboard, chart, or bulk-action controls.
- [ ] Focused web route tests cover table rendering, one-row-per-Material behavior, lean visible columns, omitted Source technical fields, compact comments, and the absence of out-of-scope table controls.

## Blocked by

- .scratch/materials/issues/01-persist-imported-materials-and-sources.md

## Comments

Completed the authenticated `/app/materials` route replacement with a feature-local Materials API adapter, TanStack Query-backed table page, focused route tests, and compact lean columns backed by the persisted `GET /materials` API. The route intentionally does not expose create, edit, delete, restore, Source management, search, filters, pagination, summary stats, charts, dashboards, or bulk actions.
