import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
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

  const form = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordRequestSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await onChangePassword(values)
      form.reset({
        currentPassword: '',
        newPassword: '',
      })
    } catch {
      return
    }
  })

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card className="rounded-[1.75rem]">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Quiet hierarchy keeps profile information readable without turning settings into a dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem]">
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Confirm your current password, then choose a new password with at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
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

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        className="h-11 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {changePasswordError ? (
                <p
                  className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {changePasswordError}
                </p>
              ) : null}

              <Separator />
              <div className="flex items-center justify-between gap-4">
                <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                  Changing your password signs out the current session so the new credentials take effect immediately.
                </p>
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? 'Changing password…' : 'Change password'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
