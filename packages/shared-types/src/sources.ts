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
