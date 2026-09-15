import Material from '#models/material'
import MaterialSource from '#models/material_source'
import MaterialSourceLink from '#models/material_source_link'
import User from '#models/user'
import PatternSet from '#modules/pattern_sets/models/pattern_set'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { performance } from 'node:perf_hooks'

const ACTIVE_RECORD_COUNT = 10_000
const SAMPLE_COUNT = 20
const TARGET_P95_MILLISECONDS = 500
const PATTERN_SET_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

test.group('Catalog search performance', (group) => {
  group.each.setup(() => testUtils.db('postgres_test').truncate())

  test('keeps Material and Pattern Set server-response p95 within 500 ms at 10,000 records', async ({
    assert,
    client,
  }) => {
    const session = await authenticateAsOperator(client)
    const user = await User.findByOrFail('email', 'operator@example.com')
    const source = await MaterialSource.create({
      publicId: 'S-9000',
      legacySourceId: 'PERF-SOURCE',
      name: 'Performance Source',
      vendor: 'Performance Vendor',
      textileFamily: 'Crepe',
      sourceStatus: 'active',
      purchasePresentation: 'roll',
      fixedPieceLength: null,
      purchaseUnit: 'meter',
      minimumPurchaseQuantity: 1,
      vendorCurrency: 'MXN',
      purchasePriceCents: 100,
      priceDate: DateTime.fromISO('2026-09-01'),
      widthCentimeters: 140,
      landedUnitCostCents: 100,
      normalizedUnit: 'meter',
      vendorSku: null,
      url: null,
      description: null,
      manufacturer: null,
      fiber: null,
      composition: null,
      gsmGramsPerSquareMeter: null,
      finish: null,
      weave: null,
      presentationNotes: null,
      countryOfOrigin: null,
      comments: null,
      estimatedShippingUsdPerKilogramCents: null,
      igiPercentage: null,
      sourceImportSnapshot: null,
    })

    for (let offset = 0; offset < ACTIVE_RECORD_COUNT; offset += 500) {
      const count = Math.min(500, ACTIVE_RECORD_COUNT - offset)
      const materials = await Material.createMany(
        Array.from({ length: count }, (_, localIndex) => {
          const index = offset + localIndex
          return {
            publicId: `M-${String(index + 10_000).padStart(5, '0')}`,
            legacyMaterialId: `PERF-MATERIAL-${index}`,
            name: `Performance target Material ${String(index).padStart(5, '0')}`,
            materialColor: 'ivory' as const,
            materialUse: 'base-fabric' as const,
            materialUnit: 'meter' as const,
            comments: null,
            sourceLinksImportSnapshot: null,
          }
        })
      )
      await MaterialSourceLink.createMany(
        materials.map((material) => ({
          materialId: material.id,
          materialSourceId: source.id,
          sortOrder: 1,
          isPreferred: true,
          vendorShadeId: null,
        }))
      )
      await PatternSet.createMany(
        Array.from({ length: count }, (_, localIndex) => {
          const index = offset + localIndex
          return {
            publicId: patternSetPublicId(index),
            name: `Performance target Pattern ${String(index).padStart(5, '0')}`,
            description: null,
            status: 'active' as const,
            createdByUserId: user.id,
          }
        })
      )
    }

    const materialP95 = await measureP95(async () => {
      const response = await client
        .get('/materials/search?search=performance%20target')
        .header('Authorization', `Bearer ${session.token}`)
      response.assertStatus(200)
      assert.lengthOf(response.body().items, 25)
      assert.isTrue(response.body().hasMore)
    })
    const patternSetP95 = await measureP95(async () => {
      const response = await client
        .get('/pattern-sets/search?search=performance%20target')
        .header('Authorization', `Bearer ${session.token}`)
      response.assertStatus(200)
      assert.lengthOf(response.body().items, 25)
      assert.isTrue(response.body().hasMore)
    })

    assert.isAtMost(materialP95, TARGET_P95_MILLISECONDS, `Material p95 was ${materialP95} ms`)
    assert.isAtMost(
      patternSetP95,
      TARGET_P95_MILLISECONDS,
      `Pattern Set p95 was ${patternSetP95} ms`
    )
  }).timeout(120_000)
})

async function measureP95(request: () => Promise<void>) {
  await request()
  const durations: number[] = []
  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const startedAt = performance.now()
    await request()
    durations.push(performance.now() - startedAt)
  }
  durations.sort((left, right) => left - right)
  return Math.round(durations[Math.ceil(durations.length * 0.95) - 1] * 100) / 100
}

function patternSetPublicId(index: number) {
  let remaining = index
  let suffix = ''
  for (let position = 0; position < 6; position += 1) {
    suffix = PATTERN_SET_ID_ALPHABET[remaining % PATTERN_SET_ID_ALPHABET.length] + suffix
    remaining = Math.floor(remaining / PATTERN_SET_ID_ALPHABET.length)
  }
  return `PS-${suffix}`
}

async function authenticateAsOperator(client: any) {
  await User.create({
    email: 'operator@example.com',
    password: 'Password123',
    role: 'operator',
    active: true,
  })
  const response = await client.post('/auth/login').json({
    email: 'operator@example.com',
    password: 'Password123',
  })
  response.assertStatus(200)
  return response.body() as { token: string }
}
