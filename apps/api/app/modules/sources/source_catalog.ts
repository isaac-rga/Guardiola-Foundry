import { DateTime } from 'luxon'

// TODO(issue 04): Move cross-boundary Source controlled values and derived types into the
// shared Source contract when the catalog API and UI are added. Workbook candidate/report
// types and import-specific validation remain API-local.
export const TEXTILE_FAMILIES = [
  'Chiffon',
  'Crepe',
  'Crin',
  'Encaje',
  'Entretela',
  'Georgette',
  'Malla',
  'Organza',
  'Satin',
  'Silk Organza',
  'Taffeta',
  'Tul',
] as const
export const PURCHASE_PRESENTATIONS = ['roll', 'piece'] as const
export const PURCHASE_UNITS = ['meter', 'yard'] as const
export const VENDOR_CURRENCIES = ['USD', 'MXN'] as const
export const SOURCE_STATUSES = ['active', 'retired'] as const

export type TextileFamily = (typeof TEXTILE_FAMILIES)[number]
export type PurchasePresentation = (typeof PURCHASE_PRESENTATIONS)[number]
export type PurchaseUnit = (typeof PURCHASE_UNITS)[number]
export type VendorCurrency = (typeof VENDOR_CURRENCIES)[number]
export type SourceStatus = (typeof SOURCE_STATUSES)[number]

export interface CommercialSourceCandidate {
  name: string | null
  vendor: string | null
  textileFamily: string | null
  purchasePresentation: string | null
  fixedPieceLength: number | null
  purchaseUnit: string | null
  minimumPurchaseQuantity: number | null
  purchasePriceCents: number | null
  priceDate: string | null
  vendorCurrency: string | null
  landedUnitCostCents: number | null
  sourceStatus: string | null
}

export interface ValidatedCommercialSource extends CommercialSourceCandidate {
  name: string
  vendor: string
  textileFamily: TextileFamily
  purchasePresentation: PurchasePresentation
  purchaseUnit: PurchaseUnit
  minimumPurchaseQuantity: number
  purchasePriceCents: number
  priceDate: string
  vendorCurrency: VendorCurrency
  sourceStatus: SourceStatus
}

export function invalidCommercialSourceFields(source: CommercialSourceCandidate) {
  const invalidFields: string[] = []

  if (!isNonBlankString(source.name)) invalidFields.push('name')
  if (!isNonBlankString(source.vendor)) invalidFields.push('vendor')
  if (!includes(TEXTILE_FAMILIES, source.textileFamily)) invalidFields.push('textileFamily')
  if (!includes(PURCHASE_PRESENTATIONS, source.purchasePresentation)) {
    invalidFields.push('purchasePresentation')
  }
  if (source.fixedPieceLength !== null && !isPositiveNumber(source.fixedPieceLength)) {
    invalidFields.push('fixedPieceLength')
  }
  if (!includes(PURCHASE_UNITS, source.purchaseUnit)) invalidFields.push('purchaseUnit')
  if (!isPositiveNumber(source.minimumPurchaseQuantity)) {
    invalidFields.push('minimumPurchaseQuantity')
  }
  if (!isNonnegativeInteger(source.purchasePriceCents)) {
    invalidFields.push('purchasePriceCents')
  }
  if (!isIsoDate(source.priceDate)) invalidFields.push('priceDate')
  if (!includes(VENDOR_CURRENCIES, source.vendorCurrency)) {
    invalidFields.push('vendorCurrency')
  }
  if (source.landedUnitCostCents !== null && !isNonnegativeInteger(source.landedUnitCostCents)) {
    invalidFields.push('landedUnitCostCents')
  }
  if (source.sourceStatus !== null && !includes(SOURCE_STATUSES, source.sourceStatus)) {
    invalidFields.push('sourceStatus')
  }

  return invalidFields
}

function includes<const Values extends readonly string[]>(values: Values, value: unknown) {
  return typeof value === 'string' && values.includes(value as Values[number])
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false

  const date = DateTime.fromISO(value, { zone: 'utc' })

  return date.isValid && date.toISODate() === value
}
