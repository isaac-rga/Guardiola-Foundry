import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { SignInPage } from '@/features/auth/sign-in-page'

export const Route = createFileRoute('/sign-in')({
  component: SignInRoute,
})

function SignInRoute() {
  const navigate = useNavigate({ from: '/sign-in' })

  return <SignInPage onAuthenticated={() => navigate({ to: '/app' })} />
}
