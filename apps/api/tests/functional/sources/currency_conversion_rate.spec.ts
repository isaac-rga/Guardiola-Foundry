import User from '#models/user'
import CurrencyConversionRate from '#modules/sources/models/currency_conversion_rate'
import CurrencyConversionRateSeeder from '#database/seeders/currency_conversion_rate_seeder'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Currency Conversion Rate', (group) => {
  group.each.setup(async () => {
    await testUtils.db('postgres_test').truncate()
    await db.from('currency_conversion_rates').delete()
  })

  test('returns the configured global rate and its reciprocal to authenticated users', async ({
    assert,
    client,
  }) => {
    await db.table('currency_conversion_rates').insert({
      id: 1,
      usd_to_mxn_rate: '17.125000',
      effective_date: '2026-08-31',
    })
    await assert.rejects(
      () =>
        db.table('currency_conversion_rates').insert({
          id: 2,
          usd_to_mxn_rate: '18.000000',
          effective_date: '2026-09-01',
        }),
      /currency_conversion_rates_singleton/
    )
    const session = await authenticateAsOperator(client)

    const response = await client
      .get('/currency-conversion-rate')
      .header('Authorization', `Bearer ${session.token}`)

    response.assertStatus(200)
    response.assertBody({
      state: 'configured',
      usdToMxnRate: 17.125,
      mxnToUsdRate: 1 / 17.125,
      effectiveDate: '2026-08-31',
    })
    assert.equal(response.body().mxnToUsdRate, 1 / response.body().usdToMxnRate)
  })

  test('seeds the deterministic global rate idempotently', async ({ assert }) => {
    const seeder = new CurrencyConversionRateSeeder(db.connection())

    await seeder.run()
    await seeder.run()

    const configurations = await CurrencyConversionRate.all()
    assert.lengthOf(configurations, 1)
    assert.equal(configurations[0].id, 1)
    assert.equal(configurations[0].usdToMxnRate, 17)
    assert.equal(configurations[0].effectiveDate?.toISODate(), '2026-09-02')
  })

  test('distinguishes missing and invalid database configuration', async ({ client }) => {
    const session = await authenticateAsOperator(client)
    const missingResponse = await client
      .get('/currency-conversion-rate')
      .header('Authorization', `Bearer ${session.token}`)

    missingResponse.assertStatus(200)
    missingResponse.assertBody({ state: 'missing' })

    await db.table('currency_conversion_rates').insert({
      id: 1,
      usd_to_mxn_rate: '0',
      effective_date: '2026-08-31',
    })
    const invalidResponse = await client
      .get('/currency-conversion-rate')
      .header('Authorization', `Bearer ${session.token}`)

    invalidResponse.assertStatus(200)
    invalidResponse.assertBody({ state: 'invalid' })
  })

  test('rejects unauthenticated reads and exposes no write contract', async ({ client }) => {
    const unauthorizedResponse = await client.get('/currency-conversion-rate')
    const session = await authenticateAsOperator(client)
    const createResponse = await client
      .post('/currency-conversion-rate')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ usdToMxnRate: 17.125, effectiveDate: '2026-08-31' })
    const updateResponse = await client
      .put('/currency-conversion-rate')
      .header('Authorization', `Bearer ${session.token}`)
      .json({ usdToMxnRate: 17.125, effectiveDate: '2026-08-31' })

    unauthorizedResponse.assertStatus(401)
    createResponse.assertStatus(404)
    updateResponse.assertStatus(404)
  })
})

async function authenticateAsOperator(client: any) {
  await User.firstOrCreate(
    { email: 'operator@currency-rate.example.com' },
    { password: 'Password123', role: 'operator', active: true }
  )

  const response = await client.post('/auth/login').json({
    email: 'operator@currency-rate.example.com',
    password: 'Password123',
  })

  response.assertStatus(200)
  return response.body() as { token: string }
}
