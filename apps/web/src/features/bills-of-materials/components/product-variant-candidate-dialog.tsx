import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import type { ProductVariantCandidate } from '@guardiola-foundry/shared-types'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useDebouncedCatalogSearch } from '@/hooks/use-catalog-search'
import { useProductVariantCandidates } from '../api/bills-of-materials'

export function ProductVariantCandidateDialog({
  onOpenChange,
  onSelect,
  open,
  token,
}: {
  onOpenChange: (open: boolean) => void
  onSelect: (candidate: ProductVariantCandidate) => void
  open: boolean
  token: string
}) {
  const [query, setQuery] = useState('')
  const {
    debouncedValue: debouncedQuery,
    isDebouncing,
    normalizedValue: normalizedQuery,
  } = useDebouncedCatalogSearch(query)
  const search = useProductVariantCandidates(token, debouncedQuery)

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) setQuery('')
      }}
    >
      <DialogContent className="gap-4 p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6 pr-14">
          <DialogTitle>Select a Product Variant</DialogTitle>
          <DialogDescription>
            A BOM Implementation belongs permanently to one Product Variant.
          </DialogDescription>
        </DialogHeader>
        <div className="relative px-6">
          <SearchIcon className="pointer-events-none absolute top-3 left-9 size-4 text-muted-foreground" />
          <Input
            aria-label="Search Product Variants"
            autoFocus
            className="pl-10"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by Product or Product Variant"
            value={query}
          />
        </div>
        <div className="max-h-[23rem] overflow-y-auto border-y px-3 py-3">
          {!normalizedQuery ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Type to search Product Variants.
            </p>
          ) : null}
          {isDebouncing || search.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Searching Product Variants...
            </p>
          ) : null}
          {search.error && !isDebouncing ? (
            <div className="px-4 py-8 text-center" role="alert">
              <p className="text-sm">{search.error.message}</p>
              <Button
                className="mt-3"
                onClick={() => void search.refetch()}
                type="button"
                variant="outline"
              >
                Try again
              </Button>
            </div>
          ) : null}
          {!isDebouncing && search.data?.items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm">
              No matches for “{query.trim()}”. Check the name or ID.
            </p>
          ) : null}
          {!isDebouncing
            ? search.data?.items.map((candidate) => (
                <button
                  aria-label={candidateLabel(candidate)}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left enabled:hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!candidate.selectable}
                  key={candidate.id}
                  onClick={() => {
                    onSelect(candidate)
                    onOpenChange(false)
                    setQuery('')
                  }}
                  type="button"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{candidate.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {candidate.id}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {candidate.product.name} · {candidate.product.id}
                    </p>
                    {!candidate.selectable ? (
                      <p className="mt-1 text-xs font-medium">
                        {candidateReason(candidate)}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))
            : null}
          {!isDebouncing && search.data?.hasMore ? (
            <p className="px-4 py-3 text-center text-xs text-muted-foreground">
              More matches exist. Refine your search.
            </p>
          ) : null}
        </div>
        <p className="sr-only" aria-live="polite">
          {search.isLoading
            ? 'Loading Product Variant results.'
            : search.data
              ? `${search.data.items.length} Product Variant results.`
              : ''}
        </p>
        <p className="px-6 pb-6 text-xs text-muted-foreground">
          Ineligible matches remain visible so their current constraint is
          clear.
        </p>
      </DialogContent>
    </Dialog>
  )
}

function candidateReason(candidate: ProductVariantCandidate) {
  if (candidate.outcome === 'implementation-exists') {
    return `Existing Implementation: ${candidate.existingImplementation.name} · ${candidate.existingImplementation.id}`
  }
  if (candidate.outcome === 'product-unavailable') return 'Product unavailable'
  return 'Product Variant inactive'
}

function candidateLabel(candidate: ProductVariantCandidate) {
  const reason = candidate.selectable ? '' : ` ${candidateReason(candidate)}`
  return `${candidate.name} ${candidate.id} ${candidate.product.name} ${candidate.product.id}${reason}`
}
