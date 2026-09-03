import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { MaterialsPage } from '@/features/materials/materials-page'

export const Route = createFileRoute('/app/materials')({
  validateSearch: z.object({
    materialId: z
      .string()
      .regex(/^M-\d{4,}$/)
      .optional()
      .catch(undefined),
  }),
  component: MaterialsRoute,
})

function MaterialsRoute() {
  const { materialId } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <MaterialsPage
      selectedMaterialId={materialId}
      onSelectedMaterialChange={(nextMaterialId) =>
        void navigate({
          search: (previous) => ({ ...previous, materialId: nextMaterialId }),
        })
      }
    />
  )
}
