import Material from '#models/material'
import MaterialSource from '#models/material_source'
import MaterialSourceLink from '#models/material_source_link'
import VendorShade from '#modules/sources/models/vendor_shade'
import db from '@adonisjs/lucid/services/db'
import type {
  GetMaterialResponse,
  LinkMaterialSourceRequest,
  LinkMaterialSourceResponse,
  ListMaterialsResponse,
  MaterialDetail,
  MaterialPreferredSourceSummary,
  MaterialSourceRelationshipSummary,
  MaterialSummary,
  UnlinkMaterialSourceResponse,
} from '@guardiola-foundry/shared-types'

type MaterialRelationshipErrorCode =
  | 'duplicate-source'
  | 'material-not-found'
  | 'preferred-source'
  | 'source-not-active'
  | 'source-not-found'
  | 'source-relationship-not-found'
  | 'vendor-shade-mismatch'

export class MaterialRelationshipError extends Error {
  constructor(
    readonly code: MaterialRelationshipErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'MaterialRelationshipError'
  }
}

export async function listMaterials(): Promise<ListMaterialsResponse> {
  const materials = await Material.query()
    .preload('sourceLinks', (sourceLinkQuery) => {
      sourceLinkQuery
        .preload('materialSource', (materialSourceQuery) => {
          MaterialSource.includeDeleted(materialSourceQuery)
        })
        .orderBy('sortOrder', 'asc')
    })
    .orderBy('name', 'asc')

  return {
    materials: materials.map(serializeMaterialSummary),
  }
}

export async function getMaterial(materialId: string): Promise<GetMaterialResponse | null> {
  const material = await Material.queryWithDeleted()
    .where('publicId', materialId)
    .preload('sourceLinks', (sourceLinkQuery) => {
      sourceLinkQuery
        .preload('materialSource', (materialSourceQuery) => {
          MaterialSource.includeDeleted(materialSourceQuery)
        })
        .preload('vendorShade')
        .orderBy('sortOrder', 'asc')
    })
    .first()

  return material ? { material: serializeMaterialDetail(material) } : null
}

export async function linkMaterialSource(
  materialId: string,
  payload: LinkMaterialSourceRequest
): Promise<LinkMaterialSourceResponse> {
  await db.transaction(async (trx) => {
    const material = await Material.query({ client: trx }).where('publicId', materialId).first()

    if (!material) {
      throw new MaterialRelationshipError('material-not-found', 'Material not found.')
    }

    const source = await MaterialSource.query({ client: trx })
      .where('publicId', payload.sourceId)
      .first()

    if (!source) {
      throw new MaterialRelationshipError('source-not-found', 'Source not found.')
    }

    if (source.sourceStatus !== 'active') {
      throw new MaterialRelationshipError(
        'source-not-active',
        'Only Active Sources can be linked to a Material.'
      )
    }

    const existingLinks = await MaterialSourceLink.query({ client: trx }).where(
      'materialId',
      material.id
    )

    if (existingLinks.some((link) => link.materialSourceId === source.id)) {
      throw new MaterialRelationshipError(
        'duplicate-source',
        'This Source is already linked to the Material.'
      )
    }

    if (payload.vendorShadeId !== null && payload.vendorShadeId !== undefined) {
      const vendorShade = await VendorShade.query({ client: trx })
        .where('id', payload.vendorShadeId)
        .where('materialSourceId', source.id)
        .first()

      if (!vendorShade) {
        throw new MaterialRelationshipError(
          'vendor-shade-mismatch',
          'Select a Vendor Shade that belongs to the linked Source.'
        )
      }
    }

    const nextSortOrder = Math.max(0, ...existingLinks.map((link) => link.sortOrder)) + 1

    await MaterialSourceLink.create(
      {
        materialId: material.id,
        materialSourceId: source.id,
        sortOrder: nextSortOrder,
        isPreferred: false,
        vendorShadeId: payload.vendorShadeId ?? null,
      },
      { client: trx }
    )
  })

  const response = await getMaterial(materialId)

  if (!response) {
    throw new Error(`Updated Material ${materialId} could not be reloaded.`)
  }

  return response
}

export async function unlinkMaterialSource(
  materialId: string,
  sourceId: string
): Promise<UnlinkMaterialSourceResponse> {
  await db.transaction(async (trx) => {
    const material = await Material.query({ client: trx }).where('publicId', materialId).first()

    if (!material) {
      throw new MaterialRelationshipError('material-not-found', 'Material not found.')
    }

    const source = await MaterialSource.query({ client: trx }).where('publicId', sourceId).first()

    if (!source) {
      throw new MaterialRelationshipError('source-not-found', 'Source not found.')
    }

    const sourceLink = await MaterialSourceLink.query({ client: trx })
      .where('materialId', material.id)
      .where('materialSourceId', source.id)
      .first()

    if (!sourceLink) {
      throw new MaterialRelationshipError(
        'source-relationship-not-found',
        'This Source is not linked to the Material.'
      )
    }

    if (sourceLink.isPreferred) {
      throw new MaterialRelationshipError(
        'preferred-source',
        'Replace the Preferred Source before unlinking it.'
      )
    }

    await sourceLink.delete()
  })

  const response = await getMaterial(materialId)

  if (!response) {
    throw new Error(`Updated Material ${materialId} could not be reloaded.`)
  }

  return response
}

function serializeMaterialSummary(material: Material): MaterialSummary {
  const preferredLink = material.sourceLinks.find((sourceLink) => sourceLink.isPreferred)

  if (!preferredLink) {
    throw new Error(`Material ${material.publicId} requires a Preferred Source.`)
  }

  const preferredSource = serializePreferredSource(preferredLink.materialSource)

  return {
    id: material.publicId,
    name: material.name,
    materialColor: material.materialColor,
    materialUse: material.materialUse,
    materialUnit: material.materialUnit,
    preferredSource,
    derivedUnitCostCents: preferredSource.normalizedUnitCostCents,
    alternateSourceCount: material.sourceLinks.filter((sourceLink) => !sourceLink.isPreferred)
      .length,
    comments: material.comments,
  }
}

function serializePreferredSource(materialSource: MaterialSource): MaterialPreferredSourceSummary {
  if (materialSource.landedUnitCostCents === null) {
    throw new Error(`Preferred Source ${materialSource.publicId} requires Landed Unit Cost.`)
  }

  return {
    id: materialSource.publicId,
    name: materialSource.name,
    provider: materialSource.vendor,
    normalizedUnitCostCents: materialSource.landedUnitCostCents,
    normalizedUnit: materialSource.normalizedUnit,
    needsAttention: materialSource.deletedAt !== null,
  }
}

function serializeMaterialDetail(material: Material): MaterialDetail {
  return {
    id: material.publicId,
    name: material.name,
    materialColor: material.materialColor,
    materialUse: material.materialUse,
    materialUnit: material.materialUnit,
    comments: material.comments,
    sourceRelationships: material.sourceLinks
      .map((link) => serializeSourceRelationship(link, material.deletedAt !== null))
      .sort((left, right) => {
        const rank = (relationship: MaterialSourceRelationshipSummary) => {
          if (relationship.relationship === 'preferred') return 0
          return relationship.relationshipStatus === 'active' ? 1 : 2
        }

        return rank(left) - rank(right)
      }),
  }
}

function serializeSourceRelationship(
  link: Material['sourceLinks'][number],
  materialIsHistorical: boolean
): MaterialSourceRelationshipSummary {
  const source = link.materialSource

  return {
    id: source.publicId,
    name: source.name,
    vendor: source.vendor,
    relationship: link.isPreferred ? 'preferred' : 'alternate',
    relationshipStatus:
      materialIsHistorical || source.sourceStatus === 'retired' || source.deletedAt !== null
        ? 'historical'
        : 'active',
    vendorShade: link.vendorShade
      ? { id: link.vendorShade.id, nameOrCode: link.vendorShade.nameOrCode }
      : null,
  }
}
