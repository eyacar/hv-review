import { useQuery, useMutation } from '@tanstack/react-query'
import { getReview, submitReview } from '../../../api/review'
import type { ApiError } from '../../../api/errors'
import type { Review } from '../../../api/types'

/**
 * Fetches review data for the given ID.
 * Only `getReview()` in `src/api/review.ts` changes when the real API is ready.
 */
export function useReview(id: string) {
  return useQuery<Review, ApiError>({
    // Scoped cache — navigating between reviews keeps each result independent
    queryKey: ['review', id],
    queryFn: () => getReview(id),
    // Params can be empty during initial mount; skip fetch to avoid invalid requests
    enabled: Boolean(id),
  })
}

/**
 * Submits a review. Returns `mutate(id)` for the submit button handler.
 * `isPending` disables the button; `isSuccess` on success; `error` carries a typed ApiError.
 */
export function useSubmitReview() {
  return useMutation<undefined, ApiError, string>({
    mutationFn: async (id: string) => {
      await submitReview(id)
      return undefined
    },
  })
}
