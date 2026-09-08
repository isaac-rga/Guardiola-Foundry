import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type {
  CreateProductVariantRequest,
  ListProductVariantsResponse,
  ProductVariant as ProductVariantContract,
  UpdateProductVariantRequest,
} from '@guardiola-foundry/shared-types'
import { randomBytes } from 'node:crypto'

const PRODUCT_VARIANT_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PRODUCT_VARIANT_ID_LENGTH = 6

export type ProductVariantMutationResult =
  | ProductVariantContract
  | 'duplicate-name'
  | 'product-not-found'
  | 'product-unavailable'
  | 'variant-not-found'

export async function listProductVariants(
  productPublicId: string
): Promise<ListProductVariantsResponse | 'product-not-found'> {
  const product = await findProductWithDeleted(productPublicId)

  if (!product) {
    return 'product-not-found'
  }

  const variants = await ProductVariant.query()
    .where('productId', product.id)
    .orderBy('createdAt', 'asc')

  return {
    variants: variants.map((variant) => serializeProductVariant(variant, product.publicId)),
  }
}

export async function createProductVariant(
  productPublicId: string,
  payload: CreateProductVariantRequest
): Promise<ProductVariantMutationResult> {
  try {
    return await db.transaction(async (trx) => {
      const productQuery = Product.query({ client: trx })
        .where('publicId', productPublicId)
        .forUpdate()
      Product.includeDeleted(productQuery)
      const product = await productQuery.first()

      if (!product) {
        return 'product-not-found'
      }

      if (product.deletedAt || product.productStatus !== 'active') {
        return 'product-unavailable'
      }

      if (await hasDuplicateName(product.id, payload.name, undefined, trx)) {
        return 'duplicate-name'
      }

      const variant = await ProductVariant.create(
        {
          publicId: await generateProductVariantId(trx),
          productId: product.id,
          name: payload.name,
          status: 'active',
        },
        { client: trx }
      )

      return serializeProductVariant(variant, product.publicId)
    })
  } catch (error) {
    if (isProductVariantNameConflict(error)) {
      return 'duplicate-name'
    }

    throw error
  }
}

export async function updateProductVariant(
  productPublicId: string,
  variantPublicId: string,
  payload: UpdateProductVariantRequest
): Promise<ProductVariantMutationResult> {
  const product = await findProductWithDeleted(productPublicId)

  if (!product) {
    return 'product-not-found'
  }

  if (product.deletedAt) {
    return 'product-unavailable'
  }

  const variant = await ProductVariant.query()
    .where('publicId', variantPublicId)
    .where('productId', product.id)
    .first()

  if (!variant) {
    return 'variant-not-found'
  }

  if (await hasDuplicateName(product.id, payload.name, variant.id)) {
    return 'duplicate-name'
  }

  variant.merge({
    name: payload.name,
    status: payload.status,
  })

  try {
    await variant.save()

    return serializeProductVariant(variant, product.publicId)
  } catch (error) {
    if (isProductVariantNameConflict(error)) {
      return 'duplicate-name'
    }

    throw error
  }
}

function serializeProductVariant(
  variant: ProductVariant,
  productPublicId: string
): ProductVariantContract {
  return {
    id: variant.publicId,
    productId: productPublicId,
    name: variant.name,
    status: variant.status,
    createdAt: variant.createdAt.toISO()!,
  }
}

async function hasDuplicateName(
  productId: number,
  name: string,
  excludedVariantId?: number,
  trx?: TransactionClientContract
) {
  const query = ProductVariant.query(trx ? { client: trx } : undefined)
    .where('productId', productId)
    .whereRaw('lower(name) = lower(?)', [name])

  if (excludedVariantId !== undefined) {
    query.whereNot('id', excludedVariantId)
  }

  return Boolean(await query.first())
}

async function generateProductVariantId(trx: TransactionClientContract) {
  while (true) {
    const candidate = `PV-${randomProductVariantToken()}`
    const query = ProductVariant.query({ client: trx }).where('publicId', candidate)
    ProductVariant.includeDeleted(query)
    const existingVariant = await query.first()

    if (!existingVariant) {
      return candidate
    }
  }
}

function findProductWithDeleted(productPublicId: string) {
  return Product.queryWithDeleted().where('publicId', productPublicId).first()
}

function randomProductVariantToken() {
  const bytes = randomBytes(PRODUCT_VARIANT_ID_LENGTH)

  return Array.from(
    bytes,
    (byte) => PRODUCT_VARIANT_ID_ALPHABET[byte % PRODUCT_VARIANT_ID_ALPHABET.length]
  ).join('')
}

function isProductVariantNameConflict(error: unknown) {
  return (
    error instanceof Error &&
    'constraint' in error &&
    error.constraint === 'product_variants_product_name_unique'
  )
}
