import Material from '#models/material'
import MaterialSource from '#models/material_source'
import type {
  GetMaterialResponse,
  ListMaterialsResponse,
  MaterialDetail,
  MaterialPreferredSourceSummary,
  MaterialSourceRelationshipSummary,
  MaterialSummary,
} from '@guardiola-foundry/shared-types'

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
