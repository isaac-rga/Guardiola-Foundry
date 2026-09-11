import db from '@adonisjs/lucid/services/db'
import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import type {
  ProductVariantCandidate,
  SearchProductVariantCandidatesResponse,
} from '@guardiola-foundry/shared-types'

const SEARCH_LIMIT = 25
const NORMALIZED_SEARCH_DOCUMENT = `
  regexp_replace(
    translate(lower(concat_ws(' ',
      product_variants.public_id,
      product_variants.name,
      products.public_id,
      products.name
    )), 'áéíóúüñ', 'aeiouun'),
    '\\s+',
    ' ',
    'g'
  )
`

export async function searchProductVariantCandidates(
  search: string,
  templatePublicId?: string
): Promise<SearchProductVariantCandidatesResponse> {
  let productId: number | undefined
  if (templatePublicId) {
    const template = await BillOfMaterial.query()
      .where('publicId', templatePublicId)
      .where('kind', 'template')
      .first()
    if (!template || template.productId === null) {
      throw new ProductVariantCandidateTemplateUnavailableError()
    }
    productId = template.productId
  }
  const normalizedVariantId = 'lower(product_variants.public_id)'
  const normalizedVariantName = `translate(lower(product_variants.name), 'áéíóúüñ', 'aeiouun')`
  const query = db
    .from('product_variants')
    .join('products', 'products.id', 'product_variants.product_id')
    .leftJoin('bills_of_materials as implementation', function () {
      this.on('implementation.product_variant_id', '=', 'product_variants.id').andOnNull(
        'implementation.deleted_at'
      )
    })
    .whereNull('product_variants.deleted_at')
    .whereNull('products.deleted_at')
    .select([
      'product_variants.public_id as variant_public_id',
      'product_variants.name as variant_name',
      'product_variants.status as variant_status',
      'products.public_id as product_public_id',
      'products.name as product_name',
      'products.product_status',
      'implementation.public_id as implementation_public_id',
      'implementation.name as implementation_name',
    ])
    .orderByRaw(
      `CASE
        WHEN ${normalizedVariantId} = ? THEN 0
        WHEN ${normalizedVariantName} = ? THEN 1
        WHEN ${normalizedVariantId} LIKE ? THEN 2
        WHEN ${normalizedVariantName} LIKE ? THEN 3
        ELSE 4
      END`,
      [search, search, `${search}%`, `${search}%`]
    )
    .orderByRaw(
      `CASE
        WHEN implementation.id IS NULL
          AND products.product_status = 'active'
          AND product_variants.status = 'active'
        THEN 0 ELSE 1
      END`
    )
    .orderBy('product_variants.name', 'asc')
    .orderBy('product_variants.public_id', 'asc')
    .limit(SEARCH_LIMIT + 1)

  if (productId !== undefined) query.where('products.id', productId)

  search.split(' ').forEach((term) => {
    query.whereRaw(`position(? in ${NORMALIZED_SEARCH_DOCUMENT}) > 0`, [term])
  })

  const rows = await query
  return {
    items: rows.slice(0, SEARCH_LIMIT).map(serializeCandidate),
    hasMore: rows.length > SEARCH_LIMIT,
  }
}

export class ProductVariantCandidateTemplateUnavailableError extends Error {}

function serializeCandidate(row: {
  variant_public_id: string
  variant_name: string
  variant_status: 'active' | 'inactive'
  product_public_id: string
  product_name: string
  implementation_public_id: string | null
  implementation_name: string | null
  product_status: 'active' | 'inactive'
}): ProductVariantCandidate {
  const candidate = {
    id: row.variant_public_id,
    name: row.variant_name,
    status: row.variant_status,
    product: {
      id: row.product_public_id,
      name: row.product_name,
      availability:
        row.product_status === 'active' ? ('available' as const) : ('unavailable' as const),
    },
  }

  if (row.implementation_public_id !== null) {
    if (row.implementation_name === null) {
      throw new Error('Occupied Product Variant is missing its Implementation name.')
    }
    return {
      ...candidate,
      selectable: false,
      outcome: 'implementation-exists',
      existingImplementation: {
        id: row.implementation_public_id,
        name: row.implementation_name,
      },
    }
  }
  if (row.product_status !== 'active') {
    return {
      ...candidate,
      selectable: false,
      outcome: 'product-unavailable',
      existingImplementation: null,
    }
  }
  if (row.variant_status !== 'active') {
    return {
      ...candidate,
      selectable: false,
      outcome: 'variant-inactive',
      existingImplementation: null,
    }
  }
  return {
    ...candidate,
    selectable: true,
    outcome: 'eligible',
    existingImplementation: null,
  }
}
