import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { BomBuilderPrototype } from '@/features/bills-of-materials/prototype/bom-builder-prototype'
import { BomCatalogPrototype } from '@/features/bills-of-materials/prototype/bom-catalog-prototype'

export const Route = createFileRoute('/app/bills-of-materials')({
  validateSearch: z.object({
    builderScenario: z
      .enum([
        'create-implementation',
        'create-template',
        'derive-implementation',
        'edit-implementation',
        'edit-template',
      ])
      .optional()
      .catch('edit-implementation'),
    screen: z.enum(['builder', 'catalog']).optional().catch('catalog'),
    product: z.string().optional().catch(undefined),
    productVariant: z.string().optional().catch(undefined),
    variant: z.enum(['A', 'B']).optional().catch('A'),
  }),
  component: BillsOfMaterialsRoute,
})

function BillsOfMaterialsRoute() {
  const {
    builderScenario = 'edit-implementation',
    product,
    productVariant,
    screen = 'catalog',
    variant = 'A',
  } = Route.useSearch()
  const navigate = Route.useNavigate()

  if (screen === 'builder') {
    return (
      <BomBuilderPrototype
        initialProductVariantContext={
          product && productVariant ? { product, productVariant } : undefined
        }
        initialScenario={builderScenario}
        key={`${builderScenario}-${productVariant ?? ''}`}
        onExit={() =>
          void navigate({
            search: (previous) => ({ ...previous, screen: 'catalog' }),
            replace: true,
            resetScroll: false,
          })
        }
        onVariantChange={() => undefined}
        showSwitcher={false}
        variant="B"
      />
    )
  }

  return (
    <BomCatalogPrototype
      onOpenBuilder={(nextScenario, context) =>
        void navigate({
          search: (previous) => ({
            ...previous,
            builderScenario: nextScenario,
            product: context?.product,
            productVariant: context?.productVariant,
            screen: 'builder',
          }),
          resetScroll: true,
        })
      }
      variant={variant}
      onVariantChange={(nextVariant) =>
        void navigate({
          search: (previous) => ({ ...previous, variant: nextVariant }),
          replace: true,
          resetScroll: false,
        })
      }
    />
  )
}
