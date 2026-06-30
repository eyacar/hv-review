/**
 * Auth utilities — reads/writes the JWT from localStorage.
 *
 * Not yet called from the API layer: `src/api/review.ts` is still a mock with
 * no real network requests, so there's no request to attach a token to. This
 * is the contract the real `fetch()` implementation will use — see the
 * "Real implementation uses: getToken()" comment in `review.ts`. Covered by
 * auth.test.ts so the contract doesn't silently break before it's wired in.
 *
 * The token is NOT stored in Zustand. Zustand lives in memory and resets
 * on page refresh. localStorage persists across sessions, which is the
 * correct behavior for an auth token.
 *
 * Zustand would only be needed here if components had to reactively respond
 * to auth state changes (e.g. token expiry redirects) — out of scope for
 * this MVP.
 */

const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
