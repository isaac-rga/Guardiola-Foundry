export type MaterialUse = 'base-fabric' | 'structure' | 'lace'

export type MaterialColor = 'ivory' | 'champagne' | 'white'

export type MaterialUnit = 'meter'

export interface MaterialPreferredSourceSummary {
  id: string
  name: string
  provider: string
  normalizedUnitCostCents: number
  normalizedUnit: MaterialUnit
  needsAttention: boolean
}

export interface MaterialSummary {
  id: string
  name: string
  materialColor: MaterialColor
  materialUse: MaterialUse
  materialUnit: MaterialUnit
  preferredSource: MaterialPreferredSourceSummary
  derivedUnitCostCents: number
  alternateSourceCount: number
  comments: string | null
}

export interface ListMaterialsResponse {
  materials: MaterialSummary[]
}

export interface MaterialSourceRelationshipSummary {
  id: string
  name: string
  vendor: string
  relationship: 'preferred' | 'alternate'
  relationshipStatus: 'active' | 'historical'
  preferredEligibility:
    | 'eligible'
    | 'already-preferred'
    | 'missing-landed-unit-cost'
    | 'source-not-active'
  vendorShade: {
    id: number
    nameOrCode: string
  } | null
}

export interface MaterialDetail {
  id: string
  name: string
  materialColor: MaterialColor
  materialUse: MaterialUse
  materialUnit: MaterialUnit
  comments: string | null
  sourceRelationships: MaterialSourceRelationshipSummary[]
}

export interface GetMaterialResponse {
  material: MaterialDetail
}

export interface LinkMaterialSourceRequest {
  sourceId: string
  vendorShadeId?: number | null
}

export type LinkMaterialSourceResponse = GetMaterialResponse

export type UnlinkMaterialSourceResponse = GetMaterialResponse

export interface ReplacePreferredSourceRequest {
  sourceId: string
}

export type ReplacePreferredSourceResponse = GetMaterialResponse
