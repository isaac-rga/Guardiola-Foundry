import { createFileRoute, Navigate } from '@tanstack/react-router'
import { z } from 'zod'

import { BillsOfMaterialsCatalogPage } from '@/features/bills-of-materials/bills-of-materials-catalog-page'
import { CreateBomPage } from '@/features/bills-of-materials/create-bom-template-page'
import { ImplementationBuilder } from '@/features/bills-of-materials/implementation-builder'

export const Route = createFileRoute('/app/bills-of-materials')({
  validateSearch: z.object({
    screen: z.enum(['builder', 'catalog']).optional().catch('catalog'),
    kind: z.enum(['template', 'implementation']).optional().catch('template'),
    productVariantId: z.string().optional(),
  }),
  component: BillsOfMaterialsRoute,
})

function BillsOfMaterialsRoute() {
  const {
    kind = 'template',
    productVariantId,
    screen = 'catalog',
  } = Route.useSearch()
  const navigate = Route.useNavigate()

  if (screen === 'builder') {
    if (kind === 'implementation') {
      if (!productVariantId) {
        return (
          <Navigate
            replace
            search={{ screen: 'catalog' }}
            to="/app/bills-of-materials"
          />
        )
      }
      return (
        <ImplementationBuilder
          productVariantId={productVariantId}
          onExit={() =>
            void navigate({
              search: { screen: 'catalog' },
              replace: true,
              resetScroll: false,
            })
          }
        />
      )
    }
    return (
      <CreateBomPage
        creation={{ kind: 'template' }}
        onCancel={() =>
          void navigate({
            search: { screen: 'catalog' },
            replace: true,
            resetScroll: false,
          })
        }
        onSaved={() =>
          void navigate({
            search: { screen: 'catalog' },
            replace: true,
            resetScroll: false,
          })
        }
      />
    )
  }

  return (
    <BillsOfMaterialsCatalogPage
      onCreateImplementation={(candidate) =>
        void navigate({
          search: {
            screen: 'builder',
            kind: 'implementation',
            productVariantId: candidate.id,
          },
          resetScroll: true,
        })
      }
      onCreateTemplate={() =>
        void navigate({
          search: (previous) => ({
            ...previous,
            screen: 'builder',
            kind: 'template',
            productVariantId: undefined,
          }),
          resetScroll: true,
        })
      }
    />
  )
}
