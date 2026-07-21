import Material from '#models/material'
import MaterialSource from '#models/material_source'
import type {
  ListMaterialsResponse,
  MaterialPreferredSourceSummary,
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
  return {
    id: materialSource.publicId,
    name: materialSource.name,
    provider: materialSource.provider,
    normalizedUnitCostCents: materialSource.normalizedUnitCostCents,
    normalizedUnit: materialSource.normalizedUnit,
    needsAttention: materialSource.deletedAt !== null,
  }
}
