import { createFileRoute } from '@tanstack/react-router'

import { AppShellPage } from '@/features/app-shell/authenticated-app-shell'
import { ProductsWorkspacePage } from '@/features/app-shell/workspace-pages'

export const Route = createFileRoute('/app/products')({
  component: ProductsRoute,
})

function ProductsRoute() {
  return (
    <AppShellPage
      eyebrow="Product lifecycle"
      title="Products"
      subtitle="Collection oversight, approvals, and next production decisions."
    >
      <ProductsWorkspacePage />
    </AppShellPage>
  )
}
