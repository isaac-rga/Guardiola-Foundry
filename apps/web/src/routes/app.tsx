import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffectEvent, useState } from 'react'

import { AuthenticatedAppShell } from '@/features/app-shell/authenticated-app-shell'
import { changePasswordCurrentSession, logoutCurrentSession } from '@/lib/api/auth'
import { requireCurrentAuthSession } from '@/lib/auth/current-auth-session'
import { clearAuthSession } from '@/lib/auth/session-storage'
import type { ChangePasswordRequest } from '@guardiola-foundry/shared-types'

export const Route = createFileRoute('/app')({
  loader: () => requireCurrentAuthSession(),
  component: AppLayoutRoute,
})

function AppLayoutRoute() {
  const navigate = useNavigate({ from: '/app' })
  const session = Route.useLoaderData()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null)
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

  const handleChangePassword = useEffectEvent(async (payload: ChangePasswordRequest) => {
    setIsChangingPassword(true)
    setChangePasswordError(null)

    try {
      await changePasswordCurrentSession(session.token, payload)
      clearAuthSession()
      await navigate({ to: '/sign-in' })
    } catch (error) {
      setChangePasswordError(
        error instanceof Error ? error.message : 'Unable to change password.'
      )
      throw error
    } finally {
      setIsChangingPassword(false)
    }
  })

  return (
    <AuthenticatedAppShell
      session={session}
      isChangingPassword={isChangingPassword}
      changePasswordError={changePasswordError}
      onChangePassword={handleChangePassword}
      isSigningOut={isSigningOut}
      logoutError={logoutError}
      onSignOut={handleSignOut}
    >
      <Outlet />
    </AuthenticatedAppShell>
  )
}
