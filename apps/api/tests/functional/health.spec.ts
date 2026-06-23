import { test } from '@japa/runner'

test.group('Health', () => {
  test('returns the API liveness status', async ({ client }) => {
    const response = await client.get('/health')

    response.assertStatus(200)
    response.assertBody({ status: 'ok' })
  })
})
