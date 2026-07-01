import { createFileRoute } from '@tanstack/react-router'

import { AppShellPage } from '@/features/app-shell/authenticated-app-shell'
import { UserSettingsPage } from '@/features/auth/user-settings-page'

export const Route = createFileRoute('/app/user-settings')({
  component: UserSettingsRoute,
})

function UserSettingsRoute() {
  return (
    <AppShellPage
      eyebrow="Settings"
      title="User Settings"
      subtitle="Profile context and account security remain calm, direct, and compact."
    >
      <UserSettingsPage />
    </AppShellPage>
  )
}
