import { createFileRoute } from '@tanstack/react-router'

import { ProtectedAppPage } from '@/features/auth/protected-app-page'
import { requireCurrentAuthSession } from '@/lib/auth/current-auth-session'

export const Route = createFileRoute('/app')({
  loader: () => requireCurrentAuthSession(),
  component: ProtectedAppRoute,
})

function ProtectedAppRoute() {
  const session = Route.useLoaderData()

  return <ProtectedAppPage session={session} />
}
