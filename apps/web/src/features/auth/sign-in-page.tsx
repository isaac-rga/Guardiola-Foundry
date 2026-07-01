import { zodResolver } from '@hookform/resolvers/zod'
import { loginRequestSchema } from '@guardiola-foundry/shared-validation'
import type { AuthSessionResponse, LoginRequest } from '@guardiola-foundry/shared-types'
import { useEffect, useEffectEvent, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { signIn } from '@/lib/api/auth'
import { bootstrapCurrentAuthSession, readCurrentAuthSession } from '@/lib/auth/current-auth-session'
import { saveAuthSession } from '@/lib/auth/session-storage'

type SignInPageProps = {
  onAuthenticated?: (session: AuthSessionResponse) => void | Promise<void>
}

export function SignInPage({ onAuthenticated }: SignInPageProps) {
  const storedSession = readCurrentAuthSession()
  const [session, setSession] = useState<AuthSessionResponse | null>(storedSession)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const handleAuthenticated = useEffectEvent(async (nextSession: AuthSessionResponse) => {
    setSession(nextSession)
    await onAuthenticated?.(nextSession)
  })

  useEffect(() => {
    let cancelled = false

    if (!storedSession) {
      return
    }

    void (async () => {
      const bootstrappedSession = await bootstrapCurrentAuthSession()

      if (cancelled) {
        return
      }

      if (!bootstrappedSession) {
        setSession(null)
        return
      }

      await handleAuthenticated(bootstrappedSession)
    })()

    return () => {
      cancelled = true
    }
  }, [storedSession])

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmissionError(null)

    try {
      const nextSession = await signIn(values)

      saveAuthSession(nextSession)
      await handleAuthenticated(nextSession)
      form.reset({
        email: '',
        password: '',
      })
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Unable to sign in.')
    }
  })

  const currentSession = session ?? storedSession

  return (
    <main className="px-6 py-10 md:px-10 md:py-14">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.95fr]">
        <div className="flex flex-col justify-center rounded-[2rem] border border-border/70 bg-card/90 px-8 py-10 shadow-[0_24px_80px_rgba(72,53,40,0.08)] md:px-12">
          <p className="text-xs font-medium tracking-[0.28em] text-muted-foreground uppercase">
            Authentication
          </p>
          <h1 className="font-editorial mt-6 max-w-2xl text-5xl leading-none text-foreground sm:text-6xl">
            Sign in to Guardiola Foundry
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            Use your Email Address and password to enter the shared operational workspace.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Card className="bg-muted/30 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Warm minimalism</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  Quiet surfaces and soft contrast keep the interface refined without losing usability.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Operational clarity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  Forms stay structured and practical, with compact labels and direct feedback.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="self-center rounded-[2rem] bg-card/95 p-2 shadow-[0_24px_80px_rgba(72,53,40,0.1)]">
          <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
            <Form {...form}>
              <form className="space-y-5" onSubmit={onSubmit}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="current-password"
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {submissionError ? (
                  <p className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive" role="alert">
                    {submissionError}
                  </p>
                ) : null}

                <Button className="h-11 w-full rounded-xl" type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </Form>

            {currentSession ? (
              <p className="mt-6 text-sm font-medium text-foreground">
                Signed in as {currentSession.user.email}.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
