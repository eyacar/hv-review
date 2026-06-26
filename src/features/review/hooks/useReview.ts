import { useQuery, useMutation } from '@tanstack/react-query'
import { getReview, submitReview } from '../../../api/review'
import type { Review } from '../../../api/types'

/**
 * Fetches the review data for a given ID.
 * Wraps getReview() in a React Query hook for loading/error state handling.
 * When the real API is ready, only getReview() changes — this hook stays the same.
 */
export function useReview(id: string) {
  return useQuery<Review, Error>({
    queryKey: ['review', id],
    queryFn: () => getReview(id),
    enabled: Boolean(id),
  })
}

/**
 * Submits the review.
 * The endpoint is not ready yet — submitReview() is a stub.
 */
export function useSubmitReview() {
  return useMutation<undefined, Error, string>({
    mutationFn: async (id: string) => {
      await submitReview(id)
      return undefined
    },
  })
}
