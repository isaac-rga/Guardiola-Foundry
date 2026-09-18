import BillOfMaterial from '#modules/bills_of_materials/models/bill_of_material'
import BillOfMaterialLine from '#modules/bills_of_materials/models/bill_of_material_line'
import Material from '#models/material'
import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import {
  authenticateAs,
  createProduct,
  createTemplate,
  createProductVariant,
  createImplementation,
  createPatternSet,
} from '#tests/functional/bills_of_materials/support/bom_test_support'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Bills of Materials', (group) => {
  group.each.setup(() => testUtils.db('postgres_test').truncate())

  test('applies an associated Template as an independent ordered Implementation snapshot', async ({
    assert,
    client,
  }) => {
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const session = await authenticateAs(client, 'admin')
    const productId = await createProduct(client, session.token, 'Jackie')
    const variantId = await createProductVariant(client, session.token, productId, 'Showroom')
    const patternSet = await createPatternSet(client, session.token, 'Jackie patterns')
    const source = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Jackie base construction',
        description: 'Current reusable construction',
        productId,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 3.125,
            patternSetId: patternSet.id,
            lineNote: 'Cut on grain',
            verified: true,
          },
          {
            constructionPiece: 'Lining',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: null,
            verified: false,
          },
        ],
      })
    source.assertStatus(201)
    const material = await Material.findByOrFail('publicId', 'M-0001')
    await material.softDelete()
    const retiredPatternSet = await client
      .delete(`/pattern-sets/${patternSet.id}`)
      .header('Authorization', `Bearer ${session.token}`)
    retiredPatternSet.assertStatus(204)
    const sourceSnapshot = await client
      .get(`/bills-of-materials/${source.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    sourceSnapshot.assertStatus(200)

    const applied = await client
      .post(`/bills-of-materials/${source.body().id}/implementations`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Jackie - Blush', productVariantId: variantId })
    const unchangedSource = await client
      .get(`/bills-of-materials/${source.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    await material.restore()
    const restoredPatternSet = await client
      .post(`/pattern-sets/${patternSet.id}/restore`)
      .header('Authorization', `Bearer ${session.token}`)
    restoredPatternSet.assertStatus(200)
    unchangedSource.assertStatus(200)
    assert.deepEqual(unchangedSource.body(), {
      ...sourceSnapshot.body(),
      descendantCount: 1,
    })

    applied.assertStatus(201)
    applied.assertBodyContains({
      kind: 'implementation',
      name: 'Jackie - Blush',
      description: 'Current reusable construction',
      product: { id: productId },
      productVariant: { id: variantId },
      origin: { id: source.body().id, name: 'Jackie base construction' },
    })
    assert.deepEqual(
      applied.body().lines.map((line: any) => ({
        constructionPiece: line.constructionPiece,
        materialId: line.material?.id ?? null,
        materialQuantity: line.materialQuantity,
        patternSetId: line.patternSet?.id ?? null,
        lineNote: line.lineNote,
        order: line.order,
        verification: line.verification.status,
        attention: line.attention,
      })),
      [
        {
          constructionPiece: 'Outer skirt',
          materialId: 'M-0001',
          materialQuantity: 3.125,
          patternSetId: patternSet.id,
          lineNote: 'Cut on grain',
          order: 0,
          verification: 'unverified',
          attention: ['material-needs-attention', 'pattern-needs-attention'],
        },
        {
          constructionPiece: 'Lining',
          materialId: null,
          materialQuantity: null,
          patternSetId: null,
          lineNote: null,
          order: 1,
          verification: 'unverified',
          attention: [],
        },
      ]
    )
    assert.notDeepEqual(
      applied.body().lines.map((line: any) => line.id),
      source.body().lines.map((line: any) => line.id)
    )
  })

  test('keeps the applied snapshot independent when source and destination are edited later', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const variantId = await createProductVariant(client, session.token, productId, 'Showroom')
    const source = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Jackie base',
        description: 'Shared starting point',
        productId,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: 'Original note',
            verified: false,
          },
        ],
      })
    source.assertStatus(201)
    const applied = await client
      .post(`/bills-of-materials/${source.body().id}/implementations`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Jackie - Blush', productVariantId: variantId })
    applied.assertStatus(201)

    const changedSource = await client
      .put(`/bills-of-materials/${source.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        updatedAt: source.body().updatedAt,
        name: source.body().name,
        description: 'Source changed later',
        lines: [
          {
            id: source.body().lines[0].id,
            constructionPiece: 'Source-only change',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: 'Source note changed',
            verified: false,
          },
        ],
      })
    changedSource.assertStatus(200)
    const destinationAfterSourceChange = await client
      .get(`/bills-of-materials/${applied.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    destinationAfterSourceChange.assertStatus(200)
    assert.equal(destinationAfterSourceChange.body().description, 'Shared starting point')
    assert.equal(destinationAfterSourceChange.body().lines[0].constructionPiece, 'Outer skirt')
    assert.equal(destinationAfterSourceChange.body().lines[0].lineNote, 'Original note')

    const changedDestination = await client
      .put(`/bills-of-materials/${applied.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        updatedAt: destinationAfterSourceChange.body().updatedAt,
        name: applied.body().name,
        description: 'Destination changed later',
        lines: [
          {
            id: destinationAfterSourceChange.body().lines[0].id,
            constructionPiece: 'Destination-only change',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: 'Destination note changed',
            verified: false,
          },
        ],
      })
    changedDestination.assertStatus(200)
    const sourceAfterDestinationChange = await client
      .get(`/bills-of-materials/${source.body().id}`)
      .header('Authorization', `Bearer ${session.token}`)
    sourceAfterDestinationChange.assertStatus(200)
    assert.equal(sourceAfterDestinationChange.body().description, 'Source changed later')
    assert.equal(
      sourceAfterDestinationChange.body().lines[0].constructionPiece,
      'Source-only change'
    )
    assert.equal(sourceAfterDestinationChange.body().lines[0].lineNote, 'Source note changed')
  })

  test('rolls back the destination and copied lines when a line copy fails', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const variantId = await createProductVariant(client, session.token, productId, 'Showroom')
    const source = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Jackie base',
        description: null,
        productId,
        lines: [
          {
            constructionPiece: 'Copy first',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: null,
            verified: false,
          },
          {
            constructionPiece: 'Rollback sentinel',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: null,
            verified: false,
          },
        ],
      })
    source.assertStatus(201)

    await db.rawQuery(`
      CREATE FUNCTION issue_12_reject_copy() RETURNS trigger AS $$
      BEGIN
        IF NEW.construction_piece = 'Rollback sentinel' THEN
          RAISE EXCEPTION 'forced copy failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      CREATE TRIGGER issue_12_reject_copy
      BEFORE INSERT ON bill_of_materials_lines
      FOR EACH ROW EXECUTE FUNCTION issue_12_reject_copy();
    `)
    try {
      const response = await client
        .post(`/bills-of-materials/${source.body().id}/implementations`)
        .header('Authorization', `Bearer ${session.token}`)
        .json({ name: 'Must roll back', productVariantId: variantId })
      response.assertStatus(500)
    } finally {
      await db.rawQuery('DROP TRIGGER issue_12_reject_copy ON bill_of_materials_lines')
      await db.rawQuery('DROP FUNCTION issue_12_reject_copy()')
    }

    const implementations = await BillOfMaterial.query().where('kind', 'implementation')
    assert.lengthOf(implementations, 0)
    const sourceModel = await BillOfMaterial.findByOrFail('publicId', source.body().id)
    const sourceLines = await BillOfMaterialLine.query().where('billOfMaterialsId', sourceModel.id)
    assert.lengthOf(sourceLines, 2)
  })

  test('reports an existing Product typification without creating a destination', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const occupiedVariantId = await createProductVariant(
      client,
      session.token,
      productId,
      'Editorial'
    )
    const destinationVariantId = await createProductVariant(
      client,
      session.token,
      productId,
      'Showroom'
    )
    const source = await createTemplate(client, session.token, 'Jackie base', { productId })
    const occupying = await createImplementation(
      client,
      session.token,
      occupiedVariantId,
      'Jackie - Blush'
    )

    const response = await client
      .post(`/bills-of-materials/${source.id}/implementations`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'jackie - blush', productVariantId: destinationVariantId })

    response.assertStatus(409)
    response.assertBodyContains({
      errors: {
        name: ['Another BOM Implementation in this Product already uses this typification.'],
      },
      conflictingImplementation: { id: occupying.id, name: 'Jackie - Blush' },
    })
    const destination = await BillOfMaterial.query()
      .whereHas('productVariant', (query) => query.where('publicId', destinationVariantId))
      .first()
    assert.isNull(destination)
  })

  test('rejects direct Template application to a Variant belonging to another Product', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const jackieId = await createProduct(client, session.token, 'Jackie')
    const palomaId = await createProduct(client, session.token, 'Paloma')
    const palomaVariantId = await createProductVariant(client, session.token, palomaId, 'Showroom')
    const source = await createTemplate(client, session.token, 'Jackie base', {
      productId: jackieId,
    })

    const response = await client
      .post(`/bills-of-materials/${source.id}/implementations`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Must remain unsaved', productVariantId: palomaVariantId })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: {
        productVariantId: ['Select a Product Variant belonging to the Template Product.'],
      },
    })
    const count = await BillOfMaterial.query().where('kind', 'implementation').count('* as total')
    assert.equal(Number(count[0].$extras.total), 0)
  })

  test('restricts Template candidates to its Product and blocks applying an unassociated Template', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Jackie')
    const matchingVariantId = await createProductVariant(
      client,
      session.token,
      productId,
      'Showroom'
    )
    const otherProductId = await createProduct(client, session.token, 'Paloma')
    await createProductVariant(client, session.token, otherProductId, 'Showroom')
    const associated = await createTemplate(client, session.token, 'Jackie base', { productId })
    const unassociated = await createTemplate(client, session.token, 'Loose base')

    const candidates = await client
      .get(
        `/bills-of-materials/product-variant-candidates?search=showroom&templateId=${associated.id}`
      )
      .header('Authorization', `Bearer ${session.token}`)
    candidates.assertStatus(200)
    assert.deepEqual(
      candidates.body().items.map((candidate: any) => candidate.id),
      [matchingVariantId]
    )

    const unavailableCandidates = await client
      .get(
        `/bills-of-materials/product-variant-candidates?search=showroom&templateId=${unassociated.id}`
      )
      .header('Authorization', `Bearer ${session.token}`)
    unavailableCandidates.assertStatus(422)

    const apply = await client
      .post(`/bills-of-materials/${unassociated.id}/implementations`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Must stay unsaved', productVariantId: matchingVariantId })
    apply.assertStatus(422)
    apply.assertBodyContains({
      errors: {
        templateId: [
          'Associate this BOM Template with a Product before creating an Implementation.',
        ],
      },
    })
    const occupying = await createImplementation(
      client,
      session.token,
      matchingVariantId,
      'Existing construction'
    )
    const occupiedApply = await client
      .post(`/bills-of-materials/${associated.id}/implementations`)
      .header('Authorization', `Bearer ${session.token}`)
      .json({ name: 'Must not overwrite', productVariantId: matchingVariantId })
    occupiedApply.assertStatus(409)
    occupiedApply.assertBodyContains({
      conflictingImplementation: { id: occupying.id, name: 'Existing construction' },
    })
    const implementations = await BillOfMaterial.query()
      .where('kind', 'implementation')
      .count('* as total')
      .firstOrFail()
    assert.equal(Number(implementations.$extras.total), 1)
  })

  test('atomically allows only one concurrent application to a Product Variant', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const productId = await createProduct(client, session.token, 'Contended Jackie')
    const variantId = await createProductVariant(client, session.token, productId, 'Showroom')
    const source = await client
      .post('/bills-of-materials')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        kind: 'template',
        name: 'Jackie base',
        description: 'Reusable construction',
        productId,
        lines: [
          {
            constructionPiece: 'Outer skirt',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: 'Cut on grain',
            verified: false,
          },
          {
            constructionPiece: 'Lining',
            materialId: null,
            materialQuantity: null,
            patternSetId: null,
            lineNote: null,
            verified: false,
          },
        ],
      })
    source.assertStatus(201)

    const responses = await Promise.all(
      ['First application', 'Second application'].map((name) =>
        client
          .post(`/bills-of-materials/${source.body().id}/implementations`)
          .header('Authorization', `Bearer ${session.token}`)
          .json({ name, productVariantId: variantId })
      )
    )

    assert.deepEqual(responses.map((response) => response.status()).sort(), [201, 409])
    const winner = responses.find((response) => response.status() === 201)!
    const conflict = responses.find((response) => response.status() === 409)!
    conflict.assertBodyContains({
      conflictingImplementation: { id: winner.body().id, name: winner.body().name },
    })
    assert.lengthOf(winner.body().lines, 2)
    assert.deepEqual(
      winner.body().lines.map((line: any) => line.constructionPiece),
      ['Outer skirt', 'Lining']
    )

    const implementations = await BillOfMaterial.query().where('kind', 'implementation')
    assert.lengthOf(implementations, 1)
    assert.equal(implementations[0].publicId, winner.body().id)
    const allLines = await BillOfMaterialLine.all()
    assert.lengthOf(allLines, 4)
    assert.lengthOf(
      allLines.filter((line) => line.billOfMaterialsId === implementations[0].id),
      2
    )
  })
})
