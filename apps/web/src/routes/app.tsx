import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffectEvent, useRef, useState } from 'react'

import { AuthenticatedAppShell } from '@/features/app-shell/authenticated-app-shell'
import { changePasswordCurrentSession, logoutCurrentSession } from '@/lib/api/auth'
import { requireCurrentAuthSession } from '@/lib/auth/current-auth-session'
import { clearAuthSession, loadAuthSession } from '@/lib/auth/session-storage'
import type {
  AuthSessionResponse,
  ChangePasswordRequest,
} from '@guardiola-foundry/shared-types'

export const Route = createFileRoute('/app')({
  loader: () => requireCurrentAuthSession(),
  component: AppLayoutRoute,
})

function AppLayoutRoute() {
  const session = Route.useLoaderData()

  return <AuthenticatedAppSession key={session.token} session={session} />
}

function AuthenticatedAppSession({ session }: { session: AuthSessionResponse }) {
  const navigate = useNavigate()
  const isExpiringSession = useRef(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const expireSession = useCallback(
    async (options?: { ignoreBlocker?: boolean }) => {
      const storedSession = loadAuthSession()
      if (
        isExpiringSession.current ||
        (storedSession && storedSession.token !== session.token)
      ) {
        return
      }

      isExpiringSession.current = true
      try {
        clearAuthSession()
        await navigate({ to: '/sign-in', ignoreBlocker: options?.ignoreBlocker })
      } finally {
        isExpiringSession.current = false
      }
    },
    [navigate, session.token],
  )

  const handleSignOut = useEffectEvent(async () => {
    setIsSigningOut(true)
    setLogoutError(null)

    try {
      await logoutCurrentSession(session.token)
      await expireSession()
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
      await expireSession()
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
      expireSession={expireSession}
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
