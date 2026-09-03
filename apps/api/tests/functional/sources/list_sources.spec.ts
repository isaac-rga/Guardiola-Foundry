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

test.group('Sources list', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await clearMaterialsData()
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
    const unlinkedSource = await MaterialSource.findByOrFail('publicId', 'S-0004')
    await db.from('material_source_links').where('material_source_id', unlinkedSource.id).delete()
  })

  test('rejects unauthenticated requests', async ({ client }) => {
    const response = await client.get('/sources')

    response.assertStatus(401)
    response.assertBodyContains({ message: 'Unauthorized' })
  })

  test('returns every Active Source as a lean ordered summary, including Unlinked Sources', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'operator')
    const response = await client.get('/sources').header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.deepEqual(
      response
        .body()
        .sources.map((source: { name: string; vendor: string }) => [source.name, source.vendor]),
      [
        ['Champagne Structure Satin', 'Atelier Supply'],
        ['Italian Silk Crepe', 'Casa Tessile'],
        ['Ivory Crepe Backup', 'Milan Textiles'],
        ['White Chantilly Lace', 'Dentelle House'],
      ]
    )

    const unlinkedSource = response
      .body()
      .sources.find((source: { id: string }) => source.id === 'S-0004')

    assert.deepEqual(unlinkedSource, {
      id: 'S-0004',
      name: 'White Chantilly Lace',
      vendor: 'Dentelle House',
      textileFamily: 'Encaje',
      purchasePresentation: 'roll',
      purchaseUnit: 'yard',
      vendorCurrency: 'USD',
      purchasePriceCents: 6800,
      landedUnitCostCents: 7600,
      linkedMaterialCount: 0,
      costNeedsAttention: false,
      dataNeedsAttention: true,
    })
    assert.notProperty(unlinkedSource, 'description')
    assert.notProperty(unlinkedSource, 'composition')
    assert.notProperty(unlinkedSource, 'vendorShades')
  })

  test('searches only Source Name and Vendor and applies catalog filters', async ({
    assert,
    client,
  }) => {
    const costlessSource = await MaterialSource.findByOrFail('publicId', 'S-0002')
    costlessSource.landedUnitCostCents = null
    await costlessSource.save()
    const session = await authenticateAs(client, 'admin')

    const searchResponse = await client
      .get('/sources?search=TEXTILE')
      .header('Authorization', `Bearer ${session.token}`)
    const idSearchResponse = await client
      .get('/sources?search=S-0001')
      .header('Authorization', `Bearer ${session.token}`)
    const filterResponse = await client
      .get(
        '/sources?textileFamily=Crepe&status=active&linkState=linked&attentionState=data-needs-attention'
      )
      .header('Authorization', `Bearer ${session.token}`)
    const unlinkedResponse = await client
      .get('/sources?linkState=unlinked')
      .header('Authorization', `Bearer ${session.token}`)
    const costAttentionResponse = await client
      .get('/sources?attentionState=cost-needs-attention')
      .header('Authorization', `Bearer ${session.token}`)

    searchResponse.assertStatus(200)
    idSearchResponse.assertStatus(200)
    filterResponse.assertStatus(200)
    unlinkedResponse.assertStatus(200)
    costAttentionResponse.assertStatus(200)
    assert.deepEqual(
      searchResponse.body().sources.map((source: { id: string }) => source.id),
      ['S-0002']
    )
    assert.isEmpty(idSearchResponse.body().sources)
    assert.deepEqual(
      filterResponse.body().sources.map((source: { id: string }) => source.id),
      ['S-0002']
    )
    assert.deepEqual(
      unlinkedResponse.body().sources.map((source: { id: string }) => source.id),
      ['S-0004']
    )
    assert.deepEqual(
      costAttentionResponse.body().sources.map((source: { id: string }) => source.id),
      ['S-0002']
    )
  })

  test('allows only Admins to request Retired Sources', async ({ assert, client }) => {
    const retiredSource = await MaterialSource.findByOrFail('publicId', 'S-0003')
    retiredSource.sourceStatus = 'retired'
    await retiredSource.save()

    const adminSession = await authenticateAs(client, 'admin')
    const operatorSession = await authenticateAs(client, 'operator')
    const adminResponse = await client
      .get('/sources?status=retired')
      .header('Authorization', `Bearer ${adminSession.token}`)
    const operatorResponse = await client
      .get('/sources?status=retired')
      .header('Authorization', `Bearer ${operatorSession.token}`)
    const operatorDefaultResponse = await client
      .get('/sources')
      .header('Authorization', `Bearer ${operatorSession.token}`)

    adminResponse.assertStatus(200)
    operatorResponse.assertStatus(403)
    operatorResponse.assertBodyContains({
      message:
        'Only Admins can view Retired Sources. Remove the Status filter to view Active Sources.',
    })
    assert.deepEqual(
      adminResponse.body().sources.map((source: { id: string }) => source.id),
      ['S-0003']
    )
    assert.notInclude(
      operatorDefaultResponse.body().sources.map((source: { id: string }) => source.id),
      'S-0003'
    )
  })

  test('rejects invalid filters instead of widening the result set', async ({ client }) => {
    const session = await authenticateAs(client, 'admin')
    const response = await client
      .get('/sources?status=archived&linkState=assigned')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(422)
    response.assertBodyContains({ message: 'Invalid Source filters.' })
  })
})

async function authenticateAs(client: any, role: 'admin' | 'operator') {
  await User.firstOrCreate(
    { email: `${role}@sources.example.com` },
    { password: 'Password123', role, active: true }
  )

  const response = await client.post('/auth/login').json({
    email: `${role}@sources.example.com`,
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
