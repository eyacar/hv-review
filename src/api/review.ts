import type { Review } from './types'
import mockData from './mock/review.json'
import { getToken } from '../lib/auth'

/**
 * Fetch a review by ID.
 *
 * Today this returns mock data with a simulated delay.
 * When the API is ready, swap the function body — nothing else changes.
 *
 * Real implementation:
 * const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/${id}`, {
 *   headers: { Authorization: `Bearer ${getToken()}` },
 * })
 * if (!res.ok) throw new Error('Failed to fetch review')
 * return res.json()
 */
export async function getReview(_id: string): Promise<Review> {
  void getToken() // will be used in real implementation
  try {
    await new Promise(res => setTimeout(res, 600))
    return mockData as Review
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? `Failed to load review: ${err.message}`
        : 'Failed to load review. Please try again.',
      { cause: err }
    )
  }
}

/**
 * Submit a review.
 *
 * The submit endpoint is not ready yet — this is a stub.
 * When the API is ready, swap the function body — nothing else changes.
 *
 * Real implementation:
 * const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/${id}/submit`, {
 *   method: 'POST',
 *   headers: { Authorization: `Bearer ${getToken()}` },
 * })
 * if (!res.ok) throw new Error('Failed to submit review')
 */
export async function submitReview(_id: string): Promise<void> {
  try {
    await new Promise(res => setTimeout(res, 800))
    // no-op — endpoint not ready
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? `Failed to submit review: ${err.message}`
        : 'Failed to submit review. Please try again.',
      { cause: err }
    )
  }
}
