import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import Material from '#models/material'
import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import {
  authenticateAs,
  createProduct,
  createProductVariant,
  createImplementation,
} from '#tests/functional/bills_of_materials/support/bom_test_support'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('Bills of Materials', (group) => {
  group.each.setup(async () => {
    await BillOfMaterial.query().delete()
    await testUtils.db('postgres_test').truncate()
  })

  group.each.teardown(async () => {
    await BillOfMaterial.queryWithDeleted().delete()
    await testUtils.db('postgres_test').truncate()
  })

  test('starts with an empty persisted catalog', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')

    const response = await client
      .get('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    response.assertBody({
      billsOfMaterials: [],
      summary: {
        totalAvailable: 0,
        templateCount: 0,
        implementationCount: 0,
        withoutProductVariantCount: 0,
        withUnverifiedLinesCount: 0,
      },
    })
  })

  test('returns operational row projections and an available-catalog summary', async ({
    assert,
    client,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const variantId = await createProductVariant(
      client,
      session.token,
      productId,
      'Jackie Showroom'
    )
    const template = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Jackie base construction',
        description: null,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 2,
            lineNote: null,
            verified: false,
          },
          {
            constructionPiece: 'Unresolved trim',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
            verified: false,
          },
        ],
      })
    const implementation = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'implementation',
        name: 'Jackie - Blush - Chapel Train',
        description: null,
        productVariantId: variantId,
        lines: [],
      })

    template.assertStatus(201)
    implementation.assertStatus(201)
    const attentionMaterial = await Material.findByOrFail('publicId', 'M-0001')
    attentionMaterial.deletedAt = DateTime.utc()
    await attentionMaterial.save()

    const response = await client
      .get('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.deepEqual(response.body().summary, {
      totalAvailable: 2,
      templateCount: 1,
      implementationCount: 1,
      withoutProductVariantCount: 1,
      withUnverifiedLinesCount: 1,
    })
    const templateSummary = response
      .body()
      .billsOfMaterials.find((item: { id: string }) => item.id === template.body().id)
    assert.deepInclude(templateSummary, {
      lineCount: 2,
      verifiedLineCount: 0,
      attentionCount: 1,
      costProjection: {
        availability: 'partial',
        amountCents: 8400,
        excludedLineCount: 1,
      },
    })
    const implementationSummary = response
      .body()
      .billsOfMaterials.find((item: { id: string }) => item.id === implementation.body().id)
    assert.deepInclude(implementationSummary, {
      lineCount: 0,
      verifiedLineCount: 0,
      attentionCount: 0,
      costProjection: {
        availability: 'unavailable',
        amountCents: null,
        excludedLineCount: 0,
      },
    })
  })

  test('searches current catalog context, filters kind, and limits deleted records to Admins', async ({
    assert,
    client,
  }) => {
    const adminSession = await authenticateAs(client, 'admin')
    const operatorSession = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, adminSession.token, 'Auróra')
    const variantId = await createProductVariant(
      client,
      adminSession.token,
      productId,
      'Auróra Atelier'
    )
    const template = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${adminSession.token}`)
      .json({
        kind: 'template',
        name: 'Atelier foundation',
        description: null,
        productId,
        lines: [],
      })
    const implementation = await client
      .post(`/bills-of-materials/${template.body().id}/implementations`)
      .header('Authorization', `Bearer ${adminSession.token}`)
      .json({ name: 'Pearl chapel build', productVariantId: variantId })

    template.assertStatus(201)
    implementation.assertStatus(201)
    const deleted = await client
      .delete(`/bills-of-materials/${template.body().id}`)
      .header('Authorization', `Bearer ${operatorSession.token}`)
    deleted.assertStatus(204)

    for (const search of [
      'PEARL',
      implementation.body().id,
      ' aurora ',
      productId,
      'atelier',
      variantId,
      'foundation',
      template.body().id,
    ]) {
      const response = await client
        .get(`/bills-of-materials?search=${encodeURIComponent(search)}`)
        .header('Authorization', `Bearer ${operatorSession.token}`)

      response.assertStatus(200)
      assert.deepEqual(
        response.body().billsOfMaterials.map((item: { id: string }) => item.id),
        [implementation.body().id]
      )
    }

    const templates = await client
      .get('/bills-of-materials?kind=template')
      .header('Authorization', `Bearer ${operatorSession.token}`)
    templates.assertStatus(200)
    assert.isEmpty(templates.body().billsOfMaterials)
    assert.deepEqual(templates.body().summary, {
      totalAvailable: 1,
      templateCount: 0,
      implementationCount: 1,
      withoutProductVariantCount: 0,
      withUnverifiedLinesCount: 0,
    })

    const adminDeleted = await client
      .get('/bills-of-materials?kind=template&includeDeleted=true')
      .header('Authorization', `Bearer ${adminSession.token}`)
    const operatorDeleted = await client
      .get('/bills-of-materials?kind=template&includeDeleted=true')
      .header('Authorization', `Bearer ${operatorSession.token}`)

    adminDeleted.assertStatus(200)
    operatorDeleted.assertStatus(200)
    assert.deepEqual(
      adminDeleted.body().billsOfMaterials.map((item: { id: string }) => item.id),
      [template.body().id]
    )
    assert.isEmpty(operatorDeleted.body().billsOfMaterials)
    assert.deepEqual(adminDeleted.body().summary, templates.body().summary)
  })

  test('lists a saved manual Implementation with its Product Variant context', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const variantId = await createProductVariant(
      client,
      session.token,
      productId,
      'Jackie Showroom'
    )
    const implementation = await createImplementation(
      client,
      session.token,
      variantId,
      'Jackie - Blush - Chapel Train'
    )

    const response = await client
      .get('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    response.assertBodyContains({
      billsOfMaterials: [
        {
          id: implementation.id,
          kind: 'implementation',
          name: 'Jackie - Blush - Chapel Train',
          product: { id: productId, name: 'Jackie', availability: 'available' },
          productVariant: {
            id: variantId,
            name: 'Jackie Showroom',
            availability: 'available',
          },
          origin: null,
        },
      ],
    })
  })

  test('persists a saved Template so a later catalog request can reload it', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ kind: 'template', name: 'Cape construction', description: null })

    created.assertStatus(201)

    const reloaded = await client
      .get('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)

    reloaded.assertStatus(200)
    reloaded.assertBodyContains({
      billsOfMaterials: [
        {
          id: created.body().id,
          kind: 'template',
          name: 'Cape construction',
          description: null,
        },
      ],
    })
  })

  test('requires bearer authentication for catalog and creation', async ({ client }) => {
    const responses = await Promise.all([
      client.get('/bills-of-materials'),
      client.get('/bills-of-materials/product-variant-candidates?search=jackie'),
      client.get('/bills-of-materials/BOM-ABC234'),
      client
        .post('/bills-of-materials')
        .json({ kind: 'template', name: 'No session', description: null }),
    ])

    responses.forEach((response) => response.assertStatus(401))
  })
})
