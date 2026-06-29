export function extractBearerToken(authorizationHeader?: string | null) {
  return authorizationHeader?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null
}
