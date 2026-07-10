export interface HealthResponse {
  status: 'ok'
}

export type UserRole = 'admin' | 'operator'

export interface SessionUser {
  id: number
  email: string
  role: UserRole
  active: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface AuthSessionResponse {
  token: string
  tokenType: 'Bearer'
  expiresAt: string
  user: SessionUser
}

export interface CurrentSessionResponse {
  tokenType: 'Bearer'
  expiresAt: string
  user: SessionUser
}

export type ProductLifecycleStatus =
  | 'concept'
  | 'fabric-trim-selection'
  | 'design-and-prototyping'
  | 'testing'
  | 'approved'
  | 'on-documentation'
  | 'finished'

export type ProductStatus = 'active' | 'inactive'

export type ProductCategory = 'dress' | 'accessory' | 'other'

export interface ProductCollection {
  id: number
  name: string
}

export interface ProductCreatedBy {
  id: number
  email: string
}

export interface ProductImage {
  fileName: string
}

export interface ProductSummary {
  id: string
  name: string
  lifecycleStatus: ProductLifecycleStatus
  productStatus: ProductStatus
  deletedAt?: string | null
  productCategory: ProductCategory | null
  collection: ProductCollection | null
  createdAt: string
  createdBy: ProductCreatedBy
}

export interface ProductDetail extends ProductSummary {
  shortDescription: string | null
  image: ProductImage | null
}

export interface DeletedProductDetail extends ProductDetail {
  deletedAt: string
}

export interface ListProductsResponse {
  products: ProductSummary[]
  collections: ProductCollection[]
}

export type GetProductResponse =
  | {
      state: 'active'
      product: ProductDetail
      collections: ProductCollection[]
    }
  | {
      state: 'deleted'
      product: DeletedProductDetail
    }

export interface CreateProductRequest {
  name: string
  lifecycleStatus?: ProductLifecycleStatus
  productStatus?: ProductStatus
  collectionId?: number | null
}

export interface UpdateProductRequest {
  name: string
  shortDescription: string | null
  lifecycleStatus: ProductLifecycleStatus
  productStatus: ProductStatus
  productCategory: ProductCategory | null
  collectionId: number | null
}
