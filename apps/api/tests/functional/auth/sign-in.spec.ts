import AccessToken from '#models/access_token'
import { hashToken } from '#modules/auth/auth_service'
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

  test('returns the current authenticated user for a valid bearer token', async ({
    client,
  }) => {
    await User.create({
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      active: true,
    })

    const signInResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'Password123',
    })

    signInResponse.assertStatus(200)

    const { token } = signInResponse.body()

    const meResponse = await client.get('/auth/me').header('Authorization', `Bearer ${token}`)

    meResponse.assertStatus(200)
    meResponse.assertBodyContains({
      user: {
        email: 'admin@example.com',
        role: 'admin',
        active: true,
      },
    })
  })

  test('treats a malformed bearer authorization header as unauthenticated', async ({ client }) => {
    const meResponse = await client.get('/auth/me').header('Authorization', 'Basic opaque-access-token')

    meResponse.assertStatus(401)
    meResponse.assertBodyContains({
      message: 'Unauthorized',
    })
  })

  test('treats a revoked bearer token as unauthenticated', async ({ client }) => {
    await User.create({
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      active: true,
    })

    const signInResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'Password123',
    })

    signInResponse.assertStatus(200)

    const accessToken = await AccessToken.firstOrFail()
    accessToken.revokedAt = DateTime.utc()
    await accessToken.save()

    const meResponse = await client
      .get('/auth/me')
      .header('Authorization', `Bearer ${signInResponse.body().token}`)

    meResponse.assertStatus(401)
    meResponse.assertBodyContains({
      message: 'Unauthorized',
    })
  })

  test('treats an expired bearer token as unauthenticated', async ({ client }) => {
    const user = await User.create({
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      active: true,
    })

    const rawToken = 'expired-access-token'

    await AccessToken.create({
      userId: user.id,
      hash: hashToken(rawToken),
      expiresAt: DateTime.utc().minus({ minute: 1 }),
      revokedAt: null,
    })

    const meResponse = await client
      .get('/auth/me')
      .header('Authorization', `Bearer ${rawToken}`)

    meResponse.assertStatus(401)
    meResponse.assertBodyContains({
      message: 'Unauthorized',
    })
  })

  test('revokes only the presented bearer token during current-session logout', async ({
    client,
  }) => {
    await User.create({
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      active: true,
    })

    const firstSignInResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'Password123',
    })
    const secondSignInResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'Password123',
    })

    firstSignInResponse.assertStatus(200)
    secondSignInResponse.assertStatus(200)

    const firstToken = firstSignInResponse.body().token
    const secondToken = secondSignInResponse.body().token

    const logoutResponse = await client
      .post('/auth/logout')
      .header('Authorization', `Bearer ${firstToken}`)

    logoutResponse.assertStatus(204)

    const revokedSessionResponse = await client
      .get('/auth/me')
      .header('Authorization', `Bearer ${firstToken}`)

    revokedSessionResponse.assertStatus(401)
    revokedSessionResponse.assertBodyContains({
      message: 'Unauthorized',
    })

    const remainingSessionResponse = await client
      .get('/auth/me')
      .header('Authorization', `Bearer ${secondToken}`)

    remainingSessionResponse.assertStatus(200)
    remainingSessionResponse.assertBodyContains({
      user: {
        email: 'admin@example.com',
        role: 'admin',
        active: true,
      },
    })
  })

  test('changes the password, revokes all active tokens, and requires the new password for future sign-in', async ({
    client,
  }) => {
    await User.create({
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      active: true,
    })

    const firstSignInResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'Password123',
    })
    const secondSignInResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'Password123',
    })

    firstSignInResponse.assertStatus(200)
    secondSignInResponse.assertStatus(200)

    const firstToken = firstSignInResponse.body().token
    const secondToken = secondSignInResponse.body().token

    const changePasswordResponse = await client
      .post('/auth/change-password')
      .header('Authorization', `Bearer ${firstToken}`)
      .json({
        currentPassword: 'Password123',
        newPassword: 'NewPassword123',
      })

    changePasswordResponse.assertStatus(204)

    const firstSessionResponse = await client
      .get('/auth/me')
      .header('Authorization', `Bearer ${firstToken}`)

    firstSessionResponse.assertStatus(401)
    firstSessionResponse.assertBodyContains({
      message: 'Unauthorized',
    })

    const secondSessionResponse = await client
      .get('/auth/me')
      .header('Authorization', `Bearer ${secondToken}`)

    secondSessionResponse.assertStatus(401)
    secondSessionResponse.assertBodyContains({
      message: 'Unauthorized',
    })

    const oldPasswordResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'Password123',
    })

    oldPasswordResponse.assertStatus(401)

    const newPasswordResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'NewPassword123',
    })

    newPasswordResponse.assertStatus(200)
    newPasswordResponse.assertBodyContains({
      user: {
        email: 'admin@example.com',
        role: 'admin',
        active: true,
      },
    })
  })

  test('rejects a password change when the current password is incorrect', async ({ client }) => {
    await User.create({
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      active: true,
    })

    const signInResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'Password123',
    })

    signInResponse.assertStatus(200)

    const changePasswordResponse = await client
      .post('/auth/change-password')
      .header('Authorization', `Bearer ${signInResponse.body().token}`)
      .json({
        currentPassword: 'WrongPassword123',
        newPassword: 'NewPassword123',
      })

    changePasswordResponse.assertStatus(401)
    changePasswordResponse.assertBodyContains({
      message: 'Current password is incorrect.',
    })

    const existingPasswordResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'Password123',
    })

    existingPasswordResponse.assertStatus(200)
  })

  test('rejects a password change payload with a new password shorter than 8 characters', async ({
    client,
  }) => {
    await User.create({
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
      active: true,
    })

    const signInResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'Password123',
    })

    signInResponse.assertStatus(200)

    const changePasswordResponse = await client
      .post('/auth/change-password')
      .header('Authorization', `Bearer ${signInResponse.body().token}`)
      .json({
        currentPassword: 'Password123',
        newPassword: 'short',
      })

    changePasswordResponse.assertStatus(422)
    changePasswordResponse.assertBodyContains({
      errors: {
        newPassword: ['Too small: expected string to have >=8 characters'],
      },
    })
  })
})
