import Material from '#models/material'
import MaterialSource from '#models/material_source'
import User from '#models/user'
import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Material detail', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await clearMaterialsData()
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
  })

  test('rejects unauthenticated relationship-detail requests', async ({ client }) => {
    const response = await client.get('/materials/M-0001')

    response.assertStatus(401)
    response.assertBodyContains({ message: 'Unauthorized' })
  })

  test('returns Material identity with preferred, alternate, and historical Source relationships', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const retiredSource = await MaterialSource.findByOrFail('publicId', 'S-0002')
    retiredSource.sourceStatus = 'retired'
    await retiredSource.save()
    await retiredSource.softDelete()

    const response = await client
      .get('/materials/M-0001')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.deepEqual(response.body(), {
      material: {
        id: 'M-0001',
        name: 'Ivory Silk Crepe',
        materialColor: 'ivory',
        materialUse: 'base-fabric',
        materialUnit: 'meter',
        comments: 'Primary dress fabric from the spreadsheet import.',
        sourceRelationships: [
          {
            id: 'S-0001',
            name: 'Italian Silk Crepe',
            vendor: 'Casa Tessile',
            relationship: 'preferred',
            relationshipStatus: 'active',
            vendorShade: {
              id: response.body().material.sourceRelationships[0].vendorShade.id,
              nameOrCode: 'Ivory 100',
            },
          },
          {
            id: 'S-0002',
            name: 'Ivory Crepe Backup',
            vendor: 'Milan Textiles',
            relationship: 'alternate',
            relationshipStatus: 'historical',
            vendorShade: null,
          },
        ],
      },
    })
  })

  test('reopens read-only relationship context for a historical Material', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')
    const historicalMaterial = await Material.findByOrFail('publicId', 'M-0001')
    await historicalMaterial.softDelete()

    const response = await client
      .get('/materials/M-0001')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.deepEqual(
      response
        .body()
        .material.sourceRelationships.map(
          (relationship: { relationshipStatus: string }) => relationship.relationshipStatus
        ),
      ['historical', 'historical']
    )
  })

  test('returns a missing response for an unknown Material', async ({ client }) => {
    const session = await authenticateAs(client, 'admin')

    const missingResponse = await client
      .get('/materials/M-9999')
      .header('Authorization', `Bearer ${session.token}`)

    missingResponse.assertStatus(404)
    missingResponse.assertBody({ message: 'Material not found.' })
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
