import { Button } from '@/components/ui/button'
import type { AuthSessionResponse } from '@guardiola-foundry/shared-types'

type ProtectedAppPageProps = {
  isSigningOut?: boolean
  logoutError?: string | null
  onSignOut?: () => void | Promise<void>
  session: AuthSessionResponse
}

export function ProtectedAppPage({
  isSigningOut = false,
  logoutError = null,
  onSignOut,
  session,
}: ProtectedAppPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl space-y-4 rounded-3xl border border-border/70 bg-card/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-semibold tracking-[0.3em] text-muted-foreground uppercase">Authenticated session</p>
        <h1 className="text-3xl font-semibold tracking-tight">Authenticated area</h1>
        <p className="text-sm text-muted-foreground">Signed in as {session.user.email}.</p>
        <p className="text-sm text-muted-foreground">Current role: {session.user.role}.</p>
        {logoutError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {logoutError}
          </p>
        ) : null}
        <Button type="button" variant="outline" onClick={() => void onSignOut?.()} disabled={isSigningOut}>
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </section>
    </main>
  )
}
