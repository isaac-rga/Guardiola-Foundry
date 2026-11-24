import {
  CheckIcon,
  ChevronLeftIcon,
  FilterIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type TableFilterCriterion = {
  key: string
  label: string
  value?: string
  valueLabel?: string
  options?: Array<{ value: string; label: string }>
  searchable?: boolean
  additive?: boolean
  onChange: (value: string | undefined) => void
}

type TableFiltersProps = {
  criteria: TableFilterCriterion[]
  onClearAll: () => void
  search?: {
    label: string
    placeholder: string
    value: string
    onChange: (value: string) => void
  }
}

export function TableFilters({
  criteria,
  onClearAll,
  search,
}: TableFiltersProps) {
  const searchId = useId()
  const [open, setOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [optionSearch, setOptionSearch] = useState('')
  const activeCriteria = criteria.filter(
    (criterion) => criterion.value !== undefined,
  )
  const selected = criteria.find((criterion) => criterion.key === selectedKey)
  const options = (selected?.options ?? []).filter(
    (option) =>
      !selected?.searchable ||
      option.label
        .toLocaleLowerCase()
        .includes(optionSearch.trim().toLocaleLowerCase()),
  )

  function editCriterion(criterion: TableFilterCriterion) {
    setSelectedKey(criterion.additive ? null : criterion.key)
    setOptionSearch('')
    setOpen(true)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {search ? (
          <div className="min-w-0 basis-full sm:max-w-[28rem] sm:flex-1 sm:basis-auto">
            <label className="sr-only" htmlFor={searchId}>
              {search.label}
            </label>
            <div className="relative">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id={searchId}
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                className="h-9 rounded-lg pr-2.5 pl-8 text-sm"
                placeholder={search.placeholder}
                type="search"
              />
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Popover
            open={open}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen)
              if (nextOpen) {
                setSelectedKey(null)
                setOptionSearch('')
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <FilterIcon aria-hidden="true" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent
              aria-label="Table filters"
              align="end"
              sideOffset={8}
              className="z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl outline-none"
            >
              <div className="space-y-3">
                <PopoverHeader
                  title={selected?.label ?? 'Filters'}
                  onBack={selected ? () => setSelectedKey(null) : undefined}
                  onClose={() => setOpen(false)}
                />
                {selected ? (
                  <div className="space-y-2">
                    {selected.searchable ? (
                      <Input
                        autoFocus
                        aria-label={`Search ${selected.label} options`}
                        className="h-9"
                        placeholder={`Search ${selected.label.toLocaleLowerCase()} options`}
                        type="search"
                        value={optionSearch}
                        onChange={(event) =>
                          setOptionSearch(event.target.value)
                        }
                      />
                    ) : null}
                    <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                      {options.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          aria-pressed={selected.value === option.value}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                            selected.value === option.value &&
                              'bg-muted font-medium',
                          )}
                          onClick={() => {
                            selected.onChange(option.value)
                            setSelectedKey(null)
                            setOptionSearch('')
                          }}
                        >
                          {option.label}
                          {selected.value === option.value ? (
                            <CheckIcon aria-hidden="true" className="size-4" />
                          ) : null}
                        </button>
                      ))}
                      {options.length === 0 ? (
                        <p className="px-3 py-5 text-center text-sm text-muted-foreground">
                          No options match.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {criteria.map((criterion) => (
                      <button
                        type="button"
                        key={criterion.key}
                        className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        onClick={() => {
                          if (criterion.additive) criterion.onChange('true')
                          else editCriterion(criterion)
                        }}
                      >
                        <span>{criterion.label}</span>
                        <span className="max-w-40 truncate text-xs text-muted-foreground">
                          {criterion.valueLabel ??
                            (criterion.value !== undefined ? 'On' : 'Not set')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {activeCriteria.length > 0 ? (
                  <div className="border-t pt-3">
                    <Button
                      type="button"
                      className="w-full"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onClearAll()
                        setSelectedKey(null)
                        setOptionSearch('')
                      }}
                    >
                      Clear all
                    </Button>
                  </div>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {activeCriteria.length > 0 || search?.value.trim() ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeCriteria.map((criterion) => (
            <FilterChip
              key={criterion.key}
              criterion={criterion}
              onEdit={() => editCriterion(criterion)}
              onRemove={() => criterion.onChange(undefined)}
            />
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function PopoverHeader({
  onBack,
  onClose,
  title,
}: {
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
        <p className="font-semibold">{title}</p>
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

function FilterChip({
  criterion,
  onEdit,
  onRemove,
}: {
  criterion: TableFilterCriterion
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
