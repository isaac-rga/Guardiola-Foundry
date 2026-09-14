import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import ProductVariant from '#models/product_variant'
import Product from '#models/product'
import {
  authenticateAs,
  createProduct,
  createTemplate,
  createProductVariant,
  updateProduct,
  updateProductVariant,
  createImplementation,
} from '#tests/functional/bills_of_materials/support/bom_test_support'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Bills of Materials', (group) => {
  group.each.setup(() => testUtils.db('postgres_test').truncate())

  test('derives an independent Template from a current BOM snapshot with immediate lineage', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const source = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Atelier base',
        description: 'Current construction',
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: 'Cut on grain',
            verified: false,
          },
        ],
      })
    source.assertStatus(201)

    const derived = await client
      .post(`/bills-of-materials/${source.body().id}/templates`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Atelier base — copy', productId: null })

    derived.assertStatus(201)
    derived.assertBodyContains({
      kind: 'template',
      name: 'Atelier base — copy',
      description: 'Current construction',
      product: null,
      origin: {
        id: source.body().id,
        name: 'Atelier base',
        kind: 'template',
        availability: 'available',
      },
    })
    assert.notEqual(derived.body().id, source.body().id)
    assert.notEqual(derived.body().lines[0].id, source.body().lines[0].id)
    assert.equal(derived.body().lines[0].verification.status, 'unverified')
  })

  test('enforces immutable non-self origin references at the persistence boundary', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const source = await createTemplate(client, session.token, 'Constraint source')
    const derived = await client
      .post(`/bills-of-materials/${source.id}/templates`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Constraint copy', productId: null })
    derived.assertStatus(201)

    await assert.rejects(
      () =>
        db
          .from('bills_of_materials')
          .where('public_id', derived.body().id)
          .update({ origin_bill_of_materials_id: null }),
      /Bill of Materials origin is immutable/
    )

    await assert.rejects(
      () =>
        db.table('bills_of_materials').insert({
          id: 999_999,
          public_id: 'BOM-SELF24',
          kind: 'template',
          name: 'Impossible self origin',
          description: null,
          created_by_user_id: session.userId,
          product_id: null,
          product_variant_id: null,
          origin_bill_of_materials_id: 999_999,
          created_at: new Date(),
          updated_at: new Date(),
        }),
      /bills_of_materials_origin_not_self_check/
    )
  })

  test('keeps multi-generation lineage immediate and projects current origin state without propagation', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const source = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Generation A',
        description: 'A snapshot',
        lines: [
          {
            constructionPiece: 'Original skirt',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: 'Original note',
            verified: false,
          },
        ],
      })
    source.assertStatus(201)
    const generationB = await client
      .post(`/bills-of-materials/${source.body().id}/templates`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Generation B', productId: null })
    generationB.assertStatus(201)

    const renamedSource = await client
      .put(`/bills-of-materials/${source.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        updatedAt: source.body().updatedAt,
        name: 'Generation A renamed',
        description: 'A changed later',
        lines: [
          {
            id: source.body().lines[0].id,
            constructionPiece: 'Changed source skirt',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: 'Changed source note',
            verified: false,
          },
        ],
      })
    renamedSource.assertStatus(200)

    const generationBAfterSourceChange = await client
      .get(`/bills-of-materials/${generationB.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    generationBAfterSourceChange.assertStatus(200)
    generationBAfterSourceChange.assertBodyContains({
      description: 'A snapshot',
      origin: {
        id: source.body().id,
        name: 'Generation A renamed',
        kind: 'template',
        availability: 'available',
      },
      lines: [{ constructionPiece: 'Original skirt', lineNote: 'Original note' }],
    })

    const generationC = await client
      .post(`/bills-of-materials/${generationB.body().id}/templates`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Generation C', productId: null })
    generationC.assertStatus(201)
    generationC.assertBodyContains({
      origin: {
        id: generationB.body().id,
        name: 'Generation B',
        kind: 'template',
        availability: 'available',
      },
    })

    const changedGenerationB = await client
      .put(`/bills-of-materials/${generationB.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        updatedAt: generationBAfterSourceChange.body().updatedAt,
        name: 'Generation B changed',
        description: 'B changed later',
        lines: [
          {
            id: generationBAfterSourceChange.body().lines[0].id,
            constructionPiece: 'Changed B skirt',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: 'Changed B note',
            verified: false,
          },
        ],
      })
    changedGenerationB.assertStatus(200)

    const generationCModel = await BillOfMaterial.findByOrFail('publicId', generationC.body().id)
    const generationBModel = await BillOfMaterial.findByOrFail('publicId', generationB.body().id)
    const sourceModel = await BillOfMaterial.findByOrFail('publicId', source.body().id)
    assert.equal(generationBModel.originBillOfMaterialsId, sourceModel.id)
    assert.equal(generationCModel.originBillOfMaterialsId, generationBModel.id)
    assert.notEqual(generationCModel.originBillOfMaterialsId, generationCModel.id)

    await generationBModel.softDelete()
    const withDeletedOrigin = await client
      .get(`/bills-of-materials/${generationC.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    withDeletedOrigin.assertStatus(200)
    withDeletedOrigin.assertBodyContains({
      description: 'A snapshot',
      origin: {
        id: generationB.body().id,
        name: 'Generation B changed',
        kind: 'template',
        availability: 'unavailable',
      },
      lines: [{ constructionPiece: 'Original skirt', lineNote: 'Original note' }],
    })

    await generationBModel.restore()
    const withRestoredOrigin = await client
      .get(`/bills-of-materials/${generationC.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    withRestoredOrigin.assertStatus(200)
    assert.equal(withRestoredOrigin.body().origin.availability, 'available')
    assert.equal(withRestoredOrigin.body().lines[0].constructionPiece, 'Original skirt')
  })

  test('derives an unassociated Template from unavailable Product and Variant context', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Unavailable source Product')
    const variantId = await createProductVariant(client, session.token, productId, 'Unavailable')
    const implementation = await createImplementation(
      client,
      session.token,
      variantId,
      'Unavailable implementation'
    )

    await updateProductVariant(
      client,
      session.token,
      productId,
      variantId,
      'Unavailable',
      'inactive'
    )
    await updateProduct(client, session.token, productId, 'Unavailable source Product', 'inactive')
    const fromInactiveContext = await client
      .post(`/bills-of-materials/${implementation.id}/templates`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'From inactive context' })
    fromInactiveContext.assertStatus(201)
    fromInactiveContext.assertBodyContains({ product: null })

    const product = await Product.findByOrFail('publicId', productId)
    const variant = await ProductVariant.findByOrFail('publicId', variantId)
    await variant.softDelete()
    await product.softDelete()
    const fromDeletedContext = await client
      .post(`/bills-of-materials/${implementation.id}/templates`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'From deleted context', productId: null })
    fromDeletedContext.assertStatus(201)
    fromDeletedContext.assertBodyContains({ product: null })
  })
})
