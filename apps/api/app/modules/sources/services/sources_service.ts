import MaterialSource from '#models/material_source'
import { deriveSourceAttention } from '#modules/sources/source_catalog'
import type {
  ListSourcesQuery,
  ListSourcesResponse,
  SourceSummary,
} from '@guardiola-foundry/shared-types'

export async function listSources(filters: ListSourcesQuery): Promise<ListSourcesResponse> {
  const query = MaterialSource.query()
    .preload('materialLinks')
    .where('sourceStatus', filters.status ?? 'active')
    .orderBy('name', 'asc')
    .orderBy('vendor', 'asc')

  if (filters.search) {
    const search = filters.search.trim()
    query.where((searchQuery) => {
      searchQuery.whereILike('name', `%${search}%`).orWhereILike('vendor', `%${search}%`)
    })
  }

  if (filters.textileFamily) {
    query.where('textileFamily', filters.textileFamily)
  }

  const sources = await query
  const summaries = sources.map(serializeSourceSummary)

  return {
    sources: summaries.filter((source) => matchesRelationshipFilters(source, filters)),
  }
}

function serializeSourceSummary(source: MaterialSource): SourceSummary {
  const attention = deriveSourceAttention(source)

  return {
    id: source.publicId,
    name: source.name,
    vendor: source.vendor,
    textileFamily: source.textileFamily,
    purchasePresentation: source.purchasePresentation,
    purchaseUnit: source.purchaseUnit,
    vendorCurrency: source.vendorCurrency,
    purchasePriceCents: source.purchasePriceCents,
    landedUnitCostCents: source.landedUnitCostCents,
    linkedMaterialCount: source.materialLinks.length,
    ...attention,
  }
}

function matchesRelationshipFilters(source: SourceSummary, filters: ListSourcesQuery) {
  if (filters.linkState === 'linked' && source.linkedMaterialCount === 0) return false
  if (filters.linkState === 'unlinked' && source.linkedMaterialCount > 0) return false
  if (filters.attentionState === 'cost-needs-attention' && !source.costNeedsAttention) return false
  if (filters.attentionState === 'data-needs-attention' && !source.dataNeedsAttention) return false

  return true
}
