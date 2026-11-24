import {
  createFileRoute,
  defaultStringifySearch,
  redirect,
} from '@tanstack/react-router'
import { z } from 'zod'

import { PatternSetsPage } from '@/features/pattern-sets/pattern-sets-page'

const patternSetsSearchSchema = z.object({
  includeRetired: z.literal(true).optional().catch(undefined),
})

export const Route = createFileRoute('/app/pattern-sets')({
  validateSearch: patternSetsSearchSchema,
  beforeLoad: ({ location, search }) => {
    const canonical = patternSetsSearchSchema.parse(search)
    if (defaultStringifySearch(canonical) !== location.searchStr) {
      throw redirect({
        to: location.pathname,
        search: canonical,
        hash: location.hash,
        replace: true,
      })
    }
  },
  component: PatternSetsRoute,
})

function PatternSetsRoute() {
  const { includeRetired } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <PatternSetsPage
      includeRetired={includeRetired === true}
      onIncludeRetiredChange={(includeRetired, options) =>
        void navigate({
          search: { includeRetired: includeRetired ? true : undefined },
          replace: options?.replace ?? false,
          resetScroll: false,
        })
      }
    />
  )
}
