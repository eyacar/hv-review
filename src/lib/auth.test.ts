import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, clearToken } from './auth'

describe('auth token storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no token has been set', () => {
    expect(getToken()).toBeNull()
  })

  it('persists a token written with setToken', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
  })

  it('removes the token with clearToken', () => {
    setToken('abc123')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
