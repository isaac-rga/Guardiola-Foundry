import { AlertTriangleIcon, SparklesIcon } from 'lucide-react'
import { useState } from 'react'

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
import { usePatternSetDetail } from '@/features/pattern-sets/api/pattern-sets'
import { cn } from '@/lib/utils'

export function PatternProposalDialog({
  materialId,
  materialWidthCentimeters,
  onUse,
  patternSetId,
  proposalCount,
  token,
}: {
  materialId: string | null
  materialWidthCentimeters: number | null
  onUse: (quantityMeters: number) => void
  patternSetId: string
  proposalCount: number
  token: string
}) {
  const [open, setOpen] = useState(false)
  const detail = usePatternSetDetail(token, patternSetId, open)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="xs" type="button" variant="link">
          <SparklesIcon />
          {proposalCount} {proposalCount === 1 ? 'proposal' : 'proposals'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pattern proposals</DialogTitle>
          <DialogDescription>
            {detail.data?.name ?? patternSetId}. Compare the assumed widths and
            copy one suggestion into Final meters.
          </DialogDescription>
        </DialogHeader>
        {detail.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading proposals...
          </p>
        ) : null}
        {detail.error ? (
          <div className="py-8 text-center" role="alert">
            <p className="text-sm">{detail.error.message}</p>
            <Button
              className="mt-3"
              onClick={() => void detail.refetch()}
              type="button"
              variant="outline"
            >
              Try again
            </Button>
          </div>
        ) : null}
        {detail.data ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {detail.data.quantityProposals.map((proposal) => (
              <div
                className={cn(
                  'rounded-xl border p-4',
                  materialWidthCentimeters === proposal.assumedWidthCm
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border/70 bg-card',
                )}
                key={proposal.assumedWidthCm}
              >
                <div className="flex min-h-6 items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Assumes {proposal.assumedWidthCm} cm
                  </span>
                  {materialWidthCentimeters === proposal.assumedWidthCm ? (
                    <Badge variant="secondary">Current width</Badge>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <strong className="font-editorial text-3xl">
                    {proposal.quantityMeters} m
                  </strong>
                  <Button
                    aria-label={`Use proposed quantity ${proposal.quantityMeters} meters`}
                    disabled={!materialId}
                    onClick={() => {
                      onUse(proposal.quantityMeters)
                      setOpen(false)
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Use proposed quantity
                  </Button>
                </div>
                {proposal.evidenceNote ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {proposal.evidenceNote}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {detail.data?.status === 'retired' ? (
          <p className="flex gap-2 text-xs text-amber-800">
            <AlertTriangleIcon className="size-3.5 shrink-0" />
            Retired Pattern Set retained on this line.
          </p>
        ) : null}
        <p className="text-xs leading-5 text-muted-foreground">
          Suggestions are guidance only. The BOM saves only the Pattern Set and
          final quantity.
          {!materialId
            ? ' Select a Material before using a proposed quantity.'
            : ''}
        </p>
      </DialogContent>
    </Dialog>
  )
}
