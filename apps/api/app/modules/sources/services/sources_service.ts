import MaterialSource from '#models/material_source'
import Material from '#models/material'
import VendorShade from '#modules/sources/models/vendor_shade'
import { deriveSourceAttention, IVA_PERCENTAGE } from '#modules/sources/source_catalog'
import db from '@adonisjs/lucid/services/db'
import type {
  CreateSourceRequest,
  CreateSourceResponse,
  GetSourceResponse,
  ListSourcesQuery,
  ListSourcesResponse,
  SourceDetail,
  SourceLinkedMaterialSummary,
  SourceSummary,
} from '@guardiola-foundry/shared-types'
import { DateTime } from 'luxon'

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

export async function getSource(
  sourceId: string,
  includeRetired: boolean
): Promise<GetSourceResponse | null> {
  const query = MaterialSource.query()
    .where('publicId', sourceId)
    .preload('vendorShades', (vendorShadeQuery) => vendorShadeQuery.orderBy('nameOrCode', 'asc'))
    .preload('materialLinks', (materialLinkQuery) => {
      materialLinkQuery
        .preload('material', (materialQuery) => {
          Material.includeDeleted(materialQuery)
        })
        .preload('vendorShade')
    })

  if (!includeRetired) {
    query.where('sourceStatus', 'active')
  }

  const source = await query.first()

  return source ? { source: serializeSourceDetail(source) } : null
}

export async function createSource(payload: CreateSourceRequest): Promise<CreateSourceResponse> {
  const source = await db.transaction(async (trx) => {
    const createdSource = await MaterialSource.create(
      {
        legacySourceId: null,
        name: payload.name,
        vendor: payload.vendor,
        textileFamily: payload.textileFamily,
        purchasePresentation: payload.purchasePresentation,
        fixedPieceLength: payload.fixedPieceLength ?? null,
        purchaseUnit: payload.purchaseUnit,
        minimumPurchaseQuantity: payload.minimumPurchaseQuantity,
        purchasePriceCents: payload.purchasePriceCents,
        priceDate: DateTime.fromISO(payload.priceDate, { zone: 'utc' }),
        vendorCurrency: payload.vendorCurrency,
        landedUnitCostCents: payload.landedUnitCostCents ?? null,
        sourceStatus: 'active',
        normalizedUnit: 'meter',
        vendorSku: payload.vendorSku ?? null,
        url: payload.url ?? null,
        description: payload.description ?? null,
        manufacturer: payload.manufacturer ?? null,
        fiber: payload.fiber ?? null,
        composition: payload.composition ?? null,
        gsmGramsPerSquareMeter: payload.gsmGramsPerSquareMeter ?? null,
        widthCentimeters: payload.widthCentimeters ?? null,
        finish: payload.finish ?? null,
        weave: payload.weave ?? null,
        presentationNotes: payload.presentationNotes ?? null,
        countryOfOrigin: payload.countryOfOrigin ?? null,
        comments: payload.comments ?? null,
        estimatedShippingUsdPerKilogramCents: payload.estimatedShippingUsdPerKilogramCents ?? null,
        igiPercentage: payload.igiPercentage ?? null,
      },
      { client: trx }
    )
    await createdSource.refresh()

    if (payload.vendorShades && payload.vendorShades.length > 0) {
      await VendorShade.createMany(
        payload.vendorShades.map((nameOrCode) => ({
          materialSourceId: createdSource.id,
          nameOrCode,
        })),
        { client: trx }
      )
    }

    return createdSource
  })
  const response = await getSource(source.publicId, true)

  if (!response) {
    throw new Error(`Created Source ${source.publicId} could not be reloaded.`)
  }

  return response
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

function serializeSourceDetail(source: MaterialSource): SourceDetail {
  return {
    id: source.publicId,
    legacySourceId: source.legacySourceId,
    name: source.name,
    vendor: source.vendor,
    textileFamily: source.textileFamily,
    purchasePresentation: source.purchasePresentation,
    fixedPieceLength: source.fixedPieceLength,
    purchaseUnit: source.purchaseUnit,
    minimumPurchaseQuantity: source.minimumPurchaseQuantity,
    purchasePriceCents: source.purchasePriceCents,
    priceDate: source.priceDate?.toISODate() ?? null,
    vendorCurrency: source.vendorCurrency,
    landedUnitCostCents: source.landedUnitCostCents,
    sourceStatus: source.sourceStatus,
    normalizedUnit: source.normalizedUnit,
    vendorSku: source.vendorSku,
    url: source.url,
    description: source.description,
    manufacturer: source.manufacturer,
    fiber: source.fiber,
    composition: source.composition,
    gsmGramsPerSquareMeter: source.gsmGramsPerSquareMeter,
    widthCentimeters: source.widthCentimeters,
    finish: source.finish,
    weave: source.weave,
    presentationNotes: source.presentationNotes,
    countryOfOrigin: source.countryOfOrigin,
    comments: source.comments,
    estimatedShippingUsdPerKilogramCents: source.estimatedShippingUsdPerKilogramCents,
    igiPercentage: source.igiPercentage,
    ivaPercentage: IVA_PERCENTAGE,
    ...deriveSourceAttention(source),
    vendorShades: source.vendorShades.map((shade) => ({
      id: shade.id,
      nameOrCode: shade.nameOrCode,
    })),
    linkedMaterials: source.materialLinks
      .map((link) => serializeLinkedMaterial(link, source.sourceStatus))
      .sort((left, right) => left.name.localeCompare(right.name)),
  }
}

function serializeLinkedMaterial(
  link: MaterialSource['materialLinks'][number],
  sourceStatus: MaterialSource['sourceStatus']
): SourceLinkedMaterialSummary {
  return {
    id: link.material.publicId,
    name: link.material.name,
    materialColor: link.material.materialColor,
    materialUse: link.material.materialUse,
    relationship: link.isPreferred ? 'preferred' : 'alternate',
    relationshipStatus:
      sourceStatus === 'retired' || link.material.deletedAt !== null ? 'historical' : 'active',
    vendorShade: link.vendorShade
      ? { id: link.vendorShade.id, nameOrCode: link.vendorShade.nameOrCode }
      : null,
  }
}

function matchesRelationshipFilters(source: SourceSummary, filters: ListSourcesQuery) {
  if (filters.linkState === 'linked' && source.linkedMaterialCount === 0) return false
  if (filters.linkState === 'unlinked' && source.linkedMaterialCount > 0) return false
  if (filters.attentionState === 'cost-needs-attention' && !source.costNeedsAttention) return false
  if (filters.attentionState === 'data-needs-attention' && !source.dataNeedsAttention) return false

  return true
}
