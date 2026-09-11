export const BILL_OF_MATERIALS_NAME_MAX_LENGTH = 255
export const BOM_LINE_CONSTRUCTION_PIECE_MAX_LENGTH = 255

export type BillOfMaterialsKind = 'template' | 'implementation'

export interface BillOfMaterialsUserReference {
  id: number
  email: string
}

export interface BillOfMaterialsProductReference {
  id: string
  name: string
  availability: 'available' | 'unavailable'
}

export interface BillOfMaterialsProductVariantReference {
  id: string
  name: string
  availability: 'available' | 'unavailable'
}

export interface BillOfMaterialsReference {
  id: string
  name: string
}

export interface BillOfMaterialsSummary {
  id: string
  kind: BillOfMaterialsKind
  name: string
  description: string | null
  product: BillOfMaterialsProductReference | null
  productVariant: BillOfMaterialsProductVariantReference | null
  origin: BillOfMaterialsReference | null
  createdBy: BillOfMaterialsUserReference
  createdAt: string
  updatedAt: string
}

export interface ListBillsOfMaterialsResponse {
  billsOfMaterials: BillOfMaterialsSummary[]
}

export interface BillOfMaterialsLineMaterial {
  id: string
  name: string
  preferredSource: BillOfMaterialsLinePreferredSource | null
}

export interface BillOfMaterialsLinePreferredSource {
  id: string
  name: string
  vendor: string
  vendorShadeOrDetail: string | null
  widthCentimeters: number | null
  landedUnitCostCents: number | null
}

export type BillOfMaterialsLineAttention =
  | 'material-needs-attention'
  | 'source-needs-attention'
  | 'pattern-needs-attention'

export interface BillOfMaterialsLinePatternSet {
  id: string
  name: string
  status: 'active' | 'retired'
  quantityProposalCount: number
}

export type BillOfMaterialsCostProjectionExclusionReason =
  | 'missing-material'
  | 'missing-material-quantity'
  | 'no-usable-landed-unit-cost'

export interface BillOfMaterialsLineCostProjection {
  amountCents: number | null
  exclusionReason: BillOfMaterialsCostProjectionExclusionReason | null
}

export interface BillOfMaterialsCostProjection {
  availability: 'complete' | 'partial' | 'unavailable'
  amountCents: number | null
  excludedLineCount: number
}

export type BillOfMaterialsLineVerification =
  | {
      status: 'unverified'
      verifiedBy: null
      verifiedAt: null
    }
  | {
      status: 'verified'
      verifiedBy: BillOfMaterialsUserReference
      verifiedAt: string
    }

export interface BillOfMaterialsLine {
  id: string
  constructionPiece: string
  material: BillOfMaterialsLineMaterial | null
  materialQuantity: number | null
  patternSet: BillOfMaterialsLinePatternSet | null
  lineNote: string | null
  order: number
  completeness: 'complete' | 'incomplete'
  verification: BillOfMaterialsLineVerification
  attention: BillOfMaterialsLineAttention[]
  costProjection: BillOfMaterialsLineCostProjection
}

export interface BillOfMaterialsDetail extends BillOfMaterialsSummary {
  lines: BillOfMaterialsLine[]
  attentionCount: number
  costProjection: BillOfMaterialsCostProjection
}

export interface CreateBillOfMaterialsLineRequest {
  constructionPiece: string
  materialId: string | null
  materialQuantity: number | null
  patternSetId: string | null
  lineNote: string | null
  verified: boolean
}

export interface CreateBillOfMaterialsTemplateRequest {
  kind: 'template'
  name: string
  description: string | null
  productId: string | null
  lines: CreateBillOfMaterialsLineRequest[]
}

export interface CreateBillOfMaterialsImplementationRequest {
  kind: 'implementation'
  name: string
  description: string | null
  productVariantId: string
  lines: CreateBillOfMaterialsLineRequest[]
}

export type CreateBillOfMaterialsRequest =
  | CreateBillOfMaterialsTemplateRequest
  | CreateBillOfMaterialsImplementationRequest

export interface UpdateBillOfMaterialsLineRequest extends CreateBillOfMaterialsLineRequest {
  id: string | null
}

export interface UpdateBillOfMaterialsRequest {
  updatedAt: string
  name: string
  description: string | null
  lines: UpdateBillOfMaterialsLineRequest[]
}

export type ProductVariantCandidateOutcome =
  | 'eligible'
  | 'implementation-exists'
  | 'product-unavailable'
  | 'variant-inactive'

interface ProductVariantCandidateBase {
  id: string
  name: string
  status: 'active' | 'inactive'
  product: BillOfMaterialsProductReference
}

export type ProductVariantCandidate = ProductVariantCandidateBase &
  (
    | {
        selectable: true
        outcome: 'eligible'
        existingImplementation: null
      }
    | {
        selectable: false
        outcome: 'implementation-exists'
        existingImplementation: BillOfMaterialsReference
      }
    | {
        selectable: false
        outcome: 'product-unavailable' | 'variant-inactive'
        existingImplementation: null
      }
  )

export interface SearchProductVariantCandidatesResponse {
  items: ProductVariantCandidate[]
  hasMore: boolean
}

export interface AssociateBillOfMaterialsTemplateProductRequest {
  productId: string
}

export interface ApplyBillOfMaterialsTemplateRequest {
  name: string
  productVariantId: string
}
