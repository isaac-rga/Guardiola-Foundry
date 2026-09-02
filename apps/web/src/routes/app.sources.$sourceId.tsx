import { createFileRoute } from '@tanstack/react-router'

import { SourceDetailPage } from '@/features/sources/source-detail-page'

export const Route = createFileRoute('/app/sources/$sourceId')({
  component: SourceDetailRoute,
})

function SourceDetailRoute() {
  const { sourceId } = Route.useParams()

  return <SourceDetailPage sourceId={sourceId} />
}
