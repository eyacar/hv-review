interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

/**
 * Generic error state — usable on any page or panel that can fail.
 * onRetry defaults to window.location.reload() when not provided,
 * but callers can pass a custom handler (e.g. react-query's refetch).
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry = () => window.location.reload(),
}: ErrorStateProps) {
  return (
    <div className="review-layout__error" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
