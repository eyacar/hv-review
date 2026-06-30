import { useQuery, useMutation } from '@tanstack/react-query'
import { getReview, submitReview } from '../../../api/review'
import type { Review } from '../../../api/types'

/**
 * Fetches the review data for a given ID.
 *
 * Behavior:
 * - Skips the fetch when `id` is empty (`enabled: false`) to avoid 404s during routing.
 * - React Query caches the result by `['review', id]` — navigating away and back won't re-fetch.
 * - On error, React Query retries 3 times with exponential backoff before surfacing `isError`.
 * - When the real API is ready, only `getReview()` in `src/api/review.ts` changes — this hook
 *   and all consuming components stay the same.
 */
export function useReview(id: string) {
  return useQuery<Review, Error>({
    queryKey: ['review', id],
    queryFn: () => getReview(id),
    enabled: Boolean(id),
  })
}

/**
 * Submits the review for a given ID.
 *
 * Behavior:
 * - Returns `mutate(id)` — call it from the submit button handler.
 * - `isSuccess` is `true` after a successful submit; use it to trigger navigation to /submitted.
 * - `isPending` is `true` while the request is in-flight; use it to disable the button.
 * - The endpoint is not ready yet — `submitReview()` is a no-op stub that resolves after 800ms.
 */
export function useSubmitReview() {
  return useMutation<undefined, Error, string>({
    mutationFn: async (id: string) => {
      await submitReview(id)
      return undefined
    },
  })
}
