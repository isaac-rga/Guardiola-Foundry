import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffectEvent, useState } from 'react'

import { ProtectedAppPage } from '@/features/auth/protected-app-page'
import { logoutCurrentSession } from '@/lib/api/auth'
import { requireCurrentAuthSession } from '@/lib/auth/current-auth-session'
import { clearAuthSession } from '@/lib/auth/session-storage'

export const Route = createFileRoute('/app')({
  loader: () => requireCurrentAuthSession(),
  component: ProtectedAppRoute,
})

function ProtectedAppRoute() {
  const navigate = useNavigate({ from: '/app' })
  const session = Route.useLoaderData()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const handleSignOut = useEffectEvent(async () => {
    setIsSigningOut(true)
    setLogoutError(null)

    try {
      await logoutCurrentSession(session.token)
      clearAuthSession()
      await navigate({ to: '/sign-in' })
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Unable to sign out.')
    } finally {
      setIsSigningOut(false)
    }
  })

  return (
    <ProtectedAppPage
      session={session}
      isSigningOut={isSigningOut}
      logoutError={logoutError}
      onSignOut={handleSignOut}
    />
  )
}
