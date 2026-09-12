import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import MaterialSourceLink from '#models/material_source_link'
import MaterialSource from '#models/material_source'
import Material from '#models/material'
import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import {
  authenticateAs,
  createPatternSet,
} from '#tests/functional/bills_of_materials/support/bom_test_support'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Bills of Materials', (group) => {
  group.each.setup(async () => {
    await BillOfMaterial.query().delete()
    await testUtils.db('postgres_test').truncate()
  })

  group.each.teardown(async () => {
    await BillOfMaterial.queryWithDeleted().delete()
    await testUtils.db('postgres_test').truncate()
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
})
