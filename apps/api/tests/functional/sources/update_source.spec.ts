import {
  MATERIAL_IMPORT_FIXTURE,
  MATERIAL_SOURCE_IMPORT_FIXTURE,
} from '#database/fixtures/materials_import_fixture'
import MaterialSource from '#models/material_source'
import User from '#models/user'
import { importMaterialsFromRows } from '#modules/materials/materials_importer'
import VendorShade from '#modules/sources/models/vendor_shade'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Source editing', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await clearMaterialsData()
    await importMaterialsFromRows(MATERIAL_SOURCE_IMPORT_FIXTURE, MATERIAL_IMPORT_FIXTURE)
  })

  test('lets Admins and Operators edit Source data and reconcile Vendor Shades without changing identity', async ({
    assert,
    client,
  }) => {
    const originalShade = await VendorShade.findByOrFail('nameOrCode', 'Ivory 100')
    const adminSession = await authenticateAs(client, 'admin')
    const operatorSession = await authenticateAs(client, 'operator')

    const completeResponse = await client
      .put('/sources/S-0001')
      .header('Authorization', `Bearer ${adminSession.token}`)
      .json({
        ...completeUpdatePayload(),
        id: 'S-9999',
        legacySourceId: 'SRC-CHANGED',
        sourceStatus: 'retired',
        normalizedUnit: 'yard',
        vendorShades: ['  Ivory 101  ', 'White 200'],
      })

    completeResponse.assertStatus(200)
    const completeSource = completeResponse.body().source
    assert.equal(completeSource.id, 'S-0001')
    assert.equal(completeSource.legacySourceId, 'SRC-100')
    assert.equal(completeSource.sourceStatus, 'active')
    assert.equal(completeSource.normalizedUnit, 'meter')
    assert.equal(completeSource.name, 'Updated Silk Crepe')
    assert.equal(completeSource.vendor, 'Updated Textile Vendor')
    assert.equal(completeSource.landedUnitCostCents, 5100)
    assert.equal(completeSource.estimatedShippingUsdPerKilogramCents, 2300)
    assert.isFalse(completeSource.costNeedsAttention)
    assert.isFalse(completeSource.dataNeedsAttention)
    assert.deepEqual(
      completeSource.vendorShades.map((shade: { id: number; nameOrCode: string }) => shade),
      [
        { id: originalShade.id, nameOrCode: 'Ivory 101' },
        { id: completeSource.vendorShades[1].id, nameOrCode: 'White 200' },
      ]
    )
    assert.equal(completeSource.linkedMaterials[0].vendorShade.nameOrCode, 'Ivory 101')

    const attentionResponse = await client
      .put('/sources/S-0001')
      .header('Authorization', `Bearer ${operatorSession.token}`)
      .json({
        ...completeUpdatePayload(),
        description: null,
        landedUnitCostCents: null,
        estimatedShippingUsdPerKilogramCents: 9999,
        vendorShades: ['White 200'],
      })

    attentionResponse.assertStatus(200)
    const attentionSource = attentionResponse.body().source
    assert.isNull(attentionSource.landedUnitCostCents)
    assert.equal(attentionSource.estimatedShippingUsdPerKilogramCents, 9999)
    assert.isTrue(attentionSource.costNeedsAttention)
    assert.isTrue(attentionSource.dataNeedsAttention)
    assert.deepEqual(
      attentionSource.vendorShades.map((shade: { nameOrCode: string }) => shade.nameOrCode),
      ['White 200']
    )
    assert.isNull(attentionSource.linkedMaterials[0].vendorShade)
  })

  test('rejects unauthenticated and invalid edits with field-level errors and no partial update', async ({
    assert,
    client,
  }) => {
    const unauthorizedResponse = await client.put('/sources/S-0001').json(completeUpdatePayload())
    unauthorizedResponse.assertStatus(401)

    const sourceBefore = await MaterialSource.findByOrFail('publicId', 'S-0001')
    const operatorSession = await authenticateAs(client, 'operator')
    const invalidResponse = await client
      .put('/sources/S-0001')
      .header('Authorization', `Bearer ${operatorSession.token}`)
      .json({
        ...completeUpdatePayload(),
        vendor: ' ',
        textileFamily: 'Unknown',
        purchasePresentation: 'bolt',
        minimumPurchaseQuantity: 0,
        purchasePriceCents: -1,
        priceDate: '09/02/2026',
        vendorCurrency: 'EUR',
        igiPercentage: 101,
        vendorShades: ['Ivory', 'Ivory'],
      })

    invalidResponse.assertStatus(422)
    const errors = invalidResponse.body().errors
    for (const field of [
      'vendor',
      'textileFamily',
      'purchasePresentation',
      'minimumPurchaseQuantity',
      'purchasePriceCents',
      'priceDate',
      'vendorCurrency',
      'igiPercentage',
      'vendorShades',
    ]) {
      assert.isArray(errors[field], `Expected a field-level error for ${field}`)
    }

    const sourceAfter = await MaterialSource.findByOrFail('publicId', 'S-0001')
    assert.equal(sourceAfter.name, sourceBefore.name)
    assert.equal(sourceAfter.vendor, sourceBefore.vendor)
    assert.equal(sourceAfter.landedUnitCostCents, sourceBefore.landedUnitCostCents)
  })

  test('keeps missing and Operator-hidden Retired Sources indistinguishable during editing', async ({
    assert,
    client,
  }) => {
    const retiredSource = await MaterialSource.findByOrFail('publicId', 'S-0003')
    retiredSource.sourceStatus = 'retired'
    await retiredSource.save()
    const operatorSession = await authenticateAs(client, 'operator')

    const retiredResponse = await client
      .put('/sources/S-0003')
      .header('Authorization', `Bearer ${operatorSession.token}`)
      .json(completeUpdatePayload())
    const missingResponse = await client
      .put('/sources/S-9999')
      .header('Authorization', `Bearer ${operatorSession.token}`)
      .json(completeUpdatePayload())

    retiredResponse.assertStatus(404)
    missingResponse.assertStatus(404)
    assert.deepEqual(retiredResponse.body(), missingResponse.body())
    retiredResponse.assertBodyContains({ message: 'Source not found.' })
  })
})

function completeUpdatePayload() {
  return {
    name: 'Updated Silk Crepe',
    vendor: 'Updated Textile Vendor',
    textileFamily: 'Crepe',
    purchasePresentation: 'piece',
    fixedPieceLength: 4,
    purchaseUnit: 'meter',
    minimumPurchaseQuantity: 2,
    purchasePriceCents: 3900,
    priceDate: '2026-09-02',
    vendorCurrency: 'USD',
    landedUnitCostCents: 5100,
    vendorSku: 'UPDATED-01',
    url: 'https://vendor.example/updated',
    description: 'Updated complete description.',
    manufacturer: 'Updated Mill',
    fiber: 'Silk',
    composition: '100% silk',
    gsmGramsPerSquareMeter: 125,
    widthCentimeters: 145,
    finish: 'Matte',
    weave: 'Crepe weave',
    presentationNotes: 'Updated presentation.',
    countryOfOrigin: 'Italy',
    comments: 'Updated comments.',
    estimatedShippingUsdPerKilogramCents: 2300,
    igiPercentage: 18,
    vendorShades: ['Ivory 101'],
  }
}

async function authenticateAs(client: any, role: 'admin' | 'operator') {
  await User.firstOrCreate(
    { email: `${role}@source-edit.example.com` },
    { password: 'Password123', role, active: true }
  )

  const response = await client.post('/auth/login').json({
    email: `${role}@source-edit.example.com`,
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
