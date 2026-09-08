import { createFileRoute } from '@tanstack/react-router'

import { PatternSetsPage } from '@/features/pattern-sets/pattern-sets-page'

export const Route = createFileRoute('/app/pattern-sets')({
  component: PatternSetsPage,
})
