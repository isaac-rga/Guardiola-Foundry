import MaterialSource from '#models/material_source'
import Material from '#models/material'
import MaterialSourceLink from '#models/material_source_link'
import VendorShade from '#modules/sources/models/vendor_shade'
import { deriveSourceAttention, IVA_PERCENTAGE } from '#modules/sources/source_catalog'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  CreateSourceRequest,
  CreateSourceResponse,
  GetSourceResponse,
  ListSourcesQuery,
  ListSourcesResponse,
  SourceLifecycleAffectedMaterial,
  SourceDetail,
  SourceLinkedMaterialSummary,
  SourceSummary,
  UpdateSourceRequest,
  UpdateSourceResponse,
} from '@guardiola-foundry/shared-types'
import { DateTime } from 'luxon'

type SourceLifecycleErrorCode = 'not-found' | 'preferred-source' | 'source-not-retired'

export class SourceLifecycleError extends Error {
  constructor(
    readonly code: SourceLifecycleErrorCode,
    message: string,
    readonly affectedMaterials: SourceLifecycleAffectedMaterial[] = []
  ) {
    super(message)
    this.name = 'SourceLifecycleError'
  }
}

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

export async function updateSource(
  sourceId: string,
  payload: UpdateSourceRequest,
  includeRetired: boolean
): Promise<UpdateSourceResponse | null> {
  const updatedSourceId = await db.transaction(async (trx) => {
    const query = MaterialSource.query({ client: trx }).where('publicId', sourceId)

    if (!includeRetired) {
      query.where('sourceStatus', 'active')
    }

    const source = await query.first()

    if (!source) {
      return null
    }

    source.merge({
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
    })
    await source.save()
    await reconcileVendorShades(source, payload.vendorShades ?? [], trx)

    return source.publicId
  })

  if (!updatedSourceId) {
    return null
  }

  const response = await getSource(updatedSourceId, includeRetired)

  if (!response) {
    throw new Error(`Updated Source ${updatedSourceId} could not be reloaded.`)
  }

  return response
}

export async function retireSource(sourceId: string): Promise<GetSourceResponse> {
  await db.transaction(async (trx) => {
    const source = await MaterialSource.query({ client: trx })
      .where('publicId', sourceId)
      .where('sourceStatus', 'active')
      .forUpdate()
      .first()

    if (!source) {
      throw new SourceLifecycleError('not-found', 'Source not found.')
    }

    const preferredLinks = await MaterialSourceLink.query({ client: trx })
      .where('materialSourceId', source.id)
      .where('isPreferred', true)
      .whereIn('materialId', trx.from('materials').select('id').whereNull('deleted_at'))
      .preload('material')
      .forUpdate()
    const affectedMaterials = preferredLinks
      .map((link) => ({ id: link.material.publicId, name: link.material.name }))
      .sort((left, right) => left.name.localeCompare(right.name))

    if (affectedMaterials.length > 0) {
      throw new SourceLifecycleError(
        'preferred-source',
        'Replace this Preferred Source for every affected Active Material before retiring it.',
        affectedMaterials
      )
    }

    source.sourceStatus = 'retired'
    await source.save()
  })

  const response = await getSource(sourceId, true)

  if (!response) {
    throw new Error(`Retired Source ${sourceId} could not be reloaded.`)
  }

  return response
}

export async function restoreSource(sourceId: string): Promise<GetSourceResponse> {
  await db.transaction(async (trx) => {
    const source = await MaterialSource.query({ client: trx })
      .where('publicId', sourceId)
      .forUpdate()
      .first()

    if (!source) {
      throw new SourceLifecycleError('not-found', 'Source not found.')
    }

    if (source.sourceStatus !== 'retired') {
      throw new SourceLifecycleError('source-not-retired', 'Only Retired Sources can be restored.')
    }

    source.sourceStatus = 'active'
    await source.save()
  })

  const response = await getSource(sourceId, true)

  if (!response) {
    throw new Error(`Restored Source ${sourceId} could not be reloaded.`)
  }

  return response
}

async function reconcileVendorShades(
  source: MaterialSource,
  desiredNamesOrCodes: string[],
  trx: TransactionClientContract
) {
  const existingShades = await VendorShade.query({ client: trx })
    .where('materialSourceId', source.id)
    .orderBy('id', 'asc')
  const desiredNames = new Set(desiredNamesOrCodes)
  const existingNames = new Set(existingShades.map((shade) => shade.nameOrCode))
  const unmatchedExisting = existingShades.filter((shade) => !desiredNames.has(shade.nameOrCode))
  const unmatchedDesired = desiredNamesOrCodes.filter(
    (nameOrCode) => !existingNames.has(nameOrCode)
  )
  const renameCount = Math.min(unmatchedExisting.length, unmatchedDesired.length)

  for (let index = 0; index < renameCount; index += 1) {
    unmatchedExisting[index].nameOrCode = unmatchedDesired[index]
    await unmatchedExisting[index].save()
  }

  const removedShadeIds = unmatchedExisting.slice(renameCount).map((shade) => shade.id)

  if (removedShadeIds.length > 0) {
    await MaterialSourceLink.query({ client: trx })
      .where('materialSourceId', source.id)
      .whereIn('vendorShadeId', removedShadeIds)
      .update({ vendorShadeId: null })
    await VendorShade.query({ client: trx }).whereIn('id', removedShadeIds).delete()
  }

  const addedNamesOrCodes = unmatchedDesired.slice(renameCount)

  if (addedNamesOrCodes.length > 0) {
    await VendorShade.createMany(
      addedNamesOrCodes.map((nameOrCode) => ({
        materialSourceId: source.id,
        nameOrCode,
      })),
      { client: trx }
    )
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
