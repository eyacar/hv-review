import { ErrorState } from '../../../../shared/components/ErrorState/ErrorState'

interface ReviewErrorProps {
  message: string
  onRetry?: () => void
}

/**
 * Error state specific to the review page.
 * Thin wrapper over the shared ErrorState with a domain-specific title.
 * Passes refetch from react-query as onRetry so we re-fetch the review
 * without blowing away the entire page.
 */
export function ReviewError({ message, onRetry }: ReviewErrorProps) {
  return <ErrorState title="Failed to load review" message={message} onRetry={onRetry} />
}
