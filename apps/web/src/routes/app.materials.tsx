import { createFileRoute } from '@tanstack/react-router'

import { MaterialsPage } from '@/features/materials/materials-page'

export const Route = createFileRoute('/app/materials')({
  component: MaterialsRoute,
})

function MaterialsRoute() {
  return <MaterialsPage />
}
