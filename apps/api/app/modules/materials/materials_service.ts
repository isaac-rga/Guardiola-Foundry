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
  SearchMaterialsResponse,
  ReplacePreferredSourceRequest,
  ReplacePreferredSourceResponse,
  UnlinkMaterialSourceResponse,
} from '@guardiola-foundry/shared-types'

type MaterialRelationshipErrorCode =
  | 'duplicate-source'
  | 'material-not-found'
  | 'preferred-source'
  | 'preferred-source-missing-cost'
  | 'preferred-source-replacement-failed'
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

const MATERIAL_SEARCH_LIMIT = 25
const NORMALIZED_MATERIAL_SEARCH_DOCUMENT = `
  regexp_replace(
    translate(
      lower(concat_ws(' ',
        materials.public_id,
        materials.name,
        materials.material_color,
        replace(materials.material_use, '-', ' '),
        preferred_source.public_id,
        preferred_source.name,
        preferred_source.vendor,
        vendor_shade.name_or_code,
        preferred_source.description,
        preferred_source.width_centimeters::text
      )),
      'áéíóúüñ',
      'aeiouun'
    ),
    '\\s+',
    ' ',
    'g'
  )
`

export async function searchMaterials(search: string): Promise<SearchMaterialsResponse> {
  const terms = search.split(' ')
  const normalizedMaterialId = `lower(materials.public_id)`
  const normalizedMaterialName = `translate(lower(materials.name), 'áéíóúüñ', 'aeiouun')`
  const query = db
    .from('materials')
    .join('material_source_links as preferred_link', function () {
      this.on('preferred_link.material_id', '=', 'materials.id').andOnVal(
        'preferred_link.is_preferred',
        true
      )
    })
    .join(
      'material_sources as preferred_source',
      'preferred_source.id',
      'preferred_link.material_source_id'
    )
    .leftJoin(
      'material_source_vendor_shades as vendor_shade',
      'vendor_shade.id',
      'preferred_link.vendor_shade_id'
    )
    .whereNull('materials.deleted_at')
    .select([
      'materials.public_id as material_public_id',
      'materials.name as material_name',
      'materials.material_color',
      'materials.material_use',
      'preferred_source.public_id as source_public_id',
      'preferred_source.name as source_name',
      'preferred_source.vendor as source_vendor',
      'vendor_shade.name_or_code as vendor_shade',
      'preferred_source.description as source_description',
      'preferred_source.width_centimeters',
      'preferred_source.source_status',
      'preferred_source.deleted_at as source_deleted_at',
      'preferred_source.landed_unit_cost_cents',
    ])
    .orderByRaw(
      `CASE
        WHEN ${normalizedMaterialId} = ? THEN 0
        WHEN ${normalizedMaterialName} = ? THEN 1
        WHEN ${normalizedMaterialId} LIKE ? THEN 2
        WHEN ${normalizedMaterialName} LIKE ? THEN 3
        ELSE 4
      END`,
      [search, search, `${search}%`, `${search}%`]
    )
    .orderBy('materials.name', 'asc')
    .orderBy('materials.public_id', 'asc')
    .limit(MATERIAL_SEARCH_LIMIT + 1)

  terms.forEach((term) => {
    query.whereRaw(`position(? in ${NORMALIZED_MATERIAL_SEARCH_DOCUMENT}) > 0`, [term])
  })

  const rows = await query

  return {
    items: rows.slice(0, MATERIAL_SEARCH_LIMIT).map((row) => ({
      id: row.material_public_id,
      name: row.material_name,
      materialColor: row.material_color,
      materialUse: row.material_use,
      preferredSource: {
        id: row.source_public_id,
        name: row.source_name,
        vendor: row.source_vendor,
        vendorShadeOrDetail: row.vendor_shade ?? row.source_description,
        widthCentimeters: row.width_centimeters === null ? null : Number(row.width_centimeters),
      },
      attention:
        row.source_deleted_at !== null ||
        row.source_status !== 'active' ||
        row.landed_unit_cost_cents === null
          ? ['source-needs-attention' as const]
          : [],
    })),
    hasMore: rows.length > MATERIAL_SEARCH_LIMIT,
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
      .forUpdate()
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

export async function replacePreferredSource(
  materialId: string,
  payload: ReplacePreferredSourceRequest
): Promise<ReplacePreferredSourceResponse> {
  try {
    await db.transaction(async (trx) => {
      const material = await Material.query({ client: trx }).where('publicId', materialId).first()

      if (!material) {
        throw new MaterialRelationshipError('material-not-found', 'Material not found.')
      }

      const source = await MaterialSource.query({ client: trx })
        .where('publicId', payload.sourceId)
        .forUpdate()
        .first()

      if (!source) {
        throw new MaterialRelationshipError('source-not-found', 'Source not found.')
      }

      if (source.sourceStatus !== 'active') {
        throw new MaterialRelationshipError(
          'source-not-active',
          'Only an Active Source can become Preferred.'
        )
      }

      const sourceLink = await MaterialSourceLink.query({ client: trx })
        .where('materialId', material.id)
        .where('materialSourceId', source.id)
        .first()

      if (!sourceLink || sourceLink.isPreferred) {
        throw new MaterialRelationshipError(
          'source-relationship-not-found',
          'Only a linked alternate Source can become Preferred.'
        )
      }

      if (source.landedUnitCostCents === null) {
        throw new MaterialRelationshipError(
          'preferred-source-missing-cost',
          'Add Landed Unit Cost before selecting this Source as Preferred.'
        )
      }

      const currentPreferredLink = await MaterialSourceLink.query({ client: trx })
        .where('materialId', material.id)
        .where('isPreferred', true)
        .first()

      if (!currentPreferredLink) {
        throw new Error(`Material ${material.publicId} requires a Preferred Source.`)
      }

      currentPreferredLink.isPreferred = false
      await currentPreferredLink.save()

      sourceLink.isPreferred = true
      await sourceLink.save()
    })
  } catch (error) {
    if (error instanceof MaterialRelationshipError) {
      throw error
    }

    throw new MaterialRelationshipError(
      'preferred-source-replacement-failed',
      'Preferred Source could not be replaced. Please try again.'
    )
  }

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
    alternateSourceCount: material.sourceLinks.filter(
      (sourceLink) =>
        !sourceLink.isPreferred &&
        sourceLink.materialSource.sourceStatus === 'active' &&
        sourceLink.materialSource.deletedAt === null
    ).length,
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
    preferredEligibility: link.isPreferred
      ? 'already-preferred'
      : source.sourceStatus !== 'active' || source.deletedAt !== null
        ? 'source-not-active'
        : source.landedUnitCostCents === null
          ? 'missing-landed-unit-cost'
          : 'eligible',
    vendorShade: link.vendorShade
      ? { id: link.vendorShade.id, nameOrCode: link.vendorShade.nameOrCode }
      : null,
  }
}
