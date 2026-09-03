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
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Material Source relationships', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await clearMaterialsData()
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
  })

  test('rejects unauthenticated link, unlink, and Preferred replacement requests', async ({
    client,
  }) => {
    const linkResponse = await client.post('/materials/M-0001/sources').json({
      sourceId: 'S-0003',
      vendorShadeId: null,
    })
    const unlinkResponse = await client.delete('/materials/M-0001/sources/S-0002')
    const replaceResponse = await client
      .put('/materials/M-0001/preferred-source')
      .json({ sourceId: 'S-0002' })

    linkResponse.assertStatus(401)
    linkResponse.assertBodyContains({ message: 'Unauthorized' })
    unlinkResponse.assertStatus(401)
    unlinkResponse.assertBodyContains({ message: 'Unauthorized' })
    replaceResponse.assertStatus(401)
    replaceResponse.assertBodyContains({ message: 'Unauthorized' })
  })

  test('lets Admins and Operators link Active Sources with or without an owned Vendor Shade', async ({
    assert,
    client,
  }) => {
    const adminSession = await authenticateAs(client, 'admin')
    const operatorSession = await authenticateAs(client, 'operator')
    const preferredSource = await MaterialSource.findByOrFail('publicId', 'S-0001')
    await preferredSource.load('vendorShades')

    const withShadeResponse = await client
      .post('/materials/M-0002/sources')
      .header('Authorization', `Bearer ${adminSession.token}`)
      .json({
        sourceId: 'S-0001',
        vendorShadeId: preferredSource.vendorShades[0].id,
      })
    const withoutShadeResponse = await client
      .post('/materials/M-0001/sources')
      .header('Authorization', `Bearer ${operatorSession.token}`)
      .json({
        sourceId: 'S-0003',
        vendorShadeId: null,
      })

    withShadeResponse.assertStatus(201)
    withoutShadeResponse.assertStatus(201)
    assert.includeDeepMembers(withShadeResponse.body().material.sourceRelationships, [
      {
        id: 'S-0001',
        name: 'Italian Silk Crepe',
        vendor: 'Casa Tessile',
        relationship: 'alternate',
        relationshipStatus: 'active',
        preferredEligibility: 'eligible',
        vendorShade: {
          id: preferredSource.vendorShades[0].id,
          nameOrCode: 'Ivory 100',
        },
      },
    ])
    assert.includeDeepMembers(withoutShadeResponse.body().material.sourceRelationships, [
      {
        id: 'S-0003',
        name: 'Champagne Structure Satin',
        vendor: 'Atelier Supply',
        relationship: 'alternate',
        relationshipStatus: 'active',
        preferredEligibility: 'eligible',
        vendorShade: null,
      },
    ])
  })

  test('rejects Retired Sources and Vendor Shades owned by another Source', async ({ client }) => {
    const session = await authenticateAs(client, 'operator')
    const retiredSource = await MaterialSource.findByOrFail('publicId', 'S-0003')
    retiredSource.sourceStatus = 'retired'
    await retiredSource.save()
    const otherSource = await MaterialSource.findByOrFail('publicId', 'S-0001')
    await otherSource.load('vendorShades')

    const retiredResponse = await client
      .post('/materials/M-0001/sources')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ sourceId: 'S-0003', vendorShadeId: null })
    const foreignShadeResponse = await client
      .post('/materials/M-0001/sources')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        sourceId: 'S-0004',
        vendorShadeId: otherSource.vendorShades[0].id,
      })

    retiredResponse.assertStatus(409)
    retiredResponse.assertBody({ message: 'Only Active Sources can be linked to a Material.' })
    foreignShadeResponse.assertStatus(422)
    foreignShadeResponse.assertBody({
      message: 'Select a Vendor Shade that belongs to the linked Source.',
    })
  })

  test('rejects duplicate relationships without persisting another link', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const material = await Material.findByOrFail('publicId', 'M-0001')
    const source = await MaterialSource.findByOrFail('publicId', 'S-0002')

    const response = await client
      .post('/materials/M-0001/sources')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ sourceId: 'S-0002', vendorShadeId: null })

    response.assertStatus(409)
    response.assertBody({ message: 'This Source is already linked to the Material.' })
    assert.equal(
      await MaterialSourceLink.query()
        .where('materialId', material.id)
        .where('materialSourceId', source.id)
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      1
    )
  })

  test('moves an Unlinked Source into Material and Source detail context', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const unlinkedSource = await MaterialSource.findByOrFail('publicId', 'S-0004')
    await MaterialSourceLink.query().where('materialSourceId', unlinkedSource.id).delete()

    const beforeResponse = await client
      .get('/sources?linkState=unlinked')
      .header('Authorization', `Bearer ${session.token}`)
    const linkResponse = await client
      .post('/materials/M-0001/sources')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ sourceId: 'S-0004', vendorShadeId: null })
    const afterResponse = await client
      .get('/sources?linkState=unlinked')
      .header('Authorization', `Bearer ${session.token}`)
    const detailResponse = await client
      .get('/sources/S-0004')
      .header('Authorization', `Bearer ${session.token}`)

    beforeResponse.assertStatus(200)
    linkResponse.assertStatus(201)
    afterResponse.assertStatus(200)
    detailResponse.assertStatus(200)
    assert.include(
      beforeResponse.body().sources.map((source: { id: string }) => source.id),
      'S-0004'
    )
    assert.notInclude(
      afterResponse.body().sources.map((source: { id: string }) => source.id),
      'S-0004'
    )
    assert.includeDeepMembers(detailResponse.body().source.linkedMaterials, [
      {
        id: 'M-0001',
        name: 'Ivory Silk Crepe',
        materialColor: 'ivory',
        materialUse: 'base-fabric',
        relationship: 'alternate',
        relationshipStatus: 'active',
        vendorShade: null,
      },
    ])
  })

  test('unlinks an alternate Source without deleting the Source', async ({ assert, client }) => {
    const session = await authenticateAs(client, 'operator')

    const response = await client
      .delete('/materials/M-0001/sources/S-0002')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.notInclude(
      response.body().material.sourceRelationships.map((source: { id: string }) => source.id),
      'S-0002'
    )
    assert.isNotNull(await MaterialSource.findBy('publicId', 'S-0002'))
  })

  test('protects the Preferred Source from direct unlinking', async ({ assert, client }) => {
    const session = await authenticateAs(client, 'admin')
    const material = await Material.findByOrFail('publicId', 'M-0001')
    const preferredSource = await MaterialSource.findByOrFail('publicId', 'S-0001')

    const response = await client
      .delete('/materials/M-0001/sources/S-0001')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(409)
    response.assertBody({ message: 'Replace the Preferred Source before unlinking it.' })
    assert.isNotNull(
      await MaterialSourceLink.query()
        .where('materialId', material.id)
        .where('materialSourceId', preferredSource.id)
        .where('isPreferred', true)
        .first()
    )
  })

  test('lets Admins and Operators replace the Preferred Source and refreshes derived Material values', async ({
    assert,
    client,
  }) => {
    const adminSession = await authenticateAs(client, 'admin')
    const operatorSession = await authenticateAs(client, 'operator')
    const material = await Material.findByOrFail('publicId', 'M-0001')
    const retiredAlternate = await MaterialSource.findByOrFail('publicId', 'S-0004')

    await MaterialSourceLink.create({
      materialId: material.id,
      materialSourceId: retiredAlternate.id,
      sortOrder: 3,
      isPreferred: false,
      vendorShadeId: null,
    })
    retiredAlternate.sourceStatus = 'retired'
    await retiredAlternate.save()

    const adminResponse = await client
      .put('/materials/M-0001/preferred-source')
      .header('Authorization', `Bearer ${adminSession.token}`)
      .json({ sourceId: 'S-0002' })

    adminResponse.assertStatus(200)
    assert.equal(adminResponse.body().material.id, 'M-0001')
    assert.deepInclude(adminResponse.body().material.sourceRelationships[0], {
      id: 'S-0002',
      relationship: 'preferred',
      relationshipStatus: 'active',
      preferredEligibility: 'already-preferred',
    })
    assert.deepInclude(adminResponse.body().material.sourceRelationships[1], {
      id: 'S-0001',
      relationship: 'alternate',
      relationshipStatus: 'active',
      preferredEligibility: 'eligible',
    })

    const listResponse = await client
      .get('/materials')
      .header('Authorization', `Bearer ${adminSession.token}`)
    const materialSummary = listResponse
      .body()
      .materials.find((summary: { id: string }) => summary.id === 'M-0001')

    listResponse.assertStatus(200)
    assert.equal(materialSummary.preferredSource.id, 'S-0002')
    assert.equal(materialSummary.derivedUnitCostCents, 3900)
    assert.equal(materialSummary.alternateSourceCount, 1)
    assert.equal(
      await MaterialSourceLink.query()
        .where('materialId', material.id)
        .where('isPreferred', true)
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      1
    )

    const operatorResponse = await client
      .put('/materials/M-0001/preferred-source')
      .header('Authorization', `Bearer ${operatorSession.token}`)
      .json({ sourceId: 'S-0001' })

    operatorResponse.assertStatus(200)
    assert.equal(operatorResponse.body().material.sourceRelationships[0].id, 'S-0001')
  })

  test('rejects ineligible Preferred Sources without changing the current Preferred relationship', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const material = await Material.findByOrFail('publicId', 'M-0001')
    const currentPreferred = await MaterialSource.findByOrFail('publicId', 'S-0001')
    const alternate = await MaterialSource.findByOrFail('publicId', 'S-0002')

    alternate.landedUnitCostCents = null
    await alternate.save()

    const missingCostResponse = await client
      .put('/materials/M-0001/preferred-source')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ sourceId: 'S-0002' })

    missingCostResponse.assertStatus(409)
    missingCostResponse.assertBody({
      message: 'Add Landed Unit Cost before selecting this Source as Preferred.',
    })

    alternate.landedUnitCostCents = 3900
    alternate.sourceStatus = 'retired'
    await alternate.save()

    const retiredResponse = await client
      .put('/materials/M-0001/preferred-source')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ sourceId: 'S-0002' })
    const unlinkedResponse = await client
      .put('/materials/M-0001/preferred-source')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ sourceId: 'S-0004' })

    retiredResponse.assertStatus(409)
    retiredResponse.assertBody({ message: 'Only an Active Source can become Preferred.' })
    unlinkedResponse.assertStatus(404)
    unlinkedResponse.assertBody({
      message: 'Only a linked alternate Source can become Preferred.',
    })
    assert.isNotNull(
      await MaterialSourceLink.query()
        .where('materialId', material.id)
        .where('materialSourceId', currentPreferred.id)
        .where('isPreferred', true)
        .first()
    )
  })

  test('rejects Preferred replacement for a historical Material', async ({ client }) => {
    const session = await authenticateAs(client, 'admin')
    const material = await Material.findByOrFail('publicId', 'M-0001')
    await material.softDelete()

    const response = await client
      .put('/materials/M-0001/preferred-source')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ sourceId: 'S-0002' })

    response.assertStatus(404)
    response.assertBody({ message: 'Material not found.' })
  })

  test('rolls back a failed Preferred replacement and returns business-language guidance', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const material = await Material.findByOrFail('publicId', 'M-0001')
    const currentPreferred = await MaterialSource.findByOrFail('publicId', 'S-0001')

    await db.rawQuery(`
      CREATE FUNCTION reject_test_preferred_promotion()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.is_preferred = true AND OLD.is_preferred = false THEN
          RAISE EXCEPTION 'Injected Preferred replacement failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER reject_test_preferred_promotion
        BEFORE UPDATE ON material_source_links
        FOR EACH ROW
        EXECUTE FUNCTION reject_test_preferred_promotion();
    `)

    try {
      const response = await client
        .put('/materials/M-0001/preferred-source')
        .header('Authorization', `Bearer ${session.token}`)
        .json({ sourceId: 'S-0002' })

      response.assertStatus(409)
      response.assertBody({
        message: 'Preferred Source could not be replaced. Please try again.',
      })
      assert.isNotNull(
        await MaterialSourceLink.query()
          .where('materialId', material.id)
          .where('materialSourceId', currentPreferred.id)
          .where('isPreferred', true)
          .first()
      )
    } finally {
      await db.rawQuery(`
        DROP TRIGGER reject_test_preferred_promotion ON material_source_links;
        DROP FUNCTION reject_test_preferred_promotion();
      `)
    }
  })
})

async function authenticateAs(client: any, role: 'admin' | 'operator') {
  await User.firstOrCreate(
    { email: `${role}@example.com` },
    { password: 'Password123', role, active: true }
  )

  const response = await client.post('/auth/login').json({
    email: `${role}@example.com`,
    password: 'Password123',
  })

  response.assertStatus(200)

  return response.body() as { token: string }
}

async function clearMaterialsData() {
  await db.from('material_source_links').delete()
  await db.from('materials').delete()
  await db.from('material_sources').delete()
  await db.rawQuery('ALTER SEQUENCE material_source_public_id_seq RESTART WITH 1')
}
