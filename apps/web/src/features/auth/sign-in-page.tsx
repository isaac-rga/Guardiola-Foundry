import { zodResolver } from '@hookform/resolvers/zod'
import { loginRequestSchema } from '@guardiola-foundry/shared-validation'
import type { AuthSessionResponse, LoginRequest } from '@guardiola-foundry/shared-types'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { signIn } from '@/lib/api/auth'
import { saveAuthSession } from '@/lib/auth/session-storage'

export function SignInPage() {
  const [session, setSession] = useState<AuthSessionResponse | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmissionError(null)

    try {
      const nextSession = await signIn(values)

      saveAuthSession(nextSession)
      setSession(nextSession)
      reset({
        email: '',
        password: '',
      })
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Unable to sign in.')
    }
  })

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.08),_transparent_45%),linear-gradient(180deg,_var(--color-background),_oklch(0.97_0_0))] px-6 py-16">
      <section className="w-full max-w-md rounded-3xl border border-border/70 bg-card/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <p className="text-sm font-semibold tracking-[0.3em] text-muted-foreground uppercase">Authentication</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">Sign in to Guardiola Foundry</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Use your Email Address and password to start an authenticated session.
        </p>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs transition-colors outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              aria-invalid={errors.email ? 'true' : 'false'}
              {...register('email')}
            />
            {errors.email ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs transition-colors outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              aria-invalid={errors.password ? 'true' : 'false'}
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {submissionError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {submissionError}
            </p>
          ) : null}

          <Button className="h-11 w-full rounded-xl" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {session ? (
          <p className="mt-6 text-sm font-medium text-foreground">Signed in as {session.user.email}.</p>
        ) : null}
      </section>
    </main>
  )
}
