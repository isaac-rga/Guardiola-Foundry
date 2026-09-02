import { createFileRoute } from '@tanstack/react-router'

import { SourceEditPage } from '@/features/sources/source-edit-page'

export const Route = createFileRoute('/app/sources/$sourceId_/edit')({
  component: SourceEditRoute,
})

function SourceEditRoute() {
  const { sourceId } = Route.useParams()

  return <SourceEditPage sourceId={sourceId} />
}
