import Material from '#models/material'
import MaterialSource from '#models/material_source'
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

interface SourceLinkImportSnapshot {
  legacySourceId: string
  isPreferred: boolean
  vendorShade: string | null
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
    const incomingRelationshipSnapshot = sourceLinkImportSnapshotFromRow(materialRow)
    const existingMaterial = await findImportedMaterial(materialRow.legacyMaterialId)
    const currentRelationshipSnapshot = existingMaterial
      ? sourceLinkImportSnapshotFromModel(existingMaterial)
      : []
    const previousRelationshipSnapshot = existingMaterial?.sourceLinksImportSnapshot as
      | SourceLinkImportSnapshot[]
      | null
      | undefined
    const protectedRelationshipFields = existingMaterial
      ? changedRelationshipFields(
          previousRelationshipSnapshot ?? incomingRelationshipSnapshot,
          currentRelationshipSnapshot
        )
      : []

    if (protectedRelationshipFields.length > 0) {
      exclusions.push({
        legacyId: materialRow.legacyMaterialId,
        recordType: 'Material',
        invalidFields: protectedRelationshipFields,
        correctiveGuidance:
          'Keep the application-managed Source relationships or update the workbook to match them before rerunning the import.',
      })
      skippedCount += 1
      continue
    }

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
      const material = await upsertMaterial(
        materialRow,
        importedCount,
        incomingRelationshipSnapshot,
        trx
      )

      if (equalImportValue(currentRelationshipSnapshot, incomingRelationshipSnapshot)) {
        return
      }

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
  sourceLinksImportSnapshot: SourceLinkImportSnapshot[],
  trx: TransactionClientContract
) {
  const materialQuery = Material.query({ client: trx })
  Material.includeDeleted(materialQuery)
  const material = await materialQuery
    .where('legacyMaterialId', materialRow.legacyMaterialId)
    .first()
  const materialAttributes = {
    legacyMaterialId: materialRow.legacyMaterialId,
    name: materialRow.name,
    materialColor: materialRow.materialColor,
    materialUse: materialRow.materialUse,
    materialUnit: 'meter' as const,
    comments: materialRow.comments,
    sourceLinksImportSnapshot,
  }

  if (!material) {
    return Material.create(
      { publicId: materialPublicIdForIndex(materialIndex), ...materialAttributes },
      { client: trx }
    )
  }

  material.merge(materialAttributes)
  await material.save()

  return material
}

async function findImportedMaterial(legacyMaterialId: string) {
  const query = Material.queryWithDeleted().where('legacyMaterialId', legacyMaterialId)
  const material = await query.first()

  if (!material) {
    return null
  }

  await material.load('sourceLinks', (sourceLinkQuery) => {
    sourceLinkQuery
      .preload('materialSource', (sourceQuery) => MaterialSource.includeDeleted(sourceQuery))
      .preload('vendorShade')
      .orderBy('sortOrder', 'asc')
  })

  return material
}

function sourceLinkImportSnapshotFromRow(materialRow: ImportedMaterialRow) {
  return materialRow.sourceLinks.map((sourceLink) => ({
    legacySourceId: sourceLink.legacySourceId,
    isPreferred: sourceLink.isPreferred,
    vendorShade: sourceLink.vendorShade ?? null,
  }))
}

function sourceLinkImportSnapshotFromModel(material: Material): SourceLinkImportSnapshot[] {
  return material.sourceLinks.map((sourceLink) => ({
    legacySourceId:
      sourceLink.materialSource.legacySourceId ??
      `application:${sourceLink.materialSource.publicId}`,
    isPreferred: sourceLink.isPreferred,
    vendorShade: sourceLink.vendorShade?.nameOrCode ?? null,
  }))
}

function changedRelationshipFields(
  previousSnapshot: SourceLinkImportSnapshot[],
  currentSnapshot: SourceLinkImportSnapshot[]
) {
  const changedFields: string[] = []
  const previousSourceIds = previousSnapshot.map((link) => link.legacySourceId)
  const currentSourceIds = currentSnapshot.map((link) => link.legacySourceId)

  if (!equalImportValue(previousSourceIds, currentSourceIds)) {
    changedFields.push('sourceLinks')
  }

  if (
    previousSnapshot.find((link) => link.isPreferred)?.legacySourceId !==
    currentSnapshot.find((link) => link.isPreferred)?.legacySourceId
  ) {
    changedFields.push('preferredSource')
  }

  const currentLinksBySourceId = new Map(currentSnapshot.map((link) => [link.legacySourceId, link]))
  const sharedVendorShadeChanged = previousSnapshot.some((previousLink) => {
    const currentLink = currentLinksBySourceId.get(previousLink.legacySourceId)

    return currentLink && currentLink.vendorShade !== previousLink.vendorShade
  })

  if (sharedVendorShadeChanged) {
    changedFields.push('vendorShade')
  }

  return changedFields
}

function equalImportValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function materialPublicIdForIndex(index: number) {
  return `${MATERIAL_PUBLIC_ID_PREFIX}${(index + 1).toString().padStart(4, '0')}`
}
