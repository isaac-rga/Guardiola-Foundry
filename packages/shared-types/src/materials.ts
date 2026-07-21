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
