import { BaseSchema } from '@adonisjs/lucid/schema'
import { randomBytes } from 'node:crypto'

const PRODUCT_VARIANT_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PRODUCT_VARIANT_ID_LENGTH = 6

export default class extends BaseSchema {
  async up() {
    const result = await this.db.rawQuery(`
      SELECT product.id
      FROM products AS product
      WHERE product.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM product_variants AS variant
          WHERE variant.product_id = product.id
            AND variant.deleted_at IS NULL
        )
      ORDER BY product.id
    `)

    for (const product of result.rows as Array<{ id: number }>) {
      await this.createBaseVariant(product.id)
    }
  }

  async down() {
    // These become ordinary user-managed Variants immediately, so rollback cannot identify them safely.
  }

  private async createBaseVariant(productId: number) {
    while (true) {
      const publicId = `PV-${this.randomProductVariantToken()}`
      const inserted = await this.db.rawQuery(
        `
          INSERT INTO product_variants (
            public_id,
            product_id,
            name,
            status,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT (public_id) DO NOTHING
          RETURNING id
        `,
        [publicId, productId, 'Base', 'active', new Date(), new Date()]
      )

      if (inserted.rows.length > 0) {
        return
      }

      const existingVariant = await this.db
        .from('product_variants')
        .where('product_id', productId)
        .whereNull('deleted_at')
        .first()

      if (existingVariant) {
        return
      }
    }
  }

  private randomProductVariantToken() {
    const bytes = randomBytes(PRODUCT_VARIANT_ID_LENGTH)

    return Array.from(
      bytes,
      (byte) => PRODUCT_VARIANT_ID_ALPHABET[byte % PRODUCT_VARIANT_ID_ALPHABET.length]
    ).join('')
  }
}
