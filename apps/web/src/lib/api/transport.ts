import { API_BASE_URL } from './config'

export function resolveApiUrl(path: string) {
  if (!API_BASE_URL) {
    return path
  }

  return new URL(path.replace(/^\//, ''), ensureTrailingSlash(API_BASE_URL)).toString()
}

export function ensureTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`
}

export function getResponseErrorMessage(body: unknown, fallbackMessage: string) {
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message
  }

  if (
    typeof body === 'object' &&
    body !== null &&
    'errors' in body &&
    typeof body.errors === 'object' &&
    body.errors !== null
  ) {
    const firstFieldError = Object.values(body.errors).find(
      (value): value is string[] => Array.isArray(value) && typeof value[0] === 'string'
    )

    if (firstFieldError?.[0]) {
      return firstFieldError[0]
    }
  }

  return fallbackMessage
}
