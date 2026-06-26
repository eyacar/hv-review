import { memo, useMemo, useCallback, useId } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Upload, ChevronRight } from 'lucide-react'
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
 * Header bar with:
 * - Dynamic page title via react-helmet-async (proper React way, no document.title in effects)
 * - Breadcrumb: Reviews / [doc name] for context
 * - Review metadata: version, date, assigned user
 * - Submit button — blocked when critical/major issues remain
 * - "Upload new version" CTA — visible when blocking issues exist, links back to /upload
 *
 * Submit uses aria-disabled (not just disabled) so keyboard users can still reach it
 * and screen readers can announce why it's blocked via aria-describedby.
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

  const pageTitle = `${reviewName} — Review`

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <header className="submit-bar" role="banner">
        <div className="submit-bar__meta">
          {/* Breadcrumb */}
          <nav className="submit-bar__breadcrumb" aria-label="Breadcrumb">
            <span className="submit-bar__breadcrumb-item submit-bar__breadcrumb-item--muted">
              Reviews
            </span>
            <ChevronRight size={12} aria-hidden="true" className="submit-bar__breadcrumb-sep" />
            <span
              className="submit-bar__breadcrumb-item submit-bar__name"
              title={reviewName}
              aria-current="page"
            >
              {reviewName}
            </span>
          </nav>

          {/* Metadata */}
          <div className="submit-bar__details">
            <span className="submit-bar__version">v{version}</span>
            <span className="submit-bar__separator" aria-hidden="true">
              ·
            </span>
            <span className="submit-bar__date">{formattedDate}</span>
            <span className="submit-bar__separator" aria-hidden="true">
              ·
            </span>
            <span className="submit-bar__user">{userName}</span>
          </div>
        </div>

        <div className="submit-bar__actions">
          {!canSubmit && (
            <p id={blockingDescId} className="submit-bar__blocking-msg" role="alert">
              <XCircle size={14} aria-hidden="true" />
              {blockingIssues.length} issue{blockingIssues.length > 1 ? 's' : ''} blocking
              submission
            </p>
          )}

          {isSuccess && (
            <p className="submit-bar__success-msg">
              <CheckCircle size={14} aria-hidden="true" />
              Submitted successfully
            </p>
          )}

          {/* Show upload CTA only when there are blocking issues */}
          {!canSubmit && (
            <Link
              to="/upload"
              className="btn btn--secondary btn--icon-mobile"
              aria-label="Upload a new document version"
            >
              <Upload size={14} aria-hidden="true" />
              <span>Upload new version</span>
            </Link>
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
    </>
  )
})
