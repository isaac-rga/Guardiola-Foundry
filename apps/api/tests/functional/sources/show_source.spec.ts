import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import Material from '#models/material'
import MaterialSource from '#models/material_source'
import User from '#models/user'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import VendorShade from '#modules/sources/models/vendor_shade'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Source detail', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await clearMaterialsData()
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
  })

  test('returns the complete Source record with read-only active and historical Material usage', async ({
    assert,
    client,
  }) => {
    const historicalMaterial = await Material.findByOrFail('publicId', 'M-0001')
    await historicalMaterial.softDelete()
    const importedShade = await VendorShade.findByOrFail('nameOrCode', 'Ivory 100')
    const session = await authenticateAs(client, 'operator')

    const response = await client
      .get('/sources/S-0001')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    assert.deepEqual(response.body(), {
      source: {
        id: 'S-0001',
        legacySourceId: 'SRC-100',
        name: 'Italian Silk Crepe',
        vendor: 'Casa Tessile',
        textileFamily: 'Crepe',
        purchasePresentation: 'roll',
        fixedPieceLength: null,
        purchaseUnit: 'yard',
        minimumPurchaseQuantity: 1,
        purchasePriceCents: 3600,
        priceDate: '2026-07-01',
        vendorCurrency: 'USD',
        landedUnitCostCents: 4200,
        sourceStatus: 'active',
        normalizedUnit: 'meter',
        vendorSku: 'CREPE-IVORY-01',
        url: 'https://vendor.example/italian-silk-crepe',
        description: 'Silk crepe for bridal base fabric.',
        manufacturer: 'Casa Tessile Mill',
        fiber: 'Silk',
        composition: '100% silk',
        gsmGramsPerSquareMeter: 120,
        widthCentimeters: 140,
        finish: 'Matte',
        weave: 'Crepe weave',
        presentationNotes: 'Rolled on a cardboard tube.',
        countryOfOrigin: 'Italy',
        comments: 'Deterministic fixture with complete optional Source details.',
        estimatedShippingUsdPerKilogramCents: 1500,
        igiPercentage: 15,
        ivaPercentage: 16,
        costNeedsAttention: false,
        dataNeedsAttention: false,
        vendorShades: [{ id: importedShade.id, nameOrCode: 'Ivory 100' }],
        linkedMaterials: [
          {
            id: 'M-0001',
            name: 'Ivory Silk Crepe',
            materialColor: 'ivory',
            materialUse: 'base-fabric',
            relationship: 'preferred',
            relationshipStatus: 'historical',
            vendorShade: { id: importedShade.id, nameOrCode: 'Ivory 100' },
          },
        ],
      },
    })
    assert.notProperty(response.body().source, 'materialSourceId')
    assert.notProperty(response.body().source, 'actions')
  })

  test('allows only Admins to inspect Retired Sources without disclosing them to Operators', async ({
    assert,
    client,
  }) => {
    const retiredSource = await MaterialSource.findByOrFail('publicId', 'S-0003')
    retiredSource.sourceStatus = 'retired'
    await retiredSource.save()
    const adminSession = await authenticateAs(client, 'admin')
    const operatorSession = await authenticateAs(client, 'operator')

    const adminResponse = await client
      .get('/sources/S-0003')
      .header('Authorization', `Bearer ${adminSession.token}`)
    const operatorResponse = await client
      .get('/sources/S-0003')
      .header('Authorization', `Bearer ${operatorSession.token}`)
    const missingResponse = await client
      .get('/sources/S-9999')
      .header('Authorization', `Bearer ${operatorSession.token}`)

    adminResponse.assertStatus(200)
    assert.equal(adminResponse.body().source.sourceStatus, 'retired')
    assert.equal(adminResponse.body().source.linkedMaterials[0].relationshipStatus, 'historical')
    operatorResponse.assertStatus(404)
    missingResponse.assertStatus(404)
    assert.deepEqual(operatorResponse.body(), missingResponse.body())
    operatorResponse.assertBodyContains({ message: 'Source not found.' })
  })

  test('rejects unauthenticated Source detail requests', async ({ client }) => {
    const response = await client.get('/sources/S-0001')

    response.assertStatus(401)
    response.assertBodyContains({ message: 'Unauthorized' })
  })
})

async function authenticateAs(client: any, role: 'admin' | 'operator') {
  await User.firstOrCreate(
    { email: `${role}@source-detail.example.com` },
    { password: 'Password123', role, active: true }
  )

  const response = await client.post('/auth/login').json({
    email: `${role}@source-detail.example.com`,
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
