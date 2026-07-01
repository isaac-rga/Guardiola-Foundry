import { createFileRoute } from '@tanstack/react-router'

import { UserSettingsPage } from '@/features/auth/user-settings-page'

export const Route = createFileRoute('/app/user-settings')({
  component: UserSettingsRoute,
})

function UserSettingsRoute() {
  return <UserSettingsPage />
}
