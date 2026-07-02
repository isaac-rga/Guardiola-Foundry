import Collection from '#models/collection'
import Product from '#models/product'
import type User from '#models/user'
import type {
  CreateProductRequest,
  ListProductsResponse,
  ProductSummary,
} from '@guardiola-foundry/shared-types'
import { randomBytes } from 'node:crypto'

const DEFAULT_LIFECYCLE_STATUS = 'concept'
const DEFAULT_PRODUCT_STATUS = 'active'
const PRODUCT_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PRODUCT_ID_LENGTH = 6

export async function listProducts(): Promise<ListProductsResponse> {
  const [products, collections] = await Promise.all([
    Product.query().preload('collection').preload('createdBy').orderBy('createdAt', 'desc'),
    Collection.query().orderBy('name', 'asc'),
  ])

  return {
    products: products.map(serializeProduct),
    collections: collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
    })),
  }
}

export async function createProduct(
  authenticatedUser: User,
  payload: CreateProductRequest
): Promise<ProductSummary | 'collection-not-found'> {
  const collectionId = payload.collectionId ?? null

  if (collectionId !== null) {
    const collection = await Collection.find(collectionId)

    if (!collection) {
      return 'collection-not-found'
    }
  }

  const product = await Product.create({
    publicId: await generateProductId(),
    name: payload.name,
    lifecycleStatus: payload.lifecycleStatus ?? DEFAULT_LIFECYCLE_STATUS,
    productStatus: payload.productStatus ?? DEFAULT_PRODUCT_STATUS,
    collectionId,
    createdByUserId: authenticatedUser.id,
  })

  await product.load('collection')
  await product.load('createdBy')

  return serializeProduct(product)
}

function serializeProduct(product: Product): ProductSummary {
  return {
    id: product.publicId,
    name: product.name,
    lifecycleStatus: product.lifecycleStatus,
    productStatus: product.productStatus,
    productCategory: null,
    collection: product.collection
      ? {
          id: product.collection.id,
          name: product.collection.name,
        }
      : null,
    createdAt: product.createdAt.toISO()!,
    createdBy: {
      id: product.createdBy.id,
      email: product.createdBy.email,
    },
  }
}

async function generateProductId() {
  while (true) {
    const candidate = `P-${randomProductToken()}`
    const existingProduct = await Product.findBy('publicId', candidate)

    if (!existingProduct) {
      return candidate
    }
  }
}

function randomProductToken() {
  const bytes = randomBytes(PRODUCT_ID_LENGTH)

  return Array.from(bytes, (byte) => PRODUCT_ID_ALPHABET[byte % PRODUCT_ID_ALPHABET.length]).join(
    ''
  )
}
