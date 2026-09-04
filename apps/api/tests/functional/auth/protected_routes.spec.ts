import { test } from '@japa/runner'

test.group('Bearer-protected routes', () => {
  test('rejects requests without a bearer token across the protected API', async ({
    assert,
    client,
  }) => {
    const protectedRequests = [
      { route: 'GET /auth/me', send: () => client.get('/auth/me') },
      { route: 'GET /materials', send: () => client.get('/materials') },
      { route: 'GET /materials/:materialId', send: () => client.get('/materials/M-0001') },
      {
        route: 'POST /materials/:materialId/sources',
        send: () => client.post('/materials/M-0001/sources'),
      },
      {
        route: 'DELETE /materials/:materialId/sources/:sourceId',
        send: () => client.delete('/materials/M-0001/sources/S-0001'),
      },
      {
        route: 'PUT /materials/:materialId/preferred-source',
        send: () => client.put('/materials/M-0001/preferred-source'),
      },
      {
        route: 'GET /currency-conversion-rate',
        send: () => client.get('/currency-conversion-rate'),
      },
      { route: 'GET /sources', send: () => client.get('/sources') },
      { route: 'POST /sources', send: () => client.post('/sources') },
      { route: 'GET /sources/:sourceId', send: () => client.get('/sources/S-0001') },
      { route: 'PUT /sources/:sourceId', send: () => client.put('/sources/S-0001') },
      { route: 'DELETE /sources/:sourceId', send: () => client.delete('/sources/S-0001') },
      {
        route: 'POST /sources/:sourceId/restore',
        send: () => client.post('/sources/S-0001/restore'),
      },
      { route: 'GET /products', send: () => client.get('/products') },
      { route: 'POST /products', send: () => client.post('/products') },
      { route: 'GET /products/:productId', send: () => client.get('/products/P-ABC234') },
      { route: 'PUT /products/:productId', send: () => client.put('/products/P-ABC234') },
      { route: 'DELETE /products/:productId', send: () => client.delete('/products/P-ABC234') },
      {
        route: 'POST /products/:productId/restore',
        send: () => client.post('/products/P-ABC234/restore'),
      },
    ]

    for (const protectedRequest of protectedRequests) {
      const response = await protectedRequest.send()

      assert.equal(response.status(), 401, protectedRequest.route)
      response.assertBodyContains({ message: 'Unauthorized' })
    }
  })
})
