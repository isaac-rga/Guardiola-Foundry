import MaterialSource from '#models/material_source'
import {
  invalidCommercialSourceFields,
  type CommercialSourceCandidate,
  type ValidatedCommercialSource,
} from '#modules/sources/source_catalog'
import { DateTime } from 'luxon'

export interface ImportedSourceCatalogRow extends CommercialSourceCandidate {
  legacySourceId: string
  recordType: string
}

type ValidatedImportedSourceCatalogRow = ImportedSourceCatalogRow & ValidatedCommercialSource

export interface SourceImportExclusion {
  legacyId: string
  recordType: 'Source'
  invalidFields: string[]
  correctiveGuidance: string
}

export interface SourceCatalogImportReport {
  successful: boolean
  importedSourceCount: number
  ignoredSourceCount: number
  exclusions: SourceImportExclusion[]
}

export async function importSourceCatalogFromRows(sourceRows: ImportedSourceCatalogRow[]) {
  const { report } = await importSourceCatalogRows(sourceRows)

  return report
}

export async function importSourceCatalogRows(sourceRows: ImportedSourceCatalogRow[]) {
  const sourcesByLegacyId = new Map<string, MaterialSource>()
  const exclusions: SourceImportExclusion[] = []
  let importedSourceCount = 0
  let ignoredSourceCount = 0

  for (const sourceRow of sourceRows) {
    if (sourceRow.recordType !== 'Textil') {
      ignoredSourceCount += 1
      continue
    }

    const invalidFields = invalidCommercialSourceFields(sourceRow)

    if (invalidFields.length > 0) {
      exclusions.push({
        legacyId: sourceRow.legacySourceId,
        recordType: 'Source',
        invalidFields,
        correctiveGuidance:
          'Correct the listed commercial fields in the source workbook before rerunning the import.',
      })
      continue
    }

    const source = await upsertSource({
      ...sourceRow,
      sourceStatus: sourceRow.sourceStatus ?? 'active',
    } as ValidatedImportedSourceCatalogRow)

    sourcesByLegacyId.set(sourceRow.legacySourceId, source)
    importedSourceCount += 1
  }

  return {
    report: {
      successful: exclusions.length === 0,
      importedSourceCount,
      ignoredSourceCount,
      exclusions,
    } satisfies SourceCatalogImportReport,
    sourcesByLegacyId,
  }
}

async function upsertSource(sourceRow: ValidatedImportedSourceCatalogRow) {
  const source = await MaterialSource.queryWithDeleted()
    .where('legacySourceId', sourceRow.legacySourceId)
    .first()
  const sourceAttributes = {
    name: sourceRow.name,
    vendor: sourceRow.vendor,
    textileFamily: sourceRow.textileFamily,
    purchasePresentation: sourceRow.purchasePresentation,
    fixedPieceLength: sourceRow.fixedPieceLength,
    purchaseUnit: sourceRow.purchaseUnit,
    minimumPurchaseQuantity: sourceRow.minimumPurchaseQuantity,
    purchasePriceCents: sourceRow.purchasePriceCents,
    priceDate: DateTime.fromISO(sourceRow.priceDate, { zone: 'utc' }),
    vendorCurrency: sourceRow.vendorCurrency,
    landedUnitCostCents: sourceRow.landedUnitCostCents,
    sourceStatus: sourceRow.sourceStatus,
    normalizedUnit: 'meter' as const,
  }

  if (!source) {
    return MaterialSource.create({
      legacySourceId: sourceRow.legacySourceId,
      ...sourceAttributes,
    })
  }

  source.merge(sourceAttributes)
  await source.save()

  return source
}
