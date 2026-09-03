import type { MaterialColor, MaterialUnit, MaterialUse } from './materials.js'

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
export const SOURCE_LINK_STATES = ['linked', 'unlinked'] as const
export const SOURCE_ATTENTION_STATES = [
  'cost-needs-attention',
  'data-needs-attention',
] as const

export type TextileFamily = (typeof TEXTILE_FAMILIES)[number]
export type PurchasePresentation = (typeof PURCHASE_PRESENTATIONS)[number]
export type PurchaseUnit = (typeof PURCHASE_UNITS)[number]
export type VendorCurrency = (typeof VENDOR_CURRENCIES)[number]
export type SourceStatus = (typeof SOURCE_STATUSES)[number]
export type SourceLinkState = (typeof SOURCE_LINK_STATES)[number]
export type SourceAttentionState = (typeof SOURCE_ATTENTION_STATES)[number]

export interface ListSourcesQuery {
  search?: string
  textileFamily?: TextileFamily
  status?: SourceStatus
  linkState?: SourceLinkState
  attentionState?: SourceAttentionState
}

export interface SourceSummary {
  id: string
  name: string
  vendor: string
  textileFamily: TextileFamily
  purchasePresentation: PurchasePresentation | null
  purchaseUnit: PurchaseUnit
  vendorCurrency: VendorCurrency | null
  purchasePriceCents: number | null
  landedUnitCostCents: number | null
  linkedMaterialCount: number
  costNeedsAttention: boolean
  dataNeedsAttention: boolean
}

export interface ListSourcesResponse {
  sources: SourceSummary[]
}

export type GetCurrencyConversionRateResponse =
  | {
      state: 'configured'
      usdToMxnRate: number
      mxnToUsdRate: number
      effectiveDate: string
    }
  | { state: 'missing' }
  | { state: 'invalid' }

export interface SourceVendorShade {
  id: number
  nameOrCode: string
}

export interface SourceLinkedMaterialSummary {
  id: string
  name: string
  materialColor: MaterialColor
  materialUse: MaterialUse
  relationship: 'preferred' | 'alternate'
  relationshipStatus: 'active' | 'historical'
  vendorShade: SourceVendorShade | null
}

export interface SourceDetail {
  id: string
  legacySourceId: string | null
  name: string
  vendor: string
  textileFamily: TextileFamily
  purchasePresentation: PurchasePresentation | null
  fixedPieceLength: number | null
  purchaseUnit: PurchaseUnit
  minimumPurchaseQuantity: number | null
  purchasePriceCents: number | null
  priceDate: string | null
  vendorCurrency: VendorCurrency | null
  landedUnitCostCents: number | null
  sourceStatus: SourceStatus
  normalizedUnit: MaterialUnit
  vendorSku: string | null
  url: string | null
  description: string | null
  manufacturer: string | null
  fiber: string | null
  composition: string | null
  gsmGramsPerSquareMeter: number | null
  widthCentimeters: number | null
  finish: string | null
  weave: string | null
  presentationNotes: string | null
  countryOfOrigin: string | null
  comments: string | null
  estimatedShippingUsdPerKilogramCents: number | null
  igiPercentage: number | null
  ivaPercentage: 16
  costNeedsAttention: boolean
  dataNeedsAttention: boolean
  vendorShades: SourceVendorShade[]
  linkedMaterials: SourceLinkedMaterialSummary[]
}

export interface GetSourceResponse {
  source: SourceDetail
}

export interface CreateSourceRequest {
  name: string
  vendor: string
  textileFamily: TextileFamily
  purchasePresentation: PurchasePresentation
  fixedPieceLength?: number | null
  purchaseUnit: PurchaseUnit
  minimumPurchaseQuantity: number
  purchasePriceCents: number
  priceDate: string
  vendorCurrency: VendorCurrency
  landedUnitCostCents?: number | null
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

export type CreateSourceResponse = GetSourceResponse

export type UpdateSourceRequest = CreateSourceRequest

export type UpdateSourceResponse = GetSourceResponse

export interface SourceLifecycleAffectedMaterial {
  id: string
  name: string
}

export interface SourceLifecycleConflictResponse {
  message: string
  affectedMaterials: SourceLifecycleAffectedMaterial[]
}

export type RetireSourceResponse = GetSourceResponse

export type RestoreSourceResponse = GetSourceResponse
