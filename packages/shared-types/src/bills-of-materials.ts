export const BILL_OF_MATERIALS_NAME_MAX_LENGTH = 255

export type BillOfMaterialsKind = 'template' | 'implementation'

export interface BillOfMaterialsCreator {
  id: number
  email: string
}

export interface BillOfMaterialsSummary {
  id: string
  kind: BillOfMaterialsKind
  name: string
  description: string | null
  createdBy: BillOfMaterialsCreator
  createdAt: string
  updatedAt: string
}

export interface ListBillsOfMaterialsResponse {
  billsOfMaterials: BillOfMaterialsSummary[]
}

export interface CreateBillOfMaterialsTemplateRequest {
  kind: 'template'
  name: string
  description: string | null
}
