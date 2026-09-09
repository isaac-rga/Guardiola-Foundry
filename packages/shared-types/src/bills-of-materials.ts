export const BILL_OF_MATERIALS_NAME_MAX_LENGTH = 255
export const BOM_LINE_CONSTRUCTION_PIECE_MAX_LENGTH = 255

export type BillOfMaterialsKind = 'template' | 'implementation'

export interface BillOfMaterialsUserReference {
  id: number
  email: string
}

export interface BillOfMaterialsSummary {
  id: string
  kind: BillOfMaterialsKind
  name: string
  description: string | null
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
  lineNote: string | null
  order: number
  completeness: 'complete' | 'incomplete'
  verification: BillOfMaterialsLineVerification
  attention: BillOfMaterialsLineAttention[]
  costProjection: BillOfMaterialsLineCostProjection
}

export interface BillOfMaterialsDetail extends BillOfMaterialsSummary {
  lines: BillOfMaterialsLine[]
  costProjection: BillOfMaterialsCostProjection
}

export interface CreateBillOfMaterialsLineRequest {
  constructionPiece: string
  materialId: string | null
  materialQuantity: number | null
  lineNote: string | null
  verified: boolean
}

export interface CreateBillOfMaterialsTemplateRequest {
  kind: 'template'
  name: string
  description: string | null
  lines: CreateBillOfMaterialsLineRequest[]
}
