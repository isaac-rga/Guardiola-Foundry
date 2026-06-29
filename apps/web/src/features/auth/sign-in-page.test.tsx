import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AUTH_SESSION_STORAGE_KEY } from '@/lib/auth/session-storage'

import { SignInPage } from './sign-in-page'

describe('SignInPage', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('stores the returned session payload after a successful sign-in', async () => {
    const session = {
      token: 'opaque-access-token',
      tokenType: 'Bearer' as const,
      expiresAt: '2026-07-28T18:33:00.000Z',
      user: {
        id: 1,
        email: 'admin@example.com',
        role: 'admin' as const,
        active: true,
      },
    }

    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(session), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )

    render(<SignInPage />)

    await user.type(screen.getByLabelText(/email address/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3333/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'admin@example.com',
            password: 'Password123',
          }),
        })
      )
    })

    await waitFor(() => {
      expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull()
    })

    expect(JSON.parse(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)!)).toEqual(session)
    expect(screen.getByText('Signed in as admin@example.com.')).toBeInTheDocument()
  })
})
