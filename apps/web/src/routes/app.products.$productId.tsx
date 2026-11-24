import { createFileRoute } from '@tanstack/react-router'

import { ProductEditPage } from '@/features/products/product-edit-page'
import { clearAuthSession } from '@/lib/auth/session-storage'

export const Route = createFileRoute('/app/products/$productId')({
  component: ProductEditRoute,
})

function ProductEditRoute() {
  const { productId } = Route.useParams()
  const navigate = Route.useNavigate()

  return (
    <ProductEditPage
      productId={productId}
      onAuthenticationFailure={() => {
        clearAuthSession()
        void navigate({ to: '/sign-in', ignoreBlocker: true })
      }}
    />
  )
}
