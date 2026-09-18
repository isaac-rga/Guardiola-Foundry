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
import { test } from '@japa/runner'

test.group('Bills of Materials', (group) => {
  group.each.setup(() => testUtils.db('postgres_test').truncate())

  test('soft deletes a Bill of Materials, releases its Product slot, and preserves descendant lineage', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const source = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Jackie source',
        description: 'Keep this snapshot',
        productId,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: 'Keep this line',
            verified: false,
          },
        ],
      })
    source.assertStatus(201)
    const descendant = await client
      .post(`/bills-of-materials/${source.body().id}/templates`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Jackie descendant', productId: null })
    descendant.assertStatus(201)

    const sourceWithDescendant = await client
      .get(`/bills-of-materials/${source.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    sourceWithDescendant.assertStatus(200)
    assert.equal(sourceWithDescendant.body().descendantCount, 1)

    const deleted = await client
      .delete(`/bills-of-materials/${source.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    deleted.assertStatus(204)

    const catalog = await client
      .get('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
    catalog.assertStatus(200)
    assert.notInclude(
      catalog.body().billsOfMaterials.map((billOfMaterials: any) => billOfMaterials.id),
      source.body().id
    )
    assert.include(
      catalog.body().billsOfMaterials.map((billOfMaterials: any) => billOfMaterials.id),
      descendant.body().id
    )

    const descendantDetail = await client
      .get(`/bills-of-materials/${descendant.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    descendantDetail.assertStatus(200)
    descendantDetail.assertBodyContains({
      origin: {
        id: source.body().id,
        name: 'Jackie source',
        kind: 'template',
        availability: 'unavailable',
      },
    })

    const persistedSource = await BillOfMaterial.queryWithDeleted()
      .where('publicId', source.body().id)
      .preload('lines')
      .firstOrFail()
    assert.isNotNull(persistedSource.deletedAt)
    assert.isNumber(persistedSource.productId)
    assert.isNull(persistedSource.productVariantId)
    assert.isNull(persistedSource.originBillOfMaterialsId)
    assert.lengthOf(persistedSource.lines, 1)

    const replacement = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ kind: 'template', name: 'Jackie replacement', description: null, productId })
    replacement.assertStatus(201)
  })

  test('counts available and deleted descendants across the full Origin chain', async ({
    assert,
    client,
  }) => {
    const admin = await authenticateAs(client, 'admin')
    const generationA = await createTemplate(client, admin.token, 'Generation A')
    const generationB = await client
      .post(`/bills-of-materials/${generationA.id}/templates`)
      .header('Authorization', `Bearer ${admin.token}`)
      .json({ name: 'Generation B', productId: null })
    generationB.assertStatus(201)
    const generationC = await client
      .post(`/bills-of-materials/${generationB.body().id}/templates`)
      .header('Authorization', `Bearer ${admin.token}`)
      .json({ name: 'Generation C', productId: null })
    generationC.assertStatus(201)
    const deleted = await client
      .delete(`/bills-of-materials/${generationC.body().id}`)
      .header('Authorization', `Bearer ${admin.token}`)
    deleted.assertStatus(204)

    const catalog = await client
      .get('/bills-of-materials?includeDeleted=true')
      .header('Authorization', `Bearer ${admin.token}`)
    catalog.assertStatus(200)
    const counts = new Map(
      catalog.body().billsOfMaterials.map((item: any) => [item.id, item.descendantCount])
    )
    assert.equal(counts.get(generationA.id), 2)
    assert.equal(counts.get(generationB.body().id), 1)
    assert.equal(counts.get(generationC.body().id), 0)
  })

  test('limits deleted Bill of Materials reads to Admins and restores a Template only into a free slot', async ({
    assert,
    client,
  }) => {
    const admin = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, admin.token, 'Paloma')
    const source = await createTemplate(client, admin.token, 'Paloma source', { productId })
    const deleted = await client
      .delete(`/bills-of-materials/${source.id}`)
      .header('Authorization', `Bearer ${admin.token}`)
    deleted.assertStatus(204)

    const replacement = await createTemplate(client, admin.token, 'Paloma replacement', {
      productId,
    })
    const conflict = await client
      .post(`/bills-of-materials/${source.id}/restore`)
      .header('Authorization', `Bearer ${admin.token}`)
    conflict.assertStatus(409)
    conflict.assertBodyContains({
      conflictingBillOfMaterials: {
        id: replacement.id,
        name: 'Paloma replacement',
      },
    })

    const operator = await authenticateAs(client, 'operator')
    const operatorCatalog = await client
      .get('/bills-of-materials?includeDeleted=true')
      .header('Authorization', `Bearer ${operator.token}`)
    operatorCatalog.assertStatus(200)
    assert.notInclude(
      operatorCatalog.body().billsOfMaterials.map((item: any) => item.id),
      source.id
    )
    const operatorDetail = await client
      .get(`/bills-of-materials/${source.id}`)
      .header('Authorization', `Bearer ${operator.token}`)
    operatorDetail.assertStatus(404)
    const operatorRestore = await client
      .post(`/bills-of-materials/${source.id}/restore`)
      .header('Authorization', `Bearer ${operator.token}`)
    operatorRestore.assertStatus(403)

    const adminCatalog = await client
      .get('/bills-of-materials?includeDeleted=true')
      .header('Authorization', `Bearer ${admin.token}`)
    adminCatalog.assertStatus(200)
    const deletedSummary = adminCatalog
      .body()
      .billsOfMaterials.find((item: any) => item.id === source.id)
    assert.isString(deletedSummary.deletedAt)
    assert.equal(deletedSummary.readOnlyReason, 'bom-deleted')

    await client
      .delete(`/bills-of-materials/${replacement.id}`)
      .header('Authorization', `Bearer ${admin.token}`)
    const deletedProduct = await client
      .delete(`/products/${productId}`)
      .header('Authorization', `Bearer ${admin.token}`)
    deletedProduct.assertStatus(204)
    const restored = await client
      .post(`/bills-of-materials/${source.id}/restore`)
      .header('Authorization', `Bearer ${admin.token}`)
    restored.assertStatus(200)
    assert.isNull(restored.body().deletedAt)
    assert.equal(restored.body().readOnlyReason, 'product-deleted')
  })

  test('checks Implementation Variant and Product typification conflicts before restore', async ({
    client,
  }) => {
    const admin = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, admin.token, 'Lucia')
    const firstVariantId = await createProductVariant(client, admin.token, productId, 'Showroom')
    const secondVariantId = await createProductVariant(client, admin.token, productId, 'Editorial')
    const deletedImplementation = await createImplementation(
      client,
      admin.token,
      firstVariantId,
      'Lucia - Blush'
    )
    await client
      .delete(`/bills-of-materials/${deletedImplementation.id}`)
      .header('Authorization', `Bearer ${admin.token}`)

    const slotOccupant = await createImplementation(
      client,
      admin.token,
      firstVariantId,
      'Lucia - Ivory'
    )
    const slotConflict = await client
      .post(`/bills-of-materials/${deletedImplementation.id}/restore`)
      .header('Authorization', `Bearer ${admin.token}`)
    slotConflict.assertStatus(409)
    slotConflict.assertBodyContains({ conflictingBillOfMaterials: { id: slotOccupant.id } })
    await client
      .delete(`/bills-of-materials/${slotOccupant.id}`)
      .header('Authorization', `Bearer ${admin.token}`)

    const typificationOccupant = await createImplementation(
      client,
      admin.token,
      secondVariantId,
      'lucia - blush'
    )
    const typificationConflict = await client
      .post(`/bills-of-materials/${deletedImplementation.id}/restore`)
      .header('Authorization', `Bearer ${admin.token}`)
    typificationConflict.assertStatus(409)
    typificationConflict.assertBodyContains({
      conflictingBillOfMaterials: { id: typificationOccupant.id },
    })
    await client
      .delete(`/bills-of-materials/${typificationOccupant.id}`)
      .header('Authorization', `Bearer ${admin.token}`)

    const deletedVariant = await client
      .delete(`/products/${productId}/variants/${firstVariantId}`)
      .header('Authorization', `Bearer ${admin.token}`)
    deletedVariant.assertStatus(204)
    const restored = await client
      .post(`/bills-of-materials/${deletedImplementation.id}/restore`)
      .header('Authorization', `Bearer ${admin.token}`)
    restored.assertStatus(200)
    restored.assertBodyContains({ readOnlyReason: 'product-variant-deleted' })
  })

  test('keeps inactive related records editable and makes soft-deleted related records read-only', async ({
    assert,
    client,
  }) => {
    const admin = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, admin.token, 'Ines')
    const template = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${admin.token}`)
      .json({ kind: 'template', name: 'Ines source', description: null, productId })
    template.assertStatus(201)

    await updateProduct(client, admin.token, productId, 'Ines', 'inactive')
    const inactiveDetail = await client
      .get(`/bills-of-materials/${template.body().id}`)
      .header('Authorization', `Bearer ${admin.token}`)
    inactiveDetail.assertStatus(200)
    assert.isNull(inactiveDetail.body().readOnlyReason)
    const saved = await client
      .put(`/bills-of-materials/${template.body().id}`)
      .header('Authorization', `Bearer ${admin.token}`)
      .json({
        updatedAt: inactiveDetail.body().updatedAt,
        name: 'Ines source revised',
        description: null,
        lines: [],
      })
    saved.assertStatus(200)

    const deletedProduct = await client
      .delete(`/products/${productId}`)
      .header('Authorization', `Bearer ${admin.token}`)
    deletedProduct.assertStatus(204)
    const readOnlyDetail = await client
      .get(`/bills-of-materials/${template.body().id}`)
      .header('Authorization', `Bearer ${admin.token}`)
    readOnlyDetail.assertStatus(200)
    readOnlyDetail.assertBodyContains({ readOnlyReason: 'product-deleted' })
    const rejected = await client
      .put(`/bills-of-materials/${template.body().id}`)
      .header('Authorization', `Bearer ${admin.token}`)
      .json({
        updatedAt: readOnlyDetail.body().updatedAt,
        name: 'Must not replace the saved Template name',
        description: 'Must not persist',
        lines: [],
      })
    rejected.assertStatus(422)
    rejected.assertBodyContains({
      errors: {
        updatedAt: ['Restore the assigned Product before editing this Bill of Materials.'],
      },
    })
    const persisted = await BillOfMaterial.findByOrFail('publicId', template.body().id)
    assert.equal(persisted.name, 'Ines source revised')
    assert.isNull(persisted.description)
    assert.equal(persisted.updatedAt.toISO(), readOnlyDetail.body().updatedAt)
  })

  test('keeps an inactive Variant editable and rejects mutation after the Variant is deleted', async ({
    assert,
    client,
  }) => {
    const admin = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, admin.token, 'Alba')
    const variantId = await createProductVariant(client, admin.token, productId, 'Showroom')
    const implementation = await createImplementation(
      client,
      admin.token,
      variantId,
      'Alba - Showroom'
    )

    await updateProductVariant(client, admin.token, productId, variantId, 'Showroom', 'inactive')
    const inactiveDetail = await client
      .get(`/bills-of-materials/${implementation.id}`)
      .header('Authorization', `Bearer ${admin.token}`)
    inactiveDetail.assertStatus(200)
    assert.isNull(inactiveDetail.body().readOnlyReason)
    const saved = await client
      .put(`/bills-of-materials/${implementation.id}`)
      .header('Authorization', `Bearer ${admin.token}`)
      .json({
        updatedAt: inactiveDetail.body().updatedAt,
        name: 'Alba - Inactive Showroom',
        description: 'Inactive remains editable',
        lines: [],
      })
    saved.assertStatus(200)

    const deletedVariant = await client
      .delete(`/products/${productId}/variants/${variantId}`)
      .header('Authorization', `Bearer ${admin.token}`)
    deletedVariant.assertStatus(204)
    const readOnlyDetail = await client
      .get(`/bills-of-materials/${implementation.id}`)
      .header('Authorization', `Bearer ${admin.token}`)
    readOnlyDetail.assertStatus(200)
    readOnlyDetail.assertBodyContains({ readOnlyReason: 'product-variant-deleted' })
    const rejected = await client
      .put(`/bills-of-materials/${implementation.id}`)
      .header('Authorization', `Bearer ${admin.token}`)
      .json({
        updatedAt: readOnlyDetail.body().updatedAt,
        name: 'Must not replace the saved Implementation name',
        description: 'Must not persist',
        lines: [],
      })
    rejected.assertStatus(422)
    rejected.assertBodyContains({
      errors: {
        updatedAt: [
          'Restore the Product and Product Variant before editing this Bill of Materials.',
        ],
      },
    })
    const persisted = await BillOfMaterial.findByOrFail('publicId', implementation.id)
    assert.equal(persisted.name, 'Alba - Inactive Showroom')
    assert.equal(persisted.description, 'Inactive remains editable')
    assert.equal(persisted.updatedAt.toISO(), readOnlyDetail.body().updatedAt)
  })

  test('atomically restores only one deleted Template into a shared Product slot', async ({
    assert,
    client,
  }) => {
    const admin = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, admin.token, 'Concurrent restore')
    const first = await createTemplate(client, admin.token, 'First deleted Template', { productId })
    await client
      .delete(`/bills-of-materials/${first.id}`)
      .header('Authorization', `Bearer ${admin.token}`)
    const second = await createTemplate(client, admin.token, 'Second deleted Template', {
      productId,
    })
    await client
      .delete(`/bills-of-materials/${second.id}`)
      .header('Authorization', `Bearer ${admin.token}`)

    const responses = await Promise.all([
      client
        .post(`/bills-of-materials/${first.id}/restore`)
        .header('Authorization', `Bearer ${admin.token}`),
      client
        .post(`/bills-of-materials/${second.id}/restore`)
        .header('Authorization', `Bearer ${admin.token}`),
    ])

    assert.deepEqual(responses.map((response) => response.status()).sort(), [200, 409])
    const product = await Product.findByOrFail('publicId', productId)
    const available = await BillOfMaterial.query().where('productId', product.id)
    assert.lengthOf(available, 1)
  })

  test('atomically restores only one case-insensitive Implementation typification per Product', async ({
    assert,
    client,
  }) => {
    const admin = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, admin.token, 'Concurrent typification restore')
    const firstVariantId = await createProductVariant(client, admin.token, productId, 'Showroom')
    const secondVariantId = await createProductVariant(client, admin.token, productId, 'Editorial')
    const first = await createImplementation(client, admin.token, firstVariantId, 'Blush Train')
    const firstDelete = await client
      .delete(`/bills-of-materials/${first.id}`)
      .header('Authorization', `Bearer ${admin.token}`)
    firstDelete.assertStatus(204)
    const second = await createImplementation(client, admin.token, secondVariantId, 'blush train')
    const secondDelete = await client
      .delete(`/bills-of-materials/${second.id}`)
      .header('Authorization', `Bearer ${admin.token}`)
    secondDelete.assertStatus(204)

    const responses = await Promise.all([
      client
        .post(`/bills-of-materials/${first.id}/restore`)
        .header('Authorization', `Bearer ${admin.token}`),
      client
        .post(`/bills-of-materials/${second.id}/restore`)
        .header('Authorization', `Bearer ${admin.token}`),
    ])

    assert.deepEqual(responses.map((response) => response.status()).sort(), [200, 409])
    const winnerResponse = responses.find((response) => response.status() === 200)!
    const loserResponse = responses.find((response) => response.status() === 409)!
    const candidates = new Map([
      [first.id, { name: 'Blush Train', productVariantId: firstVariantId }],
      [second.id, { name: 'blush train', productVariantId: secondVariantId }],
    ])
    const winner = candidates.get(winnerResponse.body().id)!
    const loser = [...candidates.entries()].find(([id]) => id !== winnerResponse.body().id)!
    loserResponse.assertBodyContains({
      conflictingBillOfMaterials: { id: winnerResponse.body().id, name: winner.name },
    })

    const variants = await ProductVariant.query().whereIn('publicId', [
      firstVariantId,
      secondVariantId,
    ])
    const active = await BillOfMaterial.query().whereIn(
      'productVariantId',
      variants.map((variant) => variant.id)
    )
    assert.lengthOf(active, 1)
    assert.equal(active[0].publicId, winnerResponse.body().id)

    const persistedLoser = await BillOfMaterial.queryWithDeleted()
      .where('publicId', loser[0])
      .firstOrFail()
    const loserVariant = variants.find((variant) => variant.publicId === loser[1].productVariantId)!
    assert.isNotNull(persistedLoser.deletedAt)
    assert.equal(persistedLoser.productVariantId, loserVariant.id)
    assert.equal(persistedLoser.name, loser[1].name)
  })

  test('serializes deletion with Product association without retaining an occupied deleted slot', async ({
    assert,
    client,
  }) => {
    const operator = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, operator.token, 'Concurrent association')
    const template = await createTemplate(client, operator.token, 'Association candidate')

    const [association, deletion] = await Promise.all([
      client
        .post(`/bills-of-materials/${template.id}/product`)
        .header('Authorization', `Bearer ${operator.token}`)
        .json({ productId }),
      client
        .delete(`/bills-of-materials/${template.id}`)
        .header('Authorization', `Bearer ${operator.token}`),
    ])

    assert.include([200, 404], association.status())
    deletion.assertStatus(204)
    const replacement = await createTemplate(client, operator.token, 'Released association slot', {
      productId,
    })
    assert.isString(replacement.id)
  })
})
