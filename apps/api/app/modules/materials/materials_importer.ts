import Material from '#models/material'
import MaterialSource from '#models/material_source'
import MaterialSourceLink from '#models/material_source_link'
import type { MaterialColor, MaterialUse } from '@guardiola-foundry/shared-types'

export interface ImportedMaterialSourceRow {
  legacySourceId: string
  name: string
  provider: string
  textileFamily: string
  purchaseUnit: string
  normalizedUnitCostCents: number
}

export interface ImportedMaterialRow {
  legacyMaterialId: string
  name: string
  materialColor: MaterialColor
  materialUse: MaterialUse
  comments: string | null
  legacySourceIds: string[]
}

const MATERIAL_PUBLIC_ID_PREFIX = 'M-'
const SOURCE_PUBLIC_ID_PREFIX = 'MS-'

export async function importMaterialsFromRows(
  sourceRows: ImportedMaterialSourceRow[],
  materialRows: ImportedMaterialRow[]
) {
  const sourcesByLegacyId = new Map<string, MaterialSource>()

  for (const [sourceIndex, sourceRow] of sourceRows.entries()) {
    const source = await upsertSource(sourceRow, sourceIndex)

    sourcesByLegacyId.set(source.legacySourceId, source)
  }

  let importedCount = 0
  let skippedCount = 0

  for (const materialRow of materialRows) {
    const linkedSources = materialRow.legacySourceIds.map((legacySourceId) =>
      sourcesByLegacyId.get(legacySourceId)
    )

    if (linkedSources.some((source) => !source)) {
      skippedCount += 1
      continue
    }

    const material = await upsertMaterial(materialRow, importedCount)

    await MaterialSourceLink.query().where('materialId', material.id).delete()

    for (const [linkIndex, source] of linkedSources.entries()) {
      await MaterialSourceLink.create({
        materialId: material.id,
        materialSourceId: source!.id,
        sortOrder: linkIndex + 1,
        isPreferred: linkIndex === 0,
      })
    }

    importedCount += 1
  }

  return {
    importedCount,
    skippedCount,
  }
}

async function upsertSource(sourceRow: ImportedMaterialSourceRow, sourceIndex: number) {
  const source = await MaterialSource.queryWithDeleted()
    .where('legacySourceId', sourceRow.legacySourceId)
    .first()
  const sourceAttributes = {
    publicId: sourcePublicIdForIndex(sourceIndex),
    legacySourceId: sourceRow.legacySourceId,
    name: sourceRow.name,
    provider: sourceRow.provider,
    textileFamily: sourceRow.textileFamily,
    purchaseUnit: sourceRow.purchaseUnit,
    normalizedUnitCostCents: sourceRow.normalizedUnitCostCents,
    normalizedUnit: 'meter' as const,
  }

  if (!source) {
    return MaterialSource.create(sourceAttributes)
  }

  source.merge(sourceAttributes)
  await source.save()

  return source
}

async function upsertMaterial(materialRow: ImportedMaterialRow, materialIndex: number) {
  const material = await Material.queryWithDeleted()
    .where('legacyMaterialId', materialRow.legacyMaterialId)
    .first()
  const materialAttributes = {
    publicId: materialPublicIdForIndex(materialIndex),
    legacyMaterialId: materialRow.legacyMaterialId,
    name: materialRow.name,
    materialColor: materialRow.materialColor,
    materialUse: materialRow.materialUse,
    materialUnit: 'meter' as const,
    comments: materialRow.comments,
  }

  if (!material) {
    return Material.create(materialAttributes)
  }

  material.merge(materialAttributes)
  await material.save()

  return material
}

function materialPublicIdForIndex(index: number) {
  return `${MATERIAL_PUBLIC_ID_PREFIX}${(index + 1).toString().padStart(4, '0')}`
}

function sourcePublicIdForIndex(index: number) {
  return `${SOURCE_PUBLIC_ID_PREFIX}${(index + 1).toString().padStart(4, '0')}`
}
