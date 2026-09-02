import MaterialSource from '#models/material_source'
import User from '#models/user'
import VendorShade from '#modules/sources/models/vendor_shade'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('Source creation', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await clearSourcesData()
  })

  test('allows Admins and Operators to create a complete Active Source with stable identity', async ({
    assert,
    client,
  }) => {
    await MaterialSource.create(basePersistedSource({ name: 'Existing Source' }))
    const session = await authenticateAs(client, 'operator')

    const response = await client
      .post('/sources')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        name: '  New Silk Organza  ',
        vendor: '  Maison Textile  ',
        textileFamily: 'Silk Organza',
        purchasePresentation: 'piece',
        fixedPieceLength: 3,
        purchaseUnit: 'meter',
        minimumPurchaseQuantity: 2,
        purchasePriceCents: 2400,
        priceDate: '2026-09-01',
        vendorCurrency: 'USD',
        landedUnitCostCents: 3100,
        vendorSku: '  ORG-01  ',
        url: '  https://vendor.example/organza  ',
        description: '  Structured silk organza.  ',
        manufacturer: '  Textile Mill  ',
        fiber: '  Silk  ',
        composition: '  100% silk  ',
        gsmGramsPerSquareMeter: 55,
        widthCentimeters: 140,
        finish: '  Crisp  ',
        weave: '  Plain weave  ',
        presentationNotes: '  Three-meter pieces.  ',
        countryOfOrigin: '  Italy  ',
        comments: '  Created in the catalog.  ',
        estimatedShippingUsdPerKilogramCents: 900,
        igiPercentage: 10,
        vendorShades: ['  Ivory 100  ', 'White 200'],
      })

    response.assertStatus(201)
    const createdSource = response.body().source
    assert.equal(createdSource.id, 'S-0002')
    assert.isNull(createdSource.legacySourceId)
    assert.equal(createdSource.name, 'New Silk Organza')
    assert.equal(createdSource.vendor, 'Maison Textile')
    assert.equal(createdSource.sourceStatus, 'active')
    assert.equal(createdSource.normalizedUnit, 'meter')
    assert.deepInclude(createdSource, {
      purchasePresentation: 'piece',
      fixedPieceLength: 3,
      purchaseUnit: 'meter',
      minimumPurchaseQuantity: 2,
      purchasePriceCents: 2400,
      priceDate: '2026-09-01',
      vendorCurrency: 'USD',
      landedUnitCostCents: 3100,
      vendorSku: 'ORG-01',
      url: 'https://vendor.example/organza',
      description: 'Structured silk organza.',
      manufacturer: 'Textile Mill',
      fiber: 'Silk',
      composition: '100% silk',
      gsmGramsPerSquareMeter: 55,
      widthCentimeters: 140,
      finish: 'Crisp',
      weave: 'Plain weave',
      presentationNotes: 'Three-meter pieces.',
      countryOfOrigin: 'Italy',
      comments: 'Created in the catalog.',
      estimatedShippingUsdPerKilogramCents: 900,
      igiPercentage: 10,
    })
    assert.equal(createdSource.ivaPercentage, 16)
    assert.isFalse(createdSource.costNeedsAttention)
    assert.isFalse(createdSource.dataNeedsAttention)
    assert.deepEqual(createdSource.linkedMaterials, [])
    assert.deepEqual(
      createdSource.vendorShades.map((shade: { nameOrCode: string }) => shade.nameOrCode),
      ['Ivory 100', 'White 200']
    )

    const persistedSource = await MaterialSource.findByOrFail('publicId', 'S-0002')
    assert.isNull(persistedSource.legacySourceId)
    assert.equal(persistedSource.name, 'New Silk Organza')
    assert.equal(persistedSource.landedUnitCostCents, 3100)
    const shadeCount = await VendorShade.query()
      .where('materialSourceId', persistedSource.id)
      .count('* as total')
      .firstOrFail()
    assert.equal(Number(shadeCount.$extras.total), 2)
  })

  test('creates an attention-marked USD Source without a Landed Unit Cost or currency rate', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAs(client, 'admin')

    const response = await client
      .post('/sources')
      .header('Authorization', `Bearer ${session.token}`)
      .json(validRequiredPayload())

    response.assertStatus(201)
    const createdSource = response.body().source
    assert.equal(createdSource.id, 'S-0001')
    assert.equal(createdSource.vendorCurrency, 'USD')
    assert.isNull(createdSource.landedUnitCostCents)
    assert.isTrue(createdSource.costNeedsAttention)
    assert.isTrue(createdSource.dataNeedsAttention)
  })

  test('rejects unauthenticated and invalid Source creation with field-level errors', async ({
    assert,
    client,
  }) => {
    const unauthorizedResponse = await client.post('/sources').json(validRequiredPayload())
    unauthorizedResponse.assertStatus(401)

    const session = await authenticateAs(client, 'operator')
    const invalidResponse = await client
      .post('/sources')
      .header('Authorization', `Bearer ${session.token}`)
      .json({
        ...validRequiredPayload(),
        name: ' ',
        vendor: ' ',
        textileFamily: 'Unknown',
        purchasePresentation: 'bolt',
        fixedPieceLength: 0,
        purchaseUnit: 'foot',
        minimumPurchaseQuantity: 0,
        purchasePriceCents: -1,
        priceDate: '09/01/2026',
        vendorCurrency: 'EUR',
        landedUnitCostCents: -1,
        widthCentimeters: 0,
        igiPercentage: 101,
        vendorShades: ['Valid', '  '],
      })

    invalidResponse.assertStatus(422)
    const errors = invalidResponse.body().errors
    for (const field of [
      'name',
      'vendor',
      'textileFamily',
      'purchasePresentation',
      'fixedPieceLength',
      'purchaseUnit',
      'minimumPurchaseQuantity',
      'purchasePriceCents',
      'priceDate',
      'vendorCurrency',
      'landedUnitCostCents',
      'widthCentimeters',
      'igiPercentage',
      'vendorShades',
    ]) {
      assert.isArray(errors[field], `Expected a field-level error for ${field}`)
    }
    const sourceCount = await MaterialSource.query().count('* as total').firstOrFail()
    assert.equal(Number(sourceCount.$extras.total), 0)
  })
})

function validRequiredPayload() {
  return {
    name: 'USD Crepe',
    vendor: 'Textile Vendor',
    textileFamily: 'Crepe',
    purchasePresentation: 'roll',
    purchaseUnit: 'yard',
    minimumPurchaseQuantity: 1,
    purchasePriceCents: 1800,
    priceDate: '2026-09-01',
    vendorCurrency: 'USD',
  }
}

function basePersistedSource(overrides: Partial<MaterialSource> = {}) {
  return {
    legacySourceId: null,
    name: 'Source',
    vendor: 'Vendor',
    textileFamily: 'Crepe' as const,
    purchasePresentation: 'roll' as const,
    fixedPieceLength: null,
    purchaseUnit: 'meter' as const,
    minimumPurchaseQuantity: 1,
    purchasePriceCents: 100,
    priceDate: DateTime.fromISO('2026-09-01'),
    vendorCurrency: 'MXN' as const,
    landedUnitCostCents: null,
    sourceStatus: 'active' as const,
    normalizedUnit: 'meter' as const,
    vendorSku: null,
    url: null,
    description: null,
    manufacturer: null,
    fiber: null,
    composition: null,
    gsmGramsPerSquareMeter: null,
    widthCentimeters: null,
    finish: null,
    weave: null,
    presentationNotes: null,
    countryOfOrigin: null,
    comments: null,
    estimatedShippingUsdPerKilogramCents: null,
    igiPercentage: null,
    ...overrides,
  }
}

async function authenticateAs(client: any, role: 'admin' | 'operator') {
  await User.firstOrCreate(
    { email: `${role}@source-create.example.com` },
    { password: 'Password123', role, active: true }
  )

  const response = await client.post('/auth/login').json({
    email: `${role}@source-create.example.com`,
    password: 'Password123',
  })

  response.assertStatus(200)
  return response.body() as { token: string }
}

async function clearSourcesData() {
  await db.from('material_source_links').delete()
  await db.from('material_source_vendor_shades').delete()
  await db.from('materials').delete()
  await db.from('material_sources').delete()
  await db.rawQuery('ALTER SEQUENCE material_source_public_id_seq RESTART WITH 1')
}
