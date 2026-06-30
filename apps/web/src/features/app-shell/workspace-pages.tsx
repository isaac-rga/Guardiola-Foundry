import { PageHeader } from '@/components/app/page-header'

type WorkspacePageCopy = {
  description: string
  eyebrow: string
  title: string
}

const homePageCopy: WorkspacePageCopy = {
  eyebrow: 'Authenticated workspace',
  title: 'Home',
  description:
    'This landing area keeps the authenticated shell grounded while the first operational workflows are still being built.',
}

const productsPageCopy: WorkspacePageCopy = {
  eyebrow: 'Product lifecycle',
  title: 'Products',
  description:
    'Product workflows will live here once the shared shell hands off to real work-area functionality.',
}

const materialsPageCopy: WorkspacePageCopy = {
  eyebrow: 'Material sourcing',
  title: 'Materials',
  description:
    'Material availability, sourcing, and vendor coordination will arrive here on top of the shared authenticated frame.',
}

const inventoryPageCopy: WorkspacePageCopy = {
  eyebrow: 'Warehouse operations',
  title: 'Inventory',
  description:
    'Inventory visibility and warehouse-position flows will plug into this route without changing the shell contract.',
}

const billsOfMaterialsPageCopy: WorkspacePageCopy = {
  eyebrow: 'Production planning',
  title: 'Bills of Materials',
  description:
    'Bills of materials will gain real planning tools here while keeping navigation, auth, and layout shared.',
}

export function DashboardWorkspacePage() {
  return <WorkspacePlaceholderPage {...homePageCopy} />
}

export function ProductsWorkspacePage() {
  return <WorkspacePlaceholderPage {...productsPageCopy} />
}

export function MaterialsWorkspacePage() {
  return <WorkspacePlaceholderPage {...materialsPageCopy} />
}

export function InventoryWorkspacePage() {
  return <WorkspacePlaceholderPage {...inventoryPageCopy} />
}

export function BillsOfMaterialsWorkspacePage() {
  return <WorkspacePlaceholderPage {...billsOfMaterialsPageCopy} />
}

function WorkspacePlaceholderPage({ description, eyebrow, title }: WorkspacePageCopy) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="flex min-h-[calc(100svh-19rem)] items-center justify-center">
        <section className="w-full max-w-3xl rounded-[2rem] border border-dashed border-border/80 bg-card/80 px-8 py-16 text-center shadow-[0_18px_48px_rgba(72,53,40,0.05)]">
          <div className="mx-auto max-w-xl space-y-3">
            <p className="text-sm font-medium tracking-[0.28em] text-muted-foreground uppercase">
              Shared authenticated shell
            </p>
            <h2 className="font-editorial text-balance text-4xl leading-none">
              Work in progress…
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              This route is live inside the authenticated workspace, and its domain-specific
              content will land here without changing the navigation or protection model.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
