import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { changePasswordRequestSchema } from '@guardiola-foundry/shared-validation'
import type { ChangePasswordRequest } from '@guardiola-foundry/shared-types'

export function UserSettingsPage() {
  const {
    changePasswordError,
    isChangingPassword,
    onChangePassword,
    session,
  } = useAppShell()

  const roleLabel = session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1)

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
      await onChangePassword(values)
      reset({
        currentPassword: '',
        newPassword: '',
      })
    } catch {
      return
    }
  })

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="text-base font-medium">{session.user.email}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Role</dt>
            <dd className="text-base font-medium">{roleLabel}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-6 shadow-sm">
        <form className="space-y-4" onSubmit={onSubmit}>
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
            <p
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {changePasswordError}
            </p>
          ) : null}

          <Button type="submit" disabled={isChangingPassword}>
            {isChangingPassword ? 'Changing password…' : 'Change password'}
          </Button>
        </form>
      </section>
    </div>
  )
}
