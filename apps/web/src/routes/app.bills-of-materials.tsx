import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { BomBuilderPrototype } from '@/features/bills-of-materials/prototype/bom-builder-prototype'

export const Route = createFileRoute('/app/bills-of-materials')({
  validateSearch: z.object({
    variant: z.enum(['A', 'B']).optional().catch('B'),
  }),
  component: BillsOfMaterialsRoute,
})

function BillsOfMaterialsRoute() {
  const { variant = 'B' } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <BomBuilderPrototype
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
