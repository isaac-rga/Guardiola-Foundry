import Material from '#models/material'
import MaterialSourceLink from '#models/material_source_link'
import {
  importSourceCatalogRows,
  type ImportedSourceCatalogRow,
  type SourceImportExclusion,
} from '#modules/sources/source_catalog_importer'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { MaterialColor, MaterialUse } from '@guardiola-foundry/shared-types'

export type ImportedMaterialSourceRow = ImportedSourceCatalogRow

interface MaterialImportExclusion {
  legacyId: string
  recordType: 'Material'
  invalidFields: string[]
  correctiveGuidance: string
}

export type ImportExclusion = SourceImportExclusion | MaterialImportExclusion

export interface ImportedMaterialRow {
  legacyMaterialId: string
  name: string
  materialColor: MaterialColor
  materialUse: MaterialUse
  comments: string | null
  sourceLinks: Array<{
    legacySourceId: string
    isPreferred: boolean
    vendorShade?: string | null
  }>
}

const MATERIAL_PUBLIC_ID_PREFIX = 'M-'

export async function importMaterialsFromRows(
  sourceRows: ImportedMaterialSourceRow[],
  materialRows: ImportedMaterialRow[]
) {
  const {
    report: sourceReport,
    sourcesByLegacyId,
    vendorShadesByLegacySourceId,
  } = await importSourceCatalogRows(sourceRows)
  const exclusions: ImportExclusion[] = [...sourceReport.exclusions]

  let importedCount = 0
  let skippedCount = 0

  for (const materialRow of materialRows) {
    const linkedSources = materialRow.sourceLinks.map((sourceLink) => ({
      ...sourceLink,
      source: sourcesByLegacyId.get(sourceLink.legacySourceId),
      vendorShade:
        sourceLink.vendorShade === null || sourceLink.vendorShade === undefined
          ? null
          : vendorShadesByLegacySourceId
              .get(sourceLink.legacySourceId)
              ?.get(sourceLink.vendorShade),
    }))
    const preferredLinks = linkedSources.filter((sourceLink) => sourceLink.isPreferred)
    const hasInvalidSourceLink = linkedSources.some((sourceLink) => !sourceLink.source)
    const hasInvalidVendorShade = linkedSources.some(
      (sourceLink) => sourceLink.vendorShade !== null && !sourceLink.vendorShade
    )
    const hasInvalidPreferredSource =
      preferredLinks.length !== 1 ||
      !preferredLinks[0]?.source ||
      preferredLinks[0].source.sourceStatus !== 'active' ||
      preferredLinks[0].source.landedUnitCostCents === null

    if (hasInvalidSourceLink || hasInvalidVendorShade || hasInvalidPreferredSource) {
      const invalidFields: string[] = []

      if (hasInvalidSourceLink) invalidFields.push('sourceLinks')
      if (hasInvalidVendorShade) invalidFields.push('vendorShade')
      if (hasInvalidPreferredSource) invalidFields.push('preferredSource')

      exclusions.push({
        legacyId: materialRow.legacyMaterialId,
        recordType: 'Material',
        invalidFields,
        correctiveGuidance:
          'Declare exactly one valid Preferred Source in the source workbook before rerunning the import.',
      })
      skippedCount += 1
      continue
    }

    await db.transaction(async (trx) => {
      const material = await upsertMaterial(materialRow, importedCount, trx)

      await MaterialSourceLink.query({ client: trx }).where('materialId', material.id).delete()

      for (const [linkIndex, sourceLink] of linkedSources.entries()) {
        await MaterialSourceLink.create(
          {
            materialId: material.id,
            materialSourceId: sourceLink.source!.id,
            vendorShadeId: sourceLink.vendorShade?.id ?? null,
            sortOrder: linkIndex + 1,
            isPreferred: sourceLink.isPreferred,
          },
          { client: trx }
        )
      }
    })

    importedCount += 1
  }

  return {
    successful: exclusions.length === 0,
    importedSourceCount: sourceReport.importedSourceCount,
    ignoredSourceCount: sourceReport.ignoredSourceCount,
    importedCount,
    skippedCount,
    exclusions,
  }
}

async function upsertMaterial(
  materialRow: ImportedMaterialRow,
  materialIndex: number,
  trx: TransactionClientContract
) {
  const materialQuery = Material.query({ client: trx })
  Material.includeDeleted(materialQuery)
  const material = await materialQuery
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
    return Material.create(materialAttributes, { client: trx })
  }

  material.merge(materialAttributes)
  await material.save()

  return material
}

function materialPublicIdForIndex(index: number) {
  return `${MATERIAL_PUBLIC_ID_PREFIX}${(index + 1).toString().padStart(4, '0')}`
}
