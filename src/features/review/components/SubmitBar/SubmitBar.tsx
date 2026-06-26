import { memo, useMemo, useCallback, useId } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { useReviewStore } from '../../store/reviewStore'
import { useSubmitReview } from '../../hooks/useReview'
import { cn } from '../../../../lib/cn'
import type { Issue, ReviewStatus } from '../../../../api/types'

interface SubmitBarProps {
  reviewId: string
  reviewName: string
  version: number
  status: ReviewStatus
  uploadedAt: string
  userName: string
  issues: Issue[]
}

/**
 * Header bar with review metadata and submit button.
 *
 * Submit is blocked when any critical or major issue is unresolved.
 * Uses aria-disabled (not just disabled) so the button is still reachable
 * by keyboard and screen readers can announce why it's blocked.
 */
export const SubmitBar = memo(function SubmitBar({
  reviewId,
  reviewName,
  version,
  uploadedAt,
  userName,
  issues,
}: SubmitBarProps) {
  const ignoredIssues = useReviewStore(state => state.ignoredIssues)
  const { mutate: submit, isPending, isSuccess } = useSubmitReview()
  const blockingDescId = useId()

  const blockingIssues = useMemo(
    () =>
      issues.filter(
        i => (i.severity === 'critical' || i.severity === 'major') && !ignoredIssues.has(i.id)
      ),
    [issues, ignoredIssues]
  )

  const canSubmit = useMemo(() => blockingIssues.length === 0, [blockingIssues])

  const handleSubmit = useCallback(() => {
    if (!canSubmit || isPending) return
    submit(reviewId)
  }, [canSubmit, isPending, submit, reviewId])

  const formattedDate = useMemo(
    () =>
      new Date(uploadedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [uploadedAt]
  )

  return (
    <header className="submit-bar" role="banner">
      <div className="submit-bar__meta">
        <h1 className="submit-bar__name" title={reviewName}>
          {reviewName}
        </h1>
        <div className="submit-bar__details">
          <span className="submit-bar__version">v{version}</span>
          <span className="submit-bar__separator" aria-hidden="true">
            ·
          </span>
          <span className="submit-bar__date">
            <Clock size={13} aria-hidden="true" />
            {formattedDate}
          </span>
          <span className="submit-bar__separator" aria-hidden="true">
            ·
          </span>
          <span className="submit-bar__user">{userName}</span>
        </div>
      </div>

      <div className="submit-bar__actions">
        {!canSubmit && (
          <p
            id={blockingDescId}
            className="submit-bar__blocking-msg"
            role="alert"
            aria-live="polite"
          >
            <XCircle size={14} aria-hidden="true" />
            {blockingIssues.length} issue{blockingIssues.length > 1 ? 's' : ''} blocking submission
          </p>
        )}

        {isSuccess && (
          <p className="submit-bar__success-msg">
            <CheckCircle size={14} aria-hidden="true" />
            Submitted successfully
          </p>
        )}

        <button
          type="button"
          className={cn('btn btn--primary', { 'btn--disabled': !canSubmit || isPending })}
          onClick={handleSubmit}
          aria-disabled={!canSubmit || isPending}
          aria-describedby={!canSubmit ? blockingDescId : undefined}
        >
          {isPending ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </header>
  )
})
