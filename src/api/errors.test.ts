import { describe, it, expect } from 'vitest'
import { ApiError, getApiErrorMessage, isApiError } from './errors'

describe('ApiError', () => {
  it('identifies typed API errors', () => {
    const err = new ApiError('NOT_FOUND', 'Review not found: abc')
    expect(isApiError(err)).toBe(true)
    expect(err.code).toBe('NOT_FOUND')
  })

  it('maps error codes to user-facing messages', () => {
    expect(getApiErrorMessage(new ApiError('NOT_FOUND', 'x'), 'fallback')).toMatch(
      /could not be found/i
    )
    expect(getApiErrorMessage(new ApiError('VALIDATION', 'x'), 'fallback')).toMatch(
      /unexpected data/i
    )
  })

  it('falls back for unknown errors', () => {
    expect(getApiErrorMessage(new Error('boom'), 'fallback')).toBe('boom')
    expect(getApiErrorMessage(null, 'fallback')).toBe('fallback')
  })
})
