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
  createPatternSet,
} from '#tests/functional/bills_of_materials/support/bom_test_support'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('Bills of Materials', (group) => {
  group.each.setup(() => testUtils.db('postgres_test').truncate())

  test('atomically updates a whole Template with additions, removals, order, and verification', async ({
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
        name: 'Original construction',
        description: null,
        lines: [
          {
            constructionPiece: 'Remove me',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
          },
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 3.125,
            lineNote: 'Original note',
            verified: true,
          },
        ],
      })
    created.assertStatus(201)
    const retainedLineId = created.body().lines[1].id

    const updated = await client
      .put(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        updatedAt: created.body().updatedAt,
        name: 'Updated construction',
        description: 'Whole-draft save',
        lines: [
          {
            id: null,
            constructionPiece: 'Corset lining',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: 'New first line',
            verified: false,
          },
          {
            id: retainedLineId,
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 3.25,
            patternSetId: null,
            lineNote: 'Updated note',
            verified: true,
          },
        ],
      })

    updated.assertStatus(200)
    updated.assertBodyContains({
      id: created.body().id,
      kind: 'template',
      name: 'Updated construction',
      description: 'Whole-draft save',
      createdBy: created.body().createdBy,
      createdAt: created.body().createdAt,
    })
    assert.isAbove(Date.parse(updated.body().updatedAt), Date.parse(created.body().updatedAt))
    assert.deepEqual(
      updated.body().lines.map((line: any) => ({
        id: line.id,
        constructionPiece: line.constructionPiece,
        materialQuantity: line.materialQuantity,
        lineNote: line.lineNote,
        order: line.order,
        verification: line.verification.status,
      })),
      [
        {
          id: updated.body().lines[0].id,
          constructionPiece: 'Corset lining',
          materialQuantity: null,
          lineNote: 'New first line',
          order: 0,
          verification: 'unverified',
        },
        {
          id: retainedLineId,
          constructionPiece: 'Outer skirt',
          materialQuantity: 3.25,
          lineNote: 'Updated note',
          order: 1,
          verification: 'verified',
        },
      ]
    )
    assert.match(updated.body().lines[0].id, /^BML-[A-Z2-9]{6}$/)
    assert.notEqual(updated.body().lines[0].id, created.body().lines[0].id)

    const reloaded = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    reloaded.assertStatus(200)
    assert.deepEqual(reloaded.body(), updated.body())
  })

  test('updates an Implementation without allowing its permanent Variant relationship to change', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const variantId = await createProductVariant(client, session.token, productId, 'Showroom')
    const otherVariantId = await createProductVariant(client, session.token, productId, 'Editorial')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'implementation',
        name: 'Jackie - Showroom',
        description: null,
        productVariantId: variantId,
        lines: [],
      })
    created.assertStatus(201)

    const immutableAttempt = await client
      .put(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        updatedAt: created.body().updatedAt,
        name: 'Jackie - Editorial',
        description: null,
        productVariantId: otherVariantId,
        lines: [],
      })
    immutableAttempt.assertStatus(422)

    const updated = await client
      .put(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        updatedAt: created.body().updatedAt,
        name: 'Jackie - Refined showroom',
        description: 'Adjusted construction',
        lines: [],
      })
    updated.assertStatus(200)
    updated.assertBodyContains({
      id: created.body().id,
      kind: 'implementation',
      name: 'Jackie - Refined showroom',
      product: { id: productId },
      productVariant: { id: variantId },
      origin: null,
      createdBy: created.body().createdBy,
      createdAt: created.body().createdAt,
    })
    assert.isAbove(Date.parse(updated.body().updatedAt), Date.parse(created.body().updatedAt))
  })

  test('allows only the first concurrent whole-BOM Save and leaves no losing line changes', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Concurrent draft',
        description: null,
        lines: [
          {
            constructionPiece: 'Original line',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
          },
        ],
      })
    created.assertStatus(201)

    const responses = await Promise.all(
      ['First save', 'Second save'].map((name) =>
        client
          .put(`/bills-of-materials/${created.body().id}`)
          .header('Authorization', `Bearer ${session.token}`)
          .json({
            updatedAt: created.body().updatedAt,
            name,
            description: null,
            lines: [
              {
                id: created.body().lines[0].id,
                constructionPiece: `${name} line`,
                materialId: null,
                materialQuantity: null,
                patternSetId: null,
                lineNote: null,
                verified: false,
              },
            ],
          })
      )
    )

    assert.deepEqual(responses.map((response) => response.status()).sort(), [200, 409])
    const winner = responses.find((response) => response.status() === 200)!
    const conflict = responses.find((response) => response.status() === 409)!
    conflict.assertBodyContains({
      message: 'This Bill of Materials changed after you opened it. Your draft was not saved.',
      currentUpdatedAt: winner.body().updatedAt,
    })

    const reloaded = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    reloaded.assertStatus(200)
    assert.deepEqual(reloaded.body(), winner.body())
  })

  test('rolls back every metadata, line, and order change when update validation fails', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Stable saved version',
        description: null,
        lines: [
          {
            constructionPiece: 'Original line',
            materialId: null,
            materialQuantity: null,
            lineNote: null,
          },
        ],
      })
    created.assertStatus(201)

    const invalid = await client
      .put(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        updatedAt: created.body().updatedAt,
        name: 'Must roll back',
        description: 'Must roll back',
        lines: [
          {
            id: null,
            constructionPiece: 'Invalid new line',
            materialId: 'M-9999',
            materialQuantity: 1,
            patternSetId: null,
            lineNote: null,
            verified: false,
          },
        ],
      })
    invalid.assertStatus(422)
    invalid.assertBodyContains({
      errors: {
        'lines.0.materialId': ['The selected Material is no longer available.'],
      },
    })

    const reloaded = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    reloaded.assertStatus(200)
    assert.deepEqual(reloaded.body(), created.body())
  })

  test('keeps retained unavailable Material and Pattern Set references saveable unchanged', async ({
    client,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const session = await authenticateAs(client, 'operator')
    const patternSet = await createPatternSet(client, session.token, 'Retained patterns')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Retained references',
        description: null,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 3.125,
            patternSetId: patternSet.id,
            lineNote: null,
            verified: true,
          },
        ],
      })
    created.assertStatus(201)
    const material = await Material.findByOrFail('publicId', 'M-0001')
    await material.softDelete()
    await client
      .delete(`/pattern-sets/${patternSet.id}`)
      .header('Authorization', `Bearer ${session.token}`)

    const updated = await client
      .put(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        updatedAt: created.body().updatedAt,
        name: created.body().name,
        description: 'References deliberately retained',
        lines: [
          {
            id: created.body().lines[0].id,
            constructionPiece: created.body().lines[0].constructionPiece,
            materialId: 'M-0001',
            materialQuantity: created.body().lines[0].materialQuantity,
            patternSetId: patternSet.id,
            lineNote: created.body().lines[0].lineNote,
            verified: true,
          },
        ],
      })

    updated.assertStatus(200)
    updated.assertBodyContains({
      description: 'References deliberately retained',
      lines: [
        {
          material: { id: 'M-0001' },
          patternSet: { id: patternSet.id, status: 'retired' },
          attention: ['material-needs-attention', 'pattern-needs-attention'],
          verification: { status: 'verified' },
        },
      ],
    })
  })

  test('rejects a Save after the open Bill of Materials was soft-deleted', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')
    const created = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ kind: 'template', name: 'Delete conflict', description: null, lines: [] })
    created.assertStatus(201)
    const persisted = await BillOfMaterial.findByOrFail('publicId', created.body().id)
    persisted.deletedAt = DateTime.utc()
    await persisted.save()

    const response = await client
      .put(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        updatedAt: created.body().updatedAt,
        name: 'Must not return',
        description: null,
        lines: [],
      })

    response.assertStatus(409)
    response.assertBodyContains({
      message: 'This Bill of Materials was deleted while it was open. Your draft was not saved.',
      deleted: true,
    })
    const hidden = await client
      .get(`/bills-of-materials/${created.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    hidden.assertStatus(404)
  })
})
