import AccessToken from '#models/access_token'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('Auth sign-in', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('rejects invalid login payloads using the shared login schema', async ({ client }) => {
    const invalidEmailResponse = await client.post('/auth/login').json({
      email: 'not-an-email',
      password: 'Password123',
    })

    invalidEmailResponse.assertStatus(422)
    invalidEmailResponse.assertBodyContains({
      errors: {
        email: ['Invalid email address'],
      },
    })

    const missingPasswordResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
    })

    missingPasswordResponse.assertStatus(422)
    missingPasswordResponse.assertBodyContains({
      errors: {
        password: ['Invalid input: expected string, received undefined'],
      },
    })
  })

  test('answers the browser preflight request for the web app origin', async ({ client }) => {
    const response = await client
      .options('/auth/login')
      .header('Origin', 'http://localhost:5173')
      .header('Access-Control-Request-Method', 'POST')
      .header('Access-Control-Request-Headers', 'content-type')

    response.assertStatus(204)
    response.assertHeader('access-control-allow-origin', 'http://localhost:5173')
    response.assertHeader('access-control-allow-methods', 'GET,HEAD,POST,PUT,DELETE,OPTIONS')
    response.assertHeader('access-control-allow-headers', 'content-type')
  })

  test('signs in a seeded user with a case-insensitive email address', async ({
    assert,
    client,
  }) => {
    await User.create({
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      active: true,
    })

    const response = await client
      .post('/auth/login')
      .header('Origin', 'http://localhost:5173')
      .json({
        email: 'ADMIN@EXAMPLE.COM',
        password: 'Password123',
      })

    response.assertStatus(200)
    response.assertHeader('access-control-allow-origin', 'http://localhost:5173')
    response.assertBodyContains({
      tokenType: 'Bearer',
      user: {
        email: 'admin@example.com',
        role: 'admin',
        active: true,
      },
    })

    const body = response.body()

    assert.isString(body.token)
    assert.isAbove(body.token.length, 20)
    assert.isTrue(DateTime.fromISO(body.expiresAt).isValid)

    const accessToken = await AccessToken.firstOrFail()

    assert.notEqual(accessToken.hash, body.token)
  })
})
