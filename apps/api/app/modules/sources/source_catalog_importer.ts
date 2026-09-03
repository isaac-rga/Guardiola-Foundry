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

const SOURCE_IMPORT_FIELDS = [
  'name',
  'vendor',
  'textileFamily',
  'purchasePresentation',
  'fixedPieceLength',
  'purchaseUnit',
  'minimumPurchaseQuantity',
  'purchasePriceCents',
  'priceDate',
  'vendorCurrency',
  'landedUnitCostCents',
  'sourceStatus',
  'vendorSku',
  'url',
  'description',
  'manufacturer',
  'fiber',
  'composition',
  'gsmGramsPerSquareMeter',
  'widthCentimeters',
  'finish',
  'weave',
  'presentationNotes',
  'countryOfOrigin',
  'comments',
  'estimatedShippingUsdPerKilogramCents',
  'igiPercentage',
] as const

type SourceImportField = (typeof SOURCE_IMPORT_FIELDS)[number]
type SourceImportSnapshot = Omit<Pick<MaterialSource, SourceImportField>, 'priceDate'> & {
  priceDate: string | null
  vendorShades: string[]
}

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

    const { source, vendorShadesByNameOrCode, protectedFields } = await db.transaction(
      async (trx) =>
        importSourceRecord(
          {
            ...sourceRow,
            sourceStatus: sourceRow.sourceStatus ?? 'active',
          } as ValidatedImportedSourceCatalogRow,
          trx
        )
    )
    sourcesByLegacyId.set(sourceRow.legacySourceId, source)
    vendorShadesByLegacySourceId.set(sourceRow.legacySourceId, vendorShadesByNameOrCode)

    if (protectedFields.length > 0) {
      exclusions.push({
        legacyId: sourceRow.legacySourceId,
        recordType: 'Source',
        invalidFields: protectedFields,
        correctiveGuidance:
          'Keep the application-managed Source values or update the workbook to match them before rerunning the import.',
      })
      continue
    }

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

async function importSourceRecord(
  sourceRow: ValidatedImportedSourceCatalogRow,
  trx: TransactionClientContract
) {
  const sourceQuery = MaterialSource.query({ client: trx })
  MaterialSource.includeDeleted(sourceQuery)
  const source = await sourceQuery
    .where('legacySourceId', sourceRow.legacySourceId)
    .forUpdate()
    .first()
  const incomingSnapshot = sourceImportSnapshotFromRow(sourceRow)
  const sourceAttributes = sourceAttributesFromSnapshot(incomingSnapshot)

  if (!source) {
    const createdSource = await MaterialSource.create(
      {
        legacySourceId: sourceRow.legacySourceId,
        ...sourceAttributes,
        sourceImportSnapshot: incomingSnapshot,
      },
      { client: trx }
    )
    const vendorShadesByNameOrCode = await importVendorShades(
      createdSource,
      incomingSnapshot.vendorShades,
      trx
    )

    return { source: createdSource, vendorShadesByNameOrCode, protectedFields: [] }
  }

  const existingVendorShades = await VendorShade.query({ client: trx })
    .where('materialSourceId', source.id)
    .orderBy('nameOrCode', 'asc')
    .forUpdate()
  const currentSnapshot = sourceImportSnapshotFromModel(source, existingVendorShades)
  const previousSnapshot = source.sourceImportSnapshot as SourceImportSnapshot | null
  const protectedFields = protectedSourceFields(currentSnapshot, previousSnapshot, incomingSnapshot)

  if (protectedFields.length > 0) {
    return {
      source,
      vendorShadesByNameOrCode: new Map(
        existingVendorShades.map((shade) => [shade.nameOrCode, shade])
      ),
      protectedFields,
    }
  }

  const mutableSourceAttributes = sourceAttributesFromSnapshot(incomingSnapshot)
  mutableSourceAttributes.sourceStatus = source.sourceStatus
  mutableSourceAttributes.normalizedUnit = source.normalizedUnit
  source.merge({
    ...mutableSourceAttributes,
    sourceImportSnapshot: {
      ...incomingSnapshot,
      sourceStatus: source.sourceStatus,
      vendorShades: [
        ...new Set([...currentSnapshot.vendorShades, ...incomingSnapshot.vendorShades]),
      ].sort(),
    },
  })
  await source.save()
  const vendorShadesByNameOrCode = await importVendorShades(
    source,
    incomingSnapshot.vendorShades,
    trx
  )

  return { source, vendorShadesByNameOrCode, protectedFields: [] }
}

function sourceImportSnapshotFromRow(sourceRow: ValidatedImportedSourceCatalogRow) {
  return {
    name: sourceRow.name,
    vendor: sourceRow.vendor,
    textileFamily: sourceRow.textileFamily,
    purchasePresentation: sourceRow.purchasePresentation,
    fixedPieceLength: sourceRow.fixedPieceLength,
    purchaseUnit: sourceRow.purchaseUnit,
    minimumPurchaseQuantity: sourceRow.minimumPurchaseQuantity,
    purchasePriceCents: sourceRow.purchasePriceCents,
    priceDate: sourceRow.priceDate,
    vendorCurrency: sourceRow.vendorCurrency,
    landedUnitCostCents: sourceRow.landedUnitCostCents,
    sourceStatus: sourceRow.sourceStatus,
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
    vendorShades: normalizedVendorShades(sourceRow.vendorShades ?? []),
  } satisfies SourceImportSnapshot
}

function sourceImportSnapshotFromModel(
  source: MaterialSource,
  vendorShades: VendorShade[]
): SourceImportSnapshot {
  return {
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
    vendorShades: normalizedVendorShades(vendorShades.map((shade) => shade.nameOrCode)),
  }
}

function sourceAttributesFromSnapshot(snapshot: SourceImportSnapshot) {
  const sourceAttributes = {
    ...snapshot,
    priceDate: snapshot.priceDate ? DateTime.fromISO(snapshot.priceDate, { zone: 'utc' }) : null,
    normalizedUnit: 'meter' as const,
  }
  delete (sourceAttributes as { vendorShades?: string[] }).vendorShades

  return sourceAttributes
}

function protectedSourceFields(
  currentSnapshot: SourceImportSnapshot,
  previousSnapshot: SourceImportSnapshot | null,
  incomingSnapshot: SourceImportSnapshot
) {
  if (!previousSnapshot) {
    const fields: Array<SourceImportField | 'vendorShades'> = [
      ...SOURCE_IMPORT_FIELDS,
      'vendorShades',
    ]

    return fields.filter(
      (field) => !equalImportValue(currentSnapshot[field], incomingSnapshot[field])
    )
  }

  const protectedFields: string[] = SOURCE_IMPORT_FIELDS.filter((field) => {
    if (field === 'sourceStatus') {
      return !equalImportValue(currentSnapshot[field], incomingSnapshot[field])
    }

    return !equalImportValue(currentSnapshot[field], previousSnapshot[field])
  })

  if (!equalImportValue(currentSnapshot.vendorShades, previousSnapshot.vendorShades)) {
    protectedFields.push('vendorShades')
  }

  return protectedFields
}

async function importVendorShades(
  source: MaterialSource,
  vendorShadeNamesOrCodes: string[],
  trx: TransactionClientContract
) {
  const namesOrCodes = normalizedVendorShades(vendorShadeNamesOrCodes)
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

function normalizedVendorShades(vendorShadeNamesOrCodes: string[]) {
  return [...new Set(vendorShadeNamesOrCodes.map((value) => value.trim()))].filter(Boolean).sort()
}

function equalImportValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}
