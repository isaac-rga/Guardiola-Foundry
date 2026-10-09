import {
  createFileRoute,
  defaultStringifySearch,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import type { ListSourcesQuery } from '@guardiola-foundry/shared-types'
import { listSourcesQuerySchema } from '@guardiola-foundry/shared-validation'

const sourceCatalogSearchSchema = listSourcesQuerySchema.extend({
  search: listSourcesQuerySchema.shape.search.optional().catch(undefined),
  textileFamily: listSourcesQuerySchema.shape.textileFamily.catch(undefined),
  linkState: listSourcesQuerySchema.shape.linkState.catch(undefined),
  attentionState: listSourcesQuerySchema.shape.attentionState.catch(undefined),
  includeRetired: listSourcesQuerySchema.shape.includeRetired
    .catch(undefined)
    .transform((value) => value || undefined),
})

export const Route = createFileRoute('/app/sources')({
  validateSearch: (search): ListSourcesQuery =>
    sourceCatalogSearchSchema.parse({
      ...search,
      includeRetired:
        search.includeRetired ??
        (search.status === 'retired' ? true : undefined),
    }),
  beforeLoad: ({ location, search }) => {
    const canonical = sourceCatalogSearchSchema.parse(search)
    if (
      defaultStringifySearch(
        Object.fromEntries(Object.entries(canonical).sort()),
      ) !==
      defaultStringifySearch(
        Object.fromEntries(Object.entries(location.search).sort()),
      )
    ) {
      throw redirect({
        to: location.pathname,
        search: canonical,
        hash: location.hash,
        replace: true,
      })
    }
  },
  component: SourcesLayoutRoute,
})

function SourcesLayoutRoute() {
  return <Outlet />
}
