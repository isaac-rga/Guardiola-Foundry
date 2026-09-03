import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import Material from '#models/material'
import MaterialSource from '#models/material_source'
import MaterialSourceLink from '#models/material_source_link'
import User from '#models/user'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Source retirement and restoration', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await clearMaterialsData()
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
  })

  test('rejects unauthenticated retirement and restoration requests', async ({ client }) => {
    const retireResponse = await client.delete('/sources/S-0002')
    const restoreResponse = await client.post('/sources/S-0002/restore')

    retireResponse.assertStatus(401)
    retireResponse.assertBodyContains({ message: 'Unauthorized' })
    restoreResponse.assertStatus(401)
    restoreResponse.assertBodyContains({ message: 'Unauthorized' })
  })

  test('lets Admins and Operators retire Unlinked or alternate Sources while preserving history', async ({
    assert,
    client,
  }) => {
    const operatorSession = await authenticateAs(client, 'operator')
    const adminSession = await authenticateAs(client, 'admin')
    const unlinkedSource = await MaterialSource.findByOrFail('publicId', 'S-0004')
    const historicalMaterial = await Material.findByOrFail('publicId', 'M-0003')
    await historicalMaterial.softDelete()
    await MaterialSourceLink.query().where('materialSourceId', unlinkedSource.id).delete()

    const unlinkedResponse = await client
      .delete('/sources/S-0004')
      .header('Authorization', `Bearer ${adminSession.token}`)

    unlinkedResponse.assertStatus(200)
    assert.equal(unlinkedResponse.body().source.sourceStatus, 'retired')
    assert.deepEqual(unlinkedResponse.body().source.linkedMaterials, [])

    const alternateResponse = await client
      .delete('/sources/S-0002')
      .header('Authorization', `Bearer ${operatorSession.token}`)

    alternateResponse.assertStatus(200)
    assert.equal(alternateResponse.body().source.sourceStatus, 'retired')
    assert.deepInclude(alternateResponse.body().source.linkedMaterials[0], {
      id: 'M-0001',
      relationship: 'alternate',
      relationshipStatus: 'historical',
    })

    const materialResponse = await client
      .get('/materials/M-0001')
      .header('Authorization', `Bearer ${operatorSession.token}`)
    const materialsResponse = await client
      .get('/materials')
      .header('Authorization', `Bearer ${operatorSession.token}`)
    const sourcesResponse = await client
      .get('/sources')
      .header('Authorization', `Bearer ${operatorSession.token}`)
    const materialSummary = materialsResponse
      .body()
      .materials.find((material: { id: string }) => material.id === 'M-0001')

    materialResponse.assertStatus(200)
    assert.deepInclude(materialResponse.body().material.sourceRelationships[1], {
      id: 'S-0002',
      relationship: 'alternate',
      relationshipStatus: 'historical',
      preferredEligibility: 'source-not-active',
    })
    assert.equal(materialSummary.alternateSourceCount, 0)
    assert.notInclude(
      sourcesResponse.body().sources.map((source: { id: string }) => source.id),
      'S-0002'
    )

    const linkResponse = await client
      .post('/materials/M-0002/sources')
      .header('Authorization', `Bearer ${operatorSession.token}`)
      .json({ sourceId: 'S-0002', vendorShadeId: null })
    const preferredResponse = await client
      .put('/materials/M-0001/preferred-source')
      .header('Authorization', `Bearer ${operatorSession.token}`)
      .json({ sourceId: 'S-0002' })

    linkResponse.assertStatus(409)
    linkResponse.assertBody({ message: 'Only Active Sources can be linked to a Material.' })
    preferredResponse.assertStatus(409)
    preferredResponse.assertBody({ message: 'Only an Active Source can become Preferred.' })
  })

  test('blocks Preferred retirement and identifies every affected Active Material', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const secondMaterial = await Material.findByOrFail('publicId', 'M-0002')
    const sharedPreferredSource = await MaterialSource.findByOrFail('publicId', 'S-0001')
    await MaterialSourceLink.query()
      .where('materialId', secondMaterial.id)
      .update({ isPreferred: false })
    await MaterialSourceLink.create({
      materialId: secondMaterial.id,
      materialSourceId: sharedPreferredSource.id,
      sortOrder: 2,
      isPreferred: true,
      vendorShadeId: null,
    })

    const response = await client
      .delete('/sources/S-0001')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(409)
    response.assertBody({
      message:
        'Replace this Preferred Source for every affected Active Material before retiring it.',
      affectedMaterials: [
        { id: 'M-0002', name: 'Champagne Structure Satin' },
        { id: 'M-0001', name: 'Ivory Silk Crepe' },
      ],
    })
    await sharedPreferredSource.refresh()
    assert.equal(sharedPreferredSource.sourceStatus, 'active')

    for (const materialId of ['M-0001', 'M-0002']) {
      const material = await Material.findByOrFail('publicId', materialId)
      const preferredLinks = await MaterialSourceLink.query()
        .where('materialId', material.id)
        .where('isPreferred', true)
        .preload('materialSource')

      assert.lengthOf(preferredLinks, 1)
      assert.equal(preferredLinks[0].materialSource.sourceStatus, 'active')
      assert.isNotNull(preferredLinks[0].materialSource.landedUnitCostCents)
    }
  })

  test('allows retirement when every Preferred relationship is historical', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const historicalMaterial = await Material.findByOrFail('publicId', 'M-0003')
    await historicalMaterial.softDelete()

    const response = await client
      .delete('/sources/S-0004')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.equal(response.body().source.sourceStatus, 'retired')
    assert.deepInclude(response.body().source.linkedMaterials[0], {
      id: 'M-0003',
      relationship: 'preferred',
      relationshipStatus: 'historical',
    })
  })

  test('allows only Admins to restore history without reinstating Preferred status', async ({
    assert,
    client,
  }) => {
    const operatorSession = await authenticateAs(client, 'operator')
    const adminSession = await authenticateAs(client, 'admin')

    const retireResponse = await client
      .delete('/sources/S-0002')
      .header('Authorization', `Bearer ${operatorSession.token}`)
    retireResponse.assertStatus(200)

    const retiredSource = await MaterialSource.findByOrFail('publicId', 'S-0002')
    retiredSource.landedUnitCostCents = null
    await retiredSource.save()

    const operatorRestoreResponse = await client
      .post('/sources/S-0002/restore')
      .header('Authorization', `Bearer ${operatorSession.token}`)

    operatorRestoreResponse.assertStatus(403)
    operatorRestoreResponse.assertBody({ message: 'Only Admins can restore Retired Sources.' })

    const adminRestoreResponse = await client
      .post('/sources/S-0002/restore')
      .header('Authorization', `Bearer ${adminSession.token}`)

    adminRestoreResponse.assertStatus(200)
    assert.equal(adminRestoreResponse.body().source.sourceStatus, 'active')
    assert.deepInclude(adminRestoreResponse.body().source.linkedMaterials[0], {
      id: 'M-0001',
      relationship: 'alternate',
      relationshipStatus: 'active',
    })

    const materialResponse = await client
      .get('/materials/M-0001')
      .header('Authorization', `Bearer ${adminSession.token}`)
    const restoredRelationship = materialResponse
      .body()
      .material.sourceRelationships.find((source: { id: string }) => source.id === 'S-0002')
    const preferredRelationships = materialResponse
      .body()
      .material.sourceRelationships.filter(
        (source: { relationship: string }) => source.relationship === 'preferred'
      )

    assert.deepInclude(restoredRelationship, {
      relationship: 'alternate',
      relationshipStatus: 'active',
      preferredEligibility: 'missing-landed-unit-cost',
    })
    assert.deepEqual(
      preferredRelationships.map((source: { id: string }) => source.id),
      ['S-0001']
    )

    const linkResponse = await client
      .post('/materials/M-0002/sources')
      .header('Authorization', `Bearer ${adminSession.token}`)
      .json({ sourceId: 'S-0002', vendorShadeId: null })

    linkResponse.assertStatus(201)
  })

  test('returns business lifecycle errors without changing Source status', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')

    const missingRetireResponse = await client
      .delete('/sources/S-9999')
      .header('Authorization', `Bearer ${session.token}`)
    const activeRestoreResponse = await client
      .post('/sources/S-0002/restore')
      .header('Authorization', `Bearer ${session.token}`)

    missingRetireResponse.assertStatus(404)
    missingRetireResponse.assertBody({ message: 'Source not found.' })
    activeRestoreResponse.assertStatus(409)
    activeRestoreResponse.assertBody({ message: 'Only Retired Sources can be restored.' })
    const activeSource = await MaterialSource.findByOrFail('publicId', 'S-0002')
    assert.equal(activeSource.sourceStatus, 'active')
  })
})

async function authenticateAs(client: any, role: 'admin' | 'operator') {
  await User.firstOrCreate(
    { email: `${role}@source-lifecycle.example.com` },
    { password: 'Password123', role, active: true }
  )

  const response = await client.post('/auth/login').json({
    email: `${role}@source-lifecycle.example.com`,
    password: 'Password123',
  })

  response.assertStatus(200)
  return response.body() as { token: string }
}

async function clearMaterialsData() {
  await db.from('material_source_links').delete()
  await db.from('material_source_vendor_shades').delete()
  await db.from('materials').delete()
  await db.from('material_sources').delete()
  await db.rawQuery('ALTER SEQUENCE material_source_public_id_seq RESTART WITH 1')
}
