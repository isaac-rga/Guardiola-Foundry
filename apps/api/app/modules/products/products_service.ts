import Collection from '#models/collection'
import Product from '#models/product'
import type User from '#models/user'
import type {
  CreateProductRequest,
  GetProductResponse,
  ListProductsResponse,
  ProductDetail,
  ProductSummary,
  UpdateProductRequest,
} from '@guardiola-foundry/shared-types'
import { randomBytes } from 'node:crypto'

const DEFAULT_LIFECYCLE_STATUS = 'concept'
const DEFAULT_PRODUCT_STATUS = 'active'
const PRODUCT_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PRODUCT_ID_LENGTH = 6

export async function listProducts(): Promise<ListProductsResponse> {
  const [products, collections] = await Promise.all([
    Product.query().preload('collection').preload('createdBy').orderBy('createdAt', 'desc'),
    loadCollections(),
  ])

  return {
    products: products.map(serializeProductSummary),
    collections: collections.map(serializeCollection),
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
    productCategory: null,
    shortDescription: null,
    collectionId,
    createdByUserId: authenticatedUser.id,
  })

  await preloadProductRelations(product)

  return serializeProductSummary(product)
}

export async function getProduct(
  productId: string
): Promise<GetProductResponse | 'not-found'> {
  const [product, collections] = await Promise.all([
    Product.query().where('publicId', productId).preload('collection').preload('createdBy').first(),
    loadCollections(),
  ])

  if (!product) {
    return 'not-found'
  }

  return {
    product: serializeProductDetail(product),
    collections: collections.map(serializeCollection),
  }
}

export async function updateProduct(
  productId: string,
  payload: UpdateProductRequest
): Promise<ProductDetail | 'collection-not-found' | 'not-found'> {
  const product = await Product.query()
    .where('publicId', productId)
    .preload('collection')
    .preload('createdBy')
    .first()

  if (!product) {
    return 'not-found'
  }

  const collectionId = payload.collectionId ?? null

  if (collectionId !== null) {
    const collection = await Collection.find(collectionId)

    if (!collection) {
      return 'collection-not-found'
    }
  }

  product.merge({
    name: payload.name,
    shortDescription: payload.shortDescription,
    lifecycleStatus: payload.lifecycleStatus,
    productStatus: payload.productStatus,
    productCategory: payload.productCategory,
    collectionId,
  })
  await product.save()
  await preloadProductRelations(product)

  return serializeProductDetail(product)
}

function serializeProductSummary(product: Product): ProductSummary {
  return {
    id: product.publicId,
    name: product.name,
    lifecycleStatus: product.lifecycleStatus,
    productStatus: product.productStatus,
    productCategory: product.productCategory,
    collection: product.collection
      ? serializeCollection(product.collection)
      : null,
    createdAt: product.createdAt.toISO()!,
    createdBy: {
      id: product.createdBy.id,
      email: product.createdBy.email,
    },
  }
}

function serializeProductDetail(product: Product): ProductDetail {
  return {
    ...serializeProductSummary(product),
    shortDescription: product.shortDescription,
  }
}

async function preloadProductRelations(product: Product) {
  await product.load('collection')
  await product.load('createdBy')
}

async function loadCollections() {
  return Collection.query().orderBy('name', 'asc')
}

function serializeCollection(collection: Collection) {
  return {
    id: collection.id,
    name: collection.name,
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
