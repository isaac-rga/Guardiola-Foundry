import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { SourceCreatePage } from '@/features/sources/source-create-page'

export const Route = createFileRoute('/app/sources/new')({
  component: SourceCreateRoute,
})

function SourceCreateRoute() {
  const navigate = useNavigate({ from: '/app/sources/new' })

  return (
    <SourceCreatePage
      onCreated={(sourceId) =>
        navigate({
          to: '/app/sources/$sourceId',
          params: { sourceId },
        })
      }
    />
  )
}
