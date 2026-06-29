import type { AuthSessionResponse } from '@guardiola-foundry/shared-types'

type ProtectedAppPageProps = {
  session: AuthSessionResponse
}

export function ProtectedAppPage({ session }: ProtectedAppPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl space-y-4 rounded-3xl border border-border/70 bg-card/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-semibold tracking-[0.3em] text-muted-foreground uppercase">Authenticated session</p>
        <h1 className="text-3xl font-semibold tracking-tight">Authenticated area</h1>
        <p className="text-sm text-muted-foreground">Signed in as {session.user.email}.</p>
        <p className="text-sm text-muted-foreground">Current role: {session.user.role}.</p>
      </section>
    </main>
  )
}
