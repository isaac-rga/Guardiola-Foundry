export interface HealthResponse {
  status: 'ok'
}

export type UserRole = 'admin' | 'operator'

export interface SessionUser {
  id: number
  email: string
  role: UserRole
  active: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthSessionResponse {
  token: string
  tokenType: 'Bearer'
  expiresAt: string
  user: SessionUser
}

export interface CurrentSessionResponse {
  tokenType: 'Bearer'
  expiresAt: string
  user: SessionUser
}
