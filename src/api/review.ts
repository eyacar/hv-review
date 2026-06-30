import type { Review } from './types'
import mockData from './mock/review.json'
import { getToken } from '../lib/auth'

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
  void getToken() // will be used in real implementation
  try {
    if (!id) throw new Error('Review ID is required')
    await new Promise(res => setTimeout(res, 600))
    return mockData as Review
  } catch (err) {
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
    // no-op — endpoint not ready
  } catch (err) {
    throw new Error(
      err instanceof Error ? `Failed to submit review: ${err.message}` : 'Failed to submit review.',
      { cause: err }
    )
  }
}
