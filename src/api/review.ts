import { ReviewSchema } from './schemas'
import type { Review } from './types'
import { ApiError } from './errors'
import { resolveAssetUrl } from '../lib/assets'
import mockData from './mock/review.json'
import { z } from 'zod'
// Real implementation uses: import { getToken } from '../lib/auth'

/** Demo review ID — matches HomePage and mock/review.json. */
export const MOCK_REVIEW_ID = mockData.id

/**
 * Fetch a review by ID.
 *
 * Today this returns mock data with a simulated delay.
 * When the API is ready, replace the function body — the hook and component contracts don't change.
 */
export async function getReview(id: string): Promise<Review> {
  try {
    if (!id) {
      throw new ApiError('MISSING_ID', 'Review ID is required')
    }

    // Simulates ~600ms network round-trip. Replace with fetch() when the API is ready.
    await new Promise(resolve => setTimeout(resolve, 600))

    if (id !== MOCK_REVIEW_ID) {
      throw new ApiError('NOT_FOUND', `Review not found: ${id}`)
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
    if (err instanceof ApiError) throw err
    if (err instanceof z.ZodError) {
      throw new ApiError('VALIDATION', 'Review response failed schema validation', {
        cause: err,
      })
    }
    throw new ApiError('UNKNOWN', err instanceof Error ? err.message : 'Failed to load review', {
      cause: err,
    })
  }
}

/**
 * Submit a review.
 *
 * The submit endpoint is not ready yet — this is a stub.
 * When the API is ready, replace the function body — the hook and component contracts don't change.
 */
export async function submitReview(id: string): Promise<void> {
  try {
    if (!id) {
      throw new ApiError('MISSING_ID', 'Review ID is required')
    }

    await new Promise(res => setTimeout(res, 800))

    if (id !== MOCK_REVIEW_ID) {
      throw new ApiError('NOT_FOUND', `Review not found: ${id}`)
    }
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError('UNKNOWN', err instanceof Error ? err.message : 'Failed to submit review', {
      cause: err,
    })
  }
}
