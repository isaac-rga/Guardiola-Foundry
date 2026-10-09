import type {
  ListSourcesQuery,
  SourceAttentionState,
  SourceLinkState,
  TextileFamily,
  UserRole,
} from '@guardiola-foundry/shared-types'
import { TEXTILE_FAMILIES } from '@guardiola-foundry/shared-types'

import {
  TableFilters,
  type TableFilterCriterion,
} from '@/components/app/table-filters'

type SourceFiltersProps = {
  filters: ListSourcesQuery
  onFiltersChange: (
    changes: Partial<ListSourcesQuery>,
    options?: { replace?: boolean },
  ) => void
  onSearchChange: (value: string) => void
  onClearAll: () => void
  role: UserRole
}

export function SourceFilters({
  filters,
  onFiltersChange,
  onClearAll,
  onSearchChange,
  role,
}: SourceFiltersProps) {
  const criteria: TableFilterCriterion[] = [
    {
      key: 'textileFamily',
      label: 'Textile family',
      value: filters.textileFamily,
      valueLabel: filters.textileFamily,
      options: TEXTILE_FAMILIES.map((value) => ({ label: value, value })),
      onChange: (value) =>
        onFiltersChange({ textileFamily: value as TextileFamily | undefined }),
    },
    {
      key: 'linkState',
      label: 'Material link',
      value: filters.linkState,
      valueLabel: filters.linkState === 'linked' ? 'Linked' : 'Unlinked',
      options: [
        { value: 'linked', label: 'Linked' },
        { value: 'unlinked', label: 'Unlinked' },
      ],
      onChange: (value) =>
        onFiltersChange({ linkState: value as SourceLinkState | undefined }),
    },
    {
      key: 'attentionState',
      label: 'Attention',
      value: filters.attentionState,
      valueLabel:
        filters.attentionState === 'cost-needs-attention'
          ? 'Cost needs attention'
          : 'Data needs attention',
      options: [
        { value: 'cost-needs-attention', label: 'Cost needs attention' },
        { value: 'data-needs-attention', label: 'Data needs attention' },
      ],
      onChange: (value) =>
        onFiltersChange({
          attentionState: value as SourceAttentionState | undefined,
        }),
    },
  ]
  if (role === 'admin') {
    criteria.push({
      key: 'includeRetired',
      label: 'Include retired',
      value: filters.includeRetired ? 'true' : undefined,
      additive: true,
      onChange: (value) =>
        onFiltersChange({ includeRetired: value ? true : undefined }),
    })
  }

  return (
    <TableFilters
      criteria={criteria}
      onClearAll={onClearAll}
      search={{
        label: 'Search Sources',
        placeholder: 'Search Source Name or Vendor',
        value: filters.search ?? '',
        onChange: onSearchChange,
      }}
    />
  )
}
