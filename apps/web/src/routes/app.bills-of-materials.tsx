import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { BillsOfMaterialsCatalogPage } from '@/features/bills-of-materials/bills-of-materials-catalog-page'
import { CreateBomTemplatePage } from '@/features/bills-of-materials/create-bom-template-page'

export const Route = createFileRoute('/app/bills-of-materials')({
  validateSearch: z.object({
    screen: z.enum(['builder', 'catalog']).optional().catch('catalog'),
  }),
  component: BillsOfMaterialsRoute,
})

function BillsOfMaterialsRoute() {
  const { screen = 'catalog' } = Route.useSearch()
  const navigate = Route.useNavigate()

  if (screen === 'builder') {
    return (
      <CreateBomTemplatePage
        onCancel={() =>
          void navigate({
            search: (previous) => ({ ...previous, screen: 'catalog' }),
            replace: true,
            resetScroll: false,
          })
        }
        onSaved={() =>
          void navigate({
            search: (previous) => ({ ...previous, screen: 'catalog' }),
            replace: true,
            resetScroll: false,
          })
        }
      />
    )
  }

  return (
    <BillsOfMaterialsCatalogPage
      onCreateTemplate={() =>
        void navigate({
          search: (previous) => ({
            ...previous,
            screen: 'builder',
          }),
          resetScroll: true,
        })
      }
    />
  )
}
