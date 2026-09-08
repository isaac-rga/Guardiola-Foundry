// PROTOTYPE — throwaway UI, not production implementation.
// Two BOM catalog variants on the existing route, switchable via ?variant=.
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BoxIcon,
  CirclePlusIcon,
  CopyPlusIcon,
  FileStackIcon,
  FilterIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { PageHeader } from '@/components/app/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  BuilderProductVariantContext,
  BuilderScenario,
} from '@/features/bills-of-materials/prototype/bom-builder-prototype'
import { cn } from '@/lib/utils'

export type CatalogPrototypeVariant = 'A' | 'B'

type BomKind = 'implementation' | 'template'
type BomRecord = {
  deleted: boolean
  description: string
  id: string
  kind: BomKind
  lines: number
  name: string
  origin: string | null
  product: string | null
  productVariant: string | null
  projection: string
  verifiedLines: number
}
type PendingMutation = { action: 'delete' | 'restore'; bomId: string } | null
type ImplementationCreationRequest = {
  product: string | null
  scenario: 'create-implementation' | 'derive-implementation'
} | null
type CatalogProductVariant = BuilderProductVariantContext

const initialBoms: BomRecord[] = [
  {
    id: 'BOM-T-001',
    kind: 'template',
    name: 'Jackie construction base',
    description: 'Reusable construction starting point for Jackie variants.',
    product: 'Jackie',
    productVariant: null,
    origin: null,
    deleted: false,
    lines: 4,
    verifiedLines: 3,
    projection: '$882.40',
  },
  {
    id: 'BOM-I-014',
    kind: 'implementation',
    name: 'Jackie — Blush — Chapel Train',
    description: 'Showroom construction using blush tulle and chapel train.',
    product: 'Jackie',
    productVariant: 'Jackie Showroom',
    origin: 'Jackie construction base',
    deleted: false,
    lines: 3,
    verifiedLines: 1,
    projection: '$401.20 · partial',
  },
  {
    id: 'BOM-I-021',
    kind: 'implementation',
    name: 'Jackie — Ivory — Floor Length',
    description: 'Ivory construction for the bridal 2027 commercial variant.',
    product: 'Jackie',
    productVariant: 'Jackie Bridal 2027',
    origin: null,
    deleted: false,
    lines: 5,
    verifiedLines: 5,
    projection: '$1,248.30',
  },
  {
    id: 'BOM-T-008',
    kind: 'template',
    name: 'Aurora atelier base',
    description: 'Primary reusable construction for Aurora.',
    product: 'Aurora',
    productVariant: null,
    origin: 'Aurora first fitting',
    deleted: false,
    lines: 6,
    verifiedLines: 4,
    projection: '$1,560.00 · partial',
  },
  {
    id: 'BOM-I-034',
    kind: 'implementation',
    name: 'Aurora — Pearl — Sweep Train',
    description: 'Pearl atelier construction with a sweep train.',
    product: 'Aurora',
    productVariant: 'Aurora Atelier',
    origin: 'Aurora atelier base',
    deleted: false,
    lines: 6,
    verifiedLines: 6,
    projection: '$1,742.10',
  },
  {
    id: 'BOM-T-011',
    kind: 'template',
    name: 'Structured corset base',
    description:
      'Reusable corset construction awaiting a Product relationship.',
    product: null,
    productVariant: null,
    origin: null,
    deleted: false,
    lines: 3,
    verifiedLines: 3,
    projection: '$536.80',
  },
  {
    id: 'BOM-I-019',
    kind: 'implementation',
    name: 'Mila — Ivory — Cathedral',
    description: 'Deleted construction retained for recovery.',
    product: 'Mila',
    productVariant: 'Mila Atelier',
    origin: null,
    deleted: true,
    lines: 4,
    verifiedLines: 2,
    projection: '$980.20 · partial',
  },
]

const variants: CatalogPrototypeVariant[] = ['A', 'B']
const catalogProductVariants: CatalogProductVariant[] = [
  { product: 'Jackie', productVariant: 'Jackie Showroom' },
  { product: 'Jackie', productVariant: 'Jackie Bridal 2027' },
  { product: 'Jackie', productVariant: 'Jackie Atelier' },
  { product: 'Aurora', productVariant: 'Aurora Atelier' },
  { product: 'Aurora', productVariant: 'Aurora Editorial' },
  { product: 'Mila', productVariant: 'Mila Atelier' },
]
const variantNames: Record<CatalogPrototypeVariant, string> = {
  A: 'Operational catalog',
  B: 'Product workspace',
}

export function BomCatalogPrototype({
  onOpenBuilder,
  onVariantChange,
  variant,
}: {
  onOpenBuilder: (
    scenario: BuilderScenario,
    context?: BuilderProductVariantContext,
  ) => void
  onVariantChange: (variant: CatalogPrototypeVariant) => void
  variant: CatalogPrototypeVariant
}) {
  const [boms, setBoms] = useState(initialBoms)
  const [implementationRequest, setImplementationRequest] =
    useState<ImplementationCreationRequest>(null)
  const [pendingMutation, setPendingMutation] = useState<PendingMutation>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const pendingBom = pendingMutation
    ? (boms.find((bom) => bom.id === pendingMutation.bomId) ?? null)
    : null

  const requestMutation = (action: 'delete' | 'restore', bomId: string) => {
    setPendingMutation({ action, bomId })
  }
  const requestImplementation = (
    scenario: 'create-implementation' | 'derive-implementation',
    product: string | null = null,
  ) => setImplementationRequest({ product, scenario })
  const applyMutation = () => {
    if (!pendingMutation || !pendingBom) return
    const deleting = pendingMutation.action === 'delete'
    setBoms((current) =>
      current.map((bom) =>
        bom.id === pendingBom.id ? { ...bom, deleted: deleting } : bom,
      ),
    )
    setFeedback(`${deleting ? 'Deleted' : 'Restored'} ${pendingBom.name}.`)
    setPendingMutation(null)
  }
  const sharedProps = {
    boms,
    feedback,
    onDismissFeedback: () => setFeedback(null),
    onOpenBuilder,
    onRequestImplementation: requestImplementation,
    onRequestMutation: requestMutation,
  }

  return (
    <div className="space-y-5 pb-24">
      <PrototypeNotice />
      {variant === 'A' ? <VariantA {...sharedProps} /> : null}
      {variant === 'B' ? <VariantB {...sharedProps} /> : null}
      <MutationDialog
        mutation={pendingMutation}
        onCancel={() => setPendingMutation(null)}
        onConfirm={applyMutation}
        target={pendingBom}
      />
      <ProductVariantDialog
        boms={boms}
        onCancel={() => setImplementationRequest(null)}
        onConfirm={(context) => {
          if (!implementationRequest) return
          onOpenBuilder(implementationRequest.scenario, context)
          setImplementationRequest(null)
        }}
        request={implementationRequest}
      />
      <CatalogPrototypeSwitcher
        current={variant}
        onChange={onVariantChange}
        state={{ boms, feedback, implementationRequest, pendingMutation }}
      />
    </div>
  )
}

type VariantProps = {
  boms: BomRecord[]
  feedback: string | null
  onDismissFeedback: () => void
  onOpenBuilder: (
    scenario: BuilderScenario,
    context?: BuilderProductVariantContext,
  ) => void
  onRequestImplementation: (
    scenario: 'create-implementation' | 'derive-implementation',
    product?: string | null,
  ) => void
  onRequestMutation: (action: 'delete' | 'restore', bomId: string) => void
}

function VariantA({
  boms,
  feedback,
  onDismissFeedback,
  onOpenBuilder,
  onRequestImplementation,
  onRequestMutation,
}: VariantProps) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<'all' | BomKind>('all')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const visibleBoms = boms.filter((bom) => {
    const searchable = [
      bom.name,
      bom.id,
      bom.product,
      bom.productVariant,
      bom.origin,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return (
      searchable.includes(query.toLowerCase()) &&
      (kind === 'all' || bom.kind === kind) &&
      (includeDeleted || !bom.deleted)
    )
  })

  return (
    <div className="space-y-5">
      <CatalogHeader
        description="Find any Template or Implementation in one operational list, then act without leaving its row."
        onOpenBuilder={onOpenBuilder}
        onRequestImplementation={onRequestImplementation}
      />
      <SummaryStrip boms={boms} />
      <Feedback message={feedback} onDismiss={onDismissFeedback} />
      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
            <SearchField onChange={setQuery} value={query} />
            <FilterPill active={kind === 'all'} onClick={() => setKind('all')}>
              All
            </FilterPill>
            <FilterPill
              active={kind === 'template'}
              onClick={() => setKind('template')}
            >
              Templates
            </FilterPill>
            <FilterPill
              active={kind === 'implementation'}
              onClick={() => setKind('implementation')}
            >
              Implementations
            </FilterPill>
            <Button
              aria-pressed={includeDeleted}
              className="h-9"
              onClick={() => setIncludeDeleted((current) => !current)}
              size="sm"
              type="button"
              variant={includeDeleted ? 'secondary' : 'outline'}
            >
              <FilterIcon />{' '}
              {includeDeleted ? 'Including deleted' : 'Include deleted'}
            </Button>
          </div>
          {visibleBoms.length > 0 ? (
            <Table className="min-w-[68rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Bill of Materials</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product context</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBoms.map((bom) => (
                  <TableRow
                    className={cn(bom.deleted && 'opacity-65')}
                    key={bom.id}
                  >
                    <TableCell className="max-w-[18rem] whitespace-normal">
                      <button
                        className="text-left font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => onOpenBuilder(toEditScenario(bom))}
                        type="button"
                      >
                        {bom.name}
                      </button>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {bom.id}
                      </p>
                    </TableCell>
                    <TableCell>
                      <KindBadge kind={bom.kind} />
                    </TableCell>
                    <TableCell>
                      <ProductContext bom={bom} />
                    </TableCell>
                    <TableCell className="max-w-[14rem] whitespace-normal">
                      <OriginLabel bom={bom} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {bom.projection}
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-medium">{bom.lines}</p>
                      <p className="text-xs text-muted-foreground">
                        {bom.verifiedLines} verified
                      </p>
                    </TableCell>
                    <TableCell>
                      <RecordActions
                        bom={bom}
                        onOpenBuilder={onOpenBuilder}
                        onRequestImplementation={onRequestImplementation}
                        onRequestMutation={onRequestMutation}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyCatalog />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function VariantB({
  boms,
  feedback,
  onDismissFeedback,
  onOpenBuilder,
  onRequestImplementation,
  onRequestMutation,
}: VariantProps) {
  const [selectedProduct, setSelectedProduct] = useState('Jackie')
  const [showDeleted, setShowDeleted] = useState(false)
  const products = ['Jackie', 'Aurora', 'Mila']
  const productBoms = boms.filter(
    (bom) => bom.product === selectedProduct && (showDeleted || !bom.deleted),
  )
  const template = productBoms.find((bom) => bom.kind === 'template')
  const implementations = productBoms.filter(
    (bom) => bom.kind === 'implementation',
  )
  const unassociatedTemplates = boms.filter(
    (bom) => bom.kind === 'template' && !bom.product && !bom.deleted,
  )

  return (
    <div className="space-y-5">
      <CatalogHeader
        description="Work product by product: keep its one Template visible above the concrete BOM for each Product Variant."
        onOpenBuilder={onOpenBuilder}
        onRequestImplementation={onRequestImplementation}
      />
      <Feedback message={feedback} onDismiss={onDismissFeedback} />
      <div className="grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)_19rem]">
        <Card className="gap-3 self-start py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-xs tracking-[0.16em] uppercase">
              Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-3">
            {products.map((product) => {
              const count = boms.filter(
                (bom) => bom.product === product && !bom.deleted,
              ).length
              return (
                <button
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors',
                    selectedProduct === product
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted',
                  )}
                  key={product}
                  onClick={() => setSelectedProduct(product)}
                  type="button"
                >
                  <span className="font-medium">{product}</span>
                  <span
                    className={cn(
                      'text-xs',
                      selectedProduct === product
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </CardContent>
        </Card>
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Product workspace
              </p>
              <h2 className="font-editorial mt-1 text-4xl">
                {selectedProduct}
              </h2>
            </div>
            <Button
              aria-pressed={showDeleted}
              onClick={() => setShowDeleted((current) => !current)}
              size="sm"
              type="button"
              variant="outline"
            >
              {showDeleted ? 'Hide deleted' : 'Show deleted'}
            </Button>
          </div>
          <section aria-labelledby="product-template-heading">
            <div className="mb-2 flex items-center justify-between">
              <h3
                className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"
                id="product-template-heading"
              >
                Primary Template
              </h3>
              <span className="text-xs text-muted-foreground">
                One per Product
              </span>
            </div>
            {template ? (
              <WorkspaceRecord
                bom={template}
                onOpenBuilder={onOpenBuilder}
                onRequestImplementation={onRequestImplementation}
                onRequestMutation={onRequestMutation}
                prominent
              />
            ) : (
              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/15 px-5 py-8 text-sm font-medium hover:bg-muted/30"
                onClick={() => onOpenBuilder('create-template')}
                type="button"
              >
                <CirclePlusIcon className="size-4" /> Create the primary
                Template for {selectedProduct}
              </button>
            )}
          </section>
          <section aria-labelledby="variant-implementations-heading">
            <div className="mb-2 flex items-center justify-between">
              <h3
                className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"
                id="variant-implementations-heading"
              >
                Variant Implementations
              </h3>
              <span className="text-xs text-muted-foreground">
                One per Product Variant
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {implementations.map((bom) => (
                <WorkspaceRecord
                  bom={bom}
                  key={bom.id}
                  onOpenBuilder={onOpenBuilder}
                  onRequestImplementation={onRequestImplementation}
                  onRequestMutation={onRequestMutation}
                />
              ))}
              {!implementations.some((bom) => !bom.deleted) ? (
                <button
                  className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/15 px-5 py-7 text-center hover:bg-muted/30"
                  onClick={() =>
                    onRequestImplementation(
                      template
                        ? 'derive-implementation'
                        : 'create-implementation',
                      selectedProduct,
                    )
                  }
                  type="button"
                >
                  <CirclePlusIcon className="size-5" />
                  <span className="text-sm font-medium">
                    Create a Variant Implementation
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Choose an eligible Product Variant in the Builder
                  </span>
                </button>
              ) : null}
            </div>
          </section>
        </div>
        <Card className="gap-4 self-start py-5">
          <CardHeader className="px-5">
            <CardTitle>Unassociated Templates</CardTitle>
            <p className="text-xs leading-5 text-muted-foreground">
              Valid reusable BOMs that need a Product before they can create an
              Implementation.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 px-5">
            {unassociatedTemplates.map((bom) => (
              <div
                className="rounded-xl border border-border/70 p-3"
                key={bom.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{bom.name}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {bom.id}
                    </p>
                  </div>
                  <RecordActions
                    bom={bom}
                    onOpenBuilder={onOpenBuilder}
                    onRequestImplementation={onRequestImplementation}
                    onRequestMutation={onRequestMutation}
                  />
                </div>
                <Badge className="mt-3" variant="secondary">
                  Product needed to derive
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PrototypeNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-amber-500/40 bg-amber-50/70 px-4 py-3">
      <SparklesIcon className="mt-0.5 size-4 shrink-0 text-amber-700" />
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-amber-900 uppercase">
          Throwaway prototype · no data is saved
        </p>
        <p className="mt-1 text-xs text-amber-800/80">
          Compare two ways to browse BOMs and enter the approved shared Builder.
        </p>
      </div>
    </div>
  )
}

function CatalogHeader({
  description,
  onOpenBuilder,
  onRequestImplementation,
}: {
  description: string
  onOpenBuilder: VariantProps['onOpenBuilder']
  onRequestImplementation: VariantProps['onRequestImplementation']
}) {
  return (
    <PageHeader
      action={
        <CreateBomMenu
          onOpenBuilder={onOpenBuilder}
          onRequestImplementation={onRequestImplementation}
        />
      }
      description={description}
      title="Bills of Materials"
    />
  )
}

function CreateBomMenu({
  onOpenBuilder,
  onRequestImplementation,
}: {
  onOpenBuilder: VariantProps['onOpenBuilder']
  onRequestImplementation: VariantProps['onRequestImplementation']
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button">
          <PlusIcon /> Create BOM
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem
          onSelect={() => onRequestImplementation('create-implementation')}
        >
          <BoxIcon />
          <div>
            <p className="font-medium">BOM Implementation</p>
            <p className="text-xs text-muted-foreground">
              Start manually for a Product Variant
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onOpenBuilder('create-template')}>
          <FileStackIcon />
          <div>
            <p className="font-medium">BOM Template</p>
            <p className="text-xs text-muted-foreground">
              Create a reusable configuration
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RecordActions({
  bom,
  onOpenBuilder,
  onRequestImplementation,
  onRequestMutation,
}: {
  bom: BomRecord
  onOpenBuilder: VariantProps['onOpenBuilder']
  onRequestImplementation: VariantProps['onRequestImplementation']
  onRequestMutation: (action: 'delete' | 'restore', bomId: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Actions for ${bom.name}`}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {bom.deleted ? (
          <DropdownMenuItem
            onSelect={() => onRequestMutation('restore', bom.id)}
          >
            <RotateCcwIcon /> Restore BOM
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              onSelect={() => onOpenBuilder(toEditScenario(bom))}
            >
              <PencilIcon /> Edit in Builder
            </DropdownMenuItem>
            {bom.kind === 'template' ? (
              <DropdownMenuItem
                disabled={!bom.product}
                onSelect={() =>
                  onRequestImplementation(
                    'derive-implementation',
                    bom.product,
                  )
                }
              >
                <CopyPlusIcon /> Create Implementation
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onRequestMutation('delete', bom.id)}
              variant="destructive"
            >
              <Trash2Icon /> Delete BOM
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function WorkspaceRecord({
  bom,
  onOpenBuilder,
  onRequestImplementation,
  onRequestMutation,
  prominent = false,
}: {
  bom: BomRecord
  onOpenBuilder: VariantProps['onOpenBuilder']
  onRequestImplementation: VariantProps['onRequestImplementation']
  onRequestMutation: (action: 'delete' | 'restore', bomId: string) => void
  prominent?: boolean
}) {
  return (
    <Card
      className={cn(
        'gap-4 py-5',
        prominent && 'border-primary/20 bg-primary/4',
      )}
    >
      <CardHeader className="px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <KindBadge kind={bom.kind} />
              <AvailabilityBadge bom={bom} />
            </div>
            <CardTitle
              className={cn(
                'mt-3',
                prominent ? 'font-editorial text-3xl' : 'text-lg',
              )}
            >
              {bom.productVariant ?? bom.name}
            </CardTitle>
            {bom.productVariant ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {bom.name}
              </p>
            ) : null}
          </div>
          <RecordActions
            bom={bom}
            onOpenBuilder={onOpenBuilder}
            onRequestImplementation={onRequestImplementation}
            onRequestMutation={onRequestMutation}
          />
        </div>
      </CardHeader>
      <CardContent className="px-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-muted-foreground">
          <span>{bom.lines} lines</span>
          <span aria-hidden="true">·</span>
          <span>{bom.verifiedLines} verified</span>
          <span aria-hidden="true">·</span>
          <span>{bom.projection}</span>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          <span className="font-medium text-foreground">Origin:</span>{' '}
          {bom.origin ?? 'Created manually'}
        </p>
        {!bom.deleted && bom.kind === 'template' ? (
          <Button
            className="mt-4"
            onClick={() =>
              onRequestImplementation('derive-implementation', bom.product)
            }
            size="sm"
            type="button"
            variant="outline"
          >
            <CopyPlusIcon /> Create Implementation
          </Button>
        ) : null}
        {bom.deleted ? (
          <Button
            className="mt-4"
            onClick={() => onRequestMutation('restore', bom.id)}
            size="sm"
            type="button"
            variant="outline"
          >
            <RotateCcwIcon /> Restore
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function SummaryStrip({ boms }: { boms: BomRecord[] }) {
  const active = boms.filter((bom) => !bom.deleted)
  const templates = active.filter((bom) => bom.kind === 'template')
  const implementations = active.filter((bom) => bom.kind === 'implementation')
  const bomsWithoutProductVariant = active.filter(
    (bom) => !bom.productVariant,
  )
  const bomsPendingVerification = active.filter(
    (bom) => bom.verifiedLines < bom.lines,
  )

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <SummaryMetric
        detail={`${templates.length} Templates · ${implementations.length} Implementations`}
        label="Available BOMs"
        value={`${active.length}`}
      />
      <SummaryMetric
        label="BOMs without an associated Product Variant"
        value={`${bomsWithoutProductVariant.length}`}
        warning={bomsWithoutProductVariant.length > 0}
      />
      <SummaryMetric
        label="BOMs pending line verification"
        value={`${bomsPendingVerification.length}`}
        warning={bomsPendingVerification.length > 0}
      />
    </div>
  )
}

function SummaryMetric({
  detail,
  label,
  value,
  warning = false,
}: {
  detail?: string
  label: string
  value: string
  warning?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-card/80 px-4 py-3',
        warning && 'border-amber-500/25 bg-amber-50/70',
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-editorial mt-1 text-3xl">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  )
}

function SearchField({
  compact = false,
  onChange,
  value,
}: {
  compact?: boolean
  onChange: (value: string) => void
  value: string
}) {
  return (
    <div className={cn('relative w-full', !compact && 'lg:max-w-sm')}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Search Bills of Materials"
        className="h-9 pl-10"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search name, ID, Product, Variant, or origin"
        type="search"
        value={value}
      />
    </div>
  )
}

function FilterPill({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <Button
      aria-pressed={active}
      className="h-9"
      onClick={onClick}
      size="sm"
      type="button"
      variant={active ? 'secondary' : 'ghost'}
    >
      {children}
    </Button>
  )
}

function KindBadge({ kind }: { kind: BomKind }) {
  return (
    <Badge variant={kind === 'template' ? 'secondary' : 'outline'}>
      {kind === 'template' ? 'Template' : 'Implementation'}
    </Badge>
  )
}

function AvailabilityBadge({ bom }: { bom: BomRecord }) {
  if (bom.deleted) return <Badge variant="destructive">Deleted</Badge>
  if (bom.kind === 'template' && !bom.product)
    return <Badge variant="secondary">Needs Product</Badge>
  return <Badge variant="default">Available</Badge>
}

function ProductContext({ bom }: { bom: BomRecord }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">
        {bom.product ?? 'No Product associated'}
      </p>
      {bom.productVariant ? (
        <p className="text-xs text-muted-foreground">
          Variant · {bom.productVariant}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {bom.kind === 'template'
            ? 'Product relationship is optional'
            : 'Variant required'}
        </p>
      )}
    </div>
  )
}

function OriginLabel({ bom }: { bom: BomRecord }) {
  return bom.origin ? (
    <div>
      <p className="text-sm">{bom.origin}</p>
      <p className="mt-1 text-xs text-muted-foreground">Immediate origin</p>
    </div>
  ) : (
    <span className="text-sm text-muted-foreground">Created manually</span>
  )
}

function Feedback({
  message,
  onDismiss,
}: {
  message: string | null
  onDismiss: () => void
}) {
  if (!message) return null
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3"
      role="status"
    >
      <p className="text-sm text-emerald-800">{message}</p>
      <Button onClick={onDismiss} size="sm" type="button" variant="ghost">
        Dismiss
      </Button>
    </div>
  )
}

function EmptyCatalog() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
      <p className="text-sm font-medium">
        No Bills of Materials match this view.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Adjust the search or filters to broaden the catalog.
      </p>
    </div>
  )
}

function ProductVariantDialog({
  boms,
  onCancel,
  onConfirm,
  request,
}: {
  boms: BomRecord[]
  onCancel: () => void
  onConfirm: (context: BuilderProductVariantContext) => void
  request: ImplementationCreationRequest
}) {
  const [query, setQuery] = useState('')
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)

  useEffect(() => {
    setQuery('')
    setSelectedVariant(null)
  }, [request])

  const occupiedVariants = new Set(
    boms
      .filter((bom) => bom.kind === 'implementation' && !bom.deleted)
      .map((bom) => bom.productVariant),
  )
  const eligibleVariants = catalogProductVariants.filter(
    (variant) =>
      !occupiedVariants.has(variant.productVariant) &&
      (!request?.product || variant.product === request.product),
  )
  const normalizedQuery = query.trim().toLowerCase()
  const visibleVariants = eligibleVariants.filter((variant) =>
    `${variant.product} ${variant.productVariant}`
      .toLowerCase()
      .includes(normalizedQuery),
  )
  const selection = eligibleVariants.find(
    (variant) => variant.productVariant === selectedVariant,
  )

  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Select a Product Variant</DialogTitle>
          <DialogDescription>
            A BOM Implementation belongs permanently to one Product Variant.
            Choose the context before entering the Builder.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search Product Variants"
            autoFocus
            className="pl-10"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by Product or Product Variant"
            type="search"
            value={query}
          />
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {visibleVariants.map((variant) => {
            const selected = variant.productVariant === selectedVariant
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border/70 hover:bg-muted/40',
                )}
                key={variant.productVariant}
                onClick={() => setSelectedVariant(variant.productVariant)}
                type="button"
              >
                <span>
                  <span className="block text-sm font-medium">
                    {variant.productVariant}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Product · {variant.product}
                  </span>
                </span>
                {selected ? <Badge>Selected</Badge> : null}
              </button>
            )
          })}
          {visibleVariants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
              <p className="text-sm font-medium">No eligible variants found.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try another search or create an active Product Variant first.
              </p>
            </div>
          ) : null}
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Variants with an existing active BOM Implementation are excluded.
        </p>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={!selection}
            onClick={() => {
              if (selection) onConfirm(selection)
            }}
            type="button"
          >
            Continue to Builder <ArrowRightIcon />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MutationDialog({
  mutation,
  onCancel,
  onConfirm,
  target,
}: {
  mutation: PendingMutation
  onCancel: () => void
  onConfirm: () => void
  target: BomRecord | null
}) {
  const restoring = mutation?.action === 'restore'
  return (
    <Dialog
      open={mutation !== null}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {restoring ? 'Restore' : 'Delete'}{' '}
            {target?.name ?? 'Bill of Materials'}?
          </DialogTitle>
          <DialogDescription>
            {restoring
              ? 'Restoring makes this BOM available again and reclaims its exclusive Product or Product Variant relationship.'
              : 'This removes the BOM from normal views and releases its exclusive Product or Product Variant relationship. Its independent descendants remain available.'}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
          <p className="font-medium">{target?.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {target?.kind === 'template'
              ? `Template · ${target.product ?? 'No Product'}`
              : `Implementation · ${target?.productVariant}`}
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={onConfirm}
            type="button"
            variant={restoring ? 'default' : 'destructive'}
          >
            {restoring ? <RotateCcwIcon /> : <Trash2Icon />}
            {restoring ? 'Restore BOM' : 'Delete BOM'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CatalogPrototypeSwitcher({
  current,
  onChange,
  state,
}: {
  current: CatalogPrototypeVariant
  onChange: (variant: CatalogPrototypeVariant) => void
  state: unknown
}) {
  const [showState, setShowState] = useState(false)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      )
        return
      event.preventDefault()
      const offset = event.key === 'ArrowRight' ? 1 : -1
      const index = variants.indexOf(current)
      onChange(variants[(index + offset + variants.length) % variants.length])
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [current, onChange])
  if (import.meta.env.PROD) return null
  const cycle = (offset: number) => {
    const index = variants.indexOf(current)
    onChange(variants[(index + offset + variants.length) % variants.length])
  }
  return (
    <>
      {showState ? (
        <aside className="fixed right-5 bottom-24 z-50 max-h-[55svh] w-[min(32rem,calc(100vw-2.5rem))] overflow-auto rounded-2xl border border-stone-700 bg-stone-950 p-4 text-stone-100 shadow-2xl">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase">
              Prototype state
            </p>
            <Button
              className="text-stone-300 hover:bg-stone-800 hover:text-white"
              onClick={() => setShowState(false)}
              size="xs"
              type="button"
              variant="ghost"
            >
              Close
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-[11px] leading-5 text-stone-300">
            {JSON.stringify(state, null, 2)}
          </pre>
        </aside>
      ) : null}
      <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-stone-700 bg-stone-950 p-1.5 text-stone-100 shadow-2xl">
        <Button
          aria-label="Previous catalog prototype variant"
          className="rounded-full text-stone-200 hover:bg-stone-800 hover:text-white"
          onClick={() => cycle(-1)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <ArrowLeftIcon />
        </Button>
        <button
          className="min-w-52 px-3 text-center text-xs font-medium"
          onClick={() => setShowState((currentValue) => !currentValue)}
          type="button"
        >
          {current} — {variantNames[current]}
          <span className="ml-2 text-stone-500">State</span>
        </button>
        <Button
          aria-label="Next catalog prototype variant"
          className="rounded-full text-stone-200 hover:bg-stone-800 hover:text-white"
          onClick={() => cycle(1)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <ArrowRightIcon />
        </Button>
      </div>
    </>
  )
}

function toEditScenario(bom: BomRecord): BuilderScenario {
  return bom.kind === 'template' ? 'edit-template' : 'edit-implementation'
}
