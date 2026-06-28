import AccessToken from '#models/access_token'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import type { AuthSessionResponse } from '@guardiola-foundry/shared-types'
import { randomBytes, createHash } from 'node:crypto'
import { DateTime } from 'luxon'

const ACCESS_TOKEN_LIFETIME_DAYS = 30

export async function signIn(email: string, password: string): Promise<AuthSessionResponse | null> {
  const user = await User.findBy('email', User.normalizeEmailAddress(email))

  if (!user) {
    return null
  }

  const passwordMatches = await hash.verify(user.password, password)

  if (!passwordMatches) {
    return null
  }

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

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
