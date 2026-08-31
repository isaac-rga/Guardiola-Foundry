import Material from '#models/material'
import MaterialSource from '#models/material_source'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import { test } from '@japa/runner'

test.group('Materials list', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await clearMaterialsData()
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
  })

  test('rejects unauthenticated requests', async ({ client }) => {
    const response = await client.get('/materials')

    response.assertStatus(401)
    response.assertBodyContains({
      message: 'Unauthorized',
    })
  })

  test('allows authenticated admins and operators to list imported Material summaries', async ({
    assert,
    client,
  }) => {
    const adminSession = await authenticateAs(client, 'admin')
    const operatorSession = await authenticateAs(client, 'operator')

    const adminResponse = await client
      .get('/materials')
      .header('Authorization', `Bearer ${adminSession.token}`)
    const operatorResponse = await client
      .get('/materials')
      .header('Authorization', `Bearer ${operatorSession.token}`)

    adminResponse.assertStatus(200)
    operatorResponse.assertStatus(200)

    assert.lengthOf(adminResponse.body().materials, 3)
    assert.lengthOf(operatorResponse.body().materials, 3)
    adminResponse.assertBodyContains({
      materials: [
        {
          id: 'M-0002',
          name: 'Champagne Structure Satin',
          materialColor: 'champagne',
          materialUse: 'structure',
          materialUnit: 'meter',
          preferredSource: {
            id: 'S-0003',
            name: 'Champagne Structure Satin',
            provider: 'Atelier Supply',
            normalizedUnitCostCents: 2800,
            normalizedUnit: 'meter',
            needsAttention: false,
          },
          derivedUnitCostCents: 2800,
          alternateSourceCount: 0,
          comments: null,
        },
      ],
    })
  })

  test('returns a lean summary contract derived from the Preferred Source', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')

    const response = await client
      .get('/materials')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)

    const material = response
      .body()
      .materials.find((summary: { id: string }) => summary.id === 'M-0001')

    assert.deepEqual(material, {
      id: 'M-0001',
      name: 'Ivory Silk Crepe',
      materialColor: 'ivory',
      materialUse: 'base-fabric',
      materialUnit: 'meter',
      preferredSource: {
        id: 'S-0001',
        name: 'Italian Silk Crepe',
        provider: 'Casa Tessile',
        normalizedUnitCostCents: 4200,
        normalizedUnit: 'meter',
        needsAttention: false,
      },
      derivedUnitCostCents: 4200,
      alternateSourceCount: 1,
      comments: 'Primary dress fabric from the spreadsheet import.',
    })
    assert.notProperty(material, 'legacyMaterialId')
    assert.notProperty(material.preferredSource, 'legacySourceId')
    assert.notProperty(material.preferredSource, 'textileFamily')
    assert.notProperty(material.preferredSource, 'purchaseUnit')
  })

  test('preserves legacy spreadsheet IDs internally and skips unresolved Source links', async ({
    assert,
  }) => {
    const persistedMaterials = await db
      .from('materials')
      .select(['public_id', 'legacy_material_id'])
      .orderBy('public_id', 'asc')
    const persistedSources = await db
      .from('material_sources')
      .select(['public_id', 'legacy_source_id'])
      .orderBy('public_id', 'asc')

    assert.deepEqual(
      persistedMaterials.map((material) => material.legacy_material_id),
      ['MAT-001', 'MAT-002', 'MAT-003']
    )
    assert.notInclude(
      persistedMaterials.map((material) => material.legacy_material_id),
      'MAT-999'
    )
    assert.notEqual(persistedMaterials[0].public_id, persistedMaterials[0].legacy_material_id)
    assert.includeMembers(
      persistedSources.map((source) => source.legacy_source_id),
      ['SRC-100', 'SRC-101', 'SRC-200', 'SRC-300']
    )
  })

  test('uses the declared Preferred Source and counts alternates', async ({ assert }) => {
    const material = await Material.query()
      .where('publicId', 'M-0001')
      .preload('sourceLinks', (sourceLinkQuery) => {
        sourceLinkQuery.preload('materialSource').orderBy('sortOrder', 'asc')
      })
      .firstOrFail()

    assert.equal(material.sourceLinks[0].materialSource.legacySourceId, 'SRC-100')
    assert.isTrue(material.sourceLinks[0].isPreferred)
    assert.equal(material.sourceLinks[1].materialSource.legacySourceId, 'SRC-101')
    assert.isFalse(material.sourceLinks[1].isPreferred)
  })

  test('hides soft-deleted Materials from the list', async ({ assert, client }) => {
    const session = await authenticateAs(client, 'admin')
    const material = await Material.findByOrFail('publicId', 'M-0003')

    await material.softDelete()

    const response = await client
      .get('/materials')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.notInclude(
      response.body().materials.map((summary: { id: string }) => summary.id),
      'M-0003'
    )
  })

  test('keeps Materials visible when their Preferred Source is soft-deleted', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const source = await MaterialSource.findByOrFail('publicId', 'S-0003')

    await source.softDelete()

    const response = await client
      .get('/materials')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)

    const material = response
      .body()
      .materials.find((summary: { id: string }) => summary.id === 'M-0002')

    const persistedSource = await MaterialSource.queryWithDeleted()
      .where('publicId', 'S-0003')
      .first()

    assert.equal(material.preferredSource.id, 'S-0003')
    assert.isTrue(material.preferredSource.needsAttention)
    assert.isNotNull(persistedSource?.deletedAt)
  })
})

async function authenticateAs(client: any, role: 'admin' | 'operator') {
  await User.firstOrCreate(
    {
      email: `${role}@example.com`,
    },
    {
      password: 'Password123',
      role,
      active: true,
    }
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
