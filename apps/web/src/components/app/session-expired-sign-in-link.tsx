import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'

export function SessionExpiredSignInLink({ className }: { className: string }) {
  const { expireSession } = useAppShell()

  return (
    <Button asChild className={className} variant="outline">
      <Link
        to="/sign-in"
        onClick={(event) => {
          if (
            event.button !== 0 ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
          ) {
            return
          }

          event.preventDefault()
          void expireSession()
        }}
      >
        Sign in again
      </Link>
    </Button>
  )
}
