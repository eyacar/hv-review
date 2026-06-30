export type ApiErrorCode = 'MISSING_ID' | 'NOT_FOUND' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN'

/** Typed API error — preserves a machine-readable code for granular UI handling. */
export class ApiError extends Error {
  readonly code: ApiErrorCode

  constructor(code: ApiErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiError'
    this.code = code
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** Maps API errors to user-facing copy; falls back to the raw message. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    switch (error.code) {
      case 'NOT_FOUND':
        return 'This review could not be found. Check the link and try again.'
      case 'MISSING_ID':
        return 'No review ID was provided.'
      case 'VALIDATION':
        return 'The server returned unexpected data. Please try again or contact support.'
      case 'NETWORK':
        return 'Network error. Check your connection and try again.'
      default:
        return error.message
    }
  }
  if (error instanceof Error) return error.message
  return fallback
}
