import AccessToken from '#models/access_token'
import LoginAttempt from '#models/login_attempt'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import type { AuthSessionResponse, CurrentSessionResponse } from '@guardiola-foundry/shared-types'
import { randomBytes, createHash } from 'node:crypto'
import { DateTime } from 'luxon'

const ACCESS_TOKEN_LIFETIME_DAYS = 30
const LOGIN_LOCKOUT_THRESHOLD = 5
const LOGIN_LOCKOUT_MINUTES = 15
export type SignInResult =
  | AuthSessionResponse
  | 'email-not-found'
  | 'incorrect-password'
  | 'inactive-user'
  | 'locked-out'
type ChangePasswordResult = 'changed' | 'invalid-session' | 'incorrect-current-password'

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const normalizedEmail = User.normalizeEmailAddress(email)
  const now = DateTime.utc()
  const loginAttempt = await LoginAttempt.findBy('email', normalizedEmail)

  if (loginAttempt?.lockedUntil && loginAttempt.lockedUntil > now) {
    return 'locked-out'
  }

  const user = await User.findBy('email', normalizedEmail)

  if (!user) {
    await recordFailedLoginAttempt(normalizedEmail, loginAttempt, now)
    return 'email-not-found'
  }

  if (!user.active) {
    await recordFailedLoginAttempt(normalizedEmail, loginAttempt, now)
    return 'inactive-user'
  }

  const passwordMatches = await hash.verify(user.password, password)

  if (!passwordMatches) {
    await recordFailedLoginAttempt(normalizedEmail, loginAttempt, now)
    return 'incorrect-password'
  }

  await clearFailedLoginAttempt(loginAttempt)

  const rawToken = randomBytes(32).toString('hex')
  const expiresAt = DateTime.utc().plus({ days: ACCESS_TOKEN_LIFETIME_DAYS })

  await AccessToken.create({
    userId: user.id,
    hash: hashToken(rawToken),
    expiresAt,
    revokedAt: null,
  })

  return {
    token: rawToken,
    tokenType: 'Bearer',
    expiresAt: expiresAt.toISO()!,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      active: user.active,
    },
  }
}

export async function getCurrentSession(token: string): Promise<CurrentSessionResponse | null> {
  const accessToken = await AccessToken.findBy('hash', hashToken(token))

  if (!accessToken || accessToken.revokedAt || accessToken.expiresAt <= DateTime.utc()) {
    return null
  }

  const user = await User.find(accessToken.userId)

  if (!user) {
    return null
  }

  return {
    tokenType: 'Bearer',
    expiresAt: accessToken.expiresAt.toISO()!,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      active: user.active,
    },
  }
}

export async function revokeCurrentSession(token: string): Promise<boolean> {
  const accessToken = await AccessToken.findBy('hash', hashToken(token))

  if (!accessToken || accessToken.revokedAt || accessToken.expiresAt <= DateTime.utc()) {
    return false
  }

  accessToken.revokedAt = DateTime.utc()
  await accessToken.save()

  return true
}

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  const accessToken = await AccessToken.findBy('hash', hashToken(token))

  if (!accessToken || accessToken.revokedAt || accessToken.expiresAt <= DateTime.utc()) {
    return 'invalid-session'
  }

  const user = await User.find(accessToken.userId)

  if (!user) {
    return 'invalid-session'
  }

  const passwordMatches = await hash.verify(user.password, currentPassword)

  if (!passwordMatches) {
    return 'incorrect-current-password'
  }

  user.password = newPassword
  await user.save()

  const activeTokens = await AccessToken.query().where('userId', user.id).whereNull('revokedAt')

  for (const activeToken of activeTokens) {
    activeToken.revokedAt = DateTime.utc()
    await activeToken.save()
  }

  return 'changed'
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function recordFailedLoginAttempt(
  email: string,
  loginAttempt: LoginAttempt | null,
  now: DateTime
) {
  if (!loginAttempt) {
    await LoginAttempt.create({
      email,
      failureCount: 1,
      lockedUntil: null,
    })

    return
  }

  if (loginAttempt.lockedUntil && loginAttempt.lockedUntil <= now) {
    loginAttempt.failureCount = 0
    loginAttempt.lockedUntil = null
  }

  loginAttempt.failureCount += 1

  if (loginAttempt.failureCount >= LOGIN_LOCKOUT_THRESHOLD) {
    loginAttempt.lockedUntil = now.plus({ minutes: LOGIN_LOCKOUT_MINUTES })
  }

  await loginAttempt.save()
}

async function clearFailedLoginAttempt(loginAttempt: LoginAttempt | null) {
  if (!loginAttempt) {
    return
  }

  await loginAttempt.delete()
}
