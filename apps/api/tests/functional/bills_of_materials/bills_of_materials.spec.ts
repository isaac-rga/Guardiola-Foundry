import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import Material from '#models/material'
import MaterialSource from '#models/material_source'
import MaterialSourceLink from '#models/material_source_link'
import User from '#models/user'
import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Bills of Materials', (group) => {
  group.each.setup(async () => {
    await BillOfMaterial.query().delete()
    await testUtils.db('postgres_test').truncate()
  })

  test('starts with an empty persisted catalog', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')

    const response = await client
      .get('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    response.assertBody({ billsOfMaterials: [] })
  })

  test('creates an unassociated Template with immutable creation metadata', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: '  Jackie base construction  ',
        description: '  Reusable starting point  ',
      })

    response.assertStatus(201)
    response.assertBodyContains({
      kind: 'template',
      name: 'Jackie base construction',
      description: 'Reusable starting point',
      createdBy: { id: session.userId, email: 'admin@example.com' },
    })
    assert.match(response.body().id, /^BOM-[A-Z2-9]{6}$/)
    assert.isString(response.body().createdAt)
    assert.isString(response.body().updatedAt)
    assert.isAtLeast(Date.parse(response.body().updatedAt), Date.parse(response.body().createdAt))
    assert.isNull(response.body().product)
  })

  test('creates a Product-associated Template and exposes immutable Product context', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, session.token, 'Jackie', {
      lifecycleStatus: 'finished',
    })

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Jackie base construction',
        description: null,
        productId,
      })

    response.assertStatus(201)
    response.assertBodyContains({
      product: { id: productId, name: 'Jackie', availability: 'available' },
    })

    const reloaded = await client
      .get(`/bills-of-materials/${response.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    reloaded.assertStatus(200)
    reloaded.assertBodyContains({
      product: { id: productId, name: 'Jackie', availability: 'available' },
    })
  })

  test('creates a manual Implementation for a Product Variant with no lines or origin', async ({
    assert,
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

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'implementation',
        name: '  Jackie - Blush - Chapel Train  ',
        description: '  Manual construction  ',
        productVariantId: variantId,
        lines: [],
      })

    response.assertStatus(201)
    response.assertBodyContains({
      kind: 'implementation',
      name: 'Jackie - Blush - Chapel Train',
      description: 'Manual construction',
      product: { id: productId, name: 'Jackie', availability: 'available' },
      productVariant: {
        id: variantId,
        name: 'Jackie Showroom',
        availability: 'available',
      },
      origin: null,
      lines: [],
    })

    const persisted = await BillOfMaterial.findByOrFail('publicId', response.body().id)
    assert.isNull(persisted.productId)
    assert.isNumber(persisted.productVariantId)
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

  test('searches Product Variant candidates with canonical eligibility and occupancy context', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const eligibleProductId = await createProduct(client, session.token, 'Eligible Jackie')
    const eligibleVariantId = await createProductVariant(
      client,
      session.token,
      eligibleProductId,
      'Showroom'
    )
    const inactiveProductId = await createProduct(client, session.token, 'Inactive Jackie')
    const inactiveProductVariantId = await createProductVariant(
      client,
      session.token,
      inactiveProductId,
      'Showroom'
    )
    await updateProduct(client, session.token, inactiveProductId, 'Inactive Jackie', 'inactive')
    const inactiveVariantProductId = await createProduct(
      client,
      session.token,
      'Variant inactive Jackie'
    )
    const inactiveVariantId = await createProductVariant(
      client,
      session.token,
      inactiveVariantProductId,
      'Showroom'
    )
    await updateProductVariant(
      client,
      session.token,
      inactiveVariantProductId,
      inactiveVariantId,
      'Showroom',
      'inactive'
    )
    const occupiedProductId = await createProduct(client, session.token, 'Occupied Jackie')
    const occupiedVariantId = await createProductVariant(
      client,
      session.token,
      occupiedProductId,
      'Showroom'
    )
    const implementation = await createImplementation(
      client,
      session.token,
      occupiedVariantId,
      'Occupied construction'
    )
    await updateProduct(client, session.token, occupiedProductId, 'Occupied Jackie', 'inactive')

    const response = await client
      .get('/bills-of-materials/product-variant-candidates?search=jackie%20showroom')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    response.assertBodyContains({ hasMore: false })
    const byId = new Map(response.body().items.map((item: any) => [item.id, item]))
    assertCandidate(assert, byId.get(eligibleVariantId), true, 'eligible', null)
    assertCandidate(assert, byId.get(inactiveProductVariantId), false, 'product-unavailable', null)
    assertCandidate(assert, byId.get(inactiveVariantId), false, 'variant-inactive', null)
    assertCandidate(
      assert,
      byId.get(occupiedVariantId),
      false,
      'implementation-exists',
      implementation.id
    )
  })

  test('scopes case-insensitive BOM Typification uniqueness to one Product', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const jackieId = await createProduct(client, session.token, 'Jackie')
    const jackieShowroomId = await createProductVariant(client, session.token, jackieId, 'Showroom')
    const jackieEditorialId = await createProductVariant(
      client,
      session.token,
      jackieId,
      'Editorial'
    )
    const palomaId = await createProduct(client, session.token, 'Paloma')
    const palomaShowroomId = await createProductVariant(client, session.token, palomaId, 'Showroom')
    await createImplementation(client, session.token, jackieShowroomId, 'Blush construction')

    const duplicate = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'implementation',
        name: 'BLUSH CONSTRUCTION',
        description: null,
        productVariantId: jackieEditorialId,
        lines: [],
      })
    duplicate.assertStatus(409)
    duplicate.assertBodyContains({
      errors: {
        name: ['Another BOM Implementation in this Product already uses this typification.'],
      },
    })

    const otherProduct = await createImplementation(
      client,
      session.token,
      palomaShowroomId,
      'BLUSH CONSTRUCTION'
    )
    assert.equal(otherProduct.product.id, palomaId)
    const count = await BillOfMaterial.query().where('kind', 'implementation').count('* as total')
    assert.equal(Number(count[0].$extras.total), 2)
  })

  test('atomically gives a Product Variant to only one competing Implementation', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Contended Jackie')
    const variantId = await createProductVariant(client, session.token, productId, 'Showroom')

    const responses = await Promise.all(
      ['First construction', 'Second construction'].map((name) =>
        client.post('/bills-of-materials').header('Authorization', `Bearer ${session.token}`).json({
          kind: 'implementation',
          name,
          description: null,
          productVariantId: variantId,
          lines: [],
        })
      )
    )

    assert.deepEqual(responses.map((response) => response.status()).sort(), [201, 409])
    const conflict = responses.find((response) => response.status() === 409)!
    assert.match(conflict.body().conflictingImplementation.id, /^BOM-[A-Z2-9]{6}$/)
    const count = await BillOfMaterial.query().whereNotNull('productVariantId').count('* as total')
    assert.equal(Number(count[0].$extras.total), 1)
  })

  test('revalidates Implementation availability atomically and accepts an Incomplete line', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const inactiveVariantId = await createProductVariant(
      client,
      session.token,
      productId,
      'Inactive'
    )
    await updateProductVariant(
      client,
      session.token,
      productId,
      inactiveVariantId,
      'Inactive',
      'inactive'
    )

    const unavailable = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'implementation',
        name: 'Must remain atomic',
        description: null,
        productVariantId: inactiveVariantId,
        lines: [
          {
            constructionPiece: 'Skirt',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
            verified: false,
          },
        ],
      })
    unavailable.assertStatus(422)
    unavailable.assertBodyContains({
      errors: {
        productVariantId: ['The selected Product Variant is no longer available.'],
      },
    })
    let count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)

    const activeVariantId = await createProductVariant(client, session.token, productId, 'Active')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'implementation',
        name: 'Progressive construction',
        description: null,
        productVariantId: activeVariantId,
        lines: [
          {
            constructionPiece: 'Skirt',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
            verified: false,
          },
        ],
      })
    created.assertStatus(201)
    created.assertBodyContains({
      lines: [{ constructionPiece: 'Skirt', completeness: 'incomplete' }],
    })
    count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 1)
  })

  test('associates an unassociated Template once and rejects reassignment', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')
    const firstProductId = await createProduct(client, session.token, 'Jackie')
    const secondProductId = await createProduct(client, session.token, 'Paloma')
    const template = await createTemplate(client, session.token, 'Shared construction')

    const associated = await client
      .post(`/bills-of-materials/${template.id}/product`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ productId: firstProductId })

    associated.assertStatus(200)
    associated.assertBodyContains({
      id: template.id,
      product: { id: firstProductId, name: 'Jackie', availability: 'available' },
    })

    const reassigned = await client
      .post(`/bills-of-materials/${template.id}/product`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ productId: secondProductId })

    reassigned.assertStatus(422)
    reassigned.assertBodyContains({
      errors: { productId: ['A Template Product association is permanent once assigned.'] },
    })
  })

  test('rejects unavailable Products while preserving an existing association', async ({
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const inactiveProductId = await createProduct(client, session.token, 'Inactive Jackie', {
      productStatus: 'inactive',
    })
    const deletedProductId = await createProduct(client, session.token, 'Deleted Paloma')
    await client
      .delete(`/products/${deletedProductId}`)
      .header('Authorization', `Bearer ${session.token}`)

    for (const productId of [inactiveProductId, deletedProductId]) {
      const response = await client
        .post('/bills-of-materials')
        .header('Authorization', `Bearer ${session.token}`)
        .json({ kind: 'template', name: `Blocked ${productId}`, description: null, productId })

      response.assertStatus(422)
      response.assertBodyContains({
        errors: { productId: ['BOM Templates can only be associated with an active Product.'] },
      })
    }

    const activeProductId = await createProduct(client, session.token, 'Associated Jackie')
    const template = await createTemplate(client, session.token, 'Associated construction', {
      productId: activeProductId,
    })
    await client
      .put(`/products/${activeProductId}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: 'Associated Jackie',
        shortDescription: null,
        lifecycleStatus: 'approved',
        productStatus: 'inactive',
        productCategory: null,
        collectionId: null,
      })

    const preserved = await client
      .get(`/bills-of-materials/${template.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    preserved.assertStatus(200)
    preserved.assertBodyContains({
      product: { id: activeProductId, name: 'Associated Jackie', availability: 'unavailable' },
    })

    await client
      .delete(`/products/${activeProductId}`)
      .header('Authorization', `Bearer ${session.token}`)
    const preservedAfterDeletion = await client
      .get(`/bills-of-materials/${template.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    preservedAfterDeletion.assertStatus(200)
    preservedAfterDeletion.assertBodyContains({
      product: { id: activeProductId, name: 'Associated Jackie', availability: 'unavailable' },
    })
  })

  test('atomically gives a Product slot to only one competing Template creation', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Contended Jackie')

    const responses = await Promise.all(
      ['First construction', 'Second construction'].map((name) =>
        client
          .post('/bills-of-materials')
          .header('Authorization', `Bearer ${session.token}`)
          .json({ kind: 'template', name, description: null, productId })
      )
    )

    assert.deepEqual(responses.map((response) => response.status()).sort(), [201, 409])
    const conflict = responses.find((response) => response.status() === 409)!
    assert.match(conflict.body().conflictingTemplate.id, /^BOM-[A-Z2-9]{6}$/)
    assert.include(
      ['First construction', 'Second construction'],
      conflict.body().conflictingTemplate.name
    )

    const associatedCount = await BillOfMaterial.query()
      .whereNotNull('productId')
      .count('* as total')
    assert.equal(Number(associatedCount[0].$extras.total), 1)
  })

  test('atomically gives a Product slot to only one competing existing Template', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Association race Jackie')
    const templates = await Promise.all([
      createTemplate(client, session.token, 'First existing construction'),
      createTemplate(client, session.token, 'Second existing construction'),
    ])

    const responses = await Promise.all(
      templates.map((template) =>
        client
          .post(`/bills-of-materials/${template.id}/product`)
          .header('Authorization', `Bearer ${session.token}`)
          .json({ productId })
      )
    )

    assert.deepEqual(responses.map((response) => response.status()).sort(), [200, 409])
    const winner = responses.find((response) => response.status() === 200)!
    const conflict = responses.find((response) => response.status() === 409)!
    assert.equal(conflict.body().conflictingTemplate.id, winner.body().id)

    const associated = await BillOfMaterial.query().whereNotNull('productId')
    assert.lengthOf(associated, 1)
    assert.equal(associated[0].publicId, winner.body().id)
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

  test('atomically creates and reloads ordered repeated and incomplete BOM Lines', async ({
    assert,
    client,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const session = await authenticateAs(client, 'operator')

    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Layered skirt construction',
        description: null,
        lines: [
          {
            constructionPiece: '  Outer skirt  ',
            materialId: 'M-0001',
            materialQuantity: 3.125,
            lineNote: '  Cut on grain  ',
          },
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 3.125,
            lineNote: null,
          },
          {
            constructionPiece: 'Lining',
            materialId: null,
            materialQuantity: null,
            lineNote: 'Resolve during drape review',
          },
        ],
      })

    created.assertStatus(201)
    assert.deepEqual(
      created.body().lines.map((line: Record<string, unknown>) => ({
        constructionPiece: line.constructionPiece,
        materialId: (line.material as { id: string } | null)?.id ?? null,
        materialQuantity: line.materialQuantity,
        lineNote: line.lineNote,
        order: line.order,
        completeness: line.completeness,
      })),
      [
        {
          constructionPiece: 'Outer skirt',
          materialId: 'M-0001',
          materialQuantity: 3.125,
          lineNote: 'Cut on grain',
          order: 0,
          completeness: 'complete',
        },
        {
          constructionPiece: 'Outer skirt',
          materialId: 'M-0001',
          materialQuantity: 3.125,
          lineNote: null,
          order: 1,
          completeness: 'complete',
        },
        {
          constructionPiece: 'Lining',
          materialId: null,
          materialQuantity: null,
          lineNote: 'Resolve during drape review',
          order: 2,
          completeness: 'incomplete',
        },
      ]
    )
    assert.equal(new Set(created.body().lines.map((line: { id: string }) => line.id)).size, 3)
    created.body().lines.forEach((line: { id: string }) => {
      assert.match(line.id, /^BML-[A-Z2-9]{6}$/)
    })

    const reloaded = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    reloaded.assertStatus(200)
    assert.deepEqual(reloaded.body(), created.body())
  })

  test('returns canonical rounded line and Partial BOM cost projections', async ({
    assert,
    client,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const zeroCostSource = await MaterialSource.findByOrFail('legacySourceId', 'SRC-200')
    zeroCostSource.landedUnitCostCents = 0
    await zeroCostSource.save()
    const unavailableCostSource = await MaterialSource.findByOrFail('legacySourceId', 'SRC-300')
    unavailableCostSource.landedUnitCostCents = null
    await unavailableCostSource.save()
    const session = await authenticateAs(client, 'operator')

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Projected construction',
        description: null,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 1.111,
            lineNote: null,
          },
          {
            constructionPiece: 'Outer skirt repeat',
            materialId: 'M-0001',
            materialQuantity: 1.111,
            lineNote: null,
          },
          {
            constructionPiece: 'Structure',
            materialId: 'M-0002',
            materialQuantity: 2.5,
            lineNote: null,
          },
          {
            constructionPiece: 'Unresolved',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
          },
          {
            constructionPiece: 'Quantity pending',
            materialId: 'M-0001',
            materialQuantity: null,
            lineNote: null,
          },
          {
            constructionPiece: 'Cost pending',
            materialId: 'M-0003',
            materialQuantity: 1,
            lineNote: null,
          },
        ],
      })

    unavailableCostSource.landedUnitCostCents = 7600
    await unavailableCostSource.save()

    response.assertStatus(201)
    assert.deepEqual(
      response.body().lines.map((line: Record<string, unknown>) => line.costProjection),
      [
        { amountCents: 4666, exclusionReason: null },
        { amountCents: 4666, exclusionReason: null },
        { amountCents: 0, exclusionReason: null },
        { amountCents: null, exclusionReason: 'missing-material' },
        { amountCents: null, exclusionReason: 'missing-material-quantity' },
        { amountCents: null, exclusionReason: 'no-usable-landed-unit-cost' },
      ]
    )
    assert.deepEqual(response.body().costProjection, {
      availability: 'partial',
      amountCents: 9332,
      excludedLineCount: 3,
    })
    assert.deepEqual(response.body().lines[2].material.preferredSource, {
      id: 'S-0003',
      name: 'Champagne Structure Satin',
      vendor: 'Atelier Supply',
      vendorShadeOrDetail: null,
      widthCentimeters: null,
      landedUnitCostCents: 0,
    })
    assert.deepEqual(response.body().lines[5].attention, ['source-needs-attention'])
  })

  test('refreshes live sourcing context and independent attention without changing BOM data', async ({
    assert,
    client,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const session = await authenticateAs(client, 'operator')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Retained construction',
        description: null,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 2,
            lineNote: null,
            verified: true,
          },
        ],
      })
    created.assertStatus(201)

    const material = await Material.findByOrFail('publicId', 'M-0001')
    await material.softDelete()
    const preferredSource = await MaterialSource.findByOrFail('legacySourceId', 'SRC-100')
    preferredSource.landedUnitCostCents = null
    await preferredSource.save()

    const needsAttention = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    needsAttention.assertStatus(200)
    assert.deepEqual(needsAttention.body().lines[0].attention, [
      'material-needs-attention',
      'source-needs-attention',
    ])
    assert.equal(needsAttention.body().lines[0].completeness, 'complete')
    assert.equal(needsAttention.body().lines[0].verification.status, 'verified')
    assert.deepEqual(needsAttention.body().costProjection, {
      availability: 'unavailable',
      amountCents: null,
      excludedLineCount: 1,
    })

    preferredSource.landedUnitCostCents = 5100
    await preferredSource.save()
    const refreshed = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    await material.restore()
    preferredSource.landedUnitCostCents = 4200
    await preferredSource.save()

    refreshed.assertStatus(200)
    assert.deepEqual(refreshed.body().lines[0].attention, ['material-needs-attention'])
    assert.deepEqual(refreshed.body().lines[0].costProjection, {
      amountCents: 10200,
      exclusionReason: null,
    })
    assert.equal(refreshed.body().updatedAt, created.body().updatedAt)
  })

  test('retains Pattern Set context and derives independent live retirement attention', async ({
    assert,
    client,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const session = await authenticateAs(client, 'operator')
    const patternSet = await createPatternSet(client, session.token, 'Skirt patterns')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Pattern-aware construction',
        description: null,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 3.25,
            patternSetId: patternSet.id,
            lineNote: null,
            verified: true,
          },
        ],
      })

    created.assertStatus(201)
    created.assertBodyContains({
      lines: [
        {
          materialQuantity: 3.25,
          patternSet: {
            id: patternSet.id,
            name: 'Skirt patterns',
            status: 'active',
            quantityProposalCount: 1,
          },
          verification: { status: 'verified' },
          attention: [],
        },
      ],
    })

    const retireResponse = await client
      .delete(`/pattern-sets/${patternSet.id}`)
      .header('Authorization', `Bearer ${session.token}`)
    retireResponse.assertStatus(204)
    const material = await Material.findByOrFail('publicId', 'M-0001')
    await material.softDelete()
    const preferredSource = await MaterialSource.findByOrFail('legacySourceId', 'SRC-100')
    preferredSource.landedUnitCostCents = null
    await preferredSource.save()

    const retired = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    retired.assertStatus(200)
    assert.deepEqual(retired.body().lines[0].attention, [
      'material-needs-attention',
      'source-needs-attention',
      'pattern-needs-attention',
    ])
    assert.equal(retired.body().lines[0].materialQuantity, 3.25)
    assert.equal(retired.body().lines[0].verification.status, 'verified')
    assert.equal(retired.body().lines[0].completeness, 'complete')
    assert.equal(retired.body().attentionCount, 1)
    assert.equal(retired.body().updatedAt, created.body().updatedAt)

    const admin = await authenticateAs(client, 'admin')
    const restoreResponse = await client
      .post(`/pattern-sets/${patternSet.id}/restore`)
      .header('Authorization', `Bearer ${admin.token}`)
    restoreResponse.assertStatus(200)
    const restored = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    assert.deepEqual(restored.body().lines[0].attention, [
      'material-needs-attention',
      'source-needs-attention',
    ])
    assert.equal(restored.body().lines[0].materialQuantity, 3.25)
    assert.equal(restored.body().lines[0].verification.status, 'verified')
    assert.equal(restored.body().attentionCount, 1)
    assert.equal(restored.body().updatedAt, created.body().updatedAt)

    preferredSource.landedUnitCostCents = 4200
    await preferredSource.save()
  })

  test('rejects a newly selected Pattern Set retired before save without creating anything', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const patternSet = await createPatternSet(client, session.token, 'Stale selection')
    await client
      .delete(`/pattern-sets/${patternSet.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Preserved draft',
        description: null,
        lines: [
          {
            constructionPiece: 'Skirt',
            materialId: null,
            materialQuantity: null,
            patternSetId: patternSet.id,
            lineNote: null,
          },
        ],
      })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: {
        'lines.0.patternSetId': ['The selected Pattern Set is no longer available.'],
      },
    })
    const count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)
  })

  test('excludes missing, Retired, and deleted Preferred Sources without blocking verified lines', async ({
    assert,
    client,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const session = await authenticateAs(client, 'operator')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Defensive sourcing projection',
        description: null,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 2,
            lineNote: null,
            verified: true,
          },
        ],
      })
    created.assertStatus(201)

    const material = await Material.findByOrFail('publicId', 'M-0001')
    const preferredSource = await MaterialSource.findByOrFail('legacySourceId', 'SRC-100')
    const preferredLink = await MaterialSourceLink.query()
      .where('materialId', material.id)
      .where('materialSourceId', preferredSource.id)
      .where('isPreferred', true)
      .firstOrFail()

    preferredSource.sourceStatus = 'retired'
    await preferredSource.save()
    const retired = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    preferredSource.sourceStatus = 'active'
    await preferredSource.save()
    await preferredSource.softDelete()
    const deleted = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    await preferredSource.restore()
    await preferredLink.delete()
    const missing = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)

    await MaterialSourceLink.create({
      materialId: preferredLink.materialId,
      materialSourceId: preferredLink.materialSourceId,
      sortOrder: preferredLink.sortOrder,
      isPreferred: preferredLink.isPreferred,
      vendorShadeId: preferredLink.vendorShadeId,
    })

    for (const response of [retired, deleted, missing]) {
      response.assertStatus(200)
      assert.deepEqual(response.body().lines[0].attention, ['source-needs-attention'])
      assert.equal(response.body().lines[0].verification.status, 'verified')
      assert.deepEqual(response.body().lines[0].costProjection, {
        amountCents: null,
        exclusionReason: 'no-usable-landed-unit-cost',
      })
    }
  })

  test('records current Operator evidence only for Complete lines', async ({ assert, client }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const session = await authenticateAs(client, 'operator')
    const requestedAt = Date.now()

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Reviewed construction',
        description: null,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 3.125,
            lineNote: null,
            verified: true,
          },
          {
            constructionPiece: 'Lining',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
            verified: false,
          },
        ],
      })

    response.assertStatus(201)
    assert.equal(response.body().lines[0].completeness, 'complete')
    assert.equal(response.body().lines[0].verification.status, 'verified')
    assert.deepEqual(response.body().lines[0].verification.verifiedBy, {
      id: session.userId,
      email: 'operator@example.com',
    })
    assert.isString(response.body().lines[0].verification.verifiedAt)
    assert.isAtLeast(Date.parse(response.body().lines[0].verification.verifiedAt), requestedAt)
    assert.deepInclude(response.body().lines[1], {
      completeness: 'incomplete',
      verification: {
        status: 'unverified',
        verifiedBy: null,
        verifiedAt: null,
      },
    })

    const reloaded = await client
      .get(`/bills-of-materials/${response.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    reloaded.assertStatus(200)
    assert.deepEqual(reloaded.body(), response.body())
  })

  test('rejects verification for an Incomplete line without creating anything', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')

    const response = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Must remain atomic',
        description: null,
        lines: [
          {
            constructionPiece: 'Lining',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
            verified: true,
          },
        ],
      })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: {
        lines: ['Only a Complete BOM Line can be verified.'],
      },
    })
    const count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)
  })

  test('rejects invalid or unavailable Material line data without creating anything', async ({
    assert,
    client,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const unavailableMaterial = await Material.findByOrFail('publicId', 'M-0003')
    await unavailableMaterial.softDelete()
    const session = await authenticateAs(client, 'operator')

    for (const lines of [
      [
        {
          constructionPiece: '   ',
          materialId: null,
          materialQuantity: null,
          lineNote: null,
        },
      ],
      [
        {
          constructionPiece: 'Skirt',
          materialId: null,
          materialQuantity: 1,
          lineNote: null,
        },
      ],
      [
        {
          constructionPiece: 'Skirt',
          materialId: 'M-0001',
          materialQuantity: 0,
          lineNote: null,
        },
      ],
      [
        {
          constructionPiece: 'Skirt',
          materialId: 'M-0001',
          materialQuantity: 1.2345,
          lineNote: null,
        },
      ],
      [
        {
          constructionPiece: 'Skirt',
          materialId: 'M-0003',
          materialQuantity: 1,
          lineNote: null,
        },
      ],
    ]) {
      const response = await client
        .post('/bills-of-materials')
        .header('Authorization', `Bearer ${session.token}`)
        .json({ kind: 'template', name: 'Must remain atomic', description: null, lines })

      response.assertStatus(422)
    }

    const count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)
  })

  test('rejects invalid names and unsupported Implementation creation without a record', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')

    for (const payload of [
      { kind: 'template', name: '   ', description: null },
      { kind: 'implementation', name: 'Not in this slice', description: null },
    ]) {
      const response = await client
        .post('/bills-of-materials')
        .header('Authorization', `Bearer ${session.token}`)
        .json(payload)
      response.assertStatus(422)
    }

    const count = await BillOfMaterial.query().count('* as total').firstOrFail()
    assert.equal(Number(count.$extras.total), 0)
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

async function authenticateAs(client: any, role: 'admin' | 'operator') {
  const user = await User.updateOrCreate(
    { email: `${role}@example.com` },
    { email: `${role}@example.com`, password: 'Password123', role, active: true }
  )
  const response = await client.post('/auth/login').json({
    email: `${role}@example.com`,
    password: 'Password123',
  })
  response.assertStatus(200)
  return { token: response.body().token as string, userId: user.id }
}

async function createProduct(
  client: any,
  token: string,
  name: string,
  overrides?: { lifecycleStatus?: string; productStatus?: string }
) {
  const response = await client
    .post('/products')
    .header('Authorization', `Bearer ${token}`)
    .json({ name, ...overrides })
  response.assertStatus(201)
  return response.body().id as string
}

async function createTemplate(
  client: any,
  token: string,
  name: string,
  options?: { productId?: string }
) {
  const response = await client
    .post('/bills-of-materials')
    .header('Authorization', `Bearer ${token}`)
    .json({ kind: 'template', name, description: null, ...options })
  response.assertStatus(201)
  return response.body() as { id: string }
}

async function createProductVariant(client: any, token: string, productId: string, name: string) {
  const response = await client
    .post(`/products/${productId}/variants`)
    .header('Authorization', `Bearer ${token}`)
    .json({ name })
  response.assertStatus(201)
  return response.body().id as string
}

async function updateProduct(
  client: any,
  token: string,
  productId: string,
  name: string,
  productStatus: 'active' | 'inactive'
) {
  const response = await client
    .put(`/products/${productId}`)
    .header('Authorization', `Bearer ${token}`)
    .json({
      name,
      shortDescription: null,
      lifecycleStatus: 'concept',
      productStatus,
      productCategory: null,
      collectionId: null,
    })
  response.assertStatus(200)
}

async function updateProductVariant(
  client: any,
  token: string,
  productId: string,
  variantId: string,
  name: string,
  status: 'active' | 'inactive'
) {
  const response = await client
    .put(`/products/${productId}/variants/${variantId}`)
    .header('Authorization', `Bearer ${token}`)
    .json({ name, status })
  response.assertStatus(200)
}

async function createImplementation(
  client: any,
  token: string,
  productVariantId: string,
  name: string
) {
  const response = await client
    .post('/bills-of-materials')
    .header('Authorization', `Bearer ${token}`)
    .json({ kind: 'implementation', name, description: null, productVariantId, lines: [] })
  response.assertStatus(201)
  return response.body() as { id: string; product: { id: string } }
}

function assertCandidate(
  assert: any,
  candidate: any,
  selectable: boolean,
  outcome: string,
  existingImplementationId: string | null
) {
  assert.equal(candidate.selectable, selectable)
  assert.equal(candidate.outcome, outcome)
  if (existingImplementationId === null) assert.isNull(candidate.existingImplementation)
  else assert.equal(candidate.existingImplementation.id, existingImplementationId)
}

async function createPatternSet(client: any, token: string, name: string) {
  const response = await client
    .post('/pattern-sets')
    .header('Authorization', `Bearer ${token}`)
    .json({
      name,
      description: 'Reusable pattern evidence',
      quantityProposals: [
        { assumedWidthCm: 140, quantityMeters: 3.25, evidenceNote: 'Marker study' },
      ],
    })
  response.assertStatus(201)
  return response.body() as { id: string }
}
