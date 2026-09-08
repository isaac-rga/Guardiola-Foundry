export const PATTERN_SET_NAME_MAX_LENGTH = 255

export type PatternSetStatus = 'active' | 'retired'

export interface PatternSetQuantityProposal {
  assumedWidthCm: number
  quantityMeters: number
  evidenceNote: string | null
}

export interface PatternSet {
  id: string
  name: string
  description: string | null
  status: PatternSetStatus
  quantityProposals: PatternSetQuantityProposal[]
  createdBy: {
    id: number
    email: string
  }
  createdAt: string
}

export interface ListPatternSetsResponse {
  patternSets: PatternSet[]
}

export interface PatternSetMutationRequest {
  name: string
  description: string | null
  quantityProposals: PatternSetQuantityProposal[]
}

export type CreatePatternSetRequest = PatternSetMutationRequest
export type UpdatePatternSetRequest = PatternSetMutationRequest
