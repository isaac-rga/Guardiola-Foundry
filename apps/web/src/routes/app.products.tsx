import { createFileRoute } from '@tanstack/react-router'

import { ProductsWorkspacePage } from '@/features/app-shell/workspace-pages'

export const Route = createFileRoute('/app/products')({
  component: ProductsRoute,
})

function ProductsRoute() {
  return <ProductsWorkspacePage />
}
