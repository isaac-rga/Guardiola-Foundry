# DevOps

## Database & Environment Control
*   **Spin up Postgres Container:** `pnpm db:up` (Do not run raw `docker compose` manually unless specified).
*   **Teardown Database Container:** `pnpm db:down`
*   **Run Pending Migrations:** `pnpm db:migrate`
*   **Rollback Last Migration:** `pnpm db:rollback`
*   **Check Migration Status:** `pnpm db:status`
*   **Seed Database:** `pnpm db:seed`
