import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import type { MaterialSearchItem } from '@guardiola-foundry/shared-types'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useMaterialSearch } from '@/features/materials/api/queries'
import { useDebouncedCatalogSearch } from '@/hooks/use-catalog-search'
import { cn } from '@/lib/utils'

export function MaterialPicker({
  onSelect,
  selected,
  token,
}: {
  onSelect: (material: MaterialSearchItem | null) => void
  selected: {
    id: string
    name: string | null
    availability?: 'available' | 'unavailable'
  } | null
  token: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectionAnnouncement, setSelectionAnnouncement] = useState('')
  const {
    debouncedValue: debouncedQuery,
    isDebouncing,
    normalizedValue: normalizedQuery,
  } = useDebouncedCatalogSearch(query)
  const search = useMaterialSearch(token, normalizedQuery ? debouncedQuery : '')

  const choose = (material: MaterialSearchItem | null) => {
    onSelect(material)
    setSelectionAnnouncement(
      material ? `${material.name} selected.` : 'Material selection cleared.',
    )
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) setQuery('')
        }}
      >
        <DialogTrigger asChild>
          <Button
            aria-expanded={open}
            aria-label="Choose Material"
            className="w-full justify-between font-normal"
            role="combobox"
            type="button"
            variant="outline"
          >
            <span
              className={cn('truncate', !selected && 'text-muted-foreground')}
            >
              {formatSelectedMaterial(selected)}
            </span>
            <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4 p-0 sm:h-auto sm:max-w-2xl sm:grid-rows-none">
          <DialogHeader className="px-6 pt-6 pr-14">
            <DialogTitle>Choose Material</DialogTitle>
            <DialogDescription>
              Search by Material name, ID, color, use, Preferred Source, Vendor,
              shade, or width.
            </DialogDescription>
          </DialogHeader>
          <div className="relative px-6">
            <SearchIcon className="pointer-events-none absolute top-3 left-9 size-4 text-muted-foreground" />
            <Input
              aria-label="Search Material"
              autoFocus
              className="pl-10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Materials…"
              value={query}
            />
          </div>
          <div className="max-h-[23rem] overflow-y-auto border-y px-3 py-3">
            <button
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-muted/60"
              onClick={() => choose(null)}
              type="button"
            >
              <span className="text-sm text-muted-foreground">No Material</span>
              {!selected ? <CheckIcon className="size-4 text-primary" /> : null}
            </button>

            {!normalizedQuery ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Type to search the Material catalog.
              </p>
            ) : null}
            {isDebouncing || search.isLoading ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Searching Materials...
              </p>
            ) : null}
            {normalizedQuery && search.error && !isDebouncing ? (
              <div className="px-4 py-8 text-center" role="alert">
                <p className="text-sm">{search.error.message}</p>
                {search.isErrorRetryable ? (
                  <Button
                    className="mt-3"
                    onClick={() => void search.refetch()}
                    type="button"
                    variant="outline"
                  >
                    Try again
                  </Button>
                ) : null}
              </div>
            ) : null}
            {normalizedQuery &&
            !isDebouncing &&
            search.data?.items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm">
                No matches for “{query.trim()}”. Check the name or ID.
              </p>
            ) : null}
            {normalizedQuery && !isDebouncing
              ? search.data?.items.map((material) => (
                  <button
                    aria-label={`${material.name} ${material.id}`}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted/60',
                      material.id === selected?.id && 'bg-primary/7',
                    )}
                    key={material.id}
                    onClick={() => choose(material)}
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{material.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {material.id}
                        </span>
                        {material.attention.length > 0 ? (
                          <Badge variant="secondary">
                            Source needs attention
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatMaterialValue(material.materialColor)} ·{' '}
                        {formatMaterialValue(material.materialUse)} ·{' '}
                        {material.preferredSource.widthCentimeters
                          ? `${material.preferredSource.widthCentimeters} cm`
                          : 'Width unavailable'}{' '}
                        · Source: {material.preferredSource.name} (
                        {material.preferredSource.id}) · Vendor:{' '}
                        {material.preferredSource.vendor}
                        {material.preferredSource.vendorShadeOrDetail
                          ? ` · Shade/detail: ${material.preferredSource.vendorShadeOrDetail}`
                          : ''}
                        {material.preferredSource.description
                          ? ` · Description: ${material.preferredSource.description}`
                          : ''}
                      </p>
                    </div>
                    {material.id === selected?.id ? (
                      <CheckIcon className="mt-1 size-4 text-primary" />
                    ) : null}
                  </button>
                ))
              : null}
            {normalizedQuery && !isDebouncing && search.data?.hasMore ? (
              <p className="px-4 py-3 text-center text-xs text-muted-foreground">
                More matches exist. Refine your search.
              </p>
            ) : null}
          </div>
          <p className="px-6 pb-6 text-xs text-muted-foreground">
            Up to 25 current Materials are shown for each search.
          </p>
        </DialogContent>
      </Dialog>
      <p className="sr-only" aria-atomic="true" role="status">
        {open
          ? catalogSearchAnnouncement({
              catalog: 'Material',
              isLoading: isDebouncing || search.isLoading,
              error: normalizedQuery ? search.error : null,
              itemCount: normalizedQuery
                ? search.data?.items.length
                : undefined,
              hasMore:
                normalizedQuery.length > 0 && search.data?.hasMore === true,
            })
          : selectionAnnouncement}
      </p>
    </>
  )
}

function formatSelectedMaterial(
  selected: {
    id: string
    name: string | null
    availability?: 'available' | 'unavailable'
  } | null,
) {
  if (!selected) return 'Choose Material'
  if (!selected.name) return `${selected.id} · Details unavailable`
  if (selected.availability === 'unavailable') {
    return `${selected.name} · ${selected.id} · Unavailable`
  }
  return selected.name
}

function catalogSearchAnnouncement({
  catalog,
  error,
  hasMore,
  isLoading,
  itemCount,
}: {
  catalog: string
  error: Error | null
  hasMore: boolean
  isLoading: boolean
  itemCount: number | undefined
}) {
  if (isLoading) return `Loading ${catalog} results.`
  if (error) return error.message
  if (itemCount === 0) return `No ${catalog} matches.`
  if (itemCount !== undefined) {
    return `${itemCount} ${catalog} results.${hasMore ? ' More matches exist.' : ''}`
  }
  return ''
}

function formatMaterialValue(value: string) {
  return value
    .split('-')
    .map((part) => part[0]?.toLocaleUpperCase() + part.slice(1))
    .join(' ')
}
