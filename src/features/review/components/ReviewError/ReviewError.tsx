import { memo } from 'react'
import { ErrorState } from '../../../../shared/components/ErrorState/ErrorState'

interface ReviewErrorProps {
  /** Error message surfaced from React Query — shown to the user. */
  readonly message: string
  /** Called when the user clicks "Try again" — typically React Query's refetch. */
  readonly onRetry?: () => void
}

/**
 * Error state specific to the review page.
 * Thin wrapper over the shared ErrorState with a domain-specific title.
 * Passes refetch from react-query as onRetry so we re-fetch the review
 * without blowing away the entire page.
 */
export const ReviewError = memo(function ReviewError({ message, onRetry }: ReviewErrorProps) {
  return <ErrorState title="Failed to load review" message={message} onRetry={onRetry} />
})
