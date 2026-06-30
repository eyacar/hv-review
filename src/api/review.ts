import { ReviewSchema } from './schemas'
import type { Review } from './types'
import { resolveAssetUrl } from '../lib/assets'
import mockData from './mock/review.json'
// Real implementation uses: import { getToken } from '../lib/auth'

/** Demo review ID — matches HomePage and mock/review.json. */
export const MOCK_REVIEW_ID = mockData.id

/**
 * Fetch a review by ID.
 *
 * Today this returns mock data with a simulated delay.
 * When the API is ready, replace the function body — the hook and component contracts don't change.
 *
 * Real implementation:
 * ```ts
 * try {
 *   const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/${id}`, {
 *     headers: { Authorization: `Bearer ${getToken()}` },
 *   })
 *   if (!res.ok) throw new Error(`HTTP ${res.status}`, { cause: res })
 *   return res.json() as Promise<Review>
 * } catch (err) {
 *   throw new Error(`Failed to load review: ${err instanceof Error ? err.message : 'unknown error'}`, { cause: err })
 * }
 * ```
 */
export async function getReview(id: string): Promise<Review> {
  try {
    if (!id) throw new Error('Review ID is required')
    // Simulates ~600ms network round-trip. Replace with fetch() when the API is ready.
    await new Promise(resolve => setTimeout(resolve, 600))
    if (id !== MOCK_REVIEW_ID) {
      throw new Error(`Review not found: ${id}`)
    }
    const review = ReviewSchema.parse(mockData)
    return {
      ...review,
      document: {
        ...review.document,
        pdf_url: resolveAssetUrl(review.document.pdf_url),
      },
    }
  } catch (err) {
    // Catches: missing ID, schema validation errors, and in production — network
    // failures and non-2xx HTTP responses. Rethrows with cause so React Query
    // surfaces a typed error to the UI without losing the original stack.
    throw new Error(
      err instanceof Error ? `Failed to load review: ${err.message}` : 'Failed to load review.',
      { cause: err }
    )
  }
}

/**
 * Submit a review.
 *
 * The submit endpoint is not ready yet — this is a stub.
 * When the API is ready, replace the function body — the hook and component contracts don't change.
 *
 * Real implementation:
 * ```ts
 * try {
 *   const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/${id}/submit`, {
 *     method: 'POST',
 *     headers: { Authorization: `Bearer ${getToken()}` },
 *   })
 *   if (!res.ok) throw new Error(`HTTP ${res.status}`, { cause: res })
 * } catch (err) {
 *   throw new Error(`Failed to submit review: ${err instanceof Error ? err.message : 'unknown error'}`, { cause: err })
 * }
 * ```
 */
export async function submitReview(id: string): Promise<void> {
  try {
    if (!id) throw new Error('Review ID is required')
    await new Promise(res => setTimeout(res, 800))
    if (id !== MOCK_REVIEW_ID) {
      throw new Error(`Review not found: ${id}`)
    }
  } catch (err) {
    throw new Error(
      err instanceof Error ? `Failed to submit review: ${err.message}` : 'Failed to submit review.',
      { cause: err }
    )
  }
}
