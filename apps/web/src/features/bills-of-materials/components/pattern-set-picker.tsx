import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import type { PatternSetSearchItem } from '@guardiola-foundry/shared-types'

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
import { usePatternSetSearch } from '@/features/pattern-sets/api/queries'
import { useDebouncedCatalogSearch } from '@/hooks/use-catalog-search'
import { cn } from '@/lib/utils'

export function PatternSetPicker({
  onSelect,
  selected,
  token,
}: {
  onSelect: (patternSet: PatternSetSearchItem | null) => void
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
  const search = usePatternSetSearch(
    token,
    normalizedQuery ? debouncedQuery : '',
  )

  const choose = (patternSet: PatternSetSearchItem | null) => {
    onSelect(patternSet)
    setSelectionAnnouncement(
      patternSet
        ? `${patternSet.name} selected.`
        : 'Pattern Set selection cleared.',
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
            aria-label="Choose Pattern Set"
            className="w-full justify-between font-normal"
            role="combobox"
            type="button"
            variant="outline"
          >
            <span
              className={cn('truncate', !selected && 'text-muted-foreground')}
            >
              {formatSelectedPatternSet(selected)}
            </span>
            <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4 p-0 sm:h-auto sm:max-w-2xl sm:grid-rows-none">
          <DialogHeader className="px-6 pt-6 pr-14">
            <DialogTitle>Choose Pattern Set</DialogTitle>
            <DialogDescription>
              Search the Pattern Set catalog by name or stable ID.
            </DialogDescription>
          </DialogHeader>
          <div className="relative px-6">
            <SearchIcon className="pointer-events-none absolute top-3 left-9 size-4 text-muted-foreground" />
            <Input
              aria-label="Search Pattern Set"
              autoFocus
              className="pl-10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Pattern Sets…"
              value={query}
            />
          </div>
          <div className="max-h-[23rem] overflow-y-auto border-y px-3 py-3">
            <button
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-muted/60"
              onClick={() => choose(null)}
              type="button"
            >
              <span className="text-sm text-muted-foreground">
                No Pattern Set
              </span>
              {!selected ? <CheckIcon className="size-4 text-primary" /> : null}
            </button>
            {!normalizedQuery ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Type to search the Pattern Set catalog.
              </p>
            ) : null}
            {isDebouncing || search.isLoading ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Searching Pattern Sets...
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
              ? search.data?.items.map((patternSet) => (
                  <button
                    aria-label={`${patternSet.name} ${patternSet.id} ${patternSet.quantityProposalCount} ${patternSet.quantityProposalCount === 1 ? 'proposal' : 'proposals'}`}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted/60',
                      patternSet.id === selected?.id && 'bg-primary/7',
                    )}
                    key={patternSet.id}
                    onClick={() => choose(patternSet)}
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{patternSet.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {patternSet.id}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {patternSet.quantityProposalCount}{' '}
                        {patternSet.quantityProposalCount === 1
                          ? 'proposal'
                          : 'proposals'}
                      </p>
                    </div>
                    {patternSet.id === selected?.id ? (
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
            Up to 25 current Pattern Sets are shown for each search.
          </p>
        </DialogContent>
      </Dialog>
      <p className="sr-only" aria-atomic="true" role="status">
        {open
          ? patternSetSearchAnnouncement({
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

function formatSelectedPatternSet(
  selected: {
    id: string
    name: string | null
    availability?: 'available' | 'unavailable'
  } | null,
) {
  if (!selected) return 'Choose Pattern Set'
  if (!selected.name) return `${selected.id} · Details unavailable`
  if (selected.availability === 'unavailable') {
    return `${selected.name} · ${selected.id} · Unavailable`
  }
  return selected.name
}

function patternSetSearchAnnouncement({
  error,
  hasMore,
  isLoading,
  itemCount,
}: {
  error: Error | null
  hasMore: boolean
  isLoading: boolean
  itemCount: number | undefined
}) {
  if (isLoading) return 'Loading Pattern Set results.'
  if (error) return error.message
  if (itemCount === 0) return 'No Pattern Set matches.'
  if (itemCount !== undefined) {
    return `${itemCount} Pattern Set results.${hasMore ? ' More matches exist.' : ''}`
  }
  return ''
}
