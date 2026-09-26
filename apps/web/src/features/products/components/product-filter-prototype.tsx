import {
  CheckIcon,
  ChevronLeftIcon,
  FilterIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type {
  ProductCategory,
  ProductLifecycleStatus,
  ProductStatus,
} from '@guardiola-foundry/shared-types'

// THROWAWAY PROTOTYPE — post-selection filter flow available through
// `?filterPrototype=A` on the existing `/app/products` route.

type LifecycleFilter = 'all' | ProductLifecycleStatus
type ProductStatusFilter = 'all' | ProductStatus
type ProductCategoryFilter = 'all' | ProductCategory | 'none'
type CollectionFilter = 'all' | 'none' | `${number}`
type CriterionKey =
  | 'lifecycle'
  | 'productStatus'
  | 'productCategory'
  | 'collection'
  | 'includeDeleted'

type ProductFilterPrototypeProps = {
  collectionFilter: CollectionFilter
  collections: Array<{ id: number; name: string }>
  includeDeleted: boolean
  isAdmin: boolean
  lifecycleFilter: LifecycleFilter
  onClearAll: () => void
  onCollectionFilterChange: (value: CollectionFilter) => void
  onIncludeDeletedChange: (value: boolean) => void
  onLifecycleFilterChange: (value: LifecycleFilter) => void
  onProductCategoryFilterChange: (value: ProductCategoryFilter) => void
  onProductStatusFilterChange: (value: ProductStatusFilter) => void
  onSearchValueChange: (value: string) => void
  productCategoryFilter: ProductCategoryFilter
  productStatusFilter: ProductStatusFilter
  searchValue: string
}

type PrototypeState = Pick<
  ProductFilterPrototypeProps,
  | 'collectionFilter'
  | 'collections'
  | 'includeDeleted'
  | 'isAdmin'
  | 'lifecycleFilter'
  | 'onCollectionFilterChange'
  | 'onIncludeDeletedChange'
  | 'onLifecycleFilterChange'
  | 'onProductCategoryFilterChange'
  | 'onProductStatusFilterChange'
  | 'productCategoryFilter'
  | 'productStatusFilter'
>

type ActiveCriterion = {
  key: CriterionKey
  label: string
  valueLabel?: string
}

type VariantProps = {
  activeCriteria: ActiveCriterion[]
  onClearAll: () => void
  open: boolean
  selectedCriterion: CriterionKey | null
  setOpen: (open: boolean) => void
  setSelectedCriterion: (criterion: CriterionKey | null) => void
  state: PrototypeState
}

const criteria: Array<{ key: CriterionKey; label: string }> = [
  { key: 'lifecycle', label: 'Lifecycle status' },
  { key: 'productStatus', label: 'Product status' },
  { key: 'productCategory', label: 'Product category' },
  { key: 'collection', label: 'Collection' },
  { key: 'includeDeleted', label: 'Include deleted' },
]

const lifecycleOptions: Array<{ label: string; value: LifecycleFilter }> = [
  { value: 'concept', label: 'Concept' },
  { value: 'fabric-trim-selection', label: 'Fabric & Trim Selection' },
  { value: 'design-and-prototyping', label: 'Design & Prototyping' },
  { value: 'testing', label: 'Testing' },
  { value: 'approved', label: 'Approved' },
  { value: 'on-documentation', label: 'On Documentation' },
  { value: 'finished', label: 'Finished' },
]

const productStatusOptions: Array<{
  label: string
  value: ProductStatusFilter
}> = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const productCategoryOptions: Array<{
  label: string
  value: ProductCategoryFilter
}> = [
  { value: 'none', label: 'No category' },
  { value: 'dress', label: 'Dress' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'other', label: 'Other' },
]

export function ProductFilterPrototype(props: ProductFilterPrototypeProps) {
  const [open, setOpen] = useState(false)
  const [selectedCriterion, setSelectedCriterion] =
    useState<CriterionKey | null>(null)
  const state: PrototypeState = props
  const activeCriteria = getActiveCriteria(state)

  function editCriterion(criterion: CriterionKey) {
    setSelectedCriterion(criterion)
    setOpen(true)
  }

  const variantProps: VariantProps = {
    activeCriteria,
    onClearAll: props.onClearAll,
    open,
    selectedCriterion,
    setOpen,
    setSelectedCriterion,
    state,
  }

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-primary/30 bg-primary/[0.025] p-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 basis-full sm:max-w-[28rem] sm:flex-1 sm:basis-auto">
          <label className="sr-only" htmlFor="product-filter-prototype-search">
            Search by product name
          </label>
          <div className="relative">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="product-filter-prototype-search"
              value={props.searchValue}
              onChange={(event) =>
                props.onSearchValueChange(event.target.value)
              }
              className="h-9 rounded-lg pr-2.5 pl-8 text-sm"
              placeholder="Search products by name"
              type="search"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <VariantA {...variantProps} />
        </div>
      </div>

      {activeCriteria.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeCriteria.map((criterion) => (
            <FilterChip
              criterion={criterion}
              key={criterion.key}
              onEdit={() => editCriterion(criterion.key)}
              onRemove={() => clearCriterion(state, criterion.key)}
            />
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={props.onClearAll}
          >
            Clear all
          </Button>
        </div>
      ) : null}

      <PrototypeStateReadout
        activeCriteria={activeCriteria}
        searchValue={props.searchValue}
      />
    </div>
  )
}

function VariantA({
  activeCriteria,
  onClearAll,
  open,
  setOpen,
  setSelectedCriterion,
  selectedCriterion,
  state,
}: VariantProps) {
  return (
    <FilterPopover
      label="Filter"
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) setSelectedCriterion(null)
      }}
      contentClassName="w-[min(22rem,calc(100vw-2rem))]"
    >
      {selectedCriterion ? (
        <div className="space-y-3">
          <PopoverHeader
            eyebrow="Choose one value"
            title={criterionLabel(selectedCriterion)}
            onBack={() => setSelectedCriterion(null)}
          />
          <CriterionEditor
            criterion={selectedCriterion}
            state={state}
            onApplied={() => setSelectedCriterion(null)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <PopoverHeader
            eyebrow="Variant A"
            title="Add another criterion"
            onClose={() => setOpen(false)}
          />
          <FieldList
            activeCriteria={activeCriteria}
            isAdmin={state.isAdmin}
            onSelect={setSelectedCriterion}
          />
          {activeCriteria.length > 0 ? (
            <div className="border-t pt-3">
              <Button
                className="w-full"
                size="sm"
                variant="outline"
                onClick={onClearAll}
              >
                Clear all
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </FilterPopover>
  )
}

function FilterPopover({
  children,
  contentClassName,
  label,
  onOpenChange,
  open,
}: {
  children: React.ReactNode
  contentClassName: string
  label: string
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <Button type="button" size="sm" variant="outline">
          <FilterIcon aria-hidden="true" />
          {label}
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl outline-none',
            contentClassName,
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function PopoverHeader({
  eyebrow,
  onBack,
  onClose,
  title,
}: {
  eyebrow: string
  onBack?: () => void
  onClose?: () => void
  title: string
}) {
  return (
    <div className="flex items-start gap-2">
      {onBack ? (
        <Button
          aria-label="Back to criteria"
          className="mt-0.5"
          size="icon-sm"
          variant="ghost"
          onClick={onBack}
        >
          <ChevronLeftIcon />
        </Button>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <p className="font-medium">{title}</p>
      </div>
      {onClose ? (
        <Button
          aria-label="Close filters"
          className="-mt-1 -mr-1"
          size="icon-sm"
          variant="ghost"
          onClick={onClose}
        >
          <XIcon aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  )
}

function FieldList({
  activeCriteria,
  isAdmin,
  onSelect,
}: {
  activeCriteria: ActiveCriterion[]
  isAdmin: boolean
  onSelect: (criterion: CriterionKey) => void
}) {
  return (
    <div className="space-y-1">
      {criteria
        .filter(
          (criterion) => criterion.key !== 'includeDeleted' || isAdmin,
        )
        .map((criterion) => {
          const active = activeCriteria.find(
            (item) => item.key === criterion.key,
          )

          return (
            <button
              className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              key={criterion.key}
              onClick={() => onSelect(criterion.key)}
              type="button"
            >
              <span>{criterion.label}</span>
              <span className="max-w-40 truncate text-xs text-muted-foreground">
                {active?.valueLabel ?? (active ? 'On' : 'Not set')}
              </span>
            </button>
          )
        })}
    </div>
  )
}

function CriterionEditor({
  criterion,
  onApplied,
  state,
}: {
  criterion: CriterionKey
  onApplied: (valueLabel: string) => void
  state: PrototypeState
}) {
  const [collectionQuery, setCollectionQuery] = useState('')
  const options = useMemo(
    () => optionsForCriterion(criterion, state),
    [criterion, state],
  )
  const filteredOptions =
    criterion === 'collection'
      ? options.filter((option) =>
          option.label
            .toLocaleLowerCase()
            .includes(collectionQuery.trim().toLocaleLowerCase()),
        )
      : options

  return (
    <div className="space-y-2">
      {criterion === 'collection' ? (
        <Input
          autoFocus
          className="h-9"
          onChange={(event) => setCollectionQuery(event.target.value)}
          placeholder="Search loaded collections"
          type="search"
          value={collectionQuery}
        />
      ) : null}
      <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
        {filteredOptions.map((option) => {
          const selected = isOptionSelected(criterion, option.value, state)

          return (
            <button
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                selected && 'bg-muted font-medium',
              )}
              key={option.value}
              onClick={() => {
                applyCriterion(state, criterion, option.value)
                onApplied(option.label)
              }}
              type="button"
            >
              {option.label}
              {selected ? <CheckIcon aria-hidden="true" className="size-4" /> : null}
            </button>
          )
        })}
        {filteredOptions.length === 0 ? (
          <p className="px-3 py-5 text-center text-sm text-muted-foreground">
            No loaded collections match.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function FilterChip({
  criterion,
  onEdit,
  onRemove,
}: {
  criterion: ActiveCriterion
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <span className="inline-flex h-8 items-center overflow-hidden rounded-full border border-border bg-card text-xs shadow-xs">
      <button
        className="h-full px-3 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        onClick={onEdit}
        type="button"
      >
        {criterion.valueLabel
          ? `${criterion.label}: ${criterion.valueLabel}`
          : criterion.label}
      </button>
      <button
        aria-label={`Remove ${criterion.label} filter`}
        className="grid h-full w-8 place-items-center border-l border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        onClick={onRemove}
        type="button"
      >
        <XIcon aria-hidden="true" className="size-3.5" />
      </button>
    </span>
  )
}

function PrototypeStateReadout({
  activeCriteria,
  searchValue,
}: {
  activeCriteria: ActiveCriterion[]
  searchValue: string
}) {
  const criteriaSummary = activeCriteria.length
    ? activeCriteria
        .map((criterion) =>
          criterion.valueLabel
            ? `${criterion.label}=${criterion.valueLabel}`
            : criterion.label,
        )
        .join(' · ')
    : 'none'

  return (
    <p className="text-[0.68rem] text-muted-foreground" aria-live="polite">
      Prototype state — search: {searchValue || 'empty'} · criteria: {criteriaSummary}
    </p>
  )
}

function getActiveCriteria(state: PrototypeState): ActiveCriterion[] {
  const active: ActiveCriterion[] = []

  if (state.lifecycleFilter !== 'all') {
    active.push({
      key: 'lifecycle',
      label: 'Lifecycle status',
      valueLabel: labelForValue(lifecycleOptions, state.lifecycleFilter),
    })
  }
  if (state.productStatusFilter !== 'all') {
    active.push({
      key: 'productStatus',
      label: 'Product status',
      valueLabel: labelForValue(productStatusOptions, state.productStatusFilter),
    })
  }
  if (state.productCategoryFilter !== 'all') {
    active.push({
      key: 'productCategory',
      label: 'Product category',
      valueLabel: labelForValue(
        productCategoryOptions,
        state.productCategoryFilter,
      ),
    })
  }
  if (state.collectionFilter !== 'all') {
    active.push({
      key: 'collection',
      label: 'Collection',
      valueLabel:
        state.collectionFilter === 'none'
          ? 'No collection'
          : (state.collections.find(
              (collection) => `${collection.id}` === state.collectionFilter,
            )?.name ?? 'Unknown collection'),
    })
  }
  if (state.includeDeleted) {
    active.push({ key: 'includeDeleted', label: 'Include deleted' })
  }

  return active
}

function optionsForCriterion(
  criterion: CriterionKey,
  state: PrototypeState,
): Array<{ label: string; value: string }> {
  if (criterion === 'lifecycle') return lifecycleOptions
  if (criterion === 'productStatus') return productStatusOptions
  if (criterion === 'productCategory') return productCategoryOptions
  if (criterion === 'includeDeleted') {
    return [
      { value: 'true', label: 'Include deleted' },
      { value: 'false', label: 'Exclude deleted' },
    ]
  }

  return [
    { value: 'none', label: 'No collection' },
    ...state.collections.map((collection) => ({
      value: `${collection.id}`,
      label: collection.name,
    })),
  ]
}

function applyCriterion(
  state: PrototypeState,
  criterion: CriterionKey,
  value: string,
) {
  if (criterion === 'lifecycle') {
    state.onLifecycleFilterChange(value as LifecycleFilter)
  } else if (criterion === 'productStatus') {
    state.onProductStatusFilterChange(value as ProductStatusFilter)
  } else if (criterion === 'productCategory') {
    state.onProductCategoryFilterChange(value as ProductCategoryFilter)
  } else if (criterion === 'collection') {
    state.onCollectionFilterChange(value as CollectionFilter)
  } else {
    state.onIncludeDeletedChange(value === 'true')
  }
}

function clearCriterion(state: PrototypeState, criterion: CriterionKey) {
  if (criterion === 'lifecycle') state.onLifecycleFilterChange('all')
  if (criterion === 'productStatus') state.onProductStatusFilterChange('all')
  if (criterion === 'productCategory') {
    state.onProductCategoryFilterChange('all')
  }
  if (criterion === 'collection') state.onCollectionFilterChange('all')
  if (criterion === 'includeDeleted') state.onIncludeDeletedChange(false)
}

function isOptionSelected(
  criterion: CriterionKey,
  value: string,
  state: PrototypeState,
) {
  if (criterion === 'lifecycle') return state.lifecycleFilter === value
  if (criterion === 'productStatus') return state.productStatusFilter === value
  if (criterion === 'productCategory') {
    return state.productCategoryFilter === value
  }
  if (criterion === 'collection') return state.collectionFilter === value
  return state.includeDeleted === (value === 'true')
}

function criterionLabel(criterion: CriterionKey) {
  return criteria.find((item) => item.key === criterion)?.label ?? criterion
}

function labelForValue(
  options: Array<{ label: string; value: string }>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value
}
