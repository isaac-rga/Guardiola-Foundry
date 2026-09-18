import { SearchIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
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
import { cn } from '@/lib/utils'
import { useProductVariantCandidates } from '../api/bills-of-materials'

export function ProductVariantCandidateDialog({
  onAuthenticationFailure,
  onOpenChange,
  onSelect,
  open,
  productId,
  returnFocusRef,
  templateId,
  token,
}: {
  onAuthenticationFailure?: () => void
  onOpenChange: (open: boolean) => void
  onSelect: (candidate: ProductVariantCandidate) => void
  open: boolean
  productId?: string
  returnFocusRef?: RefObject<HTMLElement | null>
  templateId?: string
  token: string
}) {
  const [query, setQuery] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const handledAuthenticationFailureRef = useRef(false)
  const pendingSelectionRef = useRef<{
    candidate: ProductVariantCandidate
    onSelect: (candidate: ProductVariantCandidate) => void
  } | null>(null)
  const {
    debouncedValue: debouncedQuery,
    isDebouncing,
    normalizedValue: normalizedQuery,
  } = useDebouncedCatalogSearch(query)
  const search = useProductVariantCandidates(
    token,
    open ? debouncedQuery : '',
    { productId, templateId },
  )
  const isSearching = isDebouncing || search.isFetching

  useEffect(() => {
    if (!search.isAuthenticationError) {
      handledAuthenticationFailureRef.current = false
      return
    }
    if (handledAuthenticationFailureRef.current) return

    handledAuthenticationFailureRef.current = true
    onAuthenticationFailure?.()
  }, [onAuthenticationFailure, search.isAuthenticationError])

  const activateCandidate = (candidate: ProductVariantCandidate) => {
    if (!candidate.selectable) {
      setAnnouncement(candidateReason(candidate))
      return
    }

    pendingSelectionRef.current = { candidate, onSelect }
    setAnnouncement(`${candidate.name} selected.`)
    onOpenChange(false)
    setQuery('')
  }
  const searchStatusMessage = candidateSearchAnnouncement({
    error: normalizedQuery ? search.error : null,
    hasMore: normalizedQuery.length > 0 && search.data?.hasMore === true,
    isLoading: isSearching,
    itemCount: normalizedQuery ? search.data?.items.length : undefined,
  })
  const statusMessage = isSearching
    ? searchStatusMessage
    : announcement || searchStatusMessage

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen)
          if (!nextOpen) {
            setQuery('')
            if (!pendingSelectionRef.current) setAnnouncement('')
          }
        }}
      >
        <DialogContent
          className="h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4 p-0 sm:h-auto sm:max-w-2xl sm:grid-rows-none"
          onCloseAutoFocus={(event) => {
            const pendingSelection = pendingSelectionRef.current
            pendingSelectionRef.current = null
            if (returnFocusRef?.current) {
              event.preventDefault()
              returnFocusRef.current.focus()
            }
            if (!pendingSelection) return
            window.setTimeout(
              () => pendingSelection.onSelect(pendingSelection.candidate),
              0,
            )
          }}
        >
          <DialogHeader className="px-6 pt-6 pr-14">
            <DialogTitle>Select a Product Variant</DialogTitle>
            <DialogDescription>
              {templateId
                ? "Choose an eligible Variant of this Template's Product."
                : 'A BOM Implementation belongs permanently to one Product Variant.'}
            </DialogDescription>
          </DialogHeader>
          <div className="relative px-6">
            <SearchIcon className="pointer-events-none absolute top-3 left-9 size-4 text-muted-foreground" />
            <Input
              aria-label="Search Product Variants"
              autoFocus
              className="pl-10"
              onChange={(event) => {
                setAnnouncement('')
                setQuery(event.target.value)
              }}
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
            {isSearching ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Searching Product Variants...
              </p>
            ) : null}
            {normalizedQuery && search.error && !isSearching ? (
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
            !isSearching &&
            search.data?.items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm">
                No matches for “{query.trim()}”. Check the name or ID.
              </p>
            ) : null}
            {normalizedQuery && !isSearching
              ? search.data?.items.map((candidate) => (
                  <button
                    aria-disabled={!candidate.selectable}
                    aria-label={candidateLabel(candidate)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left',
                      candidate.selectable
                        ? 'hover:bg-muted/60'
                        : 'cursor-not-allowed opacity-60',
                    )}
                    key={candidate.id}
                    onClick={() => activateCandidate(candidate)}
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
            {normalizedQuery && !isSearching && search.data?.hasMore ? (
              <p className="px-4 py-3 text-center text-xs text-muted-foreground">
                More matches exist. Refine your search.
              </p>
            ) : null}
          </div>
          <p className="sr-only" aria-atomic="true" role="status">
            {statusMessage}
          </p>
          <p className="px-6 pb-6 text-xs text-muted-foreground">
            Ineligible matches remain visible so their current constraint is
            clear.
          </p>
        </DialogContent>
      </Dialog>
      {!open && announcement ? (
        <p className="sr-only" aria-atomic="true" role="status">
          {announcement}
        </p>
      ) : null}
    </>
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

function candidateSearchAnnouncement({
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
  if (isLoading) return 'Loading Product Variant results.'
  if (error) return error.message
  if (itemCount === 0) return 'No Product Variant matches.'
  if (itemCount !== undefined) {
    return `${itemCount} Product Variant results.${hasMore ? ' More matches exist.' : ''}`
  }
  return ''
}
