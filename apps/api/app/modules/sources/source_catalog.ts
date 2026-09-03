import { DateTime } from 'luxon'
import {
  PURCHASE_PRESENTATIONS,
  PURCHASE_UNITS,
  SOURCE_STATUSES,
  TEXTILE_FAMILIES,
  VENDOR_CURRENCIES,
} from '@guardiola-foundry/shared-types'
import type {
  PurchasePresentation,
  PurchaseUnit,
  SourceStatus,
  TextileFamily,
  VendorCurrency,
} from '@guardiola-foundry/shared-types'

export const IVA_PERCENTAGE = 16 as const

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
  vendorSku?: string | null
  url?: string | null
  description?: string | null
  manufacturer?: string | null
  fiber?: string | null
  composition?: string | null
  gsmGramsPerSquareMeter?: number | null
  widthCentimeters?: number | null
  finish?: string | null
  weave?: string | null
  presentationNotes?: string | null
  countryOfOrigin?: string | null
  comments?: string | null
  estimatedShippingUsdPerKilogramCents?: number | null
  igiPercentage?: number | null
  vendorShades?: string[]
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

const OPTIONAL_SOURCE_DETAIL_FIELDS = [
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
] as const satisfies ReadonlyArray<keyof CommercialSourceCandidate>

type SourceAttentionInput = Pick<
  CommercialSourceCandidate,
  'sourceStatus' | 'landedUnitCostCents' | (typeof OPTIONAL_SOURCE_DETAIL_FIELDS)[number]
>

export function deriveSourceAttention(source: SourceAttentionInput) {
  return {
    costNeedsAttention: source.sourceStatus === 'active' && source.landedUnitCostCents === null,
    dataNeedsAttention: OPTIONAL_SOURCE_DETAIL_FIELDS.some((field) =>
      isMissingOptionalValue(source[field])
    ),
  }
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
  if (
    isPresent(source.gsmGramsPerSquareMeter) &&
    !isPositiveNumber(source.gsmGramsPerSquareMeter)
  ) {
    invalidFields.push('gsmGramsPerSquareMeter')
  }
  if (isPresent(source.widthCentimeters) && !isPositiveNumber(source.widthCentimeters)) {
    invalidFields.push('widthCentimeters')
  }
  if (
    isPresent(source.estimatedShippingUsdPerKilogramCents) &&
    !isNonnegativeInteger(source.estimatedShippingUsdPerKilogramCents)
  ) {
    invalidFields.push('estimatedShippingUsdPerKilogramCents')
  }
  if (
    isPresent(source.igiPercentage) &&
    (!Number.isFinite(source.igiPercentage) ||
      source.igiPercentage < 0 ||
      source.igiPercentage > 100)
  ) {
    invalidFields.push('igiPercentage')
  }

  return invalidFields
}

function includes<const Values extends readonly string[]>(values: Values, value: unknown) {
  return typeof value === 'string' && values.includes(value as Values[number])
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPresent<Value>(value: Value | null | undefined): value is Value {
  return value !== null && value !== undefined
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

function isMissingOptionalValue(value: unknown) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}
