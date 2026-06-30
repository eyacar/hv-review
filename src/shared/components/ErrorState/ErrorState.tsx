import { memo } from 'react'

interface ErrorStateProps {
  /** Optional heading — defaults to "Something went wrong". */
  readonly title?: string
  /** Error detail shown below the heading. */
  readonly message: string
  /** Retry callback — defaults to window.location.reload(). Pass react-query's refetch to avoid full page reload. */
  readonly onRetry?: () => void
}

/**
 * Generic error state — usable on any page or panel that can fail.
 * onRetry defaults to window.location.reload() when not provided,
 * but callers can pass a custom handler (e.g. react-query's refetch).
 */
export const ErrorState = memo(function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry = () => window.location.reload(),
}: ErrorStateProps) {
  return (
    <div className="review-layout__error" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      <button type="button" onClick={onRetry} aria-label="Try again">
        Try again
      </button>
    </div>
  )
})
