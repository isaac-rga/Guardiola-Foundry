import type {
  ListSourcesQuery,
  SourceAttentionState,
  SourceLinkState,
  SourceStatus,
  TextileFamily,
  UserRole,
} from '@guardiola-foundry/shared-types'
import {
  SOURCE_ATTENTION_STATES,
  SOURCE_LINK_STATES,
  SOURCE_STATUSES,
  TEXTILE_FAMILIES,
} from '@guardiola-foundry/shared-types'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SourceFiltersProps = {
  filters: ListSourcesQuery
  onFiltersChange: (changes: Partial<ListSourcesQuery>) => void
  role: UserRole
}

const ALL_FILTER_VALUE = 'all'

export function SourceFilters({
  filters,
  onFiltersChange,
  role,
}: SourceFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
      <Input
        type="search"
        aria-label="Search Sources"
        placeholder="Search Source Name or Vendor"
        className="h-9 lg:max-w-sm"
        value={filters.search ?? ''}
        onChange={(event) =>
          onFiltersChange({
            search: event.target.value.trimStart() || undefined,
          })
        }
      />
      <FilterSelect
        label="Textile Family"
        value={filters.textileFamily ?? ALL_FILTER_VALUE}
        options={TEXTILE_FAMILIES.map((value) => ({ label: value, value }))}
        onValueChange={(value) =>
          onFiltersChange({
            textileFamily:
              value === ALL_FILTER_VALUE ? undefined : (value as TextileFamily),
          })
        }
      />
      {role === 'admin' ? (
        <FilterSelect
          label="Source Status"
          value={filters.status ?? 'active'}
          options={SOURCE_STATUSES.map((value) => ({
            label: value === 'active' ? 'Active' : 'Retired',
            value,
          }))}
          includeAll={false}
          onValueChange={(value) =>
            onFiltersChange({ status: value as SourceStatus })
          }
        />
      ) : null}
      <FilterSelect
        label="Material Link"
        value={filters.linkState ?? ALL_FILTER_VALUE}
        options={SOURCE_LINK_STATES.map((value) => ({
          label: value === 'linked' ? 'Linked' : 'Unlinked',
          value,
        }))}
        onValueChange={(value) =>
          onFiltersChange({
            linkState:
              value === ALL_FILTER_VALUE
                ? undefined
                : (value as SourceLinkState),
          })
        }
      />
      <FilterSelect
        label="Attention"
        value={filters.attentionState ?? ALL_FILTER_VALUE}
        options={SOURCE_ATTENTION_STATES.map((value) => ({
          label:
            value === 'cost-needs-attention'
              ? 'Cost needs attention'
              : 'Data needs attention',
          value,
        }))}
        onValueChange={(value) =>
          onFiltersChange({
            attentionState:
              value === ALL_FILTER_VALUE
                ? undefined
                : (value as SourceAttentionState),
          })
        }
      />
    </div>
  )
}

function FilterSelect({
  includeAll = true,
  label,
  onValueChange,
  options,
  value,
}: {
  includeAll?: boolean
  label: string
  onValueChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  value: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={label}
        className="h-9 w-full min-w-[10rem] lg:w-auto"
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {includeAll ? (
          <SelectItem value={ALL_FILTER_VALUE}>All {label}</SelectItem>
        ) : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
