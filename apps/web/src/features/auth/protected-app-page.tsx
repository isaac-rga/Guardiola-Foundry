import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { changePasswordRequestSchema } from '@guardiola-foundry/shared-validation'
import type { AuthSessionResponse, ChangePasswordRequest } from '@guardiola-foundry/shared-types'
import { useForm } from 'react-hook-form'

type ProtectedAppPageProps = {
  isChangingPassword?: boolean
  changePasswordError?: string | null
  isSigningOut?: boolean
  logoutError?: string | null
  onChangePassword?: (payload: ChangePasswordRequest) => void | Promise<void>
  onSignOut?: () => void | Promise<void>
  session: AuthSessionResponse
}

export function ProtectedAppPage({
  isChangingPassword = false,
  changePasswordError = null,
  isSigningOut = false,
  logoutError = null,
  onChangePassword,
  onSignOut,
  session,
}: ProtectedAppPageProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordRequestSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await onChangePassword?.(values)
      reset({
        currentPassword: '',
        newPassword: '',
      })
    } catch {
      return
    }
  })

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl space-y-6 rounded-3xl border border-border/70 bg-card/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-semibold tracking-[0.3em] text-muted-foreground uppercase">Authenticated session</p>
        <h1 className="text-3xl font-semibold tracking-tight">Authenticated area</h1>
        <p className="text-sm text-muted-foreground">Signed in as {session.user.email}.</p>
        <p className="text-sm text-muted-foreground">Current role: {session.user.role}.</p>
        <form className="space-y-4 rounded-2xl border border-border/70 p-5" onSubmit={onSubmit}>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Change password</h2>
            <p className="text-sm text-muted-foreground">
              Confirm your current password, then choose a new password with at least 8
              characters.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="currentPassword">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs transition-colors outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              aria-invalid={errors.currentPassword ? 'true' : 'false'}
              {...register('currentPassword')}
            />
            {errors.currentPassword ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.currentPassword.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs transition-colors outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              aria-invalid={errors.newPassword ? 'true' : 'false'}
              {...register('newPassword')}
            />
            {errors.newPassword ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.newPassword.message}
              </p>
            ) : null}
          </div>

          {changePasswordError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {changePasswordError}
            </p>
          ) : null}

          <Button type="submit" disabled={isChangingPassword}>
            {isChangingPassword ? 'Changing password…' : 'Change password'}
          </Button>
        </form>
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
