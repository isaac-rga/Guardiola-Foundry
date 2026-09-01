import MaterialSource from '#models/material_source'
import VendorShade from '#modules/sources/models/vendor_shade'
import {
  invalidCommercialSourceFields,
  type CommercialSourceCandidate,
  type ValidatedCommercialSource,
} from '#modules/sources/source_catalog'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

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
  const vendorShadesByLegacySourceId = new Map<string, Map<string, VendorShade>>()
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

    const { source, vendorShadesByNameOrCode } = await db.transaction(async (trx) => {
      const persistedSource = await upsertSource(
        {
          ...sourceRow,
          sourceStatus: sourceRow.sourceStatus ?? 'active',
        } as ValidatedImportedSourceCatalogRow,
        trx
      )
      const importedVendorShades = await importVendorShades(
        persistedSource,
        sourceRow.vendorShades ?? [],
        trx
      )

      return {
        source: persistedSource,
        vendorShadesByNameOrCode: importedVendorShades,
      }
    })

    sourcesByLegacyId.set(sourceRow.legacySourceId, source)
    vendorShadesByLegacySourceId.set(sourceRow.legacySourceId, vendorShadesByNameOrCode)
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
    vendorShadesByLegacySourceId,
  }
}

async function upsertSource(
  sourceRow: ValidatedImportedSourceCatalogRow,
  trx: TransactionClientContract
) {
  const source = await MaterialSource.queryWithDeleted()
    .useTransaction(trx)
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
    vendorSku: sourceRow.vendorSku ?? null,
    url: sourceRow.url ?? null,
    description: sourceRow.description ?? null,
    manufacturer: sourceRow.manufacturer ?? null,
    fiber: sourceRow.fiber ?? null,
    composition: sourceRow.composition ?? null,
    gsmGramsPerSquareMeter: sourceRow.gsmGramsPerSquareMeter ?? null,
    widthCentimeters: sourceRow.widthCentimeters ?? null,
    finish: sourceRow.finish ?? null,
    weave: sourceRow.weave ?? null,
    presentationNotes: sourceRow.presentationNotes ?? null,
    countryOfOrigin: sourceRow.countryOfOrigin ?? null,
    comments: sourceRow.comments ?? null,
    estimatedShippingUsdPerKilogramCents: sourceRow.estimatedShippingUsdPerKilogramCents ?? null,
    igiPercentage: sourceRow.igiPercentage ?? null,
  }

  if (!source) {
    return MaterialSource.create(
      {
        legacySourceId: sourceRow.legacySourceId,
        ...sourceAttributes,
      },
      { client: trx }
    )
  }

  source.merge(sourceAttributes)
  await source.save()

  return source
}

async function importVendorShades(
  source: MaterialSource,
  vendorShadeNamesOrCodes: string[],
  trx: TransactionClientContract
) {
  const namesOrCodes = [...new Set(vendorShadeNamesOrCodes.map((value) => value.trim()))].filter(
    Boolean
  )
  const existingVendorShades = await VendorShade.query({ client: trx }).where(
    'materialSourceId',
    source.id
  )
  const existingNamesOrCodes = new Set(existingVendorShades.map((shade) => shade.nameOrCode))
  const newNamesOrCodes = namesOrCodes.filter((nameOrCode) => !existingNamesOrCodes.has(nameOrCode))

  if (newNamesOrCodes.length > 0) {
    await VendorShade.createMany(
      newNamesOrCodes.map((nameOrCode) => ({
        materialSourceId: source.id,
        nameOrCode,
      })),
      { client: trx }
    )
  }

  const importedVendorShades = await VendorShade.query({ client: trx }).where(
    'materialSourceId',
    source.id
  )

  return new Map(importedVendorShades.map((shade) => [shade.nameOrCode, shade]))
}
